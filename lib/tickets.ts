import "server-only";
import Papa from "papaparse";

/**
 * Tickets integration — pulls active Linear tickets from a Metabase public
 * CSV and joins them onto the missed-invoice rows by `entity_id`.
 *
 * The Metabase question is owned by Zoca's Finance team and returns one row
 * per ticket with the columns:
 *   id, linear_created_at, month_number, year, title, description, linear_url,
 *   state_name, started_at, canceled_at, completed_at, entity_id,
 *   customer_name, creator_email, assignee_email, ticket_category,
 *   ticket_classification, customer_id, churn_potential_status, am_name, ae_name
 *
 * Default URL points at the production question. Override via env if you ever
 * fork the query.
 */
const METABASE_TICKETS_URL =
  process.env.METABASE_TICKETS_URL ||
  "https://metabase.zoca.ai/public/question/331e4835-e163-4981-877e-14592f71741d.csv";

const TIMEOUT_MS = Number(process.env.METABASE_TICKETS_TIMEOUT_MS || 15_000);

/** Linear state_name values that count as "active" for the dashboard. */
const ACTIVE_STATES = new Set(["Todo", "In Progress", "In Review"]);

/** Title prefixes we never surface — write-offs and refunds describe
 *  accounting actions, not active customer issues an AM needs to chase. */
const EXCLUDED_TITLE_PREFIXES = [
  "write off",
  "write-off",
  "writeoff",
  "refund"
];

export type Ticket = {
  /** Linear ticket identifier extracted from the URL — e.g. "FIN-3153". */
  identifier: string;
  title: string;
  url: string;
  /** Lowercased Zoca entity_id used as the join key. */
  entityId: string;
  state: string;
  createdAt: string;
};

const ID_REGEX = /linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/i;

let cache: { rows: Ticket[]; ts: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — same as invoices

/** Fetch active Linear tickets from the Metabase public CSV.
 *  - Filters server-side to Todo + In Progress + In Review only.
 *  - Drops write-off and refund tickets by title prefix.
 *  - Drops rows with no entity_id (can't join them anyway).
 *  - 5-minute in-memory cache to avoid re-fetching the 2 MB CSV on every
 *    invoices request inside the same TTL window.
 */
export async function fetchActiveTickets(): Promise<Ticket[]> {
  const now = Date.now();
  if (cache && now - cache.ts < CACHE_TTL_MS) return cache.rows;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let csv: string;
  try {
    const r = await fetch(METABASE_TICKETS_URL, {
      signal: ctrl.signal,
      cache: "no-store",
      // Metabase returns a 302 to the actual CSV download URL; fetch in
      // Node follows redirects automatically.
      redirect: "follow"
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(
        `Metabase tickets ${r.status}: ${text.slice(0, 200)}`
      );
    }
    csv = await r.text();
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`Metabase tickets timeout after ${TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }

  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true
  });

  const out: Ticket[] = [];
  for (const row of parsed.data) {
    const state = (row.state_name || "").trim();
    if (!ACTIVE_STATES.has(state)) continue;

    const title = (row.title || "").trim();
    const titleLc = title.toLowerCase();
    if (EXCLUDED_TITLE_PREFIXES.some((p) => titleLc.startsWith(p))) continue;

    const entityId = (row.entity_id || "").trim().toLowerCase();
    if (!entityId) continue;

    const url = (row.linear_url || "").trim();
    if (!url) continue;

    const m = url.match(ID_REGEX);
    const identifier = m ? m[1] : "";

    out.push({
      identifier,
      title,
      url,
      entityId,
      state,
      createdAt: (row.linear_created_at || "").trim()
    });
  }

  cache = { rows: out, ts: now };
  return out;
}

/** Build Map<entity_id, Ticket> picking the most-recently-created active
 *  ticket per entity. (When an entity has multiple active tickets, the
 *  freshest wins. Ascending sort + last-write semantics on the Map.) */
export function indexTicketsByEntity(
  tickets: Ticket[]
): Map<string, Ticket> {
  const out = new Map<string, Ticket>();
  const sorted = [...tickets].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  for (const t of sorted) {
    out.set(t.entityId, t);
  }
  return out;
}
