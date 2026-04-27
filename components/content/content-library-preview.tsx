import { CheckCircle2, FileText, Loader2, Youtube } from 'lucide-react'

/**
 * Static stand-in shown inside the Content library empty state so the
 * user immediately sees what populated rows will look like — title,
 * source icon, status pill, relative timestamp. No real data, no DB
 * call, just a high-fidelity preview that does the explaining a
 * generic empty-state cannot.
 */

const ROWS = [
  {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-700',
    title: 'Q3 Strategy Sync — Loom recording',
    meta: 'Video · 12 drafts ready · 4 h ago',
    badge: { label: 'Ready', tone: 'emerald' as const },
  },
  {
    icon: Youtube,
    iconBg: 'bg-red-100 text-red-700',
    title: 'How we cut churn 23 % — YouTube interview',
    meta: 'Imported · transcribing · just now',
    badge: { label: 'In progress', tone: 'amber' as const },
  },
  {
    icon: FileText,
    iconBg: 'bg-zinc-100 text-zinc-700',
    title: 'Founder reflection — pasted notes',
    meta: 'Text · 6 drafts ready · yesterday',
    badge: { label: 'Ready', tone: 'emerald' as const },
  },
]

const TONE_CLASS: Record<'emerald' | 'amber', string> = {
  emerald: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
}

export function ContentLibraryPreview() {
  return (
    <div className="rounded-2xl border bg-background p-2 shadow-sm">
      <ul className="divide-y divide-border/60">
        {ROWS.map((row, i) => {
          const Icon = row.icon
          return (
            <li
              key={i}
              className="flex items-center gap-3 px-3 py-3"
              aria-hidden
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.iconBg}`}
              >
                {row.badge.label === 'In progress' ? (
                  <Loader2 className="h-4 w-4 animate-spin opacity-80" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {row.title}
                </p>
                <p className="truncate text-[11.5px] text-muted-foreground">
                  {row.meta}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] ${TONE_CLASS[row.badge.tone]}`}
              >
                {row.badge.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
