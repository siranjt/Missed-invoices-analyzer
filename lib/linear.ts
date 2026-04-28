import "server-only";

/**
 * Linear integration — pulls open Finance tickets so the Missed Invoice
 * Tracker's Tickets column can show the latest open ticket per customer.
 *
 * Entity-id mapping uses three signals (in order of preference):
 *   1. Linear Customer Needs → customer.externalIds (set up in Linear UI;
 *      cleanest match)
 *   2. "Entity ID: <uuid>" pattern in the issue description (used by
 *      retention-risk-alert tickets generated from the Negative Keyword
 *      Alert Dashboard)
 *   3. S3 attachment URL parse — entity_id appears as the first path segment
 *      in zoca-miscellaneous-production.s3.amazonaws.com URLs (used by
 *      app-generated SUBSCRIPTION_SUPPORT / OTHER_SUPPORT tickets)
 *
 * Tickets that don't yield any entity_id from these signals are simply
 * skipped — no false positives.
 */

const LINEAR_API_KEY = process.env.LINEAR_API_KEY || "";
const LINEAR_API = "https://api.linear.app/graphql";
const FINANCE_TEAM_ID = "10848e63-4beb-4096-a505-a2f928e95eb9";

const REQUEST_TIMEOUT_MS = Number(process.env.LINEAR_REQUEST_TIMEOUT_MS || 12_000);

async function lq<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!LINEAR_API_KEY) throw new Error("LINEAR_API_KEY not set");
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(LINEAR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: LINEAR_API_KEY
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
      signal: ctrl.signal
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Linear ${r.status}: ${text.slice(0, 300)}`);
    }
    const data = await r.json();
    if (data.errors?.length) {
      throw new Error(`Linear GraphQL: ${JSON.stringify(data.errors).slice(0, 300)}`);
    }
    return data.data as T;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`Linear timeout after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export type OpenTicket = {
  id: string;             // identifier like "FIN-3899"
  title: string;
  url: string;
  description: string;
  updatedAt: string;
  /** entity_ids surfaced via Linear Customer Needs (most reliable signal). */
  customerExternalIds: string[];
};

// Ticket templates we never want to surface in the dashboard's Tickets column.
// Matched case-insensitively against the start of the ticket title so we catch
// "Write off the payment", "Refund Request", "Refund - <client>", etc.
const EXCLUDED_TITLE_PREFIXES = ["write off", "write-off", "writeoff", "refund"];

function shouldIncludeTicket(t: { title: string }): boolean {
  const title = (t.title || "").toLowerCase().trim();
  return !EXCLUDED_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix));
}

/**
 * Fetch active Finance tickets — Todo (`unstarted`) + In Progress / In Review
 * (`started`). Backlog, Done, and Canceled are intentionally excluded.
 * Write-off and refund tickets are also dropped (see EXCLUDED_TITLE_PREFIXES)
 * because they describe accounting actions, not active customer issues an AM
 * needs to chase.
 * Returns up to 250 (Linear's per-request max). If you need more, add cursor
 * pagination — but the Finance team currently has fewer than 250 active at
 * any time.
 */
export async function fetchOpenFinanceTickets(): Promise<OpenTicket[]> {
  const query = `
    query ActiveFinanceTickets($teamId: String!) {
      team(id: $teamId) {
        issues(
          filter: { state: { type: { in: ["unstarted", "started"] } } }
          first: 250
        ) {
          nodes {
            identifier
            title
            url
            description
            updatedAt
            customerNeeds {
              nodes {
                customer {
                  externalIds
                }
              }
            }
          }
        }
      }
    }
  `;
  const data = await lq<any>(query, { teamId: FINANCE_TEAM_ID });
  const nodes: any[] = data?.team?.issues?.nodes || [];
  return nodes
    .map((n) => ({
      id: n.identifier,
      title: n.title,
      url: n.url,
      description: n.description || "",
      updatedAt: n.updatedAt,
      customerExternalIds: (n.customerNeeds?.nodes || []).flatMap(
        (cn: any) => cn?.customer?.externalIds || []
      )
    }))
    .filter(shouldIncludeTicket);
}

// Match every variant Zoca uses for "entity id" in Linear ticket bodies:
//   "Entity ID: <uuid>"      (older retention-risk template)
//   "entity_id <uuid>"        (newer template, no colon, underscored)
//   "entity_id: <uuid>"
//   "entity-id <uuid>"
//   "(entity_id <uuid>)"      (parenthetical variant — see FIN-3730)
// `g` flag so we can pull every entity_id when a ticket mentions multiple.
const ENTITY_REGEX =
  /entity[\s_-]?id[\s:]+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
const S3_REGEX =
  /zoca-miscellaneous-production\.s3\.amazonaws\.com\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

/** Resolve every entity_id this ticket plausibly belongs to. Order:
 *  Customer Needs → entity_id regex (multi-variant) → S3 URL parse. */
export function entityIdsForTicket(t: OpenTicket): Set<string> {
  const ids = new Set<string>();
  for (const id of t.customerExternalIds) ids.add(id.toLowerCase());
  // Reset both global regex `lastIndex` before iterating — without this,
  // back-to-back calls on the same module-level regex skip matches.
  ENTITY_REGEX.lastIndex = 0;
  for (const match of t.description.matchAll(ENTITY_REGEX)) {
    if (match[1]) ids.add(match[1].toLowerCase());
  }
  S3_REGEX.lastIndex = 0;
  for (const match of t.description.matchAll(S3_REGEX)) {
    if (match[1]) ids.add(match[1].toLowerCase());
  }
  return ids;
}

/** Build a Map<entity_id, OpenTicket> with the most-recently-updated open
 *  ticket per entity. Lower-cased entity_id keys for case-insensitive lookup. */
export function indexTicketsByEntity(
  tickets: OpenTicket[]
): Map<string, OpenTicket> {
  const out = new Map<string, OpenTicket>();
  // Sort ascending so later writes (newer updatedAt) overwrite earlier ones.
  const sorted = [...tickets].sort(
    (a, b) =>
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  for (const t of sorted) {
    const ids = entityIdsForTicket(t);
    for (const id of ids) {
      const prev = out.get(id);
      if (
        !prev ||
        new Date(t.updatedAt).getTime() > new Date(prev.updatedAt).getTime()
      ) {
        out.set(id, t);
      }
    }
  }
  return out;
}
