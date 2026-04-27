import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AnnotationsMap, InvoiceAnnotation } from "./types";

const FILE_PATH = path.join(process.cwd(), ".annotations.json");
const HASH_KEY = "missed-payments:annotations";

function hasKv() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKv() {
  const mod = await import("@vercel/kv");
  return mod.kv;
}

export async function getAllAnnotations(): Promise<AnnotationsMap> {
  if (hasKv()) {
    const kv = await getKv();
    const data = (await kv.hgetall<Record<string, string>>(HASH_KEY)) || {};
    const out: AnnotationsMap = {};
    for (const [k, v] of Object.entries(data)) {
      try {
        out[k] = typeof v === "string" ? JSON.parse(v) : (v as any);
      } catch {
        out[k] = {};
      }
    }
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
  if (hasKv()) {
    const kv = await getKv();
    const existingRaw = await kv.hget<string>(HASH_KEY, invoiceNumber);
    const existing: InvoiceAnnotation = existingRaw
      ? typeof existingRaw === "string"
        ? JSON.parse(existingRaw)
        : (existingRaw as any)
      : {};
    const merged = { ...existing, ...patch };
    await kv.hset(HASH_KEY, { [invoiceNumber]: JSON.stringify(merged) });
    return merged;
  }
  const all = await getAllAnnotations();
  all[invoiceNumber] = { ...(all[invoiceNumber] || {}), ...patch };
  await fs.writeFile(FILE_PATH, JSON.stringify(all, null, 2));
  return all[invoiceNumber];
}
