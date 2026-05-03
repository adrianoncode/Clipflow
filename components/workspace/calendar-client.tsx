'use client'

import Link from 'next/link'
import { useState, useTransition, useCallback } from 'react'
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react'

import { AutoDistributeButton } from '@/components/scheduler/auto-distribute-button'
import { TimezoneLabel } from '@/components/workspace/timezone-label'
import {
  PLATFORM_LABELS,
  PLATFORM_SOLID_COLORS as PLATFORM_COLORS,
  PLATFORM_SOFT_COLORS as PLATFORM_BG,
} from '@/lib/platforms'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScheduledPost {
  id: string
  platform: string
  scheduled_for: string
  status: string
  output_id: string
  platform_post_id: string | null
  outputs: {
    body: string | null
    content_items: { title: string | null } | null
  } | null
  metadata?: Record<string, unknown> | null
}

interface UnscheduledOutput {
  id: string
  platform: string
  body: string | null
  contentTitle: string | null
  latestState: string
}

interface CalendarClientProps {
  workspaceId: string
  /** IANA TZ for this workspace. Surfaced as a label so multi-team
   *  users know whose clock the schedule runs on. */
  workspaceTimezone: string
  scheduledPosts: ScheduledPost[]
  unscheduledOutputs: UnscheduledOutput[]
  quickScheduleAction: (fd: FormData) => Promise<unknown>
  reschedulePostAction: (fd: FormData) => Promise<unknown>
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

function formatStatNum(n: number | undefined): string {
  if (n === undefined || n === null) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CalendarClient({
  workspaceId,
  workspaceTimezone,
  scheduledPosts,
  unscheduledOutputs,
  quickScheduleAction,
  reschedulePostAction,
}: CalendarClientProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dragOverDay, setDragOverDay] = useState<number | null>(null)
  // Days the user expanded by clicking +N — those cells render the
  // full pill list instead of the 3-cap. Stored as a Set so multiple
  // days can be expanded simultaneously without resetting on next click.
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())
  const [isPending, startTransition] = useTransition()

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfWeek(year, month)

  // Build day → posts map
  const postsByDay = new Map<number, ScheduledPost[]>()
  for (const post of scheduledPosts) {
    const postDate = new Date(post.scheduled_for)
    if (postDate.getFullYear() === year && postDate.getMonth() === month) {
      const day = postDate.getDate()
      const existing = postsByDay.get(day) ?? []
      postsByDay.set(day, [...existing, post])
    }
  }

  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear()

