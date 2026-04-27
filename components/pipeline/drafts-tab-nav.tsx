import Link from 'next/link'
import { CalendarDays, KanbanSquare, ListChecks } from 'lucide-react'

/**
 * Three-tab strip that ties Drafts (Board), Calendar, and Queue
 * together into one perceived section. Replaces the old "Schedule"
 * sidebar item — schedule is part of the drafts flow, not a separate
 * destination.
 *
 * Routes the tabs map to:
 *   board    → /workspace/[id]/pipeline
 *   calendar → /workspace/[id]/schedule?view=calendar
 *   queue    → /workspace/[id]/schedule
 *
 * The URLs stay stable (existing bookmarks, deep links, plan-gate
 * redirects all keep working) — only the navigation framing changes.
 */
export function DraftsTabNav({
  workspaceId,
  current,
  approvedCount,
  scheduledCount,
}: {
  workspaceId: string
  current: 'board' | 'calendar' | 'queue'
  /** Optional badge counts. Skip props when you don't have them. */
  approvedCount?: number
  scheduledCount?: number
}) {
  const tabs = [
    {
      id: 'board' as const,
      label: 'Board',
      href: `/workspace/${workspaceId}/pipeline`,
      Icon: KanbanSquare,
      count: undefined,
    },
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
  ]

  return (
    <nav
      aria-label="Drafts views"
      className="inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-card p-1"
      style={{
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(42,26,61,0.04), 0 6px 14px -8px rgba(42,26,61,0.14)',
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
                ? 'bg-foreground text-background shadow-sm shadow-foreground/[0.18]'
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
                    ? 'bg-background/20 text-background'
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
