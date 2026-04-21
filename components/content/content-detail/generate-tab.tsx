'use client'

import Link from 'next/link'
import { ArrowRight, Layers, Wand2 } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FollowUpTopicsDialog } from '@/components/content/follow-up-topics-dialog'
import { ShowNotesPanel } from '@/components/content/show-notes-panel'
import { NewsletterPanel } from '@/components/content/newsletter-panel'
import { EditorExportPanel } from '@/components/content/editor-export-panel'
import type { ContentItemRow } from '@/lib/content/get-content-item'

interface GenerateTabProps {
  item: ContentItemRow
  workspaceId: string
  hasExistingOutputs: boolean
  outputCount: number
  meta: Record<string, unknown> | null
}

export function GenerateTab({
  item,
  workspaceId,
  hasExistingOutputs,
  outputCount,
  meta,
}: GenerateTabProps) {
  const title = item.title ?? 'Untitled'
  const initialShowNotes = meta?.show_notes ?? null
  const initialNewsletter = meta?.newsletter ?? null
  const srt = typeof meta?.srt === 'string' ? meta.srt : null
  const vtt = typeof meta?.vtt === 'string' ? meta.vtt : null
  const clips = Array.isArray(meta?.best_clips) ? meta.best_clips : null
  const estimatedDurationSec =
    typeof meta?.duration_seconds === 'number' ? meta.duration_seconds : null

  return (
    <div className="space-y-6">
      <Link
        href={`/workspace/${workspaceId}/content/${item.id}/outputs`}
        className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
          <Wand2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            {hasExistingOutputs
              ? 'View & regenerate drafts'
              : 'Generate drafts for 4 platforms'}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {hasExistingOutputs
              ? 'Review your existing drafts or regenerate new ones.'
              : 'Create TikTok, Instagram, YouTube & LinkedIn drafts in one pass.'}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all group-hover:shadow-md">
          {hasExistingOutputs ? 'View' : 'Generate'}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {hasExistingOutputs && outputCount > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Output Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Layers className="h-3 w-3" />
                {outputCount} output{outputCount !== 1 ? 's' : ''}
              </span>
              <Link
                href={`/workspace/${workspaceId}/pipeline`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Review drafts →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <ShowNotesPanel
        workspaceId={workspaceId}
        contentId={item.id}
        initialShowNotes={initialShowNotes}
      />

      <NewsletterPanel
        workspaceId={workspaceId}
        contentId={item.id}
        initialNewsletter={initialNewsletter}
      />

      <FollowUpTopicsDialog workspaceId={workspaceId} contentId={item.id} />

      <EditorExportPanel
        contentId={item.id}
        contentTitle={title}
        transcript={item.transcript ?? ''}
        srt={srt}
        vtt={vtt}
        clips={clips as Array<{
          quote: string
          reason: string
          position_pct: number
          type: string
          estimated_duration: string
        }> | null}
        estimatedDurationSec={estimatedDurationSec}
      />
    </div>
  )
}
