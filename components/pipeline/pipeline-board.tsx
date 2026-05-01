'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

import { PipelineCard } from '@/components/pipeline/pipeline-card'
import { PipelineBulkBar } from '@/components/pipeline/pipeline-bulk-bar'
import { PipelineReviewDrawer } from '@/components/pipeline/pipeline-review-drawer'
import type { OutputState } from '@/lib/supabase/types'

export type PipelineStateKey = 'draft' | 'review' | 'approved' | 'exported'

export interface PipelineOutputItem {
  id: string
  platform: string
  platformLabel: string
  platformBadgeClass: string
  contentId: string
  contentTitle: string | null
  bodyPreview: string | null
  /** Full output body — used by the side-panel review drawer. The card
   *  grid only renders bodyPreview (truncated); the drawer needs the
   *  complete text without re-fetching. */
  body: string | null
  state: PipelineStateKey
  /** Slice 16 — highest version number recorded in output_versions.
   *  1 = original AI gen (no history yet), 2+ = at least one edit or
   *  regen. Drives the "v2" mono-badge on the card. */
  version: number
  createdAt: string
  formattedDate: string
}

export interface PipelineColumn {
  state: PipelineStateKey
  label: string
  accentClass: string
  dotClass: string
}

/** Per-column hint explaining what the user should DO here */
const COLUMN_HINTS: Record<PipelineStateKey, string> = {
  draft: 'Click "Move to review" on each card, or select + bulk approve',
  review: 'Review these, then click "Approve" on the best ones',
  approved: 'Ready to publish — go to Schedule to pick a date',
  exported: 'Done — these have been published or scheduled',
}

/** Per-column empty state hint */
const COLUMN_EMPTY: Record<PipelineStateKey, string> = {
  draft: 'New drafts land here after you turn a video into posts',
  review: 'Move drafts here when they\u2019re ready for a second look',
  approved: 'Approve your favorites to move them here',
  exported: 'Posts you\u2019ve already sent out live here',
}

interface PipelineBoardProps {
  workspaceId: string
  columns: PipelineColumn[]
  grouped: Record<PipelineStateKey, PipelineOutputItem[]>
}

/**
 * Apply a single optimistic state-flip to the grouped map.
 *
 * Finds the card by id (anywhere across the four columns), removes it
 * from its current column, and inserts it at the head of the target
 * column with `state` updated. Returning a fresh map preserves React's
 * referential-equality contract.
 *
 * If the target state is `exported`, the card is dropped because the
 * board hides that column on the page side; users see the card "leave"
 * the board, which matches the eventual server-side behavior.
 */
function applyOptimisticTransition(
  state: Record<PipelineStateKey, PipelineOutputItem[]>,
  action: { id: string; newState: PipelineStateKey },
): Record<PipelineStateKey, PipelineOutputItem[]> {
  const next: Record<PipelineStateKey, PipelineOutputItem[]> = {
    draft: [...state.draft],
    review: [...state.review],
    approved: [...state.approved],
    exported: [...state.exported],
  }

  let card: PipelineOutputItem | null = null
  for (const key of Object.keys(next) as PipelineStateKey[]) {
    const idx = next[key].findIndex((item) => item.id === action.id)
    if (idx >= 0) {
      card = next[key][idx] ?? null
      next[key].splice(idx, 1)
      break
    }
  }
  if (!card) return state

  const updated: PipelineOutputItem = { ...card, state: action.newState }
  next[action.newState] = [updated, ...next[action.newState]]
  return next
}

