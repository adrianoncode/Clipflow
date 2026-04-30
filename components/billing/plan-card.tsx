'use client'

import { Check, Sparkles, Zap } from 'lucide-react'
import { useFormState, useFormStatus } from 'react-dom'

import { cn } from '@/lib/utils'
import { PLANS, isUnlimited } from '@/lib/billing/plans'
import type { BillingPlan } from '@/lib/billing/plans'
import { createCheckoutSessionAction } from '@/app/(app)/billing/actions'

/**
 * Pricing tile matched 1:1 to the landing-page #pricing section so a
 * user landing on /billing sees the exact same card layout, shadow,
 * type rhythm, and chip treatment they saw before signing up.
 *
 * Three states layered on the same shape:
 *   - Default            (Starter)     — soft border + hover lift.
 *   - Highlighted (Creator) — plum border + lime "Most popular" chip
 *                              + a deeper drop shadow.
 *   - Current plan        — emerald-tinted CTA reading "Current plan".
 *
 * Color tokens are inlined from the landing's `.lv2-root` palette so
 * we don't have to hoist that style block out of new-landing.tsx.
 */

const TOKENS = {
  card: '#FFFDF8',
  border: '#E5DDCE',
  primary: '#0F0F0F',
  primaryInk: '#1A1A1A',
  primarySoft: '#EDE6F5',
  accent: '#F4D93D',
  accentInk: '#1a2000',
  fg: '#181511',
  muted: '#5f5850',
} as const

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

export function PlanCard({
  planId,
  interval,
  workspaceId,
  currentPlan,
  feature,
}: PlanCardProps) {
  const plan = PLANS[planId]
  const isCurrent = planId === currentPlan
  const isHighlighted = !!plan.highlight
  // Both `monthlyPrice` and `annualPrice` are already stored as the
  // monthly equivalent in cents (annualPrice is "billed annually,
  // expressed as the per-month rate"). Don't divide by 12 again.
  const monthlyCents =
    interval === 'annual' ? plan.annualPrice : plan.monthlyPrice
  const monthly = Math.round(monthlyCents / 100)
  const annualTotal = Math.round((plan.annualPrice * 12) / 100)

  // Feature list — matches the landing copy 1:1 per plan, falling
  // back to the data-driven derivation for any plan we add later.
  const features = buildFeatureList(planId, plan)

  const subtitle =
    monthlyCents === 0
      ? 'Free forever'
      : interval === 'annual'
        ? `Billed annually · $${annualTotal}/yr`
        : 'Billed monthly'

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-[16px] border p-6 transition-all duration-300 sm:p-7',
        isHighlighted
          ? 'hover:-translate-y-1.5'
          : 'hover:-translate-y-1.5',
      )}
      style={{
        background: TOKENS.card,
        borderColor: isHighlighted ? TOKENS.primary : TOKENS.border,
        boxShadow: isHighlighted
          ? '0 1px 0 rgba(24,21,17,0.04), 0 30px 60px -20px rgba(15,15,15,0.35)'
          : '0 1px 0 rgba(24,21,17,0.03), 0 20px 40px -24px rgba(15,15,15,0.18)',
      }}
    >
      {/* "Most popular" chip — landing-style: lime pill bleeding above
          the top edge of the card. */}
      {isHighlighted ? (
        <span
          className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em]"
          style={{
            background: TOKENS.accent,
            color: TOKENS.accentInk,
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
          Most popular
        </span>
      ) : null}

      {/* Plan name — mono label */}
      <p
        className="mb-2 text-[10.5px] uppercase tracking-[0.22em]"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          color: isHighlighted ? TOKENS.primary : TOKENS.muted,
          fontWeight: 600,
        }}
      >
        {plan.name}
      </p>

      {/* Price line — big serif + /mo + free-yearly chip on right */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-[52px] font-normal leading-none"
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            letterSpacing: '-.02em',
            color: TOKENS.primary,
          }}
        >
          ${monthlyCents === 0 ? 0 : monthly}
        </span>
        {monthlyCents !== 0 ? (
          <span className="text-[13px]" style={{ color: TOKENS.muted }}>
            /mo
          </span>
        ) : null}
        {planId !== 'free' ? (
          <span
            className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
            style={{
              background: TOKENS.primarySoft,
              color: TOKENS.primary,
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            2 mo free yearly
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-[12.5px]" style={{ color: TOKENS.muted }}>
        {subtitle}
      </p>

      {/* Description (taglineish) */}
      <p
        className="mt-3 min-h-[34px] text-[13px] leading-relaxed"
        style={{ color: TOKENS.muted }}
      >
        {plan.description}
      </p>

      {/* Hairline rule — repeating-dash gradient like landing's lv2-rule */}
      <div
        className="my-5 h-px w-full"
        style={{
          backgroundImage: `repeating-linear-gradient(to right, ${TOKENS.border} 0 6px, transparent 6px 12px)`,
        }}
      />

      {/* Feature list — single uniform list (matches landing). */}
      <ul className="space-y-2.5">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-[13px] leading-snug"
            style={{ color: TOKENS.fg }}
          >
            <span
              className="mt-0.5 inline-block text-[14px] font-bold leading-none"
              style={{ color: TOKENS.primary }}
            >
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA — bottom of the tile */}
      <div className="mt-6 sm:mt-auto sm:pt-6">
        <UpgradeButton
          planId={planId}
          interval={interval}
          workspaceId={workspaceId}
          isCurrent={isCurrent}
          feature={feature}
          isHighlighted={isHighlighted}
        />

        {/* Mono footnote — the same micro-trust line the landing pairs
            with each card. Different copy per plan to match landing. */}
        {!isCurrent ? (
          <p
            className="mt-3 text-center text-[10px] uppercase tracking-[0.08em]"
            style={{
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              color: TOKENS.muted,
            }}
          >
            {footnoteFor(planId)}
          </p>
        ) : null}

        {planId === 'free' && !isCurrent ? (
          <p
            className="mt-3 text-[11.5px] leading-relaxed"
            style={{ color: TOKENS.muted }}
          >
            <Zap
              className="-mt-0.5 mr-1 inline h-3 w-3"
              style={{ color: TOKENS.primary }}
            />
            BYOK — bring your own AI keys. We never charge per token.
          </p>
        ) : null}
      </div>

      {/* Soft accent ring on the highlighted card to mirror the landing's
          beam — but static, no motion (this is settings, not marketing). */}
      {isHighlighted ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[16px]"
          style={{
            boxShadow: 'inset 0 0 0 1px rgba(214,255,62,0.20)',
          }}
        />
      ) : null}
    </article>
  )
}

