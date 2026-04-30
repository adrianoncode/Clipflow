'use client'

import * as React from 'react'

import type { KpiData } from '@/components/ui/editorial'

/**
 * Client-only motion primitives that pair with editorial.tsx.
 *
 *   <CountUp> ……… number ticks 0 → target on mount with ease-out
 *   <Reveal>  ……… fade + slide-up entrance, optional stagger by index
 *
 * Lives in a separate file so the rest of editorial.tsx stays
 * server-component-safe (Hero / Kpi / StripPill / BentoCard render
 * server-side without 'use client' bleed).
 */

// ── CountUp — animates an integer from 0 to value on mount ──────────────────
//
// Cubic ease-out feels more "premium" than linear. 600ms is the sweet spot:
// fast enough to read as snappy, slow enough that the eye registers the
// rolling number rather than seeing it pop.
export function CountUp({
  value,
  duration = 600,
  format,
  className,
  style,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
  style?: React.CSSProperties
}) {
  const [n, setN] = React.useState(0)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(value)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // Cubic ease-out: fast start, gentle landing.
      const eased = 1 - Math.pow(1 - t, 3)
      setN(Math.round(value * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className={className} style={style}>
      {format ? format(n) : n}
    </span>
  )
}

// ── Reveal — fade + slide-up entrance on mount ──────────────────────────────
//
// Pass `index` to stagger sibling reveals (0.05s default — fast enough to feel
// like one motion across a grid, slow enough to read as sequential).
//
// Auto-disables when the user prefers reduced motion. Re-triggers when `key`
// is changed by the parent (e.g. on filter change in Library).
export function Reveal({
  children,
  index = 0,
  delayBase = 50,
  distance = 8,
  duration = 320,
  as: Tag = 'div',
  className,
  style,
}: {
  children: React.ReactNode
  index?: number
  delayBase?: number
  distance?: number
  duration?: number
  as?: keyof JSX.IntrinsicElements
  className?: string
  style?: React.CSSProperties
}) {
  const [entered, setEntered] = React.useState(false)
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setReduced(
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
    )
    // Two RAFs — first to commit the initial styles, second to flip to
    // entered. Without this the transition skips on some browsers.
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(r2)
    })
    return () => cancelAnimationFrame(r1)
  }, [])

  const delay = reduced ? 0 : index * delayBase
  const useTransition = !reduced

  return React.createElement(
    Tag,
    {
      className,
      style: {
        ...style,
        opacity: entered || reduced ? 1 : 0,
        transform: entered || reduced ? 'translateY(0)' : `translateY(${distance}px)`,
        transition: useTransition
          ? `opacity ${duration}ms cubic-bezier(.2,.9,.25,1.18) ${delay}ms, transform ${duration}ms cubic-bezier(.2,.9,.25,1.18) ${delay}ms`
          : 'none',
        willChange: entered ? 'auto' : 'opacity, transform',
      },
    },
    children,
  )
}

// ── KpiCountUp — same shape as Kpi, but the value rolls up on mount ─────────
//
// Mirrors the static `Kpi` primitive in editorial.tsx so it can drop in
// 1:1 inside Hero's kpis array. The number itself ticks 0 → value via
// CountUp; everything else (icon, label, type ramp) matches.
function fmtKpi(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function KpiCountUp({ Icon, value, label }: KpiData) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-end gap-2">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
          style={{ background: 'rgba(15,15,15,0.06)' }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: '#0F0F0F' }} />
        </span>
        <CountUp
          value={value}
          format={fmtKpi}
          className="tabular-nums"
          style={{
            fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
            fontSize: 'clamp(40px, 5vw, 60px)',
            lineHeight: 0.9,
            fontWeight: 350,
            letterSpacing: '-0.04em',
            color: '#0F0F0F',
          }}
        />
      </div>
      <span className="ml-9 text-[11px] font-medium" style={{ color: '#2A2A2A' }}>
        {label}
      </span>
    </div>
  )
}
