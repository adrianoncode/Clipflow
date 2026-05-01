'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { formatNum, type KpiData } from '@/components/ui/editorial'

/**
 * Client-only motion primitives that pair with editorial.tsx.
 *
 *   <CountUp> ……… number ticks 0 → target on mount with ease-out
 *   <Reveal>  ……… fade + slide-up entrance, optional stagger by index
 *   useMountTween() ……… eased 0→1 progress that runs once on mount
 *   <BreathingDot> … pulsing dot for "live" indicators
 *   <SpotlightCard> … cursor-follow gradient under content (Linear/Vercel feel)
 *   <TiltCard>  ……… subtle 3D tilt that follows the cursor
 *   <Tooltip>   ……… positioned hover hint, mono-stamped
 *
 * Lives in a separate file so the rest of editorial.tsx stays
 * server-component-safe (Hero / Kpi / StripPill / BentoCard render
 * server-side without 'use client' bleed).
 */

// Shared util: respect `prefers-reduced-motion` system setting.
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

// useMountTween — eased 0 → 1 progress that runs once on mount.
//
// Returns a number that climbs from 0 to 1 over `duration` ms with
// cubic ease-out. Components multiply their target value (donut dash,
// bar height, funnel width) by this number to get the mount sweep.
// When the user prefers reduced motion the tween snaps to 1 immediately.
export function useMountTween(duration = 800, delay = 0) {
  const [t, setT] = React.useState(0)
  const reduced = usePrefersReducedMotion()

  React.useEffect(() => {
    if (reduced) {
      setT(1)
      return
    }
    let raf = 0
    let startedAt = 0
    const tick = (now: number) => {
      if (!startedAt) startedAt = now
      const elapsed = now - startedAt - delay
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const k = Math.min(1, elapsed / duration)
      // Cubic ease-out — snappy start, gentle landing.
      const eased = 1 - Math.pow(1 - k, 3)
      setT(eased)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, delay, reduced])

  return t
}

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
    // We track both ids in the closure so unmount cancels whichever is
    // pending (the prior version's `return` from inside the inner RAF
    // was discarded silently).
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setEntered(true))
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
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
//

// ── BreathingDot — pulsing dot for "live"/active indicators ─────────────────
//
// Two stacked dots: a solid core + an expanding halo that pulses 0 → 100%
// scale + 70% → 0% opacity over 1.6s. Halo runs `infinite`, core is static.
// Auto-disables under reduced-motion (just shows the static core).
export function BreathingDot({
  color = '#0F6B4D',
  size = 8,
  className,
}: {
  color?: string
  size?: number
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {!reduced && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: color,
            // Keyframe defined in app/globals.css so all instances share
            // a single stylesheet rather than each shipping its own
            // styled-jsx scoped block.
            animation: 'breathing-halo 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      )}
      <span
        className="relative block rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  )
}

// ── SpotlightCard — cursor-follow radial gradient under children ────────────
//
// Mounts a layer behind content that paints a soft radial gradient at the
// cursor's position. The gradient is invisible until the user enters the
// card (opacity 0 → 1 on hover). Used to give bento tiles the
// Linear/Vercel/Anthropic Console "premium pointer" feel.
//
// Light mode: warm cream highlight. Dark variant: neutral white wash.
// Disabled when reduced-motion is on.
export function SpotlightCard({
  children,
  className,
  style,
  tone = 'warm',
  size = 320,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: 'warm' | 'cool' | 'dark'
  size?: number
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = React.useState(false)

  const handleMove = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      ref.current.style.setProperty('--spot-x', `${x}px`)
      ref.current.style.setProperty('--spot-y', `${y}px`)
    },
    [reduced],
  )

  const gradColor =
    tone === 'dark'
      ? 'rgba(255,255,255,0.10)'
      : tone === 'cool'
        ? 'rgba(124,58,237,0.16)'
        : 'rgba(255,236,140,0.55)'

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={handleMove}
      {...rest}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: active && !reduced ? 1 : 0,
          background: `radial-gradient(${size}px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${gradColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  )
}

// ── TiltCard — subtle 3D tilt that follows the cursor ───────────────────────
//
// Wraps children in a perspective container; on mouse-move the inner div
// tilts up to ~`maxTilt` degrees in X and Y based on cursor offset. On
// mouse-leave it eases back to flat. Always uses transform-only so it
// stays GPU-cheap. Disabled under reduced-motion.
export function TiltCard({
  children,
  className,
  style,
  maxTilt = 4,
  perspective = 900,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  maxTilt?: number
  perspective?: number
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const reduced = usePrefersReducedMotion()
  const rafRef = React.useRef(0)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0 → 1
    const py = (e.clientY - rect.top) / rect.height
    const ry = (px - 0.5) * 2 * maxTilt // -maxTilt → +maxTilt
    const rx = (0.5 - py) * 2 * maxTilt
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!ref.current) return
      ref.current.style.transform = `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg)`
    })
  }

  const handleLeave = () => {
    if (!ref.current) return
    cancelAnimationFrame(rafRef.current)
    ref.current.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`
  }

  // Cancel any pending tilt frame on unmount — stops a stray frame
  // from writing to a detached DOM node, and matches the cleanup
  // discipline of the other motion primitives in this file.
  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn('transition-transform duration-300 ease-out will-change-transform', className)}
      style={{ transformStyle: 'preserve-3d', ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...rest}
    >
      {children}
    </div>
  )
}