// ---------------------------------------------------------------------------
// Feature copy — kept here so the marketing surface and /billing read the
// same. Falls back to a dynamic build for any plan id that doesn't have a
// hardcoded list (so adding a new tier in PLANS won't crash the page).
// ---------------------------------------------------------------------------

function buildFeatureList(
  planId: BillingPlan,
  plan: (typeof PLANS)[BillingPlan],
): string[] {
  const HARDCODED: Partial<Record<BillingPlan, string[]>> = {
    free: ['3 videos / month', '10 posts / month', '1 workspace', 'Clipflow watermark'],
    solo: [
      '30 videos / month',
      '150 posts / month',
      '30 video renders / month',
      '1 workspace',
      'Brand voice + Brand Kit (logo, color, intro/outro)',
      'Auto-publish to TikTok, Instagram, YouTube, LinkedIn',
      'A/B hook testing · Virality Score · Creator research',
    ],
    agency: [
      'Unlimited videos + posts',
      '300 video renders / month',
      'Unlimited client workspaces',
      'Unlimited team seats with roles',
      'White-label review links (your brand, not ours)',
      'AI avatars · auto-dub · voice cloning',
      'Priority render queue + audit log',
      'Everything in Creator',
    ],
  }
  const hard = HARDCODED[planId]
  if (hard) return hard

  // Fallback: derive from PLANS data so newly-added tiers still render.
  const limits = plan.limits
  const out: string[] = [
    `${formatLimit(limits.contentItemsPerMonth)} videos / mo`,
    `${formatLimit(limits.outputsPerMonth)} posts / mo`,
  ]
  if (limits.videoRendersPerMonth !== 0)
    out.push(`${formatLimit(limits.videoRendersPerMonth)} video renders / mo`)
  if (limits.workspaces !== 0)
    out.push(
      `${formatLimit(limits.workspaces)} workspace${
        limits.workspaces !== 1 ? 's' : ''
      }`,
    )
  if (plan.features.customBranding) out.push('Brand Kit on every render')
  if (plan.features.scheduling) out.push('Auto-publish to TikTok, IG, YT, LinkedIn')
  if (plan.features.abHookTesting) out.push('A/B hook testing')
  if (plan.features.creatorResearch) out.push('Creator research')
  return out
}

function footnoteFor(planId: BillingPlan): string {
  switch (planId) {
    case 'free':
      return 'No card · upgrade anytime'
    case 'solo':
      return 'No card · cancel in 2 clicks · 14-day refund'
    case 'agency':
      return 'No card · unlimited clients · cancel anytime'
    default:
      return 'No card · cancel anytime'
  }
}

// ---------------------------------------------------------------------------
// CTA button — three flavours: ghost (free), primary (highlighted),
// outlined (other). All with the same arrow-shift hover.
// ---------------------------------------------------------------------------

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

  // Free / start free
  if (planId === 'free') {
    if (isCurrent) {
      return (
        <button
          type="button"
          disabled
          className="inline-flex w-full cursor-default items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-bold"
          style={{
            background: TOKENS.card,
            borderColor: TOKENS.border,
            color: TOKENS.muted,
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
          }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          You&rsquo;re on Free
        </button>
      )
    }
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full cursor-default items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold"
        style={{
          background: 'transparent',
          color: TOKENS.muted,
          fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        }}
      >
        Free tier
      </button>
    )
  }

  // Current paid plan
  if (isCurrent) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex w-full cursor-default items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-[13px] font-bold"
        style={{
          background: '#F0FDF4',
          borderColor: 'rgba(16,185,129,0.35)',
          color: '#065f46',
          fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        }}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        Current plan
      </button>
    )
  }

  // Upgrade target
  const isPrimary = isHighlighted
  return (
    <form action={action}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="plan" value={planId} />
      <input type="hidden" name="interval" value={interval} />
      {feature ? <input type="hidden" name="feature" value={feature} /> : null}
      <button
        type="submit"
        disabled={pending}
        className="group/cta relative inline-flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all duration-200 hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
        style={
          isPrimary
            ? {
                background: TOKENS.primary,
                color: TOKENS.accent,
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 0 1px rgba(214,255,62,0.18), 0 1px 2px rgba(15,15,15,0.18), 0 8px 22px -8px rgba(15,15,15,0.45)',
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }
            : {
                background: TOKENS.card,
                color: TOKENS.fg,
                border: `1px solid ${TOKENS.border}`,
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }
        }
      >
        {pending ? 'Redirecting…' : `Start 14-day trial`}
        <span className="inline-block transition-transform duration-200 group-hover/cta:translate-x-1">
          →
        </span>
      </button>
    </form>
  )
}
