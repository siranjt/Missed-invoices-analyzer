import { NextRequest } from "next/server";
import {
  fetchOpenInvoices,
  fetchInProgressTransactions,
  fetchCustomers,
  fetchSubscriptions
} from "@/lib/chargebee";
import { fetchBaseSheet, indexBaseSheet } from "@/lib/metabase";
import {
  fetchOpenFinanceTickets,
  indexTicketsByEntity,
  type OpenTicket
} from "@/lib/linear";
import { buildInvoiceRows } from "@/lib/enrich";
import type { InvoicesResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TTL_MS = (Number(process.env.INVOICES_CACHE_TTL || 300)) * 1000;

let cache: { data: InvoicesResponse; ts: number } | null = null;

/**
 * Streams invoice data as NDJSON.
 *
 * Why streaming: the cold-start path used to fetch invoices, transactions, the
 * Metabase BaseSheet, and then per-customer + per-subscription Chargebee calls
 * before the client saw anything — putting it within reach of the 60s
 * maxDuration budget on a slow Chargebee day. Now we render rows in two phases:
 *
 *   1. **partial** — invoices joined with ACH transactions and the BaseSheet
 *      (no per-customer or per-subscription fetches yet). Fast enough to land
 *      in a couple of seconds, with biz name / AM / phone already populated.
 *   2. **complete** — fully enriched rows with customer (auto-debit, first name,
 *      email) and subscription (status, cancelling at) data merged in.
 *
 * Cache hits return a single `complete` line immediately. Refresh (`?refresh=1`)
 * always streams.
 *
 * Each line is a JSON object with `type` ∈ { partial, complete, error }.
 * The client (dashboard.tsx) reads them progressively and updates state as
 * each phase lands.
 */
export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const now = Date.now();

  const enc = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, obj: unknown) => {
    controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
  };

  // Cache hit — emit a single `complete` line and close.
  if (!refresh && cache && now - cache.ts < TTL_MS) {
    const stream = new ReadableStream({
      start(controller) {
        send(controller, { type: "complete", ...cache!.data, cached: true });
        controller.close();
      }
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  // Cache miss / refresh — stream partial then complete.
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Phase 0: invoices + transactions + BaseSheet + Linear tickets (parallel).
        // Linear is fault-tolerant — if it errors (missing API key, timeout,
        // schema change), we just skip ticket enrichment rather than fail the
        // whole pipeline.
        const [invoices, achTx, baseRows, tickets] = await Promise.all([
          fetchOpenInvoices(),
          fetchInProgressTransactions(),
          fetchBaseSheet(),
          fetchOpenFinanceTickets().catch((e) => {
            console.warn("[invoices] Linear fetch failed:", e?.message || e);
            return [] as OpenTicket[];
          })
        ]);
        const baseSheet = indexBaseSheet(baseRows);
        const ticketsByEntity = indexTicketsByEntity(tickets);

        // Phase 1: emit partial rows enriched from BaseSheet + tickets so the
        // UI has something to render quickly with ticket links already wired.
        const partial = buildInvoiceRows({
          invoices,
          customers: {},
          subs: {},
          achTransactions: achTx,
          baseSheet,
          ticketsByEntity
        });
        send(controller, { type: "partial", rows: partial });

        // Phase 2: per-customer and per-subscription Chargebee calls (batched
        // concurrent fetches — see chunked() in lib/chargebee.ts).
        const customerIds = invoices.map((i: any) => i.customer_id).filter(Boolean);
        const subIds = invoices.map((i: any) => i.subscription_id).filter(Boolean);
        const [customers, subs] = await Promise.all([
          fetchCustomers(customerIds),
          fetchSubscriptions(subIds)
        ]);

        const rows = buildInvoiceRows({
          invoices,
          customers,
          subs,
          achTransactions: achTx,
          baseSheet,
          ticketsByEntity
        });

        const fetchedAt = new Date().toISOString();
        cache = { data: { rows, fetchedAt, cached: false }, ts: Date.now() };

        send(controller, { type: "complete", rows, fetchedAt, cached: false });
      } catch (e: any) {
        send(controller, { type: "error", error: String(e?.message || e) });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Hint to proxies (Vercel etc.) not to buffer.
      "X-Accel-Buffering": "no"
    }
  });
}
