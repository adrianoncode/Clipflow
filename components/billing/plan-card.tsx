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

function UpgradeButton({ planId, interval, workspaceId, isCurrent, feature }: {
  planId: BillingPlan
  interval: 'monthly' | 'annual'
  workspaceId: string
  isCurrent: boolean
  feature?: string
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
      {feature ? <input type="hidden" name="feature" value={feature} /> : null}
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
  /** Feature the user was trying to reach — survives through the
   * checkout form so the success_url can route them back to it. */
  feature?: string
}

export function PlanCard({ planId, interval, workspaceId, currentPlan, feature }: PlanCardProps) {
  const plan = PLANS[planId]
  const isCurrent = planId === currentPlan
  const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const { limits } = plan

  // Bullets that are 0 are misleading ("0 AI avatars / mo" reads as a
  // zero-quota feature you get nothing of, not "not included"). Hide
  // them and let the plan's price + name do the selling.
  const bullets: string[] = []
  bullets.push(`${formatLimit(limits.contentItemsPerMonth)} videos / mo`)
  bullets.push(`${formatLimit(limits.outputsPerMonth)} posts / mo`)
  if (limits.videoRendersPerMonth !== 0) bullets.push(`${formatLimit(limits.videoRendersPerMonth)} video renders / mo`)
  if (limits.avatarVideosPerMonth !== 0) bullets.push(`${formatLimit(limits.avatarVideosPerMonth)} AI avatars / mo`)
  if (limits.voiceClonesMax !== 0) bullets.push(`${formatLimit(limits.voiceClonesMax)} voice clone${limits.voiceClonesMax !== 1 ? 's' : ''}`)
  bullets.push(`${formatLimit(limits.workspaces)} workspace${limits.workspaces !== 1 ? 's' : ''}`)

  // Feature bullets — surface the flags each plan flips on so users
  // can see the actual differentiators between tiers at a glance. Keep
  // the copy short; one line each.
  if (plan.features.customBranding)
    bullets.push('Brand Kit — logo, colors, intro/outro on every render')
  if (plan.features.scheduling) bullets.push('Auto-publish to 4 platforms')
  if (plan.features.abHookTesting) bullets.push('A/B hook testing')
  if (plan.features.creatorResearch) bullets.push('Creator research across YouTube / TikTok / IG')
  if (plan.features.brollAutomation) bullets.push('AI B-roll + captions')
  if (plan.features.avatarVideos) bullets.push('AI avatar videos')
  if (plan.features.autoDub) bullets.push('Auto-dub + voice cloning')
  if (plan.features.multiWorkspace) bullets.push('Unlimited client workspaces')
  if (plan.features.teamSeats) bullets.push('Team seats + roles')
  if (plan.features.whiteLabelReview)
    bullets.push('White-label review links (your brand, not ours)')
  if (plan.features.priorityRenders) bullets.push('Priority render queue')
  if (plan.features.auditLog) bullets.push('Workspace audit log')

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
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <div className="mt-auto">
          <UpgradeButton
            planId={planId}
            interval={interval}
            workspaceId={workspaceId}
            isCurrent={isCurrent}
            feature={feature}
          />
        </div>
      </CardContent>
    </Card>
  )
}
