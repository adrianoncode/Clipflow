import 'server-only'

import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { PLANS, type BillingPlan } from '@/lib/billing/plans'

export interface DashboardQuota {
  /** Display-friendly plan name, e.g. "Creator". */
  planName: string
  /** Underlying plan id — used for "is this a paid tier?" checks. */
  planId: BillingPlan
  /** The metric closest to its monthly cap. */
  metricLabel: 'Outputs' | 'Imports'
  used: number
  limit: number
  /** Whether the workspace is on a paid tier (drives upgrade-prompt threshold). */
  isPaid: boolean
}

/**
 * Computes the tightest usage metric for the QuotaIndicator. We show
 * one bar — not two — because two competing bars halve attention and
 * users skim past both. Picking the metric closest to its cap means
 * the dashboard's quota line always reflects "what limits you next".
 *
 * Returns null when both metrics are unlimited (e.g. agency tier with
 * `-1` caps) — the indicator self-hides in that case.
 */
export async function getDashboardQuota(workspaceId: string): Promise<DashboardQuota | null> {
  const [plan, usage] = await Promise.all([
    getWorkspacePlan(workspaceId),
    getWorkspaceUsage(workspaceId),
  ])

  const definition = PLANS[plan]
  const outputsLimit = definition.limits.outputsPerMonth
  const importsLimit = definition.limits.contentItemsPerMonth

  // Both unlimited → no indicator.
  if (outputsLimit < 0 && importsLimit < 0) return null

  // Per-metric remaining-headroom (as a 0..1 fraction). The metric
  // with the LOWEST remaining is what gets surfaced.
  const headroom = (used: number, limit: number): number =>
    limit < 0 ? 1 : Math.max(0, (limit - used) / Math.max(limit, 1))

  const outputsHeadroom = headroom(usage.outputsThisMonth, outputsLimit)
  const importsHeadroom = headroom(usage.contentItemsThisMonth, importsLimit)

  const tightestIsOutputs = outputsHeadroom <= importsHeadroom

  return {
    planName: definition.name,
    planId: plan,
    metricLabel: tightestIsOutputs ? 'Outputs' : 'Imports',
    used: tightestIsOutputs ? usage.outputsThisMonth : usage.contentItemsThisMonth,
    limit: tightestIsOutputs ? outputsLimit : importsLimit,
    isPaid: plan !== 'free',
  }
}
