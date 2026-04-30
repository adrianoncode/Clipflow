'use client'

import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'

import {
  ChartTooltip,
  CountUp,
  useMountTween,
} from '@/components/ui/editorial-motion'

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

// BarChartWeek — 7-day post velocity bars.
//
// Mount: bars grow staggered (80ms between bars) from 0 → height. The
// peak bar gets a softly-pulsing accent halo. Hover: bar glows yellow,
// tooltip floats above with the day name + count. Reduced-motion users
// see the static end-state with no glow.
export function BarChartWeek({
  data,
  max,
  peakIndex,
  total,
}: {
  data: Array<{ label: string; count: number; isoDay: string }>
  max: number
  peakIndex: number
  total: number
}) {
  const t = useMountTween(900, 60)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [tipPos, setTipPos] = React.useState({ x: 0, y: 0 })

  const handleEnter = (i: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const barRect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    setTipPos({
      x: barRect.left - rect.left + barRect.width / 2,
      y: barRect.top - rect.top,
    })
    setHoverIdx(i)
  }

  const formatDay = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    } catch {
      return iso
    }
  }

  return (
    <div
      className="group flex flex-col justify-between gap-4 rounded-[24px] p-5 transition-all duration-200 hover:scale-[1.012]"
      style={{
        background: PALETTE.cardCream,
        border: `1px solid ${PALETTE.border}`,
        boxShadow:
          hoverIdx !== null
            ? 'inset 0 1px 0 rgba(255,255,255,0.7), 0 12px 32px rgba(15,15,15,0.06)'
            : 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
            Progress
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <CountUp
              value={total}
              duration={900}
              className="text-[34px] leading-none tabular-nums"
              style={{
                fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
                color: PALETTE.ink,
                fontWeight: 400,
                letterSpacing: '-0.025em',
              }}
            />
            <span className="text-[11px] leading-tight" style={{ color: PALETTE.inkSoft }}>
              posts
              <br />
              this week
            </span>
          </div>
        </div>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-200 group-hover:rotate-12"
          style={{ background: 'rgba(15,15,15,0.06)' }}
          aria-hidden
        >
          <ArrowUpRight className="h-4 w-4" style={{ color: PALETTE.ink }} />
        </span>
      </div>

      <div ref={containerRef} className="relative flex h-[88px] items-end gap-1.5">
        {data.map((d, i) => {
          const isPeak = i === peakIndex && d.count > 0
          const isHover = hoverIdx === i
          const baseHeight = Math.max(Math.round((d.count / max) * 100), d.count > 0 ? 8 : 4)
          // Stagger: each bar enters delay = i * 80ms, capped to total tween length.
          const stagger = Math.max(0, Math.min(1, t * data.length - i))
          const heightPct = baseHeight * Math.min(1, stagger)
          return (
            <div
              key={d.isoDay}
              className="relative flex flex-1 cursor-pointer flex-col items-center gap-1.5"
              onMouseEnter={(e) => handleEnter(i, e)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {isPeak && stagger >= 1 && (
                <span
                  className="absolute -top-5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums transition-transform duration-200"
                  style={{
                    background: PALETTE.yellow,
                    color: PALETTE.ink,
                    transform: isHover ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {d.count}
                </span>
              )}
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-full"
                  style={{
                    height: `${heightPct}%`,
                    background: isHover
                      ? PALETTE.yellow
                      : isPeak
                        ? PALETTE.yellow
                        : PALETTE.charcoal,
                    minHeight: 4,
                    transition:
                      'background 180ms ease-out, box-shadow 220ms ease-out, transform 200ms ease-out',
                    transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHover
                      ? `0 6px 14px rgba(220,185,31,0.35)`
                      : isPeak
                        ? `0 0 0 0 rgba(220,185,31,0)`
                        : 'none',
                  }}
                />
              </div>
              <span
                className="text-[10px] font-semibold uppercase"
                style={{
                  color: isHover ? PALETTE.ink : PALETTE.inkSoft,
                  transition: 'color 180ms ease-out',
                }}
              >
                {d.label}
              </span>
            </div>
          )
        })}
        {hoverIdx !== null &&
          data[hoverIdx] &&
          (() => {
            const d = data[hoverIdx]!
            return (
              <ChartTooltip
                visible
                x={tipPos.x}
                y={tipPos.y}
                label={formatDay(d.isoDay)}
                value={`${d.count} ${d.count === 1 ? 'post' : 'posts'}`}
              />
            )
          })()}
      </div>
    </div>
  )
}
