import 'server-only'

import { cache } from 'react'

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
 *
 * Wrapped in React.cache so duplicate callers within a single request
 * (layout + dashboard page + feature-gate checks) share one round-trip.
 */
export const getSubscription = cache(
  async (workspaceId: string): Promise<SubscriptionRow> => {
    const supabase = createClient()
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (data) return data as SubscriptionRow

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
  },
)

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
 *
 * Perf notes:
 * - Cached per request so repeat calls from layout / dashboard / feature
 *   gates share a single subscriptions round-trip.
 * - The admin-override path used to run two extra sequential queries
 *   (workspaces → profiles) on every free-plan hit. Those now run only
 *   when ADMIN_EMAILS is actually configured, and share the same
 *   supabase client with a joined select so it's one round-trip instead
 *   of two. For self-hosted / non-admin deploys this is free.
 */
export const getWorkspacePlan = cache(
  async (workspaceId: string): Promise<BillingPlan> => {
    const sub = await getSubscription(workspaceId)

    if (ADMIN_EMAILS.length > 0 && (sub.plan === 'free' || !sub.stripe_subscription_id)) {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('workspaces')
          .select('owner:profiles!workspaces_owner_id_fkey(email)')
          .eq('id', workspaceId)
          .maybeSingle()
        const email = (data as { owner?: { email?: string | null } } | null)?.owner?.email
        if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
          return 'agency'
        }
      } catch {
        // Admin check failed — continue with normal plan.
      }
    }

    if (sub.status && !['active', 'trialing'].includes(sub.status)) {
      return 'free'
    }
    return sub.plan
  },
)