export function PipelineBoard({ workspaceId, columns, grouped }: PipelineBoardProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // useOptimistic + useTransition: each card-button transition fires
  // an optimistic state update that moves the card to its new column
  // INSTANTLY, then the server action runs, then router.refresh()
  // pulls fresh data. If the action fails the optimistic state simply
  // expires when refresh lands the new authoritative grouping.
  const [optimisticGrouped, addOptimisticTransition] = useOptimistic(
    grouped,
    applyOptimisticTransition,
  )
  const [, startTransition] = useTransition()

  function markOptimistic(id: string, newState: PipelineStateKey) {
    startTransition(() => {
      addOptimisticTransition({ id, newState })
      // Schedule the server-data resync. The card's own action call
      // happens in parallel — both are wrapped in the transition so
      // React paints the optimistic move first.
      router.refresh()
    })
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleColumn(state: PipelineStateKey) {
    const items = optimisticGrouped[state]
    if (items.length === 0) return
    const columnIds = items.map((i) => i.id)
    const allSelected = columnIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        columnIds.forEach((id) => next.delete(id))
      } else {
        columnIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  function selectAll() {
    const allIds = Object.values(optimisticGrouped).flatMap((items) => items.map((i) => i.id))
    setSelected(new Set(allIds))
  }

  const totalItems = Object.values(optimisticGrouped).reduce((sum, items) => sum + items.length, 0)

  return (
    <>
      {/* Quick select bar — only show when there are items and nothing selected yet */}
      {totalItems > 0 && selected.size === 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          >
            <Check className="h-3 w-3" />
            Select all ({totalItems})
          </button>
          {(['draft', 'review', 'approved'] as const).map((state) => {
            const count = optimisticGrouped[state].length
            if (count === 0) return null
            const labels: Record<string, string> = {
              draft: 'All drafts',
              review: 'All in review',
              approved: 'All approved',
            }
            return (
              <button
                key={state}
                type="button"
                onClick={() => toggleColumn(state)}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
              >
                {labels[state]} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Mobile: horizontal-snap carousel so 4 columns don't stack into
         * a vertical tower of 40+ cards. Each column gets a fixed min
         * width and snaps into view on swipe (Trello-style). sm+ falls
         * back to the regular grid so the layout is flush on larger
         * screens.
         *
         * `-mx-4 px-4 sm:mx-0 sm:px-0` bleeds the edges to the viewport
         * on mobile (so the snap area feels native) but keeps desktop
         * alignment. The gradient edge hint is pure CSS — no JS. */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4"
        role="region"
        aria-label="Drafts by stage"
      >
        {columns.map((col) => {
          const items = grouped[col.state]
          const columnIds = items.map((i) => i.id)
          const allColumnSelected = items.length > 0 && columnIds.every((id) => selected.has(id))
          const someColumnSelected = items.length > 0 && columnIds.some((id) => selected.has(id))

          return (
            <div
              key={col.state}
              className="flex w-[85vw] max-w-[320px] shrink-0 snap-start flex-col gap-3 sm:w-auto sm:max-w-none"
            >
              {/* Column header with select-all checkbox */}
              <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleColumn(col.state)}
                      aria-label={allColumnSelected ? `Deselect all ${col.label}` : `Select all ${col.label}`}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                        allColumnSelected
                          ? 'border-[#0F0F0F] bg-[#0F0F0F] text-[#F4D93D]'
                          : someColumnSelected
                            ? 'border-primary/50 bg-primary/20'
                            : 'border-border/70 bg-background hover:border-primary/40'
                      }`}
                    >
                      {allColumnSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      {someColumnSelected && !allColumnSelected && (
                        <span className="h-1.5 w-1.5 rounded-sm bg-primary" />
                      )}
                    </button>
                  )}
                  <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    {col.label}
                  </span>
                  <span className="ml-auto rounded-full bg-background/80 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                {/* Action hint */}
                <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                  {COLUMN_HINTS[col.state]}
                </p>
                <div
                  className={`mt-1.5 h-0.5 w-full rounded-full bg-gradient-to-r to-transparent ${col.accentClass}`}
                  aria-hidden
                />
              </div>

              {/* Cards */}
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-transparent px-4 py-5 text-center">
                  <p className="text-[11px] text-muted-foreground/50">
                    {COLUMN_EMPTY[col.state]}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map((output) => (
                    <PipelineCard
                      key={output.id}
                      outputId={output.id}
                      workspaceId={workspaceId}
                      contentId={output.contentId}
                      platform={output.platform}
                      platformLabel={output.platformLabel}
                      platformBadgeClass={output.platformBadgeClass}
                      contentTitle={output.contentTitle}
                      bodyPreview={output.bodyPreview}
                      currentState={output.state as OutputState}
                      createdAt={output.createdAt}
                      formattedDate={output.formattedDate}
                      version={output.version}
                      selected={selected.has(output.id)}
                      onToggleSelect={() => toggle(output.id)}
                      onOptimisticTransition={(id, newState) =>
                        markOptimistic(id, newState as PipelineStateKey)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <PipelineBulkBar
        workspaceId={workspaceId}
        selected={selected}
        onClear={() => setSelected(new Set())}
        onOptimisticBulk={(ids, newState) => {
          if (!newState) return
          // Apply each id one-by-one — useOptimistic's reducer is
          // single-action shape, so we dispatch N times. React batches
          // these inside the parent transition.
          startTransition(() => {
            for (const id of ids) {
              addOptimisticTransition({ id, newState })
            }
            router.refresh()
          })
        }}
      />

      <PipelineReviewDrawer
        workspaceId={workspaceId}
        outputs={Object.values(optimisticGrouped).flat()}
      />
    </>
  )
}
