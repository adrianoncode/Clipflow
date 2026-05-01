'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import {
  ChartTooltip,
  CountUp,
  useMountTween,
} from '@/components/ui/editorial-motion'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

// BarChartRange — adaptive volume bars across the dashboard's selected
// range (7 / 30 / 90 days). Originally a fixed-7-day component
// (BarChartWeek); renamed when adaptive bucketing landed in Phase 2 so
// the name actually describes what it does.
//
// Renders whatever buckets the analytics layer hands over (7 daily,
// 30 daily, 13 weekly) without per-range component branching.
//
// Mount: bars grow staggered (80ms between bars) from 0 → height. The
// peak bar gets a softly-pulsing accent halo. Hover: bar glows yellow,
// tooltip floats above with the bucket date + count. Reduced-motion
// users see the static end-state with no glow.
export function BarChartRange({
  data,
  max,
  peakIndex,
  total,
  rangeLabel,
}: {
  data: Array<{ label: string; count: number; isoDay: string }>
  max: number
  peakIndex: number
  total: number
  /** Free-form label for the period the data covers — e.g. "Last 7
   *  days". Renders below the count, replacing the previous hard-
   *  coded "posts this week" copy. */
  rangeLabel: string
}) {
  // Delay covers the parent <Reveal>'s 320ms fade-up so the bar grow
  // doesn't animate "behind the fog" — bars start to wake once their
  // card is fully opaque.
  const t = useMountTween(900, 380)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [tipPos, setTipPos] = React.useState({ x: 0, y: 0 })

  const handleActivate = (i: number, e: { currentTarget: HTMLDivElement }) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const barRect = e.currentTarget.getBoundingClientRect()
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
    // Card wraps in a Link to the Library — drilling into "what was
    // generated this period" lands on the actual content, not just
    // another summary view. Mirrors ScheduleWeekCard's pattern where
    // the entire card is the click-target so users don't have to find
    // a small "Open" affordance. Bars stay hover-only (tooltips for
    // information, no nested links to avoid Cmd-click ambiguity).
    <Link
      href="/library"
      aria-label={`${total} posts ${rangeLabel.toLowerCase()} — open Library`}
      className="group flex flex-col justify-between gap-4 rounded-[24px] p-5 transition-all duration-200 hover:scale-[1.012] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
              {rangeLabel.toLowerCase()}
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

      <div
        ref={containerRef}
        className="relative flex h-[88px] items-end"
        // Gap scales with bucket count: 6px @ ≤7, 3px @ 8-15, 1.5px @ 16+.
        // Without this, 30-bar views eat 174px of horizontal real estate
        // in gaps alone and the bars compress to slivers.
        style={{
          gap:
            data.length <= 7
              ? 6
              : data.length <= 15
                ? 3
                : 1.5,
        }}
      >
        {data.map((d, i) => {
          const isPeak = i === peakIndex && d.count > 0
          const isHover = hoverIdx === i
          const baseHeight = Math.max(Math.round((d.count / max) * 100), d.count > 0 ? 8 : 4)
          // Stagger: each bar enters delay = i * 80ms, capped to total tween length.
          const stagger = Math.max(0, Math.min(1, t * data.length - i))
          const heightPct = baseHeight * Math.min(1, stagger)
          // Each bar exposes its data textually via aria-label — sighted
          // users see the height, screen-reader users hear "Tue, Apr 28:
          // 12 posts". role="img" because the cell IS a data point, not
          // a button (no action on activate). The hover tooltip remains
          // a purely visual decoration; SR users get the same info from
          // the label without needing to "hover".
          const dayFormatted = formatDay(d.isoDay)
          const cellLabel = `${dayFormatted}: ${d.count} ${d.count === 1 ? 'post' : 'posts'}`
          return (
            <div
              key={d.isoDay}
              role="img"
              aria-label={cellLabel}
              // No `cursor-pointer` — cells aren't interactive (no
              // onClick / no Link), only hover-tooltips. Pointer cursor
              // would lie about clickability per Vercel WIG.
              className="relative flex flex-1 flex-col items-center gap-1.5"
              onMouseEnter={(e) => handleActivate(i, e)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {isPeak && stagger >= 1 && (
                <span
                  className="absolute -top-5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums transition-transform duration-200"
                  style={{
                    // Peak number badge desaturated from full yellow
                    // to yellowSoft — supporting-tier per the yellow-
                    // hierarchy plan. Action surfaces (FeaturedCard
                    // gradient, stuck-draft chevron, "Live" pulse pill)
                    // hold full saturation; data-viz highlights step
                    // down a tier so they read as "noted" not "alarm".
                    background: PALETTE.yellowSoft,
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
                      ? PALETTE.yellowSoft
                      : isPeak
                        ? PALETTE.yellowSoft
                        : PALETTE.charcoal,
                    minHeight: 4,
                    transition:
                      'background 180ms ease-out, box-shadow 220ms ease-out, transform 200ms ease-out',
                    transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: isHover
                      ? `0 6px 14px rgba(244,217,61,0.22)`
                      : 'none',
                  }}
                />
              </div>
              {/* Empty labels (sparse 30d markers) get a 1px-tall
                  spacer so the bar bottoms align with their neighbours.
                  Otherwise the bar with no label would visually bleed
                  down into the next row. */}
              {d.label ? (
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{
                    color: isHover ? PALETTE.ink : PALETTE.inkSoft,
                    transition: 'color 180ms ease-out',
                  }}
                >
                  {d.label}
                </span>
              ) : (
                <span aria-hidden className="block h-[14px]" />
              )}
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
    </Link>
  )
}
