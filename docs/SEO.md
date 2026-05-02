# SEO operations

How Clipflow's SEO surface is wired and what the operator needs to do
outside the codebase. Code-level concerns (sitemap, robots, JSON-LD,
Core Web Vitals, CSP) live in the source — this doc is for the things
that require accounts, manual submissions, or live-traffic decisions.

## Files of record

| Surface | Owner |
|---|---|
| Sitemap generator | [app/sitemap.ts](../app/sitemap.ts) |
| Robots rules | [app/robots.ts](../app/robots.ts) |
| Root metadata + verification + JSON-LD | [app/layout.tsx](../app/layout.tsx) |
| Homepage Organization / WebSite / Software / FAQ / Breadcrumb | [app/page.tsx](../app/page.tsx) |
| Default OG card (1200×630, charcoal+yellow) | [app/opengraph-image.tsx](../app/opengraph-image.tsx) |
| Apple touch icon (180×180, brand mark) | [app/apple-icon.tsx](../app/apple-icon.tsx) |
| PWA manifest | [app/manifest.ts](../app/manifest.ts) |
| CSP / HSTS / image format headers | [next.config.mjs](../next.config.mjs) |
| Real-User Monitoring of Core Web Vitals | [lib/analytics/web-vitals.ts](../lib/analytics/web-vitals.ts) |
| GSC ownership verification file | [public/google4dcf37e80dedc154.html](../public/google4dcf37e80dedc154.html) |

## Domain config (Vercel-side, NOT in repo)

`clipflow.to` (apex) is the canonical primary. `www.clipflow.to` issues
a 308 permanent redirect to apex at the Edge layer — set via Vercel's
project domains API, not via `next.config.mjs` redirects (Edge-level
beats server-level by ~50-200ms TTFB and consolidates link equity).

This is intentional and matches the canonical URL strategy in
`metadataBase`, `sitemap.ts`, `robots.ts`, and every JSON-LD URL. If
you ever import the project into a new Vercel team, you must redo
this — the config does not travel with the repo.

To inspect or change:
```sh
# List domain redirects on the project
curl "https://api.vercel.com/v9/projects/$PROJECT_ID/domains?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" | jq '.domains[] | {name, redirect, redirectStatusCode}'

# Flip primary (example: make www the primary instead)
curl -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID/domains/clipflow.to?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d '{"redirect": "www.clipflow.to", "redirectStatusCode": 308}'
```

## Required env vars (production)

See `.env.example` for the canonical list. The SEO-specific block:

```
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_VERIFICATION=
NEXT_PUBLIC_YANDEX_VERIFICATION=     # only if targeting RU
SENTRY_CSP_REPORT_URI=
NEXT_PUBLIC_REVIEW_RATING=           # gated, ≥20 reviews required
NEXT_PUBLIC_REVIEW_COUNT=
NEXT_PUBLIC_REVIEW_SOURCE_URL=
```

Each one is optional — missing values short-circuit cleanly without
emitting broken meta tags.

## Day-1 launch checklist (manual, one-off)

1. **Google Search Console**
   - Add `https://clipflow.to` as a property (HTML-tag method).
   - Copy the `<meta name="google-site-verification">` token into
     `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel env.
   - Redeploy → click "Verify" in GSC.
   - Submit sitemap: `https://clipflow.to/sitemap.xml`.
2. **Bing Webmaster Tools**
   - Add property; same token flow into `NEXT_PUBLIC_BING_VERIFICATION`.
   - Submit the same sitemap.
3. **Sentry CSP report endpoint** (if not already set)
   - Sentry → Project Settings → Security Headers → copy report URI
     into `SENTRY_CSP_REPORT_URI`.
4. **Vercel Analytics or PostHog dashboards**
   - Confirm `web_vital_lcp` / `web_vital_inp` / `web_vital_cls` events
     are landing in PostHog. They're emitted by
     [lib/analytics/web-vitals.ts](../lib/analytics/web-vitals.ts) on
     every page-view, both authenticated and anonymous.
5. **Imprint** — fill the `TODO` placeholders in
   [app/(legal)/imprint/page.tsx](../app/(legal)/imprint/page.tsx)
   with real Geschäftsführer / HRB / USt-ID before the launch tweet.

## Ongoing operations

- **Sitemap freshness** — auto-rebuilt on every deploy. The cache
  header is `s-maxage=3600`, so a redeploy that adds a new playbook
  guide takes up to 1 hour to surface in Google.
- **CSP promotion** — start in `Content-Security-Policy-Report-Only`
  (current state). After ≥7 days of clean Sentry reports under
  production traffic, swap the header key in `next.config.mjs` to
  `Content-Security-Policy` to enforce.
- **Reviews + AggregateRating** — leave the rating env vars unset
  until at least 20 verified reviews exist on a single source. Setting
  synthetic counts triggers a sitewide manual penalty.
- **AI search visibility** — the robots.ts allowlist explicitly
  permits `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`,
  `ClaudeBot`, `Claude-Web`, `Google-Extended`, `CCBot`. Spot-check
  AI-citation share quarterly via prompts like:
    - "Best OpusClip alternative for agencies"
    - "AI tool that captions in my brand voice"
    - "Clipflow vs Klap"

## Things this doc deliberately doesn't cover

- Backlink campaigns / outreach scripts — see Marketing playbook.
- ProductHunt / G2 / Capterra listings — same.
- Long-form content briefs — handled out-of-band by the playbook
  authoring flow under [app/playbook](../app/playbook).
