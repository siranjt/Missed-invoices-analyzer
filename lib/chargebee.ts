import "server-only";

const CB_SITE = process.env.CHARGEBEE_SITE || "zoca";
const CB_KEY = process.env.CHARGEBEE_API_KEY || "";
const CB_BASE = `https://${CB_SITE}.chargebee.com/api/v2`;

function authHeader() {
  const token = Buffer.from(`${CB_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

async function cbGet(path: string, params: Record<string, string> = {}) {
  if (!CB_KEY) throw new Error("CHARGEBEE_API_KEY not set");
  const qs = new URLSearchParams(params).toString();
  const url = `${CB_BASE}${path}${qs ? "?" + qs : ""}`;
  const r = await fetch(url, { headers: { ...authHeader() }, cache: "no-store" });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Chargebee ${r.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return r.json();
}

async function paginate(path: string, baseParams: Record<string, string>) {
  const out: any[] = [];
  let nextOffset: string | undefined;
  do {
    const params = { ...baseParams, limit: "100", ...(nextOffset ? { offset: nextOffset } : {}) };
    const data = await cbGet(path, params);
    if (Array.isArray(data?.list)) out.push(...data.list);
    nextOffset = data?.next_offset;
  } while (nextOffset);
  return out;
}

export async function fetchOpenInvoices() {
  const due = await paginate("/invoices", { "status[is]": "payment_due" });
  const np = await paginate("/invoices", { "status[is]": "not_paid" });
  return [...due, ...np].map((row) => row.invoice).filter(Boolean);
}

export async function fetchInProgressTransactions() {
  return paginate("/transactions", { "status[is]": "in_progress" });
}

async function chunked<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const res = await Promise.all(slice.map(fn));
    out.push(...res);
  }
  return out;
}

export async function fetchCustomers(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  return chunked(unique, 8, async (id) => {
    try {
      const data = await cbGet(`/customers/${encodeURIComponent(id)}`);
      return data.customer;
    } catch {
      return null;
    }
  }).then((arr) => Object.fromEntries(arr.filter(Boolean).map((c: any) => [c.id, c])));
}

export async function fetchSubscriptions(ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  return chunked(unique, 8, async (id) => {
    try {
      const data = await cbGet(`/subscriptions/${encodeURIComponent(id)}`);
      return data.subscription;
    } catch {
      return null;
    }
  }).then((arr) => Object.fromEntries(arr.filter(Boolean).map((s: any) => [s.id, s])));
}
