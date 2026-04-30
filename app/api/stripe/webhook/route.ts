import { headers } from 'next/headers'
import Stripe from 'stripe'

import { stripe } from '@/lib/stripe/client'
import { upsertSubscription } from '@/app/(app)/billing/actions'
import { PLANS, type BillingPlan } from '@/lib/billing/plans'
import {
  confirmReferralAndRewardReferrer,
  reverseReferral,
} from '@/lib/referrals/confirm-referral'
import { markEventProcessed } from '@/lib/stripe/event-dedup'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentFailedEmail } from '@/lib/email/send-payment-failed'
import { log } from '@/lib/log'

// Pin the runtime so request-body bytes match what Stripe signed —
// signature verification is byte-exact. Edge runtime can re-encode on
// some platforms; Node is the safe choice. `force-dynamic` disables any
// caching layer that could replay an old body.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RELEVANT_EVENTS = new Set([
  // Subscription lifecycle
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  // Invoice lifecycle — invoice.paid is the moment of truth for referral
  // crediting (money actually moved). payment_failed triggers dunning.
  'invoice.paid',
  'invoice.payment_failed',
  // Reversal triggers
  'charge.refunded',
  'charge.dispute.created',
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

  if (!subRow) {
    log.warn('stripe payment_failed: no subscription row for customer', { customerId })
    return
  }
  const workspace = subRow.workspaces as unknown as { name: string; owner_id: string } | null
  if (!workspace) return

  const { data: ownerData } = await admin.auth.admin.getUserById(workspace.owner_id)
  const ownerEmail = ownerData?.user?.email
  if (!ownerEmail) return

  let portalUrl = 'https://clipflow.to/billing'
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://clipflow.to'}/billing`,
    })
    portalUrl = portal.url
  } catch {
    /* fall back to in-app billing page */
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
  let workspaceId = (sub.metadata?.workspace_id as string | undefined) ?? ''

  if (!workspaceId) {
    // Recovery path: customer.subscription.created can fire before
    // checkout.session.completed copies the metadata over. Look up by
    // customer id — we may have the workspace mapped already from a
    // prior subscription on the same customer.
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('subscriptions')
      .select('workspace_id')
      .eq('stripe_customer_id', sub.customer as string)
      .maybeSingle()
    workspaceId = existing?.workspace_id ?? ''
  }

  if (!workspaceId) {
    log.warn('stripe webhook subscription missing workspace_id metadata', { subscriptionId: sub.id })
    return
  }

  const priceId = sub.items.data[0]?.price.id ?? ''
  const plan = planFromPriceId(priceId)

  if (!plan) {
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
    currentPeriodEnd: new Date(
      (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000,
    ),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  })
}

/**
 * `invoice.paid` is the canonical "money moved" signal. We use the FIRST
 * paid invoice on a subscription (`billing_reason === 'subscription_create'`)
 * as the gate for crediting the referrer — checkout completion alone is
 * not sufficient (SCA can fail, customer can immediately cancel).
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (invoice.billing_reason !== 'subscription_create') return

  // The `subscription` field on Stripe.Invoice was deprecated/relocated in
  // recent API versions; the runtime payload still includes it for
  // subscription-billed invoices. Cast pragmatically.
  type InvoiceWithSub = Stripe.Invoice & {
    subscription?: string | { id: string } | null
  }
  const subRef = (invoice as InvoiceWithSub).subscription
  const subscriptionId = typeof subRef === 'string' ? subRef : subRef?.id
  if (!subscriptionId) return

  // Look up the subscription to get metadata.referral_id. Don't trust
  // invoice.metadata — referrals attach metadata to the subscription, not
  // the invoice.
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const referralId = sub.metadata?.referral_id as string | undefined
  if (!referralId) return

  await confirmReferralAndRewardReferrer({
    referralId,
    paidInvoiceId: invoice.id ?? '',
  })
}

/**
 * Refund / dispute / cancellation reversal path. We look up the referral
 * by the invoice or subscription that originated it and trigger the
 * compensating action — reverseReferral checks confirmed-status and
 * window before doing anything, so it's safe to call on any refund.
 */
