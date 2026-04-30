'use client'

import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'

import { CountUp, useMountTween } from '@/components/ui/editorial-motion'

const PALETTE = {
  cardCream: '#F9F4DC',
  yellow: '#F4D93D',
  yellowSoft: '#F9E97A',
  yellowDeep: '#DCB91F',
  charcoal: '#0F0F0F',
  ink: '#0F0F0F',
  inkSoft: '#2A2A2A',
  border: 'rgba(15, 15, 15, 0.06)',
}

// AnimatedDonut — replaces the static SVG donut from the dashboard.
//
// Mount: stroke-dasharray sweeps 0 → target over 1.1s ease-out.
// Hover: stroke-width grows from 7 → 9, the surrounding ring picks up a
// subtle glow, the inner number kicks one extra tick. Reduced-motion users
// see the static end-state.
export function AnimatedDonut({
  pct,
  approved,
}: {
  pct: number
  approved: number
}) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const target = (Math.min(Math.max(pct, 0), 100) / 100) * circumference

  // Sweep tween — climbs 0 → 1 once on mount, eases out.
  const t = useMountTween(1100, 80)
  const dash = target * t

  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="group flex flex-col justify-between gap-2 rounded-[24px] p-5 transition-all duration-200 hover:scale-[1.012]"
      style={{
        background: PALETTE.cardCream,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: hovered
          ? 'inset 0 1px 0 rgba(255,255,255,0.7), 0 12px 32px rgba(15,15,15,0.06)'
          : 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
          Approval rate
        </p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 group-hover:rotate-12"
          style={{ background: 'rgba(15,15,15,0.06)' }}
          aria-hidden
        >
          <ArrowUpRight className="h-4 w-4" style={{ color: PALETTE.ink }} />
        </span>
      </div>

      <div className="relative mx-auto flex h-[110px] w-[110px] items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          {/* Solid muted track — visible even at 0%. */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(15,15,15,0.10)"
            strokeWidth={hovered ? 8 : 7}
            strokeLinecap="round"
            style={{ transition: 'stroke-width 200ms ease-out' }}
          />
          <defs>
            <linearGradient id="donut-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={PALETTE.yellowSoft} />
              <stop offset="100%" stopColor={PALETTE.yellowDeep} />
            </linearGradient>
            <filter id="donut-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {pct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#donut-fill)"
              strokeWidth={hovered ? 9 : 7}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              filter={hovered ? 'url(#donut-glow)' : undefined}
              style={{ transition: 'stroke-width 220ms ease-out, filter 220ms ease-out' }}
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          <CountUp
            value={pct}
            duration={1100}
            format={(n) => `${n}%`}
            className="text-[24px] leading-none tabular-nums"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          />
          <span
            className="mt-0.5 text-[9.5px] uppercase tracking-wider"
            style={{ color: PALETTE.inkSoft }}
          >
            of reviewed
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className="flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold"
          style={{ background: PALETTE.charcoal, color: '#FFFFFF' }}
        >
          <CountUp value={approved} duration={900} className="tabular-nums" />
          <span className="ml-1">approved</span>
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{
            color: PALETTE.inkSoft,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
        >
          all-time
        </span>
      </div>
    </div>
  )
}
