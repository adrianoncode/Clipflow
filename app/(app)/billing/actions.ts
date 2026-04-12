'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { stripe } from '@/lib/stripe/client'
import { PRICE_IDS } from '@/lib/stripe/price-ids'
import { getUser } from '@/lib/auth/get-user'
import { getSubscription } from '@/lib/billing/get-subscription'
import { createAdminClient } from '@/lib/supabase/admin'

const checkoutSchema = z.object({
  workspace_id: z.string().uuid(),
  plan: z.enum(['solo', 'team', 'agency']),
  interval: z.enum(['monthly', 'annual']),
})

export async function createCheckoutSessionAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = checkoutSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    plan: formData.get('plan'),
    interval: formData.get('interval'),
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

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/workspace/${parsed.data.workspace_id}?billing=success`,
    cancel_url: `${baseUrl}/billing?workspace_id=${parsed.data.workspace_id}`,
    metadata: {
      workspace_id: parsed.data.workspace_id,
      plan: parsed.data.plan,
    },
    subscription_data: {
      metadata: {
        workspace_id: parsed.data.workspace_id,
        plan: parsed.data.plan,
      },
    },
  })

  if (!session.url) return { error: 'Could not create checkout session.' }

  redirect(session.url)
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
