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

// Semantic bucket → design-token styling.
// The .lv2-shell palette only admits 4 colors beyond neutral: plum (primary),
// lime-ink (positive), ochre/#A0530B (warn), bordeaux/#9B2018 (danger). Each
// suggestion maps to exactly one bucket so the dashboard stays visually
// calm instead of a seven-color rainbow.
type Tone = 'urgent' | 'warn' | 'info' | 'positive'

const TONE_STYLES: Record<
  Tone,
  { wash: string; iconBg: string; iconColor: string; ring: string }
> = {
  urgent: {
    wash: 'bg-[#F8E3E0]/40',
    iconBg: 'bg-[#F8E3E0]',
    iconColor: 'text-[#9B2018]',
    ring: 'ring-[#9B2018]/15',
  },
  warn: {
    wash: 'bg-[#FBEDD9]/40',
    iconBg: 'bg-[#FBEDD9]',
    iconColor: 'text-[#A0530B]',
    ring: 'ring-[#A0530B]/15',
  },
  info: {
    wash: 'bg-primary/[0.04]',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    ring: 'ring-primary/15',
  },
  positive: {
    wash: 'bg-lime-soft/50',
    iconBg: 'bg-lime-soft',
    iconColor: 'text-lime-ink',
    ring: 'ring-lime-ink/15',
  },
}

const TYPE_TO_TONE: Record<Suggestion['type'], Tone> = {
  posting_gap: 'urgent',
  pipeline_stuck: 'urgent',
  platform_neglected: 'warn',
  content_stale: 'info',
  milestone: 'info',
  recycle: 'positive',
  streak: 'positive',
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
        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
          Smart suggestions
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((suggestion, i) => {
          const styles = TONE_STYLES[TYPE_TO_TONE[suggestion.type]]
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
              {/* Tone wash */}
              <div
                className={`pointer-events-none absolute inset-0 ${styles.wash}`}
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
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#9B2018]" />
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
                <Link href={suggestion.actionHref} className="lv2d-btn-ghost-sm w-full">
                  {suggestion.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
