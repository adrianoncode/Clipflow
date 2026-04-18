import { headers } from 'next/headers'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe/client'
import { upsertSubscription } from '@/app/(app)/billing/actions'
import { PLANS, type BillingPlan } from '@/lib/billing/plans'
import { confirmReferralAndRewardReferrer } from '@/lib/referrals/confirm-referral'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentFailedEmail } from '@/lib/email/send-payment-failed'
import { log } from '@/lib/log'

const RELEVANT_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  // Dunning: Stripe notifies us when a charge fails. We fire a
  // proactive email so the user can update their card before the
  // subscription actually gets paused.
  'invoice.payment_failed',
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

/**
 * Fires when Stripe fails to charge a card. We look up the workspace
 * owner by customer ID, generate a billing-portal link for them, and
 * send a proactive email pointing at it. The subscription status row
 * in our DB will separately transition to `past_due` via the
 * subscription.updated event — we don't touch it here.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) {
    log.warn('stripe payment_failed missing customer ID', { invoiceId: invoice.id })
    return
  }

  const admin = createAdminClient()
  const { data: subRow } = await admin
    .from('subscriptions')
    .select('workspace_id, plan, workspaces(name, owner_id)')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()

  if (!subRow) return
  const workspace = subRow.workspaces as unknown as { name: string; owner_id: string } | null
  if (!workspace) return

  // Owner email from auth
  const { data: ownerData } = await admin.auth.admin.getUserById(workspace.owner_id)
  const ownerEmail = ownerData?.user?.email
  if (!ownerEmail) return

  // Create a portal session so the email link drops them directly onto
  // their payment methods. Stripe expires these quickly which is fine —
  // the email is meant to be clicked soon anyway.
  let portalUrl = 'https://clipflow.to/billing'
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'}/billing`,
    })
    portalUrl = portal.url
  } catch {
    // fall back to in-app billing page
  }

  const nextAttemptAt =
    invoice.next_payment_attempt != null
      ? new Date(invoice.next_payment_attempt * 1000)
      : null

  await sendPaymentFailedEmail({
    toEmail: ownerEmail,
    workspaceName: workspace.name,
    planName: PLANS[subRow.plan as BillingPlan]?.name ?? subRow.plan,
    billingPortalUrl: portalUrl,
    nextAttemptAt,
  })
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
    } else if (event.type === 'invoice.payment_failed') {
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
    }
  } catch (err) {
    log.error('stripe webhook handler error', err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
