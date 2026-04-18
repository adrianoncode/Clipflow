# Production Setup Checklist

Everything you need to go from "built on localhost" to "live for paying users".
Each section is a one-shot setup — follow top-to-bottom. Time estimate: ~45min total.

---

## 0. Pre-flight

- [ ] You have a Vercel project connected to your GitHub repo
- [ ] `vercel` CLI installed locally (`npm i -g vercel`)
- [ ] You're logged in: `vercel login`
- [ ] You're in the linked project: `vercel link` (run once per machine)

---

## 1. Admin panel — 1 minute

Comma-separated emails that can access `/admin`. Start with just yours.

```bash
vercel env add ADMIN_EMAILS production
# Paste: your@email.com (comma-separated for multiple)
```

Nothing else to configure. Deploy once, visit `https://yourdomain/admin` while
logged in with that email. Non-matching emails get 404 (route doesn't "exist"
for them).

---

## 2. Upstash Redis — 5 minutes

Activates all rate-limits (login brute-force, AI endpoints, auth spam).
Without this, rate-limit calls are no-ops.

1. Sign up: <https://upstash.com>
2. **Create Database** → Type: **Redis** → Region: pick closest to your
   Vercel deployment (Frankfurt for EU, us-east-1 for US)
3. On the database page, copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

```bash
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
```

**Free tier**: 10,000 commands/day. Plenty for ≤1k DAU.

---

## 3. Sentry — 10 minutes

Catches every uncaught error on client + server + edge, aggregates them,
alerts via email/Slack. Without this, production errors vanish.

1. Sign up: <https://sentry.io> (free tier: 5k events/month)
2. **Create Project** → Platform: **Next.js** → Framework: Next.js
3. After creation, grab from the getting-started page:
   - **DSN** — a URL like `https://abc123@o12345.ingest.sentry.io/67890`
4. Go to **Settings → Auth Tokens → Create New Token**
   - Scopes: `project:releases`, `project:write`, `org:read`
   - Copy the token
5. Note your:
   - **Organization slug** (URL: `sentry.io/organizations/YOUR-ORG-SLUG/`)
   - **Project slug** (URL: `sentry.io/organizations/X/projects/YOUR-SLUG/`)

```bash
# DSN — same value in both (client + server)
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add SENTRY_DSN production

# Source-map upload (build time)
vercel env add SENTRY_ORG production
vercel env add SENTRY_PROJECT production
vercel env add SENTRY_AUTH_TOKEN production
```

**Alerts**: Sentry → Project Settings → Alerts → create an "Issue created"
rule routing to email or Slack.

---

## 4. Healthchecks.io — 10 minutes

Dead-man's-switch alerts when a scheduled cron stops running.
Without this, a silently-broken cron goes unnoticed for days.

1. Sign up: <https://healthchecks.io> (free: 20 checks)
2. Create 4 checks — for each, use **Simple schedule**:

   | Check name | Period | Grace |
   |---|---|---|
   | `Clipflow: reap-stuck-rows` | 5 minutes | 2 minutes |
   | `Clipflow: publish-scheduled` | 1 day | 1 hour |
   | `Clipflow: fetch-stats` | 1 day | 1 hour |
   | `Clipflow: reap-soft-deleted` | 1 day | 1 hour |

3. Each check has a ping URL: `https://hc-ping.com/<uuid>`. Copy each one.

```bash
vercel env add HEALTHCHECK_REAP_STUCK_ROWS_URL production
vercel env add HEALTHCHECK_PUBLISH_SCHEDULED_URL production
vercel env add HEALTHCHECK_FETCH_STATS_URL production
vercel env add HEALTHCHECK_REAP_SOFT_DELETED_URL production
```

4. **Integrations** tab → add Email (yours) so failures actually alert you.

---

## 5. Sanity-check deploy

```bash
vercel --prod
```

Wait for the deploy to finish, then verify:

- [ ] `/admin` works with your email, 404s otherwise
- [ ] Fire test error: `throw new Error('sentry test')` in a page → check
  the error lands in Sentry within a minute
- [ ] Manually trigger a cron once from the dashboard → check the
  healthcheck ping goes green
- [ ] Rapid-fire wrong-password logins 6 times → 6th attempt shows
  "Too many login attempts" (confirms Upstash is wired)

---

## 6. Imprint / legal details

Edit `app/(legal)/imprint/page.tsx` and replace the `[placeholder]` lines
with your real business info:

- Business name (or private full name if sole trader)
- Legal representative
- Postal address (street, postal code, city, country)
- Contact email
- Handelsregister + HRB number (only if GmbH/UG/AG)
- USt-IdNr. (only if VAT-registered under §27a UStG)

Then commit + push. These are legally required for EU users under
§5 TMG and the DSA.

---

## Optional: 2FA rollout

TOTP 2FA works as soon as deployed. Opt-in per user via
`/settings/security`. No flag to flip — users discover it when ready.

If you want to **require** 2FA for all users (not just opt-in), add a
check to middleware that redirects to `/settings/security` when
`listFactors().length === 0`. Not currently implemented because forcing
2FA on signup hurts conversion.

---

## Rollback plan

Every single external dependency is **optional and no-ops when unset**.
If Upstash/Sentry/Healthchecks go down, the app keeps working — you just
lose rate-limiting / error tracking / cron alerts. None of them are
required for the core user flow.
