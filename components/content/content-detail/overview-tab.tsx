'use client'

import Link from 'next/link'
import { ArrowRight, Layers, Wand2 } from 'lucide-react'

import { CollapsibleTranscript } from './shared'
import type { ContentItemRow } from '@/lib/content/get-content-item'

interface OverviewTabProps {
  item: ContentItemRow
  workspaceId: string
  hasExistingOutputs: boolean
  outputCount: number
  meta: Record<string, unknown> | null
  wordCount: number
  isReady: boolean
}

export function OverviewTab({
  item,
  workspaceId,
  hasExistingOutputs,
  outputCount,
  meta,
  wordCount,
  isReady,
}: OverviewTabProps) {
  const durationSeconds =
    meta && typeof meta.duration_seconds === 'number' ? meta.duration_seconds : null

  return (
    <div className="space-y-6">
      {/* What's Next: Generate drafts CTA */}
      {isReady && !hasExistingOutputs && (
        <Link
          href={`/workspace/${workspaceId}/content/${item.id}/outputs`}
          className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
        >
          <div
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10"
          >
            <Wand2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              Ready! Generate drafts for 4 platforms
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Create TikTok, Instagram, YouTube &amp; LinkedIn drafts in one pass.
            </p>
          </div>
          <span className="cf-btn-3d cf-btn-3d-primary inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs">
            Generate
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </span>
        </Link>
      )}

      {/* What's Next: Drafts-review link */}
      {isReady && hasExistingOutputs && outputCount > 0 && (
        <Link
          href={`/workspace/${workspaceId}/pipeline`}
          className="group flex items-center gap-4 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/50 to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"
          >
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              You have {outputCount} draft{outputCount !== 1 ? 's' : ''} ready
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Review them, approve the best ones, and schedule them.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-700 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
            Review drafts
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
      )}

      <CollapsibleTranscript
        text={item.transcript!}
        workspaceId={workspaceId}
        contentId={item.id}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Type
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {item.kind === 'video'
              ? 'Video / Audio'
              : item.kind === 'youtube'
                ? 'YouTube'
                : item.kind === 'url'
                  ? 'Website'
                  : 'Text'}
          </p>
        </div>
        {durationSeconds !== null && (
          <div className="rounded-xl border border-border/50 bg-card p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {Math.floor(durationSeconds / 60)}m {Math.round(durationSeconds % 60)}s
            </p>
          </div>
        )}
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Words
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {wordCount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Created
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">
            {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {hasExistingOutputs && outputCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Layers className="h-3 w-3" />
            {outputCount} output{outputCount !== 1 ? 's' : ''} generated
          </span>
        </div>
      )}
    </div>
  )
}
