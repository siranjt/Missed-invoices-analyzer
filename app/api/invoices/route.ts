import { NextRequest, NextResponse } from "next/server";
import {
  fetchOpenInvoices,
  fetchInProgressTransactions,
  fetchCustomers,
  fetchSubscriptions
} from "@/lib/chargebee";
import { fetchBaseSheet, indexBaseSheet } from "@/lib/metabase";
import { buildInvoiceRows } from "@/lib/enrich";
import type { InvoicesResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const TTL_MS = (Number(process.env.INVOICES_CACHE_TTL || 300)) * 1000;

let cache: { data: InvoicesResponse; ts: number } | null = null;
let inflight: Promise<InvoicesResponse> | null = null;

async function build(): Promise<InvoicesResponse> {
  const [invoices, achTx, baseSheetRows] = await Promise.all([
    fetchOpenInvoices(),
    fetchInProgressTransactions(),
    fetchBaseSheet()
  ]);
  const customerIds = invoices.map((i: any) => i.customer_id).filter(Boolean);
  const subIds = invoices.map((i: any) => i.subscription_id).filter(Boolean);
  const [customers, subs] = await Promise.all([
    fetchCustomers(customerIds),
    fetchSubscriptions(subIds)
  ]);
  const baseSheet = indexBaseSheet(baseSheetRows);
  const rows = buildInvoiceRows({ invoices, customers, subs, achTransactions: achTx, baseSheet });
  return { rows, fetchedAt: new Date().toISOString(), cached: false };
}

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  const now = Date.now();
  if (!refresh && cache && now - cache.ts < TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true });
  }
  if (!inflight) {
    inflight = build()
      .then((data) => {
        cache = { data, ts: Date.now() };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  }
  try {
    const data = await inflight;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