  const goToPrevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11) } else { setMonth(month - 1) }
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0) } else { setMonth(month + 1) }
    setSelectedDay(null)
  }

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' })
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7
  const selectedPosts = selectedDay ? (postsByDay.get(selectedDay) ?? []) : []

  // ── Drag handlers ───────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, type: 'output' | 'post', id: string, platform: string) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ type, id, platform }))
      e.dataTransfer.effectAllowed = 'move'
    },
    [],
  )

  const handleDragOver = useCallback((e: React.DragEvent, dayNumber: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDay(dayNumber)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverDay(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, dayNumber: number) => {
      e.preventDefault()
      setDragOverDay(null)

      let payload: { type: string; id: string; platform: string }
      try {
        payload = JSON.parse(e.dataTransfer.getData('text/plain'))
      } catch {
        return
      }

      // Default to 10:00 AM
      const scheduledFor = new Date(year, month, dayNumber, 10, 0, 0).toISOString()

      startTransition(() => {
        const fd = new FormData()
        fd.set('workspace_id', workspaceId)
        fd.set('scheduled_for', scheduledFor)

        if (payload.type === 'output') {
          fd.set('output_id', payload.id)
          fd.set('platform', payload.platform)
          quickScheduleAction(fd)
        } else if (payload.type === 'post') {
          fd.set('post_id', payload.id)
          reschedulePostAction(fd)
        }
      })
    },
    [year, month, workspaceId, quickScheduleAction, reschedulePostAction, startTransition],
  )

  // ── Stats helper for post metadata ──────────────────────────────────────

  function renderPostStats(post: ScheduledPost) {
    const meta = post.metadata as Record<string, unknown> | null | undefined
    if (!meta || post.status !== 'published') return null
    const views = typeof meta.views === 'number' ? meta.views : undefined
    const likes = typeof meta.likes === 'number' ? meta.likes : undefined
    const comments = typeof meta.comments === 'number' ? meta.comments : undefined
    const shares = typeof meta.shares === 'number' ? meta.shares : undefined
    if (views === undefined && likes === undefined) return null

    return (
      <div className="mt-2 flex flex-wrap gap-2 text-[10px]" style={{ color: '#7A7468' }}>
        {views !== undefined && (
          <span className="inline-flex items-center gap-0.5">
            <Eye className="h-3 w-3" /> {formatStatNum(views)}
          </span>
        )}
        {likes !== undefined && (
          <span className="inline-flex items-center gap-0.5">
            <Heart className="h-3 w-3" /> {formatStatNum(likes)}
          </span>
        )}
        {comments !== undefined && (
          <span className="inline-flex items-center gap-0.5">
            <MessageCircle className="h-3 w-3" /> {formatStatNum(comments)}
          </span>
        )}
        {shares !== undefined && (
          <span className="inline-flex items-center gap-0.5">
            <Share2 className="h-3 w-3" /> {formatStatNum(shares)}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={goToPrevMonth}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[rgba(15,15,15,0.04)]"
            style={{ border: '1px solid rgba(15,15,15,0.14)' }}
          >
            <span style={{ color: '#0F0F0F', fontSize: 14 }}>&lsaquo;</span>
          </button>
          <h1
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: 24,
              fontWeight: 400,
              color: '#0F0F0F',
              letterSpacing: '-0.01em',
            }}
          >
            {monthName} {year}
          </h1>
          <button
            onClick={goToNextMonth}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[rgba(15,15,15,0.04)]"
            style={{ border: '1px solid rgba(15,15,15,0.14)' }}
          >
            <span style={{ color: '#0F0F0F', fontSize: 14 }}>&rsaquo;</span>
          </button>
          <button
            onClick={() => {
              setYear(today.getFullYear())
              setMonth(today.getMonth())
              setSelectedDay(null)
            }}
            className="ml-1 rounded-full px-3.5 py-1 text-[11px] font-bold transition-colors hover:scale-[1.02]"
            style={{
              background: '#F4D93D',
              color: '#0F0F0F',
              border: '1px solid rgba(15,15,15,0.10)',
            }}
          >
            Today
          </button>
          <TimezoneLabel workspaceTimezone={workspaceTimezone} />
        </div>
        <Link
          href={`/workspace/${workspaceId}/schedule`}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-bold transition-all hover:scale-[1.02]"
          style={{
            background: '#0F0F0F',
            color: '#F4D93D',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 14px -6px rgba(15,15,15,0.4)',
          }}
        >
          + Schedule new
        </Link>
      </div>

      {isPending && (
        <div
          className="rounded-[14px] px-4 py-2.5 text-[12px] font-semibold"
          style={{
            background: 'rgba(244,217,61,0.15)',
            border: '1px solid rgba(244,217,61,0.3)',
            color: '#0F0F0F',
          }}
        >
          Updating schedule…
        </div>
      )}

      {unscheduledOutputs.length > 0 && scheduledPosts.length === 0 && (
        <div
          className="flex items-center gap-3 rounded-[16px] px-4 py-3"
          style={{
            background: '#FFFDF8',
            border: '1px solid rgba(15,15,15,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          <span className="text-lg">👆</span>
          <p className="text-[12px]" style={{ color: '#3A3A3A' }}>
            <span className="font-semibold" style={{ color: '#0F0F0F' }}>How to schedule: </span>
            Drag an approved draft from the sidebar onto any date. It schedules at 10:00 AM — drag to move.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ── Unscheduled sidebar ─────────────────────────────────────── */}
        <div className="w-full shrink-0 xl:w-64">
          <div
            className="rounded-[20px] p-3.5"
            style={{
              background: '#FFFDF8',
              border: '1px solid rgba(15,15,15,0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
            }}
          >
            <h2 className="mb-3 text-[13px] font-semibold" style={{ color: '#0F0F0F' }}>
              Unscheduled
              {unscheduledOutputs.length > 0 && (
                <span
                  className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                  style={{ background: '#F4D93D', color: '#0F0F0F' }}
                >
                  {unscheduledOutputs.length}
                </span>
              )}
            </h2>

            {/* One-click distribute — picks platform-default best times
                (Tuesday 8:30am for LinkedIn, Thursday 6pm for Shorts,
                etc.) and inserts scheduled_posts rows for each draft.
                Faster than dragging 8 cards onto the grid one at a
                time, and respects per-platform cadence caps. */}
            {unscheduledOutputs.length > 0 && (
              <div className="mb-3">
                <AutoDistributeButton
                  workspaceId={workspaceId}
                  count={unscheduledOutputs.length}
                />
              </div>
            )}

            {unscheduledOutputs.length === 0 ? (
              <p className="text-[12px]" style={{ color: '#7A7468' }}>
                No approved drafts waiting. Approve drafts first, then drag them here to schedule.
              </p>
            ) : (
              <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {unscheduledOutputs.map((output) => (
                  <li
                    key={output.id}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, 'output', output.id, output.platform)
                    }
                    className="cursor-grab rounded-[14px] p-2.5 text-[12px] transition-all hover:shadow-sm active:cursor-grabbing active:shadow-md"
                    style={{
                      background: '#FAF7F2',
                      border: '1px solid rgba(15,15,15,0.06)',
                    }}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={[
                          'rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                          PLATFORM_COLORS[output.platform] ?? 'bg-gray-500 text-white',
                        ].join(' ')}
                      >
                        {PLATFORM_LABELS[output.platform] ?? output.platform}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}
                      >
                        {output.latestState}
                      </span>
                    </div>
                    <p className="font-medium line-clamp-1" style={{ color: '#0F0F0F' }}>
                      {output.contentTitle ?? 'Untitled'}
                    </p>
                    {output.body && (
                      <p className="mt-0.5 line-clamp-2" style={{ color: '#7A7468' }}>
                        {output.body.slice(0, 80)}
                        {output.body.length > 80 ? '…' : ''}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px]" style={{ color: 'rgba(15,15,15,0.3)' }}>
                      Drag onto a date to schedule
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Calendar grid + detail panel ────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-semibold uppercase"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    letterSpacing: '0.12em',
                    color: '#7A7468',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const dayNumber = idx - firstDayOffset + 1
                const isCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth
                const dayPosts = isCurrentMonth ? (postsByDay.get(dayNumber) ?? []) : []
                const isSelected = isCurrentMonth && dayNumber === selectedDay
                const todayCell = isCurrentMonth && isToday(dayNumber)
                const isDragTarget = isCurrentMonth && dayNumber === dragOverDay

                const toggleDay = () => {
                  if (!isCurrentMonth) return
                  setSelectedDay(dayNumber === selectedDay ? null : dayNumber)
                }

                return (
                  <div
                    key={idx}
                    // Native <button> would kill drag-and-drop (buttons
                    // don't receive drop events reliably across browsers).
                    // Instead: role="gridcell" semantics + tabIndex + an
                    // explicit keydown handler so keyboard users can
                    // select days with Enter/Space.
                    role={isCurrentMonth ? 'gridcell' : undefined}
                    tabIndex={isCurrentMonth ? 0 : -1}
                    aria-selected={isSelected ? true : undefined}
                    aria-label={
                      isCurrentMonth
                        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(
                            dayNumber,
                          ).padStart(2, '0')}${todayCell ? ' — today' : ''}`
                        : undefined
                    }
                    onClick={toggleDay}
                    onKeyDown={(e) => {
                      if (!isCurrentMonth) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleDay()
                      }
                    }}
                    onDragOver={
                      isCurrentMonth ? (e) => handleDragOver(e, dayNumber) : undefined
                    }
                    onDragLeave={isCurrentMonth ? handleDragLeave : undefined}
                    onDrop={
                      isCurrentMonth ? (e) => handleDrop(e, dayNumber) : undefined
                    }
                    className={[
                      'relative min-h-[72px] rounded-[14px] p-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2',
                      isCurrentMonth
                        ? 'cursor-pointer hover:bg-[rgba(15,15,15,0.03)]'
                        : 'pointer-events-none opacity-0',
                      isSelected ? 'ring-2 ring-[#0F0F0F]' : '',
                      isDragTarget ? 'ring-2 ring-[#F4D93D]' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      background: isDragTarget
                        ? 'rgba(244,217,61,0.08)'
                        : todayCell
                          ? 'rgba(244,217,61,0.12)'
                          : isCurrentMonth
                            ? '#FFFDF8'
                            : undefined,
                      border: todayCell
                        ? '1px solid rgba(244,217,61,0.5)'
                        : isCurrentMonth
                          ? '1px solid rgba(15,15,15,0.06)'
                          : 'none',
                    }}
                  >
                    {isCurrentMonth && (
                      <>
                        <span
                          className="text-[11px] tabular-nums"
                          style={{
                            fontFamily: 'var(--font-jetbrains-mono), monospace',
                            fontWeight: todayCell ? 700 : 500,
                            color: todayCell ? '#0F0F0F' : '#3A3A3A',
                          }}
                        >
                          {dayNumber}
                        </span>
                        {dayPosts.length > 0 && (() => {
                          const isExpanded = expandedDays.has(dayNumber)
                          const visiblePosts = isExpanded
                            ? dayPosts
                            : dayPosts.slice(0, 3)
                          return (
                            <div className="mt-1 flex flex-wrap gap-0.5">
                              {visiblePosts.map((post) => (
                                <span
                                  key={post.id}
                                  draggable={post.status === 'scheduled'}
                                  onDragStart={
                                    post.status === 'scheduled'
                                      ? (e) => {
                                          e.stopPropagation()
                                          handleDragStart(e, 'post', post.id, post.platform)
                                        }
                                      : undefined
                                  }
                                  className={[
                                    'inline-block rounded px-1 py-0.5 text-[10px] font-medium leading-none',
                                    PLATFORM_BG[post.platform] ?? 'bg-gray-100 text-gray-700',
                                    post.status === 'scheduled' ? 'cursor-grab active:cursor-grabbing' : '',
                                  ].join(' ')}
                                >
                                  {PLATFORM_LABELS[post.platform] ?? post.platform}
                                </span>
                              ))}
                              {dayPosts.length > 3 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    // Stop propagation so the day-cell
                                    // click handler doesn't also fire
                                    // (which would open the day detail
                                    // panel and lose the expand state).
                                    e.stopPropagation()
                                    setExpandedDays((prev) => {
                                      const nextSet = new Set(prev)
                                      if (nextSet.has(dayNumber)) {
                                        nextSet.delete(dayNumber)
                                      } else {
                                        nextSet.add(dayNumber)
                                      }
                                      return nextSet
                                    })
                                  }}
                                  aria-expanded={isExpanded}
                                  aria-label={
                                    isExpanded
                                      ? 'Collapse day pills'
                                      : `Show all ${dayPosts.length} posts for this day`
                                  }
                                  className="inline-block rounded bg-muted px-1 py-0.5 text-[10px] font-medium leading-none text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
                                >
                                  {isExpanded ? '−' : `+${dayPosts.length - 3}`}
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Platform legend */}
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(PLATFORM_BG).map(([platform, cls]) => (
                <span
                  key={platform}
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${cls}`}
                >
                  {PLATFORM_LABELS[platform] ?? platform}
                </span>
              ))}
            </div>
          </div>

          {/* ── Detail side panel ──────────────────────────────────────── */}
          {selectedDay !== null && (
            <div
              className="w-full rounded-[20px] p-4 lg:w-72"
              style={{
                background: '#FFFDF8',
                border: '1px solid rgba(15,15,15,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  style={{
                    fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                    fontSize: 18,
                    fontWeight: 400,
                    color: '#0F0F0F',
                  }}
                >
                  {monthName} {selectedDay}
                </h2>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-[rgba(15,15,15,0.06)]"
                  style={{ color: '#7A7468', fontSize: 14 }}
                >
                  &times;
                </button>
              </div>

              {selectedPosts.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-[13px]" style={{ color: '#7A7468' }}>No posts scheduled.</p>
                  <p className="text-[11px]" style={{ color: 'rgba(15,15,15,0.35)' }}>
                    Drag an approved output here to schedule it.
                  </p>
                  <Link
                    href={`/workspace/${workspaceId}/schedule`}
                    className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition hover:scale-[1.02]"
                    style={{ background: '#0F0F0F', color: '#F4D93D' }}
                  >
                    + Schedule post
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectedPosts.map((post) => {
                    const time = new Date(post.scheduled_for).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    const title = post.outputs?.content_items?.title ?? 'Untitled'
                    const body = post.outputs?.body ?? ''

                    return (
                      <li
                        key={post.id}
                        className="rounded-[14px] p-3 text-[12px]"
                        style={{
                          background: '#FAF7F2',
                          border: '1px solid rgba(15,15,15,0.06)',
                        }}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={[
                              'rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                              PLATFORM_COLORS[post.platform] ?? 'bg-gray-500 text-white',
                            ].join(' ')}
                          >
                            {PLATFORM_LABELS[post.platform] ?? post.platform}
                          </span>
                          <span style={{ color: '#7A7468' }}>{time}</span>
                          <span
                            className="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background:
                                post.status === 'published'
                                  ? 'rgba(16,185,129,0.1)'
                                  : post.status === 'failed'
                                    ? 'rgba(239,68,68,0.1)'
                                    : 'rgba(15,15,15,0.06)',
                              color:
                                post.status === 'published'
                                  ? '#059669'
                                  : post.status === 'failed'
                                    ? '#DC2626'
                                    : '#7A7468',
                            }}
                          >
                            {post.status}
                          </span>
                        </div>
                        <p className="font-medium line-clamp-1" style={{ color: '#0F0F0F' }}>{title}</p>
                        {body && (
                          <p className="mt-1 line-clamp-2" style={{ color: '#7A7468' }}>{body}</p>
                        )}
                        {renderPostStats(post)}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
