'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { stripe } from '@/lib/stripe/client'
import { PRICE_IDS } from '@/lib/stripe/price-ids'
import { getUser } from '@/lib/auth/get-user'
import { getSubscription } from '@/lib/billing/get-subscription'
import { createAdminClient } from '@/lib/supabase/admin'
import { getReferralCouponId } from '@/lib/referrals/constants'
import { getEarnedReferrerCouponId } from '@/lib/referrals/confirm-referral'

const checkoutSchema = z.object({
  workspace_id: z.string().uuid(),
  plan: z.enum(['solo', 'team', 'agency']),
  interval: z.enum(['monthly', 'annual']),
  /** Feature the user was trying to reach when they hit the paywall.
   * Used to build a feature-specific success_url so they land where
   * they actually wanted to go post-payment. */
  feature: z.string().max(40).optional(),
})

/** Map a gated feature key → the page that feature lives on. After
 * checkout we bounce the user straight there. Workspace-scoped paths
 * get the id substituted at call time. Features without an entry
 * (e.g. pure cross-workspace capabilities) fall back to the dashboard. */
function featurePostCheckoutPath(
  feature: string | undefined,
  workspaceId: string,
): string {
  if (!feature) return '/dashboard?billing=success'
  const map: Record<string, string> = {
    scheduling: `/workspace/${workspaceId}/schedule?billing=success`,
    abHookTesting: `/workspace/${workspaceId}/pipeline?billing=success`,
    creatorResearch: `/workspace/${workspaceId}/research?billing=success`,
    brollAutomation: `/workspace/${workspaceId}?billing=success`,
    avatarVideos: `/workspace/${workspaceId}?billing=success`,
    autoDub: `/workspace/${workspaceId}?billing=success`,
    multiWorkspace: '/clients?billing=success',
    teamSeats: `/workspace/${workspaceId}/members?billing=success`,
    clientReviewLink: `/workspace/${workspaceId}/pipeline?billing=success`,
    whiteLabelReview: `/workspace/${workspaceId}/pipeline?billing=success`,
  }
  return map[feature] ?? `/workspace/${workspaceId}?billing=success`
}

export async function createCheckoutSessionAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = checkoutSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    plan: formData.get('plan'),
    interval: formData.get('interval'),
    feature: formData.get('feature')?.toString() || undefined,
  })
  if (!parsed.success) {
    return { error: 'Invalid request.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const priceId = PRICE_IDS[parsed.data.plan][parsed.data.interval]
  if (!priceId) {
    return { error: 'Pricing not configured yet. Please try again later.' }
  }

  const sub = await getSubscription(parsed.data.workspace_id)

  // Reuse or create Stripe customer
  let customerId = sub.stripe_customer_id ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { workspace_id: parsed.data.workspace_id, user_id: user.id },
    })
    customerId = customer.id
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // Referral: attach the 20 %-off coupon if EITHER
  //   (a) this user was referred by someone else and hasn't converted yet
  //       (they get the discount as the referee), or
  //   (b) this user has already earned the discount by referring someone
  //       paying (they get the discount as the referrer, carried over to
  //       a fresh subscription).
  // Same coupon in both cases — Stripe only allows one discount anyway.
  const couponId = getReferralCouponId()
  const pendingRefereeRow = await findPendingReferralForUser(user.id)
  const earnedReferrerCoupon = await getEarnedReferrerCouponId(user.id)
  const shouldApplyCoupon = Boolean(
    couponId && (pendingRefereeRow || earnedReferrerCoupon),
  )
  const discounts = shouldApplyCoupon ? [{ coupon: couponId }] : undefined
  const referral = pendingRefereeRow

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}${featurePostCheckoutPath(parsed.data.feature, parsed.data.workspace_id)}`,
    cancel_url: `${baseUrl}/billing?workspace_id=${parsed.data.workspace_id}`,
    ...(discounts ? { discounts } : {}),
    // Stripe forbids combining `discounts` with `allow_promotion_codes`;
    // our referral coupon takes priority over manual promo codes.
    ...(discounts ? {} : { allow_promotion_codes: true }),
    metadata: {
      workspace_id: parsed.data.workspace_id,
      plan: parsed.data.plan,
      ...(referral ? { referral_id: referral.id } : {}),
    },
    subscription_data: {
      metadata: {
        workspace_id: parsed.data.workspace_id,
        plan: parsed.data.plan,
        ...(referral ? { referral_id: referral.id } : {}),
      },
    },
  })

  if (!session.url) return { error: 'Could not create checkout session.' }

  redirect(session.url)
}

/**
 * Pull the pending referral (if any) where the current user is the referee.
 * RLS allows the user to read their own referral row, so no admin client.
 */
async function findPendingReferralForUser(userId: string): Promise<{ id: string } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('referrals')
    .select('id')
    .eq('referee_user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()
  return (data as { id: string } | null) ?? null
}

export async function createPortalSessionAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const workspaceId = z.string().uuid().safeParse(formData.get('workspace_id'))
  if (!workspaceId.success) return { error: 'Invalid workspace.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const sub = await getSubscription(workspaceId.data)
  if (!sub.stripe_customer_id) {
    return { error: 'No active subscription found.' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${baseUrl}/billing?workspace_id=${workspaceId.data}`,
  })

  redirect(session.url)
}

/**
 * Upserts a subscription row via admin client (bypasses RLS).
 * Called from the webhook handler.
 */
export async function upsertSubscription(params: {
  workspaceId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  plan: string
  status: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
}) {
  const admin = createAdminClient()
  const plan = params.plan as 'free' | 'solo' | 'team' | 'agency'
  const status = params.status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | 'incomplete_expired' | 'paused'
  const periodEnd = params.currentPeriodEnd.toISOString()

  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('workspace_id', params.workspaceId)
    .maybeSingle()

  if (existing) {
    await admin
      .from('subscriptions')
      .update({
        stripe_customer_id: params.stripeCustomerId,
        stripe_subscription_id: params.stripeSubscriptionId,
        plan,
        status,
        current_period_end: periodEnd,
        cancel_at_period_end: params.cancelAtPeriodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', params.workspaceId)
  } else {
    await admin.from('subscriptions').insert({
      workspace_id: params.workspaceId,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      plan,
      status,
      current_period_end: periodEnd,
      cancel_at_period_end: params.cancelAtPeriodEnd,
    })
  }
}
