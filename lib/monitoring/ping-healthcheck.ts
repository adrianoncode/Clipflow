import 'server-only'

/**
 * Dead-man's-switch monitoring for scheduled cron jobs.
 *
 * We rely on Healthchecks.io (or any service with the same URL-based
 * ping semantics — Cronitor, BetterStack, etc.) to alert us when a
 * cron fails to check in, fails loudly, or runs too long.
 *
 * Pattern per cron route:
 *   1. `pingHealthcheck(url, 'start')` — resets the timer
 *   2. run the work
 *   3a. success → `pingHealthcheck(url, 'success', { reaped: 3 })`
 *   3b. error   → `pingHealthcheck(url, 'fail', { error: 'msg' })`
 *
 * If the URL env var is unset, every call is a no-op — local dev and
 * self-hosted deploys without external monitoring still work.
 *
 * Expected env vars (all optional):
 *   HEALTHCHECK_REAP_STUCK_ROWS_URL
 *   HEALTHCHECK_PUBLISH_SCHEDULED_URL
 *   HEALTHCHECK_FETCH_STATS_URL
 *   HEALTHCHECK_REAP_SOFT_DELETED_URL
 *
 * Example URL format (Healthchecks.io):
 *   https://hc-ping.com/abc-123-...-xyz
 */

type PingStatus = 'start' | 'success' | 'fail'

export async function pingHealthcheck(
  url: string | undefined,
  status: PingStatus,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (!url) return
  // Healthchecks.io appends /start and /fail to the base URL.
  const fullUrl =
    status === 'start' ? `${url}/start` : status === 'fail' ? `${url}/fail` : url

  try {
    await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // Monitoring must never break the cron. Swallow the error.
  }
}