// ── Tooltip — minimal hover hint with mono kicker + value ───────────────────
//
// Positioned absolutely above its anchor by the parent. Just the visual —
// the show/hide / position-tracking logic lives in the chart components
// that need it (BarChartWeek, AnimatedDonut, etc.).
export function ChartTooltip({
  label,
  value,
  visible,
  x,
  y,
}: {
  label: string
  value: React.ReactNode
  visible: boolean
  x: number
  y: number
}) {
  return (
    <div
      role="tooltip"
      aria-hidden={!visible}
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md px-2 py-1 text-[10px] transition-opacity duration-150"
      style={{
        left: x,
        top: y - 8,
        opacity: visible ? 1 : 0,
        background: '#0F0F0F',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(15,15,15,0.18)',
      }}
    >
      <span
        className="block uppercase opacity-60"
        style={{
          fontFamily: 'var(--font-jetbrains-mono), monospace',
          letterSpacing: '0.18em',
          fontSize: 9,
        }}
      >
        {label}
      </span>
      <span
        className="block tabular-nums"
        style={{
          fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
          fontSize: 12,
          fontWeight: 600,
          marginTop: 1,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ── StripPillAnimated — animated cousin of editorial StripPill ──────────────
//
// Same 4 visual variants (dark / accent / bar / outline). Differences:
//   • Numeric value rolls 0 → target via CountUp.
//   • `bar` variant: hatched fill grows 0 → value % via mount tween.
//   • Subtle opacity breath on the wrapper (2.4s, ±0.04) so the strip
//     feels "alive" even when no one's hovering it.
// Reduced-motion: snaps to end-state, no breathing.
export function StripPillAnimated({
  label,
  value,
  variant,
  showSign = false,
  suffix = '%',
}: {
  label: string
  value: number
  variant: 'dark' | 'accent' | 'bar' | 'outline'
  showSign?: boolean
  suffix?: string
}) {
  const reduced = usePrefersReducedMotion()
  const t = useMountTween(900, 80)
  const animatedValue = Math.round(value * t)
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '−' : '') : ''
  const display = `${sign}${Math.abs(animatedValue)}${suffix}`

  return (
    <div
      className="flex flex-col gap-1.5"
      style={{
        animation: reduced ? 'none' : 'strip-breath 2.6s ease-in-out infinite',
      }}
    >
      <span className="text-[11px] font-medium" style={{ color: '#2A2A2A' }}>
        {label}
      </span>
      {variant === 'dark' && (
        <div
          className="flex h-9 items-center justify-center rounded-full px-4"
          style={{ background: '#0F0F0F', color: '#FFFFFF' }}
        >
          <PillNumberLocal>{display}</PillNumberLocal>
        </div>
      )}
      {variant === 'accent' && (
        <div
          className="flex h-9 items-center justify-center rounded-full px-4"
          style={{ background: '#F4D93D', color: '#0F0F0F' }}
        >
          <PillNumberLocal bold>{display}</PillNumberLocal>
        </div>
      )}
      {variant === 'bar' && (
        <div
          role="progressbar"
          aria-label={`${label}: ${sign}${Math.abs(value)}${suffix}`}
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
              width: `${Math.max(0, Math.min(100, animatedValue))}%`,
              backgroundImage:
                'repeating-linear-gradient(115deg, rgba(15,15,15,0.18) 0 6px, rgba(15,15,15,0.04) 6px 12px)',
            }}
          />
          <div className="relative ml-auto" style={{ color: '#0F0F0F' }}>
            <PillNumberLocal>{display}</PillNumberLocal>
          </div>
        </div>
      )}
      {variant === 'outline' && (
        <div
          className="flex h-9 items-center justify-center rounded-full px-4"
          style={{ border: '1px solid rgba(15,15,15,0.14)', color: '#0F0F0F' }}
        >
          <PillNumberLocal>{display}</PillNumberLocal>
        </div>
      )}
    </div>
  )
}

function PillNumberLocal({
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
          format={formatNum}
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
