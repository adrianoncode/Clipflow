'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarX2,
  Flame,
  PackageOpen,
  Radio,
  Recycle,
  Timer,
  Trophy,
  X,
} from 'lucide-react'
import type { Suggestion } from '@/lib/suggestions/get-suggestions'

const DISMISS_KEY = 'clipflow.dismissed_suggestions'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarX2,
  Flame,
  PackageOpen,
  Radio,
  Recycle,
  Timer,
  Trophy,
}

const TYPE_STYLES: Record<
  Suggestion['type'],
  { gradient: string; iconBg: string; iconColor: string; ring: string }
> = {
  posting_gap: {
    gradient: 'from-red-500/10 via-orange-500/5 to-transparent',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    ring: 'ring-red-200/60',
  },
  platform_neglected: {
    gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    ring: 'ring-amber-200/60',
  },
  content_stale: {
    gradient: 'from-violet-500/10 via-purple-500/5 to-transparent',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    ring: 'ring-violet-200/60',
  },
  pipeline_stuck: {
    gradient: 'from-orange-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    ring: 'ring-orange-200/60',
  },
  recycle: {
    gradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    ring: 'ring-emerald-200/60',
  },
  milestone: {
    gradient: 'from-violet-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    ring: 'ring-violet-200/60',
  },
  streak: {
    gradient: 'from-orange-500/10 via-red-500/5 to-transparent',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    ring: 'ring-orange-200/60',
  },
}

function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { ids: string[]; ts: number }
    // Auto-expire dismissed suggestions after 7 days
    if (Date.now() - parsed.ts > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DISMISS_KEY)
      return new Set()
    }
    return new Set(parsed.ids)
  } catch {
    return new Set()
  }
}

function setDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ ids: [...ids], ts: Date.now() }))
  } catch {
    // localStorage full or unavailable
  }
}

export function SmartSuggestions({ suggestions }: { suggestions: Suggestion[] }) {
  const [dismissed, setDismissedState] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDismissedState(getDismissed())
    setMounted(true)
  }, [])

  const visible = suggestions.filter((s) => !dismissed.has(s.id))
  if (!mounted || visible.length === 0) return null

  function dismiss(id: string) {
    setDismissedState((prev) => {
      const next = new Set(prev)
      next.add(id)
      setDismissed(next)
      return next
    })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Smart suggestions
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((suggestion, i) => {
          const styles = TYPE_STYLES[suggestion.type]
          const Icon = ICON_MAP[suggestion.icon]

          return (
            <div
              key={suggestion.id}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.06]"
              style={{
                animationDelay: `${i * 80}ms`,
                animationFillMode: 'both',
              }}
            >
              {/* Gradient accent strip */}
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-60`}
              />

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => dismiss(suggestion.id)}
                className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-background/80 text-muted-foreground/40 opacity-0 backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
                aria-label="Dismiss suggestion"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="relative flex flex-col gap-3 p-4">
                {/* Icon + priority dot */}
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${styles.iconBg} ${styles.iconColor} ${styles.ring}`}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      {suggestion.priority === 'high' && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      )}
                      <p className="text-[13px] font-semibold leading-tight text-foreground">
                        {suggestion.title}
                      </p>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                </div>

                {/* Action button */}
                <Link
                  href={suggestion.actionHref}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-primary/15 bg-primary/[0.05] py-2 text-[11px] font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/10"
                >
                  {suggestion.actionLabel}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
