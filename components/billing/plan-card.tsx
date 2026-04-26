'use client'

import { Check, Sparkles, Zap } from 'lucide-react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PLANS, isUnlimited } from '@/lib/billing/plans'
import type { BillingPlan } from '@/lib/billing/plans'
import { createCheckoutSessionAction } from '@/app/(app)/billing/actions'

/**
 * Pricing tile for one plan — matches the landing-page pricing tiles
 * 1:1 (mono label → big violet display price → 2-mo-free chip →
 * hairline rule → feature list with violet ✓ checks → primary CTA →
 * mono footnote). Three visual states layered on the same shape:
 *   - Highlighted (featured / recommended) — extra violet ring +
 *     "MOST POPULAR" lime chip + drop shadow.
 *   - Current plan                          — emerald ring + "Current"
 *     pill + disabled CTA reading "Current plan".
 *   - Default                               — soft border, hover lift.
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
        'relative flex flex-col rounded-3xl border bg-card p-6 transition-all sm:p-7',
        isHighlighted
          ? 'border-primary shadow-[0_30px_60px_-20px_rgba(42,26,61,0.35)]'
          : isCurrent
            ? 'border-emerald-300/60 ring-1 ring-emerald-300/40'
            : 'border-border/60 hover:-translate-y-0.5 hover:border-border hover:shadow-md',
      )}
    >
      {/* Top "Most popular" chip — absolutely positioned to match the
          landing-page tile exactly. */}
      {isHighlighted ? (
        <span
          className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-[#D6FF3E] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#1a2000]"
        >
          <Sparkles className="h-2.5 w-2.5" />
          Most popular
        </span>
      ) : null}

      {/* Plan name (mono label) */}
      <p
        className={cn(
          'font-mono text-[10px] font-bold uppercase tracking-[0.18em]',
          isHighlighted ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {plan.name}
      </p>

      {/* Price line — big display + /mo + free-yearly chip */}
      <div className="mt-2 flex items-baseline gap-1.5">
        {price === 0 ? (
          <span
            style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
            className="text-[52px] font-normal leading-none text-primary"
          >
            $0
          </span>
        ) : (
          <>
            <span
              style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
              className="text-[52px] font-normal leading-none text-primary"
            >
              ${monthly}
            </span>
            <span className="text-[13px] text-muted-foreground">/mo</span>
            {planId !== 'free' ? (
              <span className="ml-auto inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                2 mo free yearly
              </span>
            ) : null}
          </>
        )}
      </div>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {price === 0
          ? 'Free forever'
          : interval === 'annual'
            ? `Billed annually · $${Math.round(price / 100)}/yr`
            : 'Billed monthly'}
      </p>

      {/* Description */}
      <p className="mt-3 min-h-[34px] text-[12.5px] leading-relaxed text-muted-foreground">
        {plan.description}
      </p>

      {/* Hairline rule */}
      <div className="my-5 h-px w-full bg-border/60" />

      {/* Limits */}
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        Limits
      </p>
      <ul className="mt-2.5 space-y-2">
        {quotas.map((q) => (
          <FeatureRow key={q.label} label={q.label} />
        ))}
      </ul>

      {features.length > 0 ? (
        <>
          <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
            Capabilities
          </p>
          <ul className="mt-2.5 space-y-2">
            {features.map((f) => (
              <FeatureRow key={f} label={f} />
            ))}
          </ul>
        </>
      ) : null}

      {/* CTA — bottom of the tile, sits inside the card with a top
          margin that grows so cards of different lengths line up. */}
      <div className="mt-6 sm:mt-auto sm:pt-6">
        <UpgradeButton
          planId={planId}
          interval={interval}
          workspaceId={workspaceId}
          isCurrent={isCurrent}
          feature={feature}
          isHighlighted={isHighlighted}
        />
        {isHighlighted && !isCurrent ? (
          <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            No card · cancel in 2 clicks · 14-day refund
          </p>
        ) : null}
        {planId === 'free' ? (
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            <Zap className="-mt-0.5 mr-1 inline h-3 w-3 text-primary" />
            BYOK — bring your own AI keys. We never charge per token.
          </p>
        ) : null}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function FeatureRow({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2 text-[13px] leading-snug text-foreground">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
      <span>{label}</span>
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
        <Button variant="outline" size="sm" className="w-full cursor-default" disabled>
          You’re on Free
        </Button>
      )
    }
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
        className="w-full cursor-default border-emerald-300/60 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50/50 hover:text-emerald-800"
        disabled
      >
        <Check className="mr-1.5 h-3.5 w-3.5" strokeWidth={3} />
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
          'inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60',
          'bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25',
          isHighlighted ? '' : '',
        )}
      >
        {pending ? 'Redirecting…' : `Start ${PLANS[planId].name}`}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </button>
    </form>
  )
}
