import { headers } from 'next/headers'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe/client'
import { upsertSubscription } from '@/app/(app)/billing/actions'
import type { BillingPlan } from '@/lib/billing/plans'
import { confirmReferralAndRewardReferrer } from '@/lib/referrals/confirm-referral'
import { log } from '@/lib/log'

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

/**
 * Maps a Stripe price ID back to our plan name.
 * Returns null (not 'free') when the price ID is unrecognized — a
 * misconfigured preview deploy otherwise silently downgraded paying
 * customers on every subscription.updated event. Caller logs + skips.
 */
function planFromPriceId(priceId: string): BillingPlan | null {
  const envMap: Record<string, BillingPlan> = {
    [process.env.STRIPE_PRICE_SOLO_MONTHLY ?? '__']: 'solo',
    [process.env.STRIPE_PRICE_SOLO_ANNUAL ?? '__']: 'solo',
    [process.env.STRIPE_PRICE_TEAM_MONTHLY ?? '__']: 'team',
    [process.env.STRIPE_PRICE_TEAM_ANNUAL ?? '__']: 'team',
    [process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? '__']: 'agency',
    [process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? '__']: 'agency',
  }
  return envMap[priceId] ?? null
}

async function handleSubscriptionEvent(sub: Stripe.Subscription) {
  const workspaceId =
    (sub.metadata?.workspace_id as string | undefined) ?? ''

  if (!workspaceId) {
    log.warn('stripe webhook subscription missing workspace_id metadata', { subscriptionId: sub.id })
    return
  }

  const priceId = sub.items.data[0]?.price.id ?? ''
  const plan = planFromPriceId(priceId)

  if (!plan) {
    // Don't touch the DB on an unknown price ID. Safer to leave the
    // existing row intact than downgrade a real paying customer
    // because STRIPE_PRICE_* envs are missing on this deploy.
    log.error('stripe webhook unknown price ID — skipping subscription update', undefined, {
      priceId,
      subscriptionId: sub.id,
      workspaceId,
    })
    return
  }

  await upsertSubscription({
    workspaceId,
    stripeCustomerId: sub.customer as string,
    stripeSubscriptionId: sub.id,
    plan,
    status: sub.status,
    currentPeriodEnd: new Date((sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  })
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('stripe webhook signature verification failed', err, { message })
    return new Response(`Webhook error: ${message}`, { status: 400 })
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return new Response('Ignored', { status: 200 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        // Prefer metadata from subscription, fall back to session
        if (!sub.metadata.workspace_id && session.metadata?.workspace_id) {
          ;(sub.metadata as Record<string, string>).workspace_id = session.metadata.workspace_id
        }
        await handleSubscriptionEvent(sub)

        // Referral: if this checkout started as a referee conversion,
        // mark the referral confirmed and push the coupon onto the
        // referrer's existing subscription(s). Metadata was copied from
        // the checkout session into the subscription when created.
        const referralId =
          (sub.metadata?.referral_id as string | undefined) ??
          (session.metadata?.referral_id as string | undefined)
        if (referralId) {
          await confirmReferralAndRewardReferrer({ referralId })
        }
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription)
    }
  } catch (err) {
    log.error('stripe webhook handler error', err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
