/**
 * Editorial primitives — Crextio paper-tone aesthetic.
 *
 * These are the building blocks every Work-area page composes from:
 *
 *   <Hero> ………… kicker + serif title + KPI trio + action
 *   <Kpi>  ………… single icon + tabular value + label (with CountUp)
 *   <StripPill> … 4-variant percent indicator (dark · accent · bar · outline)
 *   <StatusBadge> ……… consistent status vocabulary across the pipeline
 *   <BentoCard> ……… 24px-radius cream card with inset highlight + lift hover
 *   <SectionHeader> … mono kicker + serif headline pair
 *   <CountUp> ……… number ticks from 0 → target on mount (cubic-out)
 *   <Reveal> ……… fade+slide-up on mount, optional stagger by index
 *
 * They lift the inline patterns from the original Dashboard implementation
 * (which got reused via copy-paste across Library, Workflow, Schedule) into
 * one place — same look, less duplication, easier to evolve.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { KpiCountUp, StripPillAnimated } from '@/components/ui/editorial-motion'

// ── Format helpers ──────────────────────────────────────────────────────────
function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '–'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ── KPI item — used in <Hero kpis={[…]}> and standalone ─────────────────────
export interface KpiData {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  value: number
  label: string
}

export function Kpi({ Icon, value, label }: KpiData) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-end gap-2">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: 'rgba(15,15,15,0.06)' }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
        </span>
        <span
          className="tabular-nums"
          style={{
            fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            fontSize: 'clamp(40px, 5vw, 60px)',
            lineHeight: 0.9,
            fontWeight: 350,
            letterSpacing: '-0.04em',
            color: '#0F0F0F',
          }}
        >
          {formatNum(value)}
        </span>
      </div>
      <span className="ml-9 text-[11px] font-medium" style={{ color: '#2A2A2A' }}>
        {label}
      </span>
    </div>
  )
}

// ── Hero — kicker + title + optional KPI trio + optional action ─────────────
//
// `animated` swaps the static <Kpi> for the count-up variant. Keeps the
// API symmetrical so server-component callers don't have to know about
// the client/server split.
export function Hero({
  kicker,
  title,
  kpis,
  action,
  size = 'lg',
  animated = false,
}: {
  kicker: React.ReactNode
  title: React.ReactNode
  kpis?: KpiData[]
  action?: React.ReactNode
  size?: 'lg' | 'md'
  animated?: boolean
}) {
  const titleClamp =
    size === 'md'
      ? 'clamp(32px, 4vw, 48px)'
      : 'clamp(44px, 6.5vw, 76px)'
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          <p
            className="mb-2 text-[10px] font-semibold uppercase"
            style={{
              color: '#7A7468',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.22em',
            }}
          >
            {kicker}
          </p>
          <h1
            className="m-0"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: titleClamp,
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 0.98,
              color: '#0F0F0F',
            }}
          >
            {title}
          </h1>
        </div>
        {action}
      </div>
      {kpis && kpis.length > 0 && (
        <div className="flex flex-wrap items-end gap-7 sm:gap-10">
          {kpis.map((k, i) =>
            animated ? (
              <KpiCountUp key={`${k.label}-${i}`} {...k} />
            ) : (
              <Kpi key={`${k.label}-${i}`} {...k} />
            ),
          )}
        </div>
      )}
    </section>
  )
}

// ── StripPill — 4 visual variants of a single percent indicator ─────────────
//
//   dark    = solid charcoal pill, white text
//   accent  = solid yellow pill, dark text
//   bar     = outline pill with hatched fill that grows to N%
//   outline = outline pill, dark text
export function StripPill({
  label,
  value,
  variant,
  showSign = false,
  suffix = '%',
  animated = false,
}: {
  label: string
  value: number
  variant: 'dark' | 'accent' | 'bar' | 'outline'
  showSign?: boolean
  suffix?: string
  animated?: boolean
}) {
  if (animated) {
    return (
      <StripPillAnimated
        label={label}
        value={value}
        variant={variant}
        showSign={showSign}
        suffix={suffix}
      />
    )
  }
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '−' : '') : ''
  const display = `${sign}${Math.abs(value)}${suffix}`

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium" style={{ color: '#2A2A2A' }}>
        {label}
      </span>
      {variant === 'dark' && (
        <div
          className="flex h-9 items-center justify-center rounded-full px-4"
          style={{ background: '#0F0F0F', color: '#FFFFFF' }}
        >
          <PillNumber>{display}</PillNumber>
        </div>
      )}
      {variant === 'accent' && (
        <div
          className="flex h-9 items-center justify-center rounded-full px-4"
          style={{ background: '#F4D93D', color: '#0F0F0F' }}
        >
          <PillNumber bold>{display}</PillNumber>
        </div>
      )}
      {variant === 'bar' && (
        <div
          role="progressbar"
          aria-label={`${label}: ${display}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, value))}
          className="relative flex h-9 items-center overflow-hidden rounded-full px-4"
          style={{ border: '1px solid rgba(15,15,15,0.14)' }}
        >
          <div
            aria-hidden
            className="absolute inset-y-0 left-0"
            style={{
              width: `${Math.max(0, Math.min(100, value))}%`,
              backgroundImage:
                'repeating-linear-gradient(115deg, rgba(15,15,15,0.18) 0 6px, rgba(15,15,15,0.04) 6px 12px)',
            }}
          />
          <div className="relative ml-auto" style={{ color: '#0F0F0F' }}>
            <PillNumber>{display}</PillNumber>
          </div>
        </div>
      )}
      {variant === 'outline' && (
        <div
          className="flex h-9 items-center justify-center rounded-full px-4"
          style={{ border: '1px solid rgba(15,15,15,0.14)', color: '#0F0F0F' }}
        >
          <PillNumber>{display}</PillNumber>
        </div>
      )}
    </div>
  )
}

function PillNumber({
  children,
  bold = false,
}: {
  children: React.ReactNode
  bold?: boolean
}) {
  return (
    <span
      className="tabular-nums"
      style={{
        fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
        fontSize: 14,
        fontWeight: bold ? 700 : 600,
      }}
    >
      {children}
    </span>
  )
}

// ── StatusBadge — pipeline-wide vocabulary (transcribing/draft/ready/…) ─────
type StatusKey =
  | 'processing'
  | 'transcribing'
  | 'rendering'
  | 'importing'
  | 'draft'
  | 'drafting'
  | 'ready'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'live'
  | 'failed'
  | 'rejected'
  | (string & {})

export function StatusBadge({ status }: { status: StatusKey }) {
  const v = String(status).toLowerCase()
  const baseMono = {
    fontFamily: 'var(--font-jetbrains-mono), monospace',
    fontSize: 10,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
  }
  if (['processing', 'transcribing', 'rendering', 'importing'].includes(v)) {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5"
        style={{
          background: 'rgba(15,15,15,0.06)',
          border: '1px solid rgba(15,15,15,0.14)',
          fontWeight: 600,
          ...baseMono,
        }}
      >
        <span
          className="inline-block h-[11px] w-[11px] rounded-full"
          style={{
            border: '1.5px solid rgba(15,15,15,0.18)',
            borderTopColor: '#0F0F0F',
            animation: 'conic-spin 1.4s linear infinite',
          }}
        />
        {v}
      </span>
    )
  }
  if (['draft', 'drafting'].includes(v)) {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5"
        style={{ background: '#F4D93D', color: '#0F0F0F', fontWeight: 700, ...baseMono }}
      >
        Drafting
      </span>
    )
  }
  if (['ready', 'approved'].includes(v)) {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5"
        style={{ background: '#0F0F0F', color: '#FFFFFF', fontWeight: 600, ...baseMono }}
      >
        {v}
      </span>
    )
  }
  if (v === 'scheduled') {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5"
        style={{
          background: 'rgba(99,113,214,0.10)',
          color: '#4350a8',
          border: '1px solid rgba(99,113,214,0.25)',
          fontWeight: 600,
          ...baseMono,
        }}
      >
        scheduled
      </span>
    )
  }
  if (v === 'published' || v === 'live') {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5"
        style={{
          background: 'rgba(15,107,77,0.10)',
          color: '#0F6B4D',
          border: '1px solid rgba(15,107,77,0.25)',
          fontWeight: 700,
          ...baseMono,
        }}
      >
        live
      </span>
    )
  }
  if (['failed', 'rejected'].includes(v)) {
    return (
      <span
        className="inline-flex h-6 items-center gap-1.5 rounded-full px-2.5"
        style={{
          background: 'rgba(155,32,24,0.08)',
          color: '#9B2018',
          border: '1px solid rgba(155,32,24,0.25)',
          fontWeight: 700,
          ...baseMono,
        }}
      >
        <span className="block h-1.5 w-1.5 rounded-full" style={{ background: '#9B2018' }} />
        {v}
      </span>
    )
  }
  return (
    <span
      className="inline-flex h-6 items-center rounded-full px-2.5"
      style={{
        border: '1px solid rgba(15,15,15,0.14)',
        color: '#7A7468',
        fontWeight: 600,
        ...baseMono,
      }}
    >
      {v}
    </span>
  )
}

// ── BentoCard — 24px radius cream card, inset highlight, lift + drop-shadow ─
//
// Hover lifts the card with `scale(1.02)` AND adds a soft outer drop shadow
// — so the depth shift reads as "elevation" rather than just zoom. The
// inset highlight at the top sells the light-from-above illusion that
// gives the cream surface its haptic feel.
export const BentoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    tone?: 'cream' | 'dark' | 'white' | 'accent'
    lift?: boolean
  }
>(({ className, style, tone = 'cream', lift = true, ...props }, ref) => {
  // Typed as a Record over the exact tone union — TypeScript then knows
  // the lookup is total and `tones[tone]` is never `undefined`.
  type Tone = 'cream' | 'dark' | 'white' | 'accent'
  const tones: Record<Tone, { rest: React.CSSProperties; hover: string }> = {
    cream: {
      rest: {
        background: '#F9F4DC',
        color: '#0F0F0F',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      hover:
        'inset_0_1px_0_rgba(255,255,255,0.7),0_18px_42px_-12px_rgba(15,15,15,0.18)',
    },
    dark: {
      rest: {
        background: '#0F0F0F',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      hover:
        'inset_0_1px_0_rgba(255,255,255,0.06),0_18px_42px_-12px_rgba(0,0,0,0.50)',
    },
    white: {
      rest: {
        background: '#FFFDF8',
        color: '#0F0F0F',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      hover:
        'inset_0_1px_0_rgba(255,255,255,0.7),0_18px_42px_-12px_rgba(15,15,15,0.16)',
    },
    accent: {
      rest: {
        background: 'linear-gradient(170deg, #F9E97A 0%, #F4D93D 55%, #DCB91F 100%)',
        color: '#0F0F0F',
        border: '1px solid rgba(15,15,15,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
      },
      hover:
        'inset_0_1px_0_rgba(255,255,255,0.55),0_18px_42px_-12px_rgba(220,185,31,0.35)',
    },
  }
  const t = tones[tone]
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-[24px] p-5 transition-all duration-200',
        lift && `hover:scale-[1.02] hover:[box-shadow:${t.hover}]`,
        className,
      )}
      style={{ ...t.rest, ...style }}
      {...props}
    />
  )
})
BentoCard.displayName = 'BentoCard'

// ── SectionHeader — mono kicker + serif headline pair ───────────────────────
export function SectionHeader({
  kicker,
  title,
  action,
  size = 'md',
}: {
  kicker?: React.ReactNode
  title: React.ReactNode
  action?: React.ReactNode
  size?: 'md' | 'sm'
}) {
  const titleSize = size === 'sm' ? 22 : 28
  return (
    <div className="flex items-end justify-between gap-3 border-b pb-3.5"
      style={{ borderColor: 'rgba(15,15,15,0.14)' }}
    >
      <div className="min-w-0">
        {kicker && (
          <p
            className="mb-1 text-[10px] font-semibold uppercase"
            style={{
              color: '#7A7468',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.22em',
            }}
          >
            {kicker}
          </p>
        )}
        <h2
          className="m-0"
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            fontSize: titleSize,
            fontWeight: 400,
            letterSpacing: '-0.012em',
            lineHeight: 1.05,
            color: '#0F0F0F',
          }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  )
}
