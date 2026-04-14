'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PLANS, isUnlimited } from '@/lib/billing/plans'
import type { BillingPlan } from '@/lib/billing/plans'
import { createCheckoutSessionAction } from '@/app/(app)/billing/actions'

function formatLimit(value: number): string {
  return isUnlimited(value) ? 'Unlimited' : String(value)
}

function UpgradeButton({ planId, interval, workspaceId, isCurrent }: {
  planId: BillingPlan
  interval: 'monthly' | 'annual'
  workspaceId: string
  isCurrent: boolean
}) {
  const [, action] = useFormState(createCheckoutSessionAction, undefined)
  const { pending } = useFormStatus()

  if (planId === 'free') return null
  if (isCurrent) {
    return (
      <Button variant="outline" size="sm" className="w-full" disabled>
        Current plan
      </Button>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="plan" value={planId} />
      <input type="hidden" name="interval" value={interval} />
      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? 'Redirecting…' : 'Upgrade'}
      </Button>
    </form>
  )
}

interface PlanCardProps {
  planId: BillingPlan
  interval: 'monthly' | 'annual'
  workspaceId: string
  currentPlan: BillingPlan
}

export function PlanCard({ planId, interval, workspaceId, currentPlan }: PlanCardProps) {
  const plan = PLANS[planId]
  const isCurrent = planId === currentPlan
  const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const { limits } = plan

  return (
    <Card
      className={cn(
        'flex flex-col',
        plan.highlight && 'border-primary shadow-md',
        isCurrent && 'ring-2 ring-primary',
      )}
    >
      <CardHeader className="pb-2">
        {plan.highlight ? (
          <span className="mb-1 w-fit rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Most popular
          </span>
        ) : null}
        <CardTitle className="text-base">{plan.name}</CardTitle>
        <CardDescription className="text-xs">{plan.description}</CardDescription>
        <div className="pt-1">
          {price === 0 ? (
            <span className="text-2xl font-bold">Free</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                ${Math.floor(price / 100)}
              </span>
              <span className="text-sm text-muted-foreground">
                /mo{interval === 'annual' ? ' · billed annually' : ''}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>{formatLimit(limits.contentItemsPerMonth)} content items/mo</li>
          <li>{formatLimit(limits.outputsPerMonth)} text drafts/mo</li>
          <li>{formatLimit(limits.videoRendersPerMonth)} video renders/mo</li>
          <li>{formatLimit(limits.avatarVideosPerMonth)} AI avatars/mo</li>
          <li>{formatLimit(limits.voiceClonesMax)} voice clone{limits.voiceClonesMax !== 1 ? 's' : ''}</li>
          <li>{formatLimit(limits.workspaces)} workspace{limits.workspaces !== 1 ? 's' : ''}</li>
        </ul>
        <div className="mt-auto">
          <UpgradeButton
            planId={planId}
            interval={interval}
            workspaceId={workspaceId}
            isCurrent={isCurrent}
          />
        </div>
      </CardContent>
    </Card>
  )
}
