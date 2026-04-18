'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { PlanCard } from '@/components/billing/plan-card'
import { PUBLIC_PLAN_ORDER } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

// Interactive portion of the billing page — interval toggle + plan grid.
// The outer server component (see page.tsx) resolves the current plan
// and any active discount and passes them in.

function IntervalToggle({
  value,
  onChange,
}: {
  value: 'monthly' | 'annual'
  onChange: (v: 'monthly' | 'annual') => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border bg-muted/30 p-1 text-sm">
      {(['monthly', 'annual'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-full px-4 py-1 font-medium transition-colors',
            value === opt ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt === 'monthly' ? 'Monthly' : 'Annual · 20% off'}
        </button>
      ))}
    </div>
  )
}

export function BillingPlansClient({
  workspaceId,
  currentPlan,
}: {
  workspaceId: string
  currentPlan: 'free' | 'solo' | 'team' | 'agency'
}) {
  const searchParams = useSearchParams()
  const fallbackWorkspaceId = searchParams.get('workspace_id') ?? ''
  const resolvedWorkspaceId = workspaceId || fallbackWorkspaceId

  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  return (
    <>
      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PUBLIC_PLAN_ORDER.map((planId) => (
          <PlanCard
            key={planId}
            planId={planId}
            interval={interval}
            workspaceId={resolvedWorkspaceId}
            currentPlan={currentPlan}
          />
        ))}
      </div>

      {!resolvedWorkspaceId ? (
        <p className="text-center text-sm text-muted-foreground">
          Open this page from a workspace to manage your subscription.
        </p>
      ) : null}
    </>
  )
}
