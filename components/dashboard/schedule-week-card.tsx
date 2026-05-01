'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, CalendarDays, ChevronRight, Inbox } from 'lucide-react'

import { BreathingDot, ChartTooltip } from '@/components/ui/editorial-motion'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'
import type { UpcomingPost } from '@/lib/dashboard/get-analytics'

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Reels',
  youtube_shorts: 'Shorts',
  linkedin: 'LinkedIn',
}

const PLATFORM_DOT: Record<string, string> = {
  tiktok: '#0F0F0F',
  instagram_reels: '#CC8425',
  youtube_shorts: '#9B2018',
  linkedin: '#25808E',
}

/**
 * Compact relative when-phrase for upcoming posts. Examples:
 *   • Today, 14:00
 *   • Tomorrow, 09:00
 *   • Fri 9 May, 09:00
 * Falls through to the raw ISO string if Date can't parse.
 */
function formatRelativeWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000,
  )
  const time = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
  if (dayDiff === 0) return `Today · ${time}`
  if (dayDiff === 1) return `Tomorrow · ${time}`
  if (dayDiff > 1 && dayDiff < 7) {
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' })
    return `${weekday} · ${time}`
  }
  const dayMonth = d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
  return `${dayMonth}`
}

// ScheduleWeekCard — week strip with breathing today indicator + day
// tooltips, plus a "next up" preview row that surfaces the actual
// queue rather than just the count.
//
// Today's day cell gets a BreathingDot above it. Hovering any day shows
// a tooltip. The bottom of the card now lists the next 1-2 scheduled
// posts inline — was previously just `12 queued · 3 live` and forced a
// /schedule round-trip to see anything actionable.
export function ScheduleWeekCard({
  scheduled,
  published,
  workspaceId,
  upcoming,
}: {
  scheduled: number
  published: number
  workspaceId: string
  upcoming: UpcomingPost[]
}) {
  const today = new Date()
  // Locale-aware week start. Some users get a Sunday-first week, most
  // get Monday-first. JS Date.getDay() returns 0=Sun..6=Sat — we shift
  // it so Monday=0..Sunday=6 to match the European default the app
  // ships with.
  const dayIdx = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayIdx)
  // Full week: Mon..Sun (7 cells). The previous version emitted only 6
  // and silently dropped Sunday — broken on every Sunday view.
  const days = Array.from({ length: 7 }, (_, i) => {
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

      <div ref={containerRef} className="relative grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          return (
            <div
              key={i}
              // No `cursor-pointer`: each day cell is a hover-tooltip
              // host, not a click target. The whole card is wrapped in
              // a Link, so the implicit cursor inherited from the Link
              // (`pointer`) is correct everywhere — we just don't add
              // a misleading second pointer at the cell level.
              className="flex flex-col items-center gap-1.5"
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

      {/* Footer: either the next-up preview list (when posts are
          queued) or a small empty state nudge. Counter chip moves to
          the right of the eyebrow row above so the footer real-estate
          is reserved for actionable content. */}
      {upcoming.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {upcoming.map((post) => (
            <li
              key={post.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors duration-150 group-hover:bg-[rgba(15,15,15,0.04)]"
              style={{ background: 'rgba(255,255,255,0.55)' }}
            >
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: PLATFORM_DOT[post.platform] ?? PALETTE.charcoal,
                }}
              />
              <span
                className="min-w-0 flex-1 truncate text-[12px] font-semibold"
                style={{ color: PALETTE.ink }}
              >
                {post.contentTitle ?? 'Untitled draft'}
              </span>
              <span
                className="shrink-0 text-[10px] tabular-nums"
                style={{
                  color: PALETTE.inkSoft,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {formatRelativeWhen(post.scheduledFor)} · {PLATFORM_LABEL[post.platform] ?? post.platform}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="flex items-center gap-2 rounded-lg px-2 py-2.5"
          style={{ background: 'rgba(255,255,255,0.55)', color: PALETTE.inkSoft }}
        >
          <Inbox className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="text-[11.5px] font-medium">
            Nothing queued.{' '}
            <span style={{ color: PALETTE.ink }}>Approve something</span> and it lands here.
          </span>
        </div>
      )}

      <div
        className="flex items-center justify-between text-[10.5px]"
        style={{
          color: PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        <span className="tabular-nums">
          {scheduled} queued · {published} live
        </span>
        <span
          className="flex items-center gap-1 text-[12px] font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
          style={{ color: PALETTE.ink, fontFamily: 'var(--font-inter)' }}
        >
          Open <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
