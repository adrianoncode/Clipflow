import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { BillingPlan } from '@/lib/billing/plans'

export interface SubscriptionRow {
  id: string
  workspace_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: BillingPlan
  status: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

/**
 * Returns the subscription for a workspace.
 * If no row exists, returns a synthetic free-plan object.
 */
export async function getSubscription(workspaceId: string): Promise<SubscriptionRow> {
  const supabase = createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (data) return data as SubscriptionRow

  // No subscription row → free plan
  return {
    id: '',
    workspace_id: workspaceId,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    plan: 'free',
    status: null,
    current_period_end: null,
    cancel_at_period_end: false,
  }
}

/**
 * Admin email(s) that always get agency-tier access, regardless of Stripe.
 * Set via ADMIN_EMAILS env var (comma-separated). Empty = no overrides.
 */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Returns just the plan name for a workspace — cheap shortcut when you
 * only need the plan (e.g. for limit checks).
 */
export async function getWorkspacePlan(workspaceId: string): Promise<BillingPlan> {
  const sub = await getSubscription(workspaceId)

  // Admin override — check if workspace owner is an admin (only when on free plan to avoid extra queries)
  if (sub.plan === 'free' || !sub.stripe_subscription_id) {
    try {
      const supabase = createClient()
      const { data: ws } = await supabase
        .from('workspaces')
        .select('owner_id')
        .eq('id', workspaceId)
        .maybeSingle()

      if (ws?.owner_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', ws.owner_id)
          .maybeSingle()

        if (profile?.email && ADMIN_EMAILS.includes(profile.email.toLowerCase())) {
          return 'agency'
        }
      }
    } catch {
      // Admin check failed — continue with normal plan
    }
  }
  // Treat canceled/expired subscriptions as free
  if (sub.status && !['active', 'trialing'].includes(sub.status)) {
    return 'free'
  }
  return sub.plan
}
