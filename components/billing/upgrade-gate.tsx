import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'

import { PLANS, type BillingPlan } from '@/lib/billing/plans'

const PLAN_ORDER: BillingPlan[] = ['free', 'solo', 'team', 'agency']

function planName(id: BillingPlan): string {
  return PLANS[id].name
}

function planPrice(id: BillingPlan): string {
  const cents = PLANS[id].monthlyPrice
  if (cents === 0) return '$0'
  return `$${Math.round(cents / 100)}/mo`
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
    <div
      className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-[24px] p-8 text-center"
      style={{
        background: '#FFFDF8',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: 'rgba(15,15,15,0.06)' }}
      >
        <Lock className="h-6 w-6" style={{ color: '#0F0F0F' }} />
      </div>

      <div className="max-w-sm space-y-2">
        <p
          className="text-[9px] font-semibold uppercase"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', letterSpacing: '0.22em', color: '#7A7468' }}
        >
          {planName(requiredPlan)} plan
        </p>
        <h3
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: 24,
            fontWeight: 400,
            color: '#0F0F0F',
            letterSpacing: '-0.01em',
          }}
        >
          {featureName}
        </h3>
        {description && (
          <p className="text-[13px]" style={{ color: '#2A2A2A', lineHeight: 1.55 }}>{description}</p>
        )}
        <p className="text-[12px]" style={{ color: '#7A7468' }}>
          Unlock with {planName(requiredPlan)} · {planPrice(requiredPlan)}
        </p>
      </div>

      <Link
        href={`/billing?workspace_id=${workspaceId}&plan=${requiredPlan}&feature=${encodeURIComponent(featureName)}`}
        className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-[13px] font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_22px_-6px_rgba(15,15,15,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2"
        style={{
          background: '#0F0F0F',
          color: '#F4D93D',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 18px -6px rgba(15,15,15,0.45)',
        }}
      >
        <Zap className="h-4 w-4" />
        Upgrade to {planName(requiredPlan)}
      </Link>

      <p className="text-[11px]" style={{ color: '#7A7468' }}>
        Currently on <span className="font-semibold" style={{ color: '#0F0F0F' }}>{planName(currentPlan)}</span>
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
    <div
      className="flex items-center justify-between gap-4 rounded-[16px] px-4 py-3"
      style={{
        background: '#FFFDF8',
        border: '1px solid rgba(15,15,15,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0" style={{ color: '#0F0F0F' }} />
        <p className="text-[13px]" style={{ color: '#2A2A2A' }}>
          <span className="font-semibold" style={{ color: '#0F0F0F' }}>{featureName}</span>{' '}
          · {planName(requiredPlan)} {planPrice(requiredPlan)}
        </p>
      </div>
      <Link
        href={`/billing?workspace_id=${workspaceId}&plan=${requiredPlan}&feature=${encodeURIComponent(featureName)}`}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition hover:scale-[1.02]"
        style={{ background: '#0F0F0F', color: '#F4D93D' }}
      >
        <Zap className="h-3 w-3" />
        Upgrade
      </Link>
    </div>
  )
}
