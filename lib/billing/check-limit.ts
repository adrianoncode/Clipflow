import 'server-only'

import { getPlanLimits, isUnlimited } from '@/lib/billing/plans'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'

export type LimitType = 'content_items' | 'outputs'

export interface LimitCheckResult {
  ok: boolean
  plan: string
  used: number
  limit: number
  unlimited: boolean
  /** Human-readable error when ok === false */
  message?: string
}

export async function checkLimit(
  workspaceId: string,
  type: LimitType,
): Promise<LimitCheckResult> {
  const [plan, usage] = await Promise.all([
    getWorkspacePlan(workspaceId),
    getWorkspaceUsage(workspaceId),
  ])

  const limits = getPlanLimits(plan)

  if (type === 'content_items') {
    const limit = limits.contentItemsPerMonth
    const used = usage.contentItemsThisMonth
    if (isUnlimited(limit)) return { ok: true, plan, used, limit, unlimited: true }
    if (used >= limit) {
      return {
        ok: false,
        plan,
        used,
        limit,
        unlimited: false,
        message: `You've used all ${limit} content items this month on the ${plan} plan. Upgrade to add more.`,
      }
    }
    return { ok: true, plan, used, limit, unlimited: false }
  }

  // outputs
  const limit = limits.outputsPerMonth
  const used = usage.outputsThisMonth
  if (isUnlimited(limit)) return { ok: true, plan, used, limit, unlimited: true }
  if (used >= limit) {
    return {
      ok: false,
      plan,
      used,
      limit,
      unlimited: false,
      message: `You've used all ${limit} outputs this month on the ${plan} plan. Upgrade to generate more.`,
    }
  }
  return { ok: true, plan, used, limit, unlimited: false }
}
