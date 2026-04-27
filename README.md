# Missed Invoice Tracker

Live web dashboard over Zoca's Chargebee + Metabase data. Mirrors the daily Excel report.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · xlsx-js-style · Neon Postgres (annotations)

## Local dev
```
npm install
cp .env.example .env.local
# fill CHARGEBEE_API_KEY at minimum
npm run dev
```

## Deploy (Vercel)
1. `git init && git add . && git commit -m "init"` then push to GitHub.
2. Import the repo on vercel.com.
3. Set env vars: `CHARGEBEE_API_KEY` (required), `CHARGEBEE_SITE`, `METABASE_BASESHEET_URL`, `INVOICES_CACHE_TTL`.
4. Storage tab → Create Neon Postgres → attach to project. `DATABASE_URL` auto-injects.
5. Redeploy. The `annotations` table is auto-created on first write.

## Routes
- `/` dashboard
- `/api/invoices` server pull (5-min in-memory cache, `?refresh=1` busts)
- `/api/annotations` GET/POST persisted edits
