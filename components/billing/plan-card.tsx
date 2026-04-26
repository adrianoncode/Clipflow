'use client'

import { Check, Sparkles, Zap } from 'lucide-react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLANS, isUnlimited } from '@/lib/billing/plans'
import type { BillingPlan } from '@/lib/billing/plans'
import { createCheckoutSessionAction } from '@/app/(app)/billing/actions'

/**
 * Pricing tile for one plan. Three visual states:
 *   - Highlighted (featured/recommended) — dark plum bg + lime accents
 *   - Current plan                       — subtle ring, "Current plan" CTA
 *   - Default                             — neutral card
 */

function formatLimit(value: number): string {
  return isUnlimited(value) ? 'Unlimited' : String(value)
}

interface PlanCardProps {
  planId: BillingPlan
  interval: 'monthly' | 'annual'
  workspaceId: string
  currentPlan: BillingPlan
  feature?: string
}

export function PlanCard({ planId, interval, workspaceId, currentPlan, feature }: PlanCardProps) {
  const plan = PLANS[planId]
  const isCurrent = planId === currentPlan
  const isHighlighted = !!plan.highlight
  const price = interval === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const monthly =
    interval === 'annual' ? Math.round(price / 12 / 100) : Math.round(price / 100)

  const limits = plan.limits
  const quotas = [
    { label: `${formatLimit(limits.contentItemsPerMonth)} videos / mo` },
    { label: `${formatLimit(limits.outputsPerMonth)} posts / mo` },
    ...(limits.videoRendersPerMonth !== 0
      ? [{ label: `${formatLimit(limits.videoRendersPerMonth)} video renders / mo` }]
      : []),
    ...(limits.avatarVideosPerMonth !== 0
      ? [{ label: `${formatLimit(limits.avatarVideosPerMonth)} AI avatars / mo` }]
      : []),
    ...(limits.voiceClonesMax !== 0
      ? [
          {
            label: `${formatLimit(limits.voiceClonesMax)} voice clone${
              limits.voiceClonesMax !== 1 ? 's' : ''
            }`,
          },
        ]
      : []),
    {
      label: `${formatLimit(limits.workspaces)} workspace${limits.workspaces !== 1 ? 's' : ''}`,
    },
  ]

  const features: string[] = []
  if (plan.features.customBranding) features.push('Brand Kit on every render')
  if (plan.features.scheduling) features.push('Auto-publish to TikTok / IG / YT / LinkedIn')
  if (plan.features.abHookTesting) features.push('A/B hook testing')
  if (plan.features.creatorResearch) features.push('Creator research across YT / TikTok / IG')
  if (plan.features.brollAutomation) features.push('AI B-roll + captions')
  if (plan.features.avatarVideos) features.push('AI avatar videos')
  if (plan.features.autoDub) features.push('Auto-dub + voice cloning')
  if (plan.features.multiWorkspace) features.push('Unlimited client workspaces')
  if (plan.features.teamSeats) features.push('Team seats + roles')
  if (plan.features.whiteLabelReview) features.push('White-label review links')
  if (plan.features.priorityRenders) features.push('Priority render queue')
  if (plan.features.auditLog) features.push('Workspace audit log')

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-3xl p-6 transition-all sm:p-7',
        isHighlighted
          ? 'bg-[#2A1A3D] text-[#F4FFAB] shadow-[0_24px_48px_-12px_rgba(42,26,61,0.35)]'
          : 'border border-border/60 bg-card hover:-translate-y-0.5 hover:shadow-md',
        isCurrent && !isHighlighted && 'ring-2 ring-primary/40',
      )}
    >
      {/* Top row — pill row (Most popular + Current) */}
      <div className="flex h-6 items-center gap-1.5">
        {isHighlighted ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#D6FF3E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1a2000]"
          >
            <Sparkles className="h-3 w-3" />
            Most popular
          </span>
        ) : null}
        {isCurrent ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
              isHighlighted
                ? 'bg-white/10 text-[#F4FFAB]'
                : 'bg-emerald-100 text-emerald-800',
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
            Current plan
          </span>
        ) : null}
      </div>

      {/* Plan name + description */}
      <h3
        className={cn(
          'mt-4 text-[20px] font-bold leading-tight',
          isHighlighted ? 'text-white' : 'text-foreground',
        )}
      >
        {plan.name}
      </h3>
      <p
        className={cn(
          'mt-1 min-h-[34px] text-[12.5px] leading-relaxed',
          isHighlighted ? 'text-white/65' : 'text-muted-foreground',
        )}
      >
        {plan.description}
      </p>

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-1.5">
        {price === 0 ? (
          <span className="text-[40px] font-bold leading-none tracking-tight">Free</span>
        ) : (
          <>
            <span
              className={cn(
                'text-[42px] font-bold leading-none tracking-tight',
                isHighlighted ? 'text-white' : 'text-foreground',
              )}
            >
              ${monthly}
            </span>
            <span
              className={cn(
                'text-[13px]',
                isHighlighted ? 'text-white/55' : 'text-muted-foreground',
              )}
            >
              /mo
            </span>
          </>
        )}
      </div>
      {price > 0 && interval === 'annual' ? (
        <p
          className={cn(
            'mt-1 text-[11px]',
            isHighlighted ? 'text-white/45' : 'text-muted-foreground/70',
          )}
        >
          billed annually · ${Math.round(price / 100)}/yr
        </p>
      ) : null}

      {/* CTA — placed BEFORE the feature list so it never sinks to the
          bottom of a long list, and is reachable even on short cards
          like Free where there's nothing else to read. */}
      <div className="mt-6">
        <UpgradeButton
          planId={planId}
          interval={interval}
          workspaceId={workspaceId}
          isCurrent={isCurrent}
          feature={feature}
          isHighlighted={isHighlighted}
        />
      </div>

      {/* Quotas section */}
      <p
        className={cn(
          'mt-7 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]',
          isHighlighted ? 'text-white/45' : 'text-muted-foreground',
        )}
      >
        Limits
      </p>
      <ul className="mt-2.5 space-y-2">
        {quotas.map((q) => (
          <FeatureRow key={q.label} label={q.label} highlighted={isHighlighted} />
        ))}
      </ul>

      {features.length > 0 ? (
        <>
          <p
            className={cn(
              'mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]',
              isHighlighted ? 'text-white/45' : 'text-muted-foreground',
            )}
          >
            Capabilities
          </p>
          <ul className="mt-2.5 space-y-2">
            {features.map((f) => (
              <FeatureRow key={f} label={f} highlighted={isHighlighted} />
            ))}
          </ul>
        </>
      ) : null}

      {/* Free plan disclosure footnote */}
      {planId === 'free' ? (
        <p
          className="mt-auto pt-6 text-[11px] leading-relaxed text-muted-foreground"
        >
          <Zap className="-mt-0.5 mr-1 inline h-3 w-3 text-primary" />
          BYOK — bring your own AI keys. We never charge per token.
        </p>
      ) : null}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function FeatureRow({
  label,
  highlighted,
}: {
  label: string
  highlighted: boolean
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={cn(
          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
          highlighted ? 'bg-[#D6FF3E] text-[#1a2000]' : 'bg-primary/10 text-primary',
        )}
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      <span
        className={cn(
          'text-[13px] leading-snug',
          highlighted ? 'text-white/85' : 'text-foreground',
        )}
      >
        {label}
      </span>
    </li>
  )
}

