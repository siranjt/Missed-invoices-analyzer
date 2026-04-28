# Missed Invoice Tracker

Live web dashboard over Zoca's Chargebee + Metabase data. Mirrors the daily Excel report.

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Recharts · xlsx-js-style · Neon Postgres (annotations) · NextAuth (Google, @zoca.com only)

## Local dev
```
npm install
cp .env.example .env.local
# fill CHARGEBEE_API_KEY at minimum, plus NEXTAUTH_SECRET + GOOGLE_CLIENT_ID/SECRET if you want sign-in locally
npm run dev
```

If you set `NEXTAUTH_SECRET` locally, NextAuth will protect the dashboard. To bypass auth in local dev, leave `NEXTAUTH_SECRET` unset (the middleware will still run but Google sign-in will fail open). For real local testing of auth, set `NEXTAUTH_URL=http://localhost:3000`.

## Deploy (Vercel)
1. `git init && git add . && git commit -m "init"` then push to GitHub.
2. Import the repo on vercel.com.
3. Set env vars:
   - `CHARGEBEE_API_KEY` (required), `CHARGEBEE_SITE`, `METABASE_BASESHEET_URL`, `INVOICES_CACHE_TTL`
   - `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production URL, e.g. `https://missed-invoices-analyzer.vercel.app`)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google Cloud OAuth client — see below)
   - `CRON_SECRET` (any random string; the cron warm-up route checks `Authorization: Bearer ${CRON_SECRET}`)
4. Storage tab → Create Neon Postgres → attach to project. `DATABASE_URL` auto-injects.
5. Redeploy. The `annotations` table is auto-created on first write. The cron in `vercel.json` warms `/api/invoices` daily at 02:30 UTC (08:00 IST).

### Google OAuth setup
1. Go to https://console.cloud.google.com → APIs & Services → Credentials.
2. Create OAuth client ID → Web application.
3. Authorized redirect URIs:
   - `https://YOUR-VERCEL-URL.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
4. Copy the client ID + secret into the env vars above.

The `signIn` callback in `lib/auth.ts` rejects any account whose email doesn't end in `@zoca.com`, and additionally checks Google's `hd` (hosted domain) claim. Non-Zoca accounts see an "Access denied" message on `/auth/signin`.

## Routes
- `/` — dashboard (gated by middleware; redirects to `/auth/signin`)
- `/auth/signin` — branded sign-in page
- `/api/auth/[...nextauth]` — NextAuth handler
- `/api/invoices` — server pull (5-min in-memory cache, `?refresh=1` busts)
- `/api/annotations` — GET/POST persisted edits
- `/api/cron/warm` — daily warm-up hit by Vercel Cron

## URL state
The active tab and all filters round-trip through the URL (`?tab=April&am=Joshi&...`), so shared/bookmarked links open with the same view. Browser back/forward also restore the prior view.
