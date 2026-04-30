import 'server-only'

import type Stripe from 'stripe'

import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendReferralConversionEmail } from '@/lib/email/send-referral-conversion'
import { getReferralCouponId, REFERRAL_DISCOUNT_PERCENT } from './constants'
import { log } from '@/lib/log'

/**
 * Called from the Stripe webhook on `invoice.paid` for a referee's first
 * paid invoice. Marks the referral as confirmed, records the invoice id,
 * and applies the shared referral coupon to every active subscription
 * owned by the referrer.
 *
 * Why invoice.paid (not checkout.session.completed):
 *   - Checkout completion fires before money moves; SCA can fail, the
 *     subscription can land in `incomplete` state, the customer can
 *     immediately cancel. Crediting then = paying out for unconfirmed
 *     conversions.
 *   - `invoice.paid` with `billing_reason === 'subscription_create'` is
 *     the "first month is paid" signal — that's when reward earns.
 *
 * Idempotent — safe to call multiple times with the same referral id.
 * The event-id dedup table at the webhook entry handles the common
 * replay case; this function additionally CAS-flips status to confirmed
 * so two simultaneous webhook calls can't both notify.
 */
export async function confirmReferralAndRewardReferrer(params: {
  referralId: string
  paidInvoiceId: string
}): Promise<void> {
  const admin = createAdminClient()
  const couponId = getReferralCouponId()

  const { data: ref, error: refErr } = await admin
    .from('referrals')
    .select('id, referrer_user_id, referee_user_id, status, reversed_at')
    .eq('id', params.referralId)
    .maybeSingle()

  if (refErr || !ref) {
    log.error('confirmReferral lookup failed', { error: refErr?.message ?? 'not found' })
    return
  }

  // `blocked` referrals never graduate — they're recorded for analytics
  // but get no coupon on either side. See is-disposable-email.ts.
  if (ref.status === 'blocked') {
    log.warn('confirmReferral referral blocked, not applying coupon', { referralId: ref.id })
    return
  }

  // Reversed referrals stay reversed — a refund + new payment for the
  // same referee should not silently undo the reversal.
  if (ref.reversed_at) {
    log.warn('confirmReferral referral previously reversed, not re-confirming', {
      referralId: ref.id,
    })
    return
  }

  // CAS flip: only rows still in `pending` graduate. A second webhook
  // call will match zero rows → no double notification, no double
  // coupon-attach run.
  const { data: flipped } = await admin
    .from('referrals')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      paid_invoice_id: params.paidInvoiceId,
    })
    .eq('id', ref.id)
    .eq('status', 'pending')
    .select('id')

  const wonTheRace = Array.isArray(flipped) && flipped.length > 0
  if (!wonTheRace) {
    // Already confirmed by an earlier replay. Nothing to do — coupon was
    // already attached on that pass.
    return
  }

  await notifyReferrer({
    referrerUserId: ref.referrer_user_id as string,
    refereeUserId: ref.referee_user_id as string,
  })

  if (!couponId) {
    log.warn('confirmReferral STRIPE_REFERRAL_COUPON_ID missing, skipping referrer reward')
    return
  }

  await applyCouponToReferrerSubscriptions({
    referrerUserId: ref.referrer_user_id as string,
    couponId,
  })
}

/**
 * Reverse a previously-confirmed referral. Triggered by the webhook on
 * `charge.refunded` / `charge.dispute.created` / a `customer.subscription
 * .deleted` event whose subscription belongs to a referee whose first
 * paid invoice was within the reversal window.
 *
 * Sets `reversed_at` + `reversal_reason`, removes the coupon from the
 * referrer's subscriptions if no other confirmed referrals are still
 * earning it, and notifies the referrer in-app that the discount has
 * been removed.
 */
