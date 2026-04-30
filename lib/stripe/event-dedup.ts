import 'server-only'

import { log } from '@/lib/log'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Stripe webhook event-ID idempotency.
 *
 * Stripe retries webhook deliveries up to 3 days on transient failures.
 * Without dedup, replays compound: every retry of a checkout-completion
 * re-applies the referral coupon, every retry of subscription-updated
 * re-runs the upsert, etc. Most are harmless on idempotent ops, but
 * `applyCouponToReferrerSubscriptions` was demonstrated to overwrite
 * unrelated manual discounts on each replay.
 *
 * Pattern:
 *   const seen = await markEventProcessed(event.id, event.type)
 *   if (seen) return new Response('OK (already processed)', { status: 200 })
 *
 * Returns:
 *   - `false`  → first time we've seen this event_id, proceed with handler
 *   - `true`   → duplicate, skip
 *   - `false`  on DB error (fail-open: better to risk one duplicate than
 *               drop a real event due to a transient outage). Logged so
 *               the operator can see it.
 */
export async function markEventProcessed(eventId: string, type: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('processed_stripe_events')
    .insert({ event_id: eventId, type })

  if (!error) return false

  // Postgres unique violation = "already processed" → this is the success
  // path. Any other error (network, RLS, etc.) we treat as "proceed
  // anyway" so a DB hiccup doesn't drop money-relevant events.
  if (error.code === '23505') return true

  log.error('markEventProcessed unexpected error', error, { eventId, type })
  return false
}
