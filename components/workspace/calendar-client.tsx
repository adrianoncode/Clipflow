'use client'

import Link from 'next/link'
import { useState, useTransition, useCallback } from 'react'
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react'

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
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
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
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm hover:bg-accent"
          >
            &lsaquo;
          </button>
          <h1 className="text-xl font-semibold">
            {monthName} {year}
          </h1>
          <button
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm hover:bg-accent"
          >
            &rsaquo;
          </button>
          <button
            onClick={() => {
              setYear(today.getFullYear())
              setMonth(today.getMonth())
              setSelectedDay(null)
            }}
            className="ml-1 rounded-md border px-3 py-1 text-xs font-medium hover:bg-accent"
          >
            Today
          </button>
        </div>
        <Link
          href={`/workspace/${workspaceId}/schedule`}
          className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm"
        >
          + Schedule new
        </Link>
      </div>

      {isPending && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-medium text-primary">
          Updating schedule...
        </div>
      )}

      {/* How-to hint for first-time users */}
      {unscheduledOutputs.length > 0 && scheduledPosts.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3">
          <span className="text-lg">👆</span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">How to schedule: </span>
            Grab an approved output from the left panel and drag it onto any date in the calendar. It will be scheduled for 10:00 AM — you can reschedule by dragging it to another date.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* ── Unscheduled sidebar ─────────────────────────────────────── */}
        <div className="w-full shrink-0 xl:w-64">
          <div className="rounded-lg border bg-card p-3">
            <h2 className="mb-3 text-sm font-semibold">
              Unscheduled
              {unscheduledOutputs.length > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {unscheduledOutputs.length}
                </span>
              )}
            </h2>

            {unscheduledOutputs.length === 0 ? (
              <p className="text-xs text-muted-foreground">
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
                    className="cursor-grab rounded-md border bg-background p-2.5 text-xs transition-all hover:shadow-sm active:cursor-grabbing active:shadow-md"
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
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        {output.latestState}
                      </span>
                    </div>
                    <p className="font-medium text-foreground line-clamp-1">
                      {output.contentTitle ?? 'Untitled'}
                    </p>
                    {output.body && (
                      <p className="mt-0.5 text-muted-foreground line-clamp-2">
                        {output.body.slice(0, 80)}
                        {output.body.length > 80 ? '...' : ''}
                      </p>
                    )}
                    <p className="mt-1.5 text-[10px] text-muted-foreground/50">
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
                <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">
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
                      'relative min-h-[72px] rounded-md border p-1 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isCurrentMonth
                        ? 'cursor-pointer hover:bg-accent/50'
                        : 'pointer-events-none opacity-0',
                      todayCell ? 'bg-accent border-primary' : 'bg-background',
                      isSelected ? 'ring-2 ring-primary' : '',
                      isDragTarget
                        ? 'ring-2 ring-primary bg-primary/5 border-primary'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isCurrentMonth && (
                      <>
                        <span
                          className={[
                            'text-xs font-medium',
                            todayCell ? 'font-bold text-primary' : 'text-foreground',
                          ].join(' ')}
                        >
                          {dayNumber}
                        </span>
                        {dayPosts.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {dayPosts.slice(0, 3).map((post) => (
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
                              <span className="inline-block rounded bg-muted px-1 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                                +{dayPosts.length - 3}
                              </span>
                            )}
                          </div>
                        )}
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
            <div className="w-full rounded-lg border bg-card p-4 lg:w-72">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {monthName} {selectedDay}
                </h2>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </div>

              {selectedPosts.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No posts scheduled.</p>
                  <p className="text-xs text-muted-foreground/60">
                    Drag an approved output here to schedule it.
                  </p>
                  <Link
                    href={`/workspace/${workspaceId}/schedule`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
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
                      <li key={post.id} className="rounded-md border bg-background p-3 text-xs">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={[
                              'rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                              PLATFORM_COLORS[post.platform] ?? 'bg-gray-500 text-white',
                            ].join(' ')}
                          >
                            {PLATFORM_LABELS[post.platform] ?? post.platform}
                          </span>
                          <span className="text-muted-foreground">{time}</span>
                          <span
                            className={[
                              'ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium',
                              post.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : post.status === 'failed'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-muted text-muted-foreground',
                            ].join(' ')}
                          >
                            {post.status}
                          </span>
                        </div>
                        <p className="font-medium text-foreground line-clamp-1">{title}</p>
                        {body && (
                          <p className="mt-1 text-muted-foreground line-clamp-2">{body}</p>
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
