'use client'

import Link from 'next/link'
import { useState } from 'react'

interface CalendarClientProps {
  workspaceId: string
  scheduledPosts: Array<{
    id: string
    platform: string
    scheduled_for: string
    status: string
    outputs: { body: string | null; content_items: { title: string | null } | null } | null
  }>
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500 text-white',
  instagram: 'bg-purple-500 text-white',
  linkedin: 'bg-blue-600 text-white',
  youtube: 'bg-red-500 text-white',
}

const PLATFORM_BG: Record<string, string> = {
  tiktok: 'bg-pink-100 text-pink-800',
  instagram: 'bg-purple-100 text-purple-800',
  linkedin: 'bg-blue-100 text-blue-800',
  youtube: 'bg-red-100 text-red-800',
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  // getDay() returns 0=Sun, 1=Mon...6=Sat — convert to Mon=0
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

export function CalendarClient({ workspaceId, scheduledPosts }: CalendarClientProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOffset = getFirstDayOfWeek(year, month)

  // Build a map: day number → posts
  const postsByDay = new Map<number, typeof scheduledPosts>()
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
    if (month === 0) {
      setYear(year - 1)
      setMonth(11)
    } else {
      setMonth(month - 1)
    }
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    if (month === 11) {
      setYear(year + 1)
      setMonth(0)
    } else {
      setMonth(month + 1)
    }
    setSelectedDay(null)
  }

  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long' })

  // Total cells: offset + days, rounded up to multiple of 7
  const totalCells = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7

  const selectedPosts = selectedDay ? (postsByDay.get(selectedDay) ?? []) : []

  return (
    <div className="flex min-h-full flex-col gap-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm hover:bg-accent"
          >
            ‹
          </button>
          <h1 className="text-xl font-semibold">
            {monthName} {year}
          </h1>
          <button
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-md border text-sm hover:bg-accent"
          >
            ›
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
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Schedule new
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Calendar grid */}
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

              return (
                <button
                  key={idx}
                  onClick={() => isCurrentMonth && setSelectedDay(dayNumber === selectedDay ? null : dayNumber)}
                  disabled={!isCurrentMonth}
                  className={[
                    'relative min-h-[72px] rounded-md border p-1 text-left transition-colors',
                    isCurrentMonth ? 'cursor-pointer hover:bg-accent/50' : 'opacity-0 pointer-events-none',
                    todayCell ? 'bg-accent border-primary' : 'bg-background',
                    isSelected ? 'ring-2 ring-primary' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCurrentMonth && (
                    <>
                      <span
                        className={[
                          'text-xs font-medium',
                          todayCell ? 'text-primary font-bold' : 'text-foreground',
                        ].join(' ')}
                      >
                        {dayNumber}
                      </span>
                      {dayPosts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-0.5">
                          {dayPosts.slice(0, 3).map((post) => (
                            <span
                              key={post.id}
                              className={[
                                'inline-block rounded px-1 py-0.5 text-[10px] leading-none font-medium',
                                PLATFORM_BG[post.platform] ?? 'bg-gray-100 text-gray-700',
                              ].join(' ')}
                            >
                              {post.platform}
                            </span>
                          ))}
                          {dayPosts.length > 3 && (
                            <span className="inline-block rounded bg-muted px-1 py-0.5 text-[10px] leading-none text-muted-foreground">
                              +{dayPosts.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Platform legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(PLATFORM_BG).map(([platform, cls]) => (
              <span key={platform} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
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
                ✕
              </button>
            </div>

            {selectedPosts.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">No posts scheduled.</p>
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
                          {post.platform}
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
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