export async function reverseReferral(params: {
  referralId: string
  reason: 'refund' | 'dispute' | 'subscription_canceled' | 'manual'
}): Promise<void> {
  const admin = createAdminClient()

  const { data: ref } = await admin
    .from('referrals')
    .select('id, referrer_user_id, status, reversed_at')
    .eq('id', params.referralId)
    .maybeSingle()

  if (!ref) return
  if (ref.reversed_at) return // already reversed
  if (ref.status !== 'confirmed') {
    // A pending referral that gets refunded just stays pending — nothing
    // to undo. Mark it blocked so it can't graduate later if the same
    // session is somehow retried.
    await admin
      .from('referrals')
      .update({ status: 'blocked', reversed_at: new Date().toISOString(), reversal_reason: params.reason })
      .eq('id', ref.id)
    return
  }

  // CAS-flip: only rows still in `confirmed` get reversed, so two
  // simultaneous reverse calls don't both run the coupon-removal pass.
  // We use status='blocked' (the only "terminal-non-reward" enum value)
  // combined with reversed_at to distinguish a reversal from a fraud
  // block. Queries earning rewards must also check `reversed_at IS NULL`.
  const { data: flipped } = await admin
    .from('referrals')
    .update({
      status: 'blocked',
      reversed_at: new Date().toISOString(),
      reversal_reason: params.reason,
    })
    .eq('id', ref.id)
    .eq('status', 'confirmed')
    .select('id')

  if (!Array.isArray(flipped) || flipped.length === 0) return

  // Only strip the coupon if the referrer has zero remaining confirmed
  // (non-reversed) referrals. Otherwise other referees are still earning
  // them the discount.
  const referrerUserId = ref.referrer_user_id as string
  const { data: stillConfirmed } = await admin
    .from('referrals')
    .select('id')
    .eq('referrer_user_id', referrerUserId)
    .eq('status', 'confirmed')
    .is('reversed_at', null)
    .limit(1)

  if (Array.isArray(stillConfirmed) && stillConfirmed.length > 0) return

  await removeCouponFromReferrerSubscriptions({ referrerUserId })
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
    log.error('confirmReferral notify failed', { error: notifError.message })
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
      // Read the current state first — if our coupon is already attached
      // we skip the update entirely. Without this, every webhook replay
      // would re-issue the `subscriptions.update` call, which atomically
      // replaces the discount set: any unrelated discount a CS rep
      // attached in the meantime would be silently overwritten.
      const current = await stripe.subscriptions.retrieve(s.stripe_subscription_id)
      // Stripe's `discounts` field shape varies across API versions; we
      // tolerate string ids, expanded coupon objects, and Discount
      // wrappers. Anything that resolves to our coupon id counts.
      type RawDiscount = string | { id?: string; coupon?: { id?: string } | string | null }
      const existing = ((current as Stripe.Subscription & { discounts?: RawDiscount[] }).discounts ?? []) as RawDiscount[]
      const alreadyAttached = existing.some((d) => {
        if (typeof d === 'string') return d === params.couponId
        const c = d.coupon
        const id = typeof c === 'string' ? c : c?.id
        return id === params.couponId
      })
      if (alreadyAttached) continue

      await stripe.subscriptions.update(s.stripe_subscription_id, {
        discounts: [{ coupon: params.couponId }],
      } as Stripe.SubscriptionUpdateParams)
    } catch (err) {
      log.error('confirmReferral failed to attach coupon', err, { subscriptionId: s.stripe_subscription_id })
    }
  }
}

/**
 * Mirror of `applyCouponToReferrerSubscriptions` for the reversal path.
 * Removes ONLY the referral coupon from each subscription — leaves any
 * other discount intact by passing an empty `discounts` array only when
 * the referral coupon is the sole attached discount.
 */
async function removeCouponFromReferrerSubscriptions(params: {
  referrerUserId: string
}): Promise<void> {
  const couponId = getReferralCouponId()
  if (!couponId) return

  const admin = createAdminClient()

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
      const current = await stripe.subscriptions.retrieve(s.stripe_subscription_id)
      type RawDiscount = string | { id?: string; coupon?: { id?: string } | string | null }
      const existing = ((current as Stripe.Subscription & { discounts?: RawDiscount[] }).discounts ?? []) as RawDiscount[]
      const remaining = existing.filter((d) => {
        if (typeof d === 'string') return d !== couponId
        const c = d.coupon
        const id = typeof c === 'string' ? c : c?.id
        return id !== couponId
      })
      if (remaining.length === existing.length) continue // coupon wasn't attached anyway

      await stripe.subscriptions.update(s.stripe_subscription_id, {
        discounts: remaining.length > 0 ? (remaining as Stripe.SubscriptionUpdateParams['discounts']) : [],
      })
    } catch (err) {
      log.error('reverseReferral failed to remove coupon', err, {
        subscriptionId: s.stripe_subscription_id,
      })
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
