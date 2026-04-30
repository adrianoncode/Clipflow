import Link from 'next/link'
import { CalendarDays, ListChecks, Sparkles } from 'lucide-react'

/**
 * Local view-tabs for the Schedule page (Step 6 in the Create-Section
 * workflow). Only switches between sub-views OF /schedule itself —
 * Calendar, Queue, and Plan. The cross-section "Board" link from the
 * old DraftsTabNav has moved to the global sidebar (Pipeline = Step 5).
 *
 * Stable URLs:
 *   queue     → /workspace/[id]/schedule
 *   calendar  → /workspace/[id]/schedule?view=calendar
 *   plan      → /workspace/[id]/schedule?view=plan
 */
export function ScheduleViewTabs({
  workspaceId,
  current,
  approvedCount,
  scheduledCount,
}: {
  workspaceId: string
  current: 'queue' | 'calendar' | 'plan'
  /** Badge counts — pass when known, omit otherwise. */
  approvedCount?: number
  scheduledCount?: number
}) {
  const tabs = [
    {
      id: 'calendar' as const,
      label: 'Calendar',
      href: `/workspace/${workspaceId}/schedule?view=calendar`,
      Icon: CalendarDays,
      count: approvedCount,
    },
    {
      id: 'queue' as const,
      label: 'Queue',
      href: `/workspace/${workspaceId}/schedule`,
      Icon: ListChecks,
      count: scheduledCount,
    },
    {
      id: 'plan' as const,
      label: 'Plan',
      href: `/workspace/${workspaceId}/schedule?view=plan`,
      Icon: Sparkles,
      count: undefined,
    },
  ]

  return (
    <nav
      aria-label="Schedule views"
      className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-card p-1"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(15,15,15,0.04), 0 6px 14px -8px rgba(15,15,15,0.14)',
      }}
    >
      {tabs.map((t) => {
        const isActive = t.id === current
        const Icon = t.Icon
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={isActive ? 'page' : undefined}
            className={`group relative inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold tracking-tight transition-all ${
              isActive
                ? 'bg-[#0F0F0F] text-[#F4D93D] shadow-sm shadow-[#0F0F0F]/30'
                : 'text-muted-foreground hover:bg-primary/[0.05] hover:text-foreground'
            }`}
            style={{
              fontFamily:
                'var(--font-inter-tight), var(--font-inter), sans-serif',
            }}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
            {typeof t.count === 'number' && t.count > 0 ? (
              <span
                className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ${
                  isActive
                    ? 'bg-[#F4D93D]/15 text-[#F4D93D]'
                    : 'bg-muted-foreground/15 text-muted-foreground/85'
                }`}
              >
                {t.count}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
