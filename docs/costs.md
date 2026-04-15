# Clipflow — Cost & Margin Model

Last updated: 2026-04-15. This file is the source of truth for why the
plan quotas in `lib/billing/plans.ts` are what they are. Update it
when the BYOK model shifts or a new paid integration lands.

## Business model — what we provide vs. what the user brings

Clipflow is a **thin orchestration layer** on top of best-of-breed
APIs. Our margin comes from UX, workflow, caching, and the insight
data we own — not from marking up token/render costs.

### What **we** pay for (fixed costs, included in plan price)

| Service | Our cost | Used for |
|---------|----------|----------|
| Apify | $0.002 / request | Trending sounds, competitor analysis, hashtag research, viral discovery, comment mining |
| ScrapeCreators | ~fixed subscription | Creator database (TikTok/IG/Twitter/LI/YT profile search) |
| Pexels | $0 (free tier) | Stock video + audio |
| Supabase + Vercel + Resend | ~$100–300/mo flat | Platform infra |

### What **the user brings** (BYOK — they pay their provider directly)

| Service | Typical user cost | Used for |
|---------|-------------------|----------|
| OpenAI / Anthropic / Google | $5–20/mo | Script generation, output writing |
| Shotstack | $10–40/mo | Video rendering (MP4 output) |
| Replicate | $5–30/mo | AI avatar, video reframe |
| ElevenLabs | $0–99/mo | TTS, voice cloning, auto-dub |

**Why this model works:**

1. **Zero runaway costs** — a user who renders 500 videos/mo costs us
   nothing extra; they pay Shotstack themselves.
2. **Transparent pricing** — users see exactly what AI/rendering
   costs. Tools that bundle everything mark up tokens 5–10×.
3. **Free-tier generous** — Shotstack gives 20 free render-min; most
   users have OpenAI credits. New signups test for $0 before any
   subscription.
4. **Our moat is UX + data**, not the APIs. Anyone can call Shotstack;
   only Clipflow wraps it with the pipeline, templates, scraper
   intelligence, and workflow.

## Per-User Cost (Our Variable Burn)

Assuming 40 % quota utilization (standard SaaS averaging):

### Free ($0)

- No scrapers, no renders, no paid features active
- Cost: **$0**

### Solo ($19/mo)

Scraper quotas (only thing we actually pay for):
- 20 hashtag queries × $0.04 = $0.32 (cache-adjusted: $0.16)
- 5 competitor analyses × $0.08 = $0.40 (cache-adjusted: $0.20)
- 40 % util → ~$0.25 scraper cost
- ScrapeCreators pro-rata share: ~$0.50

**Total variable cost: ~$0.75 / user / mo**
**Margin at $19: 96%** ✓

### Team ($49/mo)

Scraper quotas:
- 100 hashtag × $0.04 × 0.4 util = $1.60
- 20 competitor × $0.08 × 0.4 = $0.64
- 30 viral × $0.10 × 0.4 = $1.20
- 20 comment × $0.04 × 0.4 = $0.32
- 100 trending (heavily cached) ≈ $0.05
- ScrapeCreators share: ~$1.00

**Total variable cost: ~$4.80 / user / mo**
**Margin at $49: 90%** ✓

### Agency ($99/mo)

Scraper quotas (5× Team, caching helps more on volume):
- 500 hashtag × 0.4 util × cache ~50% = $4
- 100 competitor × 0.4 × $0.08 = $3.20
- 150 viral × 0.4 × $0.10 = $6
- 100 comment × 0.4 × $0.04 = $1.60
- 500 trending (cached) ≈ $0.10
- ScrapeCreators share: ~$3.00

**Total variable cost: ~$18 / user / mo**
**Margin at $99: 82%** ✓

## Worst-Case (100% Quota Utilization)

For financial safety — margins stay positive even if a user maxes
out:

- Solo 100% util: ~$1.90 cost → 90% margin
- Team 100% util: ~$12 cost → 75% margin
- Agency 100% util: ~$45 cost → 55% margin

## What BYOK unlocks for the user

When a user connects their Shotstack / Replicate / ElevenLabs key,
they're paying those providers directly. Since we don't eat the cost,
we **don't apply quotas** for that service — BYOK = unlimited for
that feature. This is the incentive to connect keys:

| Service | Without BYOK (platform) | With BYOK |
|---------|-------------------------|-----------|
| Shotstack | plan-quota renders | **Unlimited renders** |
| Replicate | plan-quota avatars + reframe | **Unlimited** |
| ElevenLabs | plan-quota TTS + dubs + clones | **Unlimited** |

The platform keys remain as fallback during the BYOK rollout — new
users are steered toward connecting their own from onboarding step 3.

## Levers if margins slip

1. **Cache harder** — hashtag + viral results barely change hourly.
   12–24 h cache cuts Apify calls 10×.
2. **Coalesce cross-workspace queries** — trending-sounds region
   lists are global, one fetch serves all.
3. **Volume-tier Apify** — at $50+/mo actor spend they discount.
4. **ScrapeCreators tier** — bump up only when DAU crosses threshold.

## Change log

- 2026-04-15: BYOK expanded to Shotstack + Replicate + ElevenLabs.
  Team price reverted from $79 → $49 since BYOK keeps our cost under
  $5/user. Solo stays $19, Agency $99. All plans now deliver 82–96%
  margin at 40% utilization.
- 2026-04-15 (earlier): Initial cost model + Apify scrapers added.
