import 'server-only'

import type Stripe from 'stripe'

import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReferralConversionEmail } from '@/lib/email/send-referral-conversion'
import { getReferralCouponId, REFERRAL_DISCOUNT_PERCENT } from './constants'

/**
 * Called from the Stripe webhook once a referee has successfully completed
 * checkout. Marks the referral as confirmed and applies the shared referral
 * coupon to every active subscription owned by the referrer.
 *
 * Idempotent — safe to call multiple times with the same referral id.
 */
export async function confirmReferralAndRewardReferrer(params: {
  referralId: string
}): Promise<void> {
  const admin = createAdminClient()
  const couponId = getReferralCouponId()

  const { data: ref, error: refErr } = await admin
    .from('referrals')
    .select('id, referrer_user_id, referee_user_id, status')
    .eq('id', params.referralId)
    .maybeSingle()

  if (refErr || !ref) {
    console.error('[confirmReferral] lookup failed:', refErr?.message ?? 'not found')
    return
  }

  // `blocked` referrals never graduate — they're recorded for analytics
  // but get no coupon on either side. See is-disposable-email.ts.
  if (ref.status === 'blocked') {
    console.warn('[confirmReferral] referral is blocked, not applying coupon', ref.id)
    return
  }

  // Stripe retries webhook events on transient failures, so two invocations
  // can race. We guard the "first confirmation" side-effects (notify +
  // email) with a CONDITIONAL update: only rows still in `pending` flip
  // to `confirmed` here. The second webhook call will match zero rows
  // and skip the notification — guaranteeing exactly-once fan-out.
  const { data: flipped } = await admin
    .from('referrals')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', ref.id)
    .eq('status', 'pending')
    .select('id')

  const wonTheRace = Array.isArray(flipped) && flipped.length > 0
  if (wonTheRace) {
    await notifyReferrer({
      referrerUserId: ref.referrer_user_id as string,
      refereeUserId: ref.referee_user_id as string,
    })
  }

  if (!couponId) {
    console.warn('[confirmReferral] STRIPE_REFERRAL_COUPON_ID missing — skipping referrer reward')
    return
  }

  await applyCouponToReferrerSubscriptions({
    referrerUserId: ref.referrer_user_id as string,
    couponId,
  })
}

/**
 * Drops an in-app notification into the referrer's bell. Uses the admin
 * client because the webhook context has no authenticated user.
 */
async function notifyReferrer(params: {
  referrerUserId: string
  refereeUserId: string
}): Promise<void> {
  const admin = createAdminClient()

  // Look both profiles up in one pass.
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .in('id', [params.referrerUserId, params.refereeUserId])

  type MiniProfile = { id: string; full_name: string | null; email: string }
  const list = (profiles ?? []) as MiniProfile[]
  const referrer = list.find((p) => p.id === params.referrerUserId)
  const referee = list.find((p) => p.id === params.refereeUserId)

  const refereeDisplay =
    referee?.full_name ||
    referee?.email?.split('@')[0] ||
    'A friend'

  // In-app notification — always.
  const { error: notifError } = await admin.from('notifications').insert({
    user_id: params.referrerUserId,
    type: 'referral_confirmed',
    title: `🎉 ${refereeDisplay} signed up — you're saving ${REFERRAL_DISCOUNT_PERCENT}%`,
    body: `Your ${REFERRAL_DISCOUNT_PERCENT}% referral discount is now active on your subscription.`,
    link: '/settings/referrals',
  })
  if (notifError) {
    console.error('[confirmReferral] notify failed:', notifError.message)
  }

  // Email — best-effort, silently skips in dev when RESEND_API_KEY is missing.
  if (referrer?.email) {
    await sendReferralConversionEmail({
      toEmail: referrer.email,
      toName: referrer.full_name,
      refereeDisplay,
      savingsLine: `${REFERRAL_DISCOUNT_PERCENT}% off your Clipflow subscription is now active.`,
    })
  }
}

/**
 * Apply `couponId` to every active Stripe subscription that belongs to any
 * workspace owned by the referrer. We look up subscriptions via our own
 * `subscriptions` table (which the webhook keeps in sync) rather than
 * hitting Stripe, because workspace→customer mapping only lives here.
 */
async function applyCouponToReferrerSubscriptions(params: {
  referrerUserId: string
  couponId: string
}): Promise<void> {
  const admin = createAdminClient()

  // Referrer's workspaces
  const { data: workspaces } = await admin
    .from('workspaces')
    .select('id')
    .eq('owner_id', params.referrerUserId)

  const workspaceIds = (workspaces ?? []).map((w: { id: string }) => w.id)
  if (workspaceIds.length === 0) return

  const { data: subs } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .in('workspace_id', workspaceIds)

  const active = (subs ?? []).filter(
    (s: { stripe_subscription_id: string | null; status: string | null }) =>
      s.stripe_subscription_id &&
      s.status &&
      ['active', 'trialing', 'past_due'].includes(s.status),
  )

  for (const s of active) {
    if (!s.stripe_subscription_id) continue
    try {
      // `discounts` replaces the current discount set — pass the coupon
      // alongside nothing else. If the subscription already has the same
      // coupon this is a no-op from the customer's perspective.
      await stripe.subscriptions.update(s.stripe_subscription_id, {
        discounts: [{ coupon: params.couponId }],
      } as Stripe.SubscriptionUpdateParams)
    } catch (err) {
      console.error('[confirmReferral] failed to attach coupon to', s.stripe_subscription_id, err)
    }
  }
}

/**
 * When a *referrer* starts their own checkout, pre-attach the referral
 * coupon so they carry their earned discount over to the new subscription.
 * Returns the coupon id if any confirmed referrals exist, else null.
 */
export async function getEarnedReferrerCouponId(userId: string): Promise<string | null> {
  const couponId = getReferralCouponId()
  if (!couponId) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from('referrals')
    .select('id')
    .eq('referrer_user_id', userId)
    .eq('status', 'confirmed')
    .limit(1)
    .maybeSingle()

  return data ? couponId : null
}
