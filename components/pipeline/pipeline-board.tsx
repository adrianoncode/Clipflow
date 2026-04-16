'use client'

import { useState } from 'react'

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

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const items = grouped[col.state]
          return (
            <div key={col.state} className="flex flex-col gap-3">
              {/* Column header */}
              <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotClass}`} />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    {col.label}
                  </span>
                  <span className="ml-auto rounded-full bg-background/80 px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div
                  className={`mt-2 h-0.5 w-full rounded-full bg-gradient-to-r to-transparent ${col.accentClass}`}
                  aria-hidden
                />
              </div>

              {/* Cards */}
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 bg-transparent p-6 text-center">
                  <p className="text-[11px] text-muted-foreground/50">—</p>
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
