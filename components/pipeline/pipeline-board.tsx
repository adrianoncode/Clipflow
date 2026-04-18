'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

import { PipelineCard } from '@/components/pipeline/pipeline-card'
import { PipelineBulkBar } from '@/components/pipeline/pipeline-bulk-bar'
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
  state: PipelineStateKey
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

export function PipelineBoard({ workspaceId, columns, grouped }: PipelineBoardProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleColumn(state: PipelineStateKey) {
    const items = grouped[state]
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
    const allIds = Object.values(grouped).flatMap((items) => items.map((i) => i.id))
    setSelected(new Set(allIds))
  }

  const totalItems = Object.values(grouped).reduce((sum, items) => sum + items.length, 0)

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
            const count = grouped[state].length
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const items = grouped[col.state]
          const columnIds = items.map((i) => i.id)
          const allColumnSelected = items.length > 0 && columnIds.every((id) => selected.has(id))
          const someColumnSelected = items.length > 0 && columnIds.some((id) => selected.has(id))

          return (
            <div key={col.state} className="flex flex-col gap-3">
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
                          ? 'border-primary bg-primary text-primary-foreground'
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
                      selected={selected.has(output.id)}
                      onToggleSelect={() => toggle(output.id)}
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
      />
    </>
  )
}
