import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { AnnotationsMap, InvoiceAnnotation } from "./types";

const FILE_PATH = path.join(process.cwd(), ".annotations.json");

function getDbUrl(): string | null {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

let _sql: NeonQueryFunction<false, false> | null = null;
function getSql() {
  if (_sql) return _sql;
  const url = getDbUrl();
  if (!url) return null;
  _sql = neon(url);
  return _sql;
}

let _ensured = false;
async function ensureTable() {
  if (_ensured) return;
  const sql = getSql();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS annotations (
      invoice_number TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  _ensured = true;
}

export async function getAllAnnotations(): Promise<AnnotationsMap> {
  const sql = getSql();
  if (sql) {
    await ensureTable();
    const rows = (await sql`SELECT invoice_number, data FROM annotations`) as {
      invoice_number: string;
      data: InvoiceAnnotation;
    }[];
    const out: AnnotationsMap = {};
    for (const r of rows) out[r.invoice_number] = r.data || {};
    return out;
  }
  try {
    const buf = await fs.readFile(FILE_PATH, "utf8");
    return JSON.parse(buf) as AnnotationsMap;
  } catch {
    return {};
  }
}

export async function setAnnotation(invoiceNumber: string, patch: InvoiceAnnotation) {
  const sql = getSql();
  if (sql) {
    await ensureTable();
    const rows = (await sql`
      SELECT data FROM annotations WHERE invoice_number = ${invoiceNumber}
    `) as { data: InvoiceAnnotation }[];
    const existing: InvoiceAnnotation = rows[0]?.data || {};
    const merged: InvoiceAnnotation = { ...existing, ...patch };
    await sql`
      INSERT INTO annotations (invoice_number, data, updated_at)
      VALUES (${invoiceNumber}, ${JSON.stringify(merged)}::jsonb, now())
      ON CONFLICT (invoice_number)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
    `;
    return merged;
  }
  const all = await getAllAnnotations();
  all[invoiceNumber] = { ...(all[invoiceNumber] || {}), ...patch };
  await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2));
  return all[invoiceNumber];
}
