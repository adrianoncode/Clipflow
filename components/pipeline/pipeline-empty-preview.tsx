'use client'

/**
 * Mini kanban-board preview shown inside the Pipeline empty state.
 * Mocks the three real columns (Draft / Review / Approved) with
 * realistic-looking cards so the user immediately sees how their
 * drafts will flow once they import their first video. Mirrors
 * COLUMN_CONFIG in app/(app)/workspace/[id]/pipeline/page.tsx so
 * an empty-board user doesn't see a "Published" column they'll
 * never find on the real board.
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
    label: 'Ready to review',
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
]

export function PipelineEmptyPreview() {
  return (
    <div
      aria-hidden
      className="cf-pipeline-preview relative grid grid-cols-1 gap-2 rounded-2xl border border-border/60 p-2 sm:grid-cols-3"
      style={{
        background:
          'linear-gradient(180deg, #FFFDF8 0%, #F3EDE3 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(15,15,15,.04), 0 14px 32px -18px rgba(15,15,15,.18)',
      }}
    >
      {/* Top-edge hairline highlight, same trick as the dashboard hero. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(15,15,15,.32), transparent)',
        }}
      />
      {COLUMNS.map((col, colIdx) => {
        const isApproved = col.label === 'Approved'
        return (
          <div
            key={col.label}
            className="relative rounded-xl p-2"
            style={
              isApproved
                ? {
                    background:
                      'linear-gradient(180deg, rgba(214,255,62,.10) 0%, rgba(214,255,62,.02) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(214,255,62,.30)',
                  }
                : {
                    background: 'rgba(15,15,15,.03)',
                    boxShadow: 'inset 0 0 0 1px rgba(15,15,15,.06)',
                  }
            }
          >
            <div className="mb-1.5 flex items-center gap-1.5 px-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${col.dot}`}
                aria-hidden
              />
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {col.label}
              </span>
              <span
                className="lv2-tabular ml-auto rounded-full px-1.5 py-px text-[10px] font-bold"
                style={{
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  background: isApproved
                    ? 'rgba(214,255,62,.30)'
                    : 'rgba(255,255,255,.85)',
                  color: isApproved ? '#1a2000' : '#5f5850',
                }}
              >
                {col.cards.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {col.cards.map((c, i) => {
                const isFirstCardOfFirstColumn = colIdx === 0 && i === 0
                return (
                  <div
                    key={i}
                    className={`relative rounded-lg border border-border/50 bg-card px-2 py-1.5 ${
                      isFirstCardOfFirstColumn ? 'cf-pipeline-preview-card-active' : ''
                    }`}
                    style={{
                      boxShadow:
                        '0 1px 0 rgba(255,255,255,.55) inset, 0 1px 2px rgba(24,21,17,.04)',
                    }}
                  >
                    <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
                      {c.title}
                    </p>
                    <span
                      className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]"
                      style={{
                        background:
                          isApproved
                            ? '#F4D93D'
                            : 'rgba(15,15,15,.08)',
                        color: isApproved ? '#1a2000' : '#0F0F0F',
                      }}
                    >
                      {c.tag}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <style jsx>{`
        /* The first card on the leftmost column lifts on a slow loop —
           subtle "drag-me" affordance so the eye reads the kanban as
           interactive, not a static snapshot. */
        @keyframes cf-pipeline-card-pulse {
          0%,
          100% {
            transform: translateY(0);
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.55) inset,
              0 1px 2px rgba(24, 21, 17, 0.04);
          }
          50% {
            transform: translateY(-2px);
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.7) inset,
              0 0 0 1px rgba(214, 255, 62, 0.35),
              0 8px 18px -8px rgba(15, 15, 15, 0.2);
          }
        }
        .cf-pipeline-preview-card-active {
          animation: cf-pipeline-card-pulse 3.2s
            cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-pipeline-preview-card-active {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
