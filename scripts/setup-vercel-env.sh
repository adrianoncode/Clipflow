#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Bulk Vercel env-var setup helper.
#
# Walks through every env var Clipflow expects in production, prompts for
# the value (with the key name + link to where to get it), and pushes it
# to Vercel via `vercel env add`.
#
# Run from the repo root:
#   bash scripts/setup-vercel-env.sh
#
# Skip a var by hitting ENTER without typing a value.
# Run again later to fill in vars you skipped — existing values aren't
# overwritten (you'll see "already exists" and move on).
# ---------------------------------------------------------------------------

set -u

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI not installed. Run: npm i -g vercel"
  exit 1
fi

if ! vercel whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: vercel login"
  exit 1
fi

ENV="${1:-production}"
if [[ "$ENV" != "production" && "$ENV" != "preview" && "$ENV" != "development" ]]; then
  echo "Usage: bash scripts/setup-vercel-env.sh [production|preview|development]"
  exit 1
fi

echo ""
echo "Setting env vars for target: $ENV"
echo "Hit ENTER to skip any variable."
echo ""

ask() {
  local name=$1
  local desc=$2
  local value
  printf "\e[1m%s\e[0m — %s\n> " "$name" "$desc"
  read -r value
  if [[ -z "$value" ]]; then
    echo "  (skipped)"
    return
  fi
  echo "$value" | vercel env add "$name" "$ENV" >/dev/null 2>&1
  if [[ $? -eq 0 ]]; then
    echo "  added"
  else
    echo "  failed (maybe already exists — remove first with 'vercel env rm $name $ENV')"
  fi
  echo ""
}

echo "=== Supabase ==="
ask NEXT_PUBLIC_SUPABASE_URL       "Supabase project URL (Dashboard -> Project Settings -> API)"
ask NEXT_PUBLIC_SUPABASE_ANON_KEY  "Supabase anon key (same page)"
ask SUPABASE_SERVICE_ROLE_KEY      "Supabase service_role key (secret, same page)"

echo "=== Core secrets ==="
ask ENCRYPTION_KEY                 "AES-256-GCM master key (run: openssl rand -hex 32)"
ask CRON_SECRET                    "Cron shared secret (run: openssl rand -hex 32)"
ask SHOTSTACK_WEBHOOK_SECRET       "Shotstack webhook secret (run: openssl rand -hex 32)"

echo "=== App URL ==="
ask NEXT_PUBLIC_APP_URL            "Production URL, no trailing slash (e.g. https://clipflow.to)"

echo "=== Admin ==="
ask ADMIN_EMAILS                   "Comma-separated lowercase emails with /admin access"

echo "=== Upstash (rate limits) - https://upstash.com ==="
ask UPSTASH_REDIS_REST_URL         "Redis REST URL from Upstash dashboard"
ask UPSTASH_REDIS_REST_TOKEN       "Redis REST token from Upstash dashboard"

echo "=== Sentry (error tracking) - https://sentry.io ==="
ask NEXT_PUBLIC_SENTRY_DSN         "Sentry DSN (getting-started page)"
ask SENTRY_DSN                     "Sentry DSN (same value)"
ask SENTRY_ORG                     "Sentry organization slug"
ask SENTRY_PROJECT                 "Sentry project slug"
ask SENTRY_AUTH_TOKEN              "Sentry auth token (Settings -> Auth Tokens)"

echo "=== Healthchecks (cron monitoring) - https://healthchecks.io ==="
ask HEALTHCHECK_REAP_STUCK_ROWS_URL   "Ping URL for reap-stuck-rows cron (5min schedule)"
ask HEALTHCHECK_PUBLISH_SCHEDULED_URL "Ping URL for publish-scheduled cron (daily)"
ask HEALTHCHECK_FETCH_STATS_URL       "Ping URL for fetch-stats cron (daily)"
ask HEALTHCHECK_REAP_SOFT_DELETED_URL "Ping URL for reap-soft-deleted cron (daily)"

echo "=== Email (Resend) - https://resend.com ==="
ask RESEND_API_KEY                 "Resend API key"
ask EMAIL_FROM                     "Verified sender e.g. 'Clipflow <hello@clipflow.to>'"

echo "=== Stripe - https://dashboard.stripe.com ==="
ask STRIPE_SECRET_KEY              "Stripe secret key (sk_live_...)"
ask STRIPE_WEBHOOK_SECRET          "Stripe webhook signing secret (Dashboard -> Webhooks)"
ask STRIPE_REFERRAL_COUPON_ID      "Stripe referral coupon ID (optional - leave empty if no referrals)"

echo ""
echo "Done. Run 'vercel env ls' to review. Redeploy for changes to take effect:"
echo "  vercel --prod"
