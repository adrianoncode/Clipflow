'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { PlanCard } from '@/components/billing/plan-card'
import { cn } from '@/lib/utils'

// Billing page is fully client-rendered — interval toggle + query params.

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

export default function BillingPage() {
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get('workspace_id') ?? ''
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')

  // currentPlan is passed via server wrapper; for now default to 'free'
  // The actual plan is shown correctly once the BillingShell passes it down.
  const currentPlan = (searchParams.get('plan') ?? 'free') as 'free' | 'solo' | 'team' | 'agency'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your plan and usage.
        </p>
      </div>

      <div className="flex justify-center">
        <IntervalToggle value={interval} onChange={setInterval} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(['free', 'solo', 'team', 'agency'] as const).map((planId) => (
          <PlanCard
            key={planId}
            planId={planId}
            interval={interval}
            workspaceId={workspaceId}
            currentPlan={currentPlan}
          />
        ))}
      </div>

      {!workspaceId ? (
        <p className="text-center text-sm text-muted-foreground">
          Open this page from a workspace to manage your subscription.
        </p>
      ) : null}
    </div>
  )
}
