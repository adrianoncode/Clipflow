/**
 * Mini kanban-board preview shown inside the Pipeline empty state.
 * Mocks the four columns (Draft / Review / Approved / Published) with
 * realistic-looking cards so the user immediately sees how their
 * drafts will flow once they import their first video.
 */

const COLUMNS: Array<{
  label: string
  dot: string
  cards: Array<{ title: string; tag: string }>
}> = [
  {
    label: 'Draft',
    dot: 'bg-zinc-400',
    cards: [
      { title: 'Hook variant — “The 3 metrics…”', tag: 'TikTok' },
      { title: 'Long caption — Q3 sync', tag: 'LinkedIn' },
    ],
  },
  {
    label: 'Review',
    dot: 'bg-amber-400',
    cards: [
      { title: 'Carousel script — onboarding', tag: 'IG' },
    ],
  },
  {
    label: 'Approved',
    dot: 'bg-emerald-400',
    cards: [
      { title: 'Short — “We cut churn 23 %”', tag: 'YT' },
      { title: 'Thread — pricing change', tag: 'X' },
    ],
  },
  {
    label: 'Published',
    dot: 'bg-blue-500',
    cards: [
      { title: 'Reel — founder reflection', tag: 'IG' },
    ],
  },
]

export function PipelineEmptyPreview() {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-background p-2 shadow-sm sm:grid-cols-4">
      {COLUMNS.map((col) => (
        <div key={col.label} className="rounded-xl bg-muted/30 p-2">
          <div className="mb-1.5 flex items-center gap-1.5 px-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} aria-hidden />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              {col.label}
            </span>
            <span
              className="ml-auto rounded-full bg-background px-1.5 py-px text-[10px] font-bold tabular-nums text-muted-foreground"
              style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
            >
              {col.cards.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {col.cards.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card px-2 py-1.5 shadow-[0_1px_0_rgba(24,21,17,0.04)]"
                aria-hidden
              >
                <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
                  {c.title}
                </p>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-primary">
                  {c.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
