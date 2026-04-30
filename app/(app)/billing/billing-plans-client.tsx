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
    <div
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1 text-[12px] shadow-sm"
      role="tablist"
      aria-label="Billing interval"
    >
      {(['monthly', 'annual'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          role="tab"
          aria-selected={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-full px-4 py-1.5 font-semibold transition-all',
            value === opt
              ? 'bg-[#0F0F0F] text-[#F4D93D] shadow-sm shadow-[#0F0F0F]/30'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt === 'monthly' ? 'Monthly' : 'Annual'}
          {opt === 'annual' ? (
            <span
              className={cn(
                'ml-1.5 rounded-full px-1.5 py-px text-[10px] font-bold',
                value === 'annual'
                  ? 'bg-[#F4D93D] text-[#1a2000]'
                  : 'bg-emerald-100 text-emerald-800',
              )}
            >
              −20%
            </span>
          ) : null}
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
  // The feature the user was trying to reach — forwarded into every
  // upgrade button's hidden input so the post-checkout success_url
  // can route them back to it.
  const feature = searchParams.get('feature') ?? undefined

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
            feature={feature}
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
