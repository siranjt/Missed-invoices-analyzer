import "server-only";
import Papa from "papaparse";

const BASE_SHEET_URL =
  process.env.METABASE_BASESHEET_URL ||
  "https://metabase.zoca.ai/public/question/87763e8c-8084-442e-891a-df1b11e81b47.csv";

let cache: { rows: any[]; ts: number } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function fetchBaseSheet(): Promise<any[]> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL_MS) return cache.rows;
  const r = await fetch(BASE_SHEET_URL, { cache: "no-store" });
  if (!r.ok) throw new Error(`Metabase BaseSheet HTTP ${r.status}`);
  const text = await r.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  cache = { rows: (parsed.data as any[]) || [], ts: now };
  return cache.rows;
}

export function indexBaseSheet(rows: any[]) {
  const byCustomerId = new Map<string, any>();
  const byEntityId = new Map<string, any>();
  for (const r of rows) {
    const c = (r.customer_id || "").trim();
    const e = (r.entity_id || "").trim();
    if (c) byCustomerId.set(c, r);
    if (e) byEntityId.set(e, r);
  }
  return { byCustomerId, byEntityId };
}