async function handleReversalTrigger(params: {
  reason: 'refund' | 'dispute' | 'subscription_canceled'
  invoiceId?: string | null
  subscriptionId?: string | null
}) {
  const admin = createAdminClient()

  // Match by paid_invoice_id first (most precise), then by subscription
  // → workspace → referee.
  if (params.invoiceId) {
    const { data: byInvoice } = await admin
      .from('referrals')
      .select('id')
      .eq('paid_invoice_id', params.invoiceId)
      .maybeSingle()
    if (byInvoice?.id) {
      await reverseReferral({ referralId: byInvoice.id, reason: params.reason })
      return
    }
  }

  if (params.subscriptionId) {
    // Subscription → workspace → referee_user_id → referral
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('workspace_id, workspaces(owner_id)')
      .eq('stripe_subscription_id', params.subscriptionId)
      .maybeSingle()
    const workspace = subRow?.workspaces as unknown as { owner_id: string } | null
    if (workspace?.owner_id) {
      const { data: byReferee } = await admin
        .from('referrals')
        .select('id')
        .eq('referee_user_id', workspace.owner_id)
        .eq('status', 'confirmed')
        .maybeSingle()
      if (byReferee?.id) {
        await reverseReferral({ referralId: byReferee.id, reason: params.reason })
      }
    }
  }
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

  // Event-ID dedup. Stripe retries deliveries for up to 3 days on
  // transient failures; without this, every replay re-runs side effects
  // (referral credit, coupon attach) and silently overwrites unrelated
  // discounts. See lib/stripe/event-dedup.ts.
  const alreadyProcessed = await markEventProcessed(event.id, event.type)
  if (alreadyProcessed) {
    return new Response('OK (already processed)', { status: 200 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        // Prefer metadata from subscription, fall back to session
        if (!sub.metadata.workspace_id && session.metadata?.workspace_id) {
          ;(sub.metadata as Record<string, string>).workspace_id = session.metadata.workspace_id
          // Persist the metadata back to Stripe so subsequent
          // subscription.updated events arrive with workspace_id intact —
          // otherwise handleSubscriptionEvent will warn-and-skip.
          try {
            await stripe.subscriptions.update(sub.id, {
              metadata: { ...sub.metadata, workspace_id: session.metadata.workspace_id },
            })
          } catch (err) {
            log.error('stripe webhook: failed to persist workspace_id metadata', err, {
              subscriptionId: sub.id,
            })
          }
        }
        // Persist the referral_id likewise — the invoice.paid handler
        // reads it from the subscription, so it must survive replays.
        if (!sub.metadata.referral_id && session.metadata?.referral_id) {
          ;(sub.metadata as Record<string, string>).referral_id = session.metadata.referral_id
          try {
            await stripe.subscriptions.update(sub.id, {
              metadata: { ...sub.metadata, referral_id: session.metadata.referral_id },
            })
          } catch (err) {
            log.error('stripe webhook: failed to persist referral_id metadata', err, {
              subscriptionId: sub.id,
            })
          }
        }
        await handleSubscriptionEvent(sub)
        // No referral credit here — that moves to invoice.paid.
      }
    } else if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated'
    ) {
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription)
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      await handleSubscriptionEvent(sub)
      await handleReversalTrigger({
        reason: 'subscription_canceled',
        subscriptionId: sub.id,
      })
    } else if (event.type === 'invoice.paid') {
      await handleInvoicePaid(event.data.object as Stripe.Invoice)
    } else if (event.type === 'invoice.payment_failed') {
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      type ChargeWithInvoice = Stripe.Charge & {
        invoice?: string | { id: string } | null
      }
      const invRef = (charge as ChargeWithInvoice).invoice
      const invoiceId = typeof invRef === 'string' ? invRef : invRef?.id
      await handleReversalTrigger({ reason: 'refund', invoiceId })
    } else if (event.type === 'charge.dispute.created') {
      const dispute = event.data.object as Stripe.Dispute
      const charge =
        typeof dispute.charge === 'string'
          ? await stripe.charges.retrieve(dispute.charge)
          : dispute.charge
      type ChargeWithInvoice = Stripe.Charge & {
        invoice?: string | { id: string } | null
      }
      const invRef = (charge as ChargeWithInvoice).invoice
      const invoiceId = typeof invRef === 'string' ? invRef : invRef?.id
      await handleReversalTrigger({ reason: 'dispute', invoiceId })
    }
  } catch (err) {
    log.error('stripe webhook handler error', err, { eventType: event.type, eventId: event.id })
    // Return 5xx so Stripe retries — the dedup table will skip the work
    // we already completed on the next attempt.
    return new Response('Handler error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
