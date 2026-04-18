import 'server-only'

import { PostHog } from 'posthog-node'

import type { AnalyticsEvent } from '@/lib/analytics/events'

/**
 * Server-side PostHog client for events fired from server actions,
 * cron jobs, and webhooks. We want both "user clicked Upgrade on the
 * billing page" (client) AND "Stripe webhook confirmed the checkout"
 * (server) to tie to the same distinct_id so the funnel holds.
 *
 * Single long-lived client — PostHog handles batching + flushing
 * internally. Missing env means we no-op, same as the client bundle.
 */

let _client: PostHog | null = null

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null
  if (_client) return _client
  _client = new PostHog(key, {
    host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    // Flush fast in serverless — otherwise events die in the buffer
    // when the lambda freezes. Short intervals are cheap vs. lost data.
    flushAt: 1,
    flushInterval: 0,
  })
  return _client
}

/** Fire a server-side event. `distinctId` should match the user's
 * Supabase user.id so client-side events tie to the same person. */
export async function trackServer(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = getClient()
  if (!client) return
  client.capture({ distinctId, event, properties })
  // flushAt=1 means this also triggers the send — awaiting just lets
  // the promise settle before serverless freezes.
  try {
    await client.flush()
  } catch {
    // PostHog failures never block the action.
  }
}