function UpgradeButton({
  planId,
  interval,
  workspaceId,
  isCurrent,
  feature,
  isHighlighted,
}: {
  planId: BillingPlan
  interval: 'monthly' | 'annual'
  workspaceId: string
  isCurrent: boolean
  feature?: string
  isHighlighted: boolean
}) {
  const [, action] = useFormState(createCheckoutSessionAction, undefined)
  const { pending } = useFormStatus()

  if (planId === 'free') {
    if (isCurrent) {
      return (
        <Button
          variant="outline"
          size="sm"
          className="w-full cursor-default"
          disabled
        >
          You’re on Free
        </Button>
      )
    }
    // Showing Free as an option but user isn't on it (downgrade case).
    return (
      <Button variant="ghost" size="sm" className="w-full" disabled>
        Free tier
      </Button>
    )
  }
  if (isCurrent) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'w-full cursor-default',
          isHighlighted && 'border-white/20 bg-white/5 text-white hover:bg-white/5 hover:text-white',
        )}
        disabled
      >
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
      <button
        type="submit"
        disabled={pending}
        className={cn(
          'inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-px disabled:opacity-60 disabled:translate-y-0',
          isHighlighted
            ? 'bg-[#D6FF3E] text-[#1a2000] shadow-sm shadow-[#D6FF3E]/30 hover:shadow-md hover:shadow-[#D6FF3E]/40'
            : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25',
        )}
      >
        {pending ? 'Redirecting…' : `Upgrade to ${PLANS[planId].name}`}
      </button>
    </form>
  )
}
