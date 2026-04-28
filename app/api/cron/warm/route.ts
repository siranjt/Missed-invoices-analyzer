import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Daily warm-up endpoint hit by Vercel Cron (configured in vercel.json).
 *
 * Vercel sends `Authorization: Bearer ${CRON_SECRET}` automatically when a cron
 * job is configured on the project. We verify that header before fanning out to
 * /api/invoices?refresh=1, which busts the in-memory cache and re-pulls from
 * Chargebee + Metabase so the next morning's first user request is instant.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Resolve the absolute origin so this works on Vercel (where relative fetches
  // can fail in edge/serverless contexts) and locally.
  const origin =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || req.nextUrl.origin;

  const start = Date.now();
  try {
    const res = await fetch(`${origin}/api/invoices?refresh=1`, {
      // Forward the cron secret so middleware (if any future change adds it
      // to the matcher) doesn't 401 us.
      headers: secret ? { authorization: `Bearer ${secret}` } : undefined,
      cache: "no-store"
    });
    const ok = res.ok;
    const text = ok ? "" : await res.text();
    return NextResponse.json({
      ok,
      status: res.status,
      ms: Date.now() - start,
      body: ok ? undefined : text.slice(0, 400)
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e), ms: Date.now() - start },
      { status: 500 }
    );
  }
}
