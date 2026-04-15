import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'

import type { BillingPlan } from '@/lib/billing/plans'

const PLAN_ORDER: BillingPlan[] = ['free', 'solo', 'team', 'agency']
const PLAN_NAMES: Record<BillingPlan, string> = {
  free: 'Free',
  solo: 'Solo',
  team: 'Team',
  agency: 'Agency',
}
const PLAN_PRICES: Record<BillingPlan, string> = {
  free: '$0',
  solo: '$19/mo',
  team: '$49/mo',
  agency: '$99/mo',
}

function hasPlanAccess(currentPlan: BillingPlan, requiredPlan: BillingPlan): boolean {
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan)
}

interface UpgradeGateProps {
  currentPlan: BillingPlan
  /** Minimum plan required. E.g. 'solo' means free users see the gate. */
  requiredPlan: BillingPlan
  workspaceId: string
  featureName: string
  description?: string
  children: React.ReactNode
}

/**
 * Wraps a feature. If the user's plan is below `requiredPlan`,
 * renders a "locked" upgrade card instead of children.
 */
export function UpgradeGate({
  currentPlan,
  requiredPlan,
  workspaceId,
  featureName,
  description,
  children,
}: UpgradeGateProps) {
  if (hasPlanAccess(currentPlan, requiredPlan)) return <>{children}</>

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-2xl border border-border/60 bg-muted/20 p-8 text-center">
      {/* Lock icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Copy */}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-base font-semibold">{featureName}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Available on the{' '}
          <span className="font-semibold text-foreground">
            {PLAN_NAMES[requiredPlan]} plan
          </span>{' '}
          ({PLAN_PRICES[requiredPlan]}) and above.
        </p>
      </div>

      {/* CTA */}
      <Link
        href={`/billing?workspace_id=${workspaceId}&plan=${requiredPlan}`}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
      >
        <Zap className="h-4 w-4" />
        Upgrade to {PLAN_NAMES[requiredPlan]}
      </Link>

      <p className="text-xs text-muted-foreground">
        You are on the <span className="font-medium">{PLAN_NAMES[currentPlan]}</span> plan.
      </p>
    </div>
  )
}

/**
 * Compact inline upgrade nudge — for inside cards/rows.
 */
export function UpgradeInline({
  currentPlan,
  requiredPlan,
  workspaceId,
  featureName,
}: Omit<UpgradeGateProps, 'description' | 'children'>) {
  if (hasPlanAccess(currentPlan, requiredPlan)) return null

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          <span className="font-semibold">{featureName}</span> requires the{' '}
          {PLAN_NAMES[requiredPlan]} plan ({PLAN_PRICES[requiredPlan]})
        </p>
      </div>
      <Link
        href={`/billing?workspace_id=${workspaceId}&plan=${requiredPlan}`}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Zap className="h-3 w-3" />
        Upgrade
      </Link>
    </div>
  )
}
