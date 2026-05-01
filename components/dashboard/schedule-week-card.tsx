'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, ChevronRight } from 'lucide-react'

import { BreathingDot, ChartTooltip } from '@/components/ui/editorial-motion'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'

// ScheduleWeekCard — week strip with breathing today indicator + day tooltips.
//
// Today's day cell gets a BreathingDot above it. Hovering any day shows a
// tooltip — useful even when there's no per-day data because it confirms
// "this is Tuesday" at a glance.
export function ScheduleWeekCard({
  scheduled,
  published,
  workspaceId,
}: {
  scheduled: number
  published: number
  workspaceId: string
}) {
  const today = new Date()
  const dayIdx = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayIdx)
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [tip, setTip] = React.useState<{
    visible: boolean
    label: string
    x: number
    y: number
  }>({ visible: false, label: '', x: 0, y: 0 })

  const showTip = (i: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const day = days[i]
    if (!day) return
    const rect = containerRef.current.getBoundingClientRect()
    const cellRect = e.currentTarget.getBoundingClientRect()
    setTip({
      visible: true,
      label: day.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
      x: cellRect.left - rect.left + cellRect.width / 2,
      y: cellRect.top - rect.top,
    })
  }

  return (
    <Link
      href={`/workspace/${workspaceId}/schedule`}
      className="group flex flex-col justify-between gap-4 rounded-[24px] p-5 transition-all duration-200 hover:scale-[1.012] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      style={{
        background: PALETTE.cardCream,
        border: `1px solid ${PALETTE.border}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" style={{ color: PALETTE.inkSoft }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: PALETTE.inkSoft,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            This week
          </span>
        </div>
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12"
          style={{ color: PALETTE.ink }}
        />
      </div>

      <div ref={containerRef} className="relative grid grid-cols-6 gap-1 text-center">
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          return (
            <div
              key={i}
              className="flex cursor-pointer flex-col items-center gap-1.5"
              onMouseEnter={(e) => showTip(i, e)}
              onMouseLeave={() => setTip((s) => ({ ...s, visible: false }))}
            >
              <div className="flex items-center gap-1">
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{ color: PALETTE.inkSoft }}
                >
                  {d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
                </span>
                {isToday && <BreathingDot color={PALETTE.charcoal} size={5} />}
              </div>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-all duration-200"
                style={{
                  background: isToday ? PALETTE.charcoal : 'transparent',
                  color: isToday ? '#FFFFFF' : PALETTE.ink,
                  border: isToday ? undefined : `1px solid ${PALETTE.border}`,
                }}
              >
                {d.getDate()}
              </span>
            </div>
          )
        })}
        <ChartTooltip
          visible={tip.visible}
          x={tip.x}
          y={tip.y}
          label="Day"
          value={tip.label}
        />
      </div>

      <div
        className="flex items-center justify-between text-[11px]"
        style={{ color: PALETTE.inkSoft }}
      >
        <span
          className="tabular-nums"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {scheduled} queued · {published} live
        </span>
        <span
          className="flex items-center gap-1 text-[12px] font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: PALETTE.ink }}
        >
          Open <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
