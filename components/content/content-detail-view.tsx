'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form-message'
import { RetryTranscriptionButton } from '@/components/content/retry-transcription-button'
import { VideoPlayer } from '@/components/content/video-player'
import { AutoGenerateTrigger } from '@/components/content/auto-generate-trigger'
import { DeleteContentButton } from '@/components/content/delete-content-button'
import type { ContentItemRow } from '@/lib/content/get-content-item'
import type { BillingPlan } from '@/lib/billing/plans'
import type { RenderRow } from '@/lib/video/renders/list-renders'
import type { ReviewLinkRow } from '@/lib/review/get-review-links-for-content'
import type { InternalReviewComment } from '@/lib/review/get-review-comments-for-content'

import {
  TabNav,
  type ContentDetailTab,
  readErrorMessage,
} from './content-detail/shared'
import { OverviewTab } from './content-detail/overview-tab'
import { GenerateTab } from './content-detail/generate-tab'
import { ToolsTab } from './content-detail/tools-tab'

interface ContentDetailViewProps {
  item: ContentItemRow
  workspaceId: string
  hasExistingOutputs: boolean
  outputCount?: number
  signedUrl?: string
  /** Long-lived URL for source-context tools (Editor Export needs a URL
   *  that survives past the short-lived player URL). */
  longLivedSourceUrl?: string
  currentPlan: BillingPlan
  /** Source-context data — moved here from /outputs page in the Step 4
   *  page-detox so the per-video page owns everything that's about the
   *  source video, and Outputs stays focused on the per-platform drafts. */
  renders?: RenderRow[]
  reviewLinks?: ReviewLinkRow[]
  reviewComments?: InternalReviewComment[]
  /** Plan-gate for the client-review-link feature. */
  canCreateReviewLink?: boolean
}

/**
 * Orchestrates the content-detail page. Renders the persistent header
 * (title, status, video player, status banners) and delegates tab
 * bodies to `./content-detail/{overview,generate,tools}-tab.tsx`.
 *
 * Split from a 644-line god-component in the refactor commit that
 * extracted the 3 tabs + shared helpers (TabNav, CollapsibleTranscript,
 * ToolCard) into `./content-detail/`.
 */
export function ContentDetailView({
  item,
  workspaceId,
  hasExistingOutputs,
  outputCount = 0,
  signedUrl,
  longLivedSourceUrl,
  currentPlan,
  renders = [],
  reviewLinks = [],
  reviewComments = [],
  canCreateReviewLink = false,
}: ContentDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ContentDetailTab>('overview')
  const isReady = item.status === 'ready'
  const hasTranscript = isReady && !!item.transcript

  const meta =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : null

  const wordCount = item.transcript
    ? item.transcript.split(/\s+/).filter(Boolean).length
    : 0

  // Layout (../layout.tsx) renders the Stepper + Per-Video header + tab
  // nav. This view is the body of the "Source" tab — pure content, no
  // chassis duplication.
  return (
    <div className="space-y-6">
      {/* ── Video player ── */}
      {signedUrl && (
        <VideoPlayer signedUrl={signedUrl} title={item.title ?? undefined} />
      )}

      {/* Compact inline status pill — replaces the old big "Transcribing…
          Auto-refreshing every 3s" Card so the user can see the player
          + tabs immediately and the phase update is unobtrusive. The
          full progress experience for active items lives in the
          Recent-Imports-Strip on the Library page (Slice 2). */}
      {(item.status === 'uploading' || item.status === 'processing') && (
        <ProcessingPhasePill
          status={item.status}
          phase={item.processing_phase}
          progress={item.processing_progress}
        />
      )}

      {item.status === 'failed' && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Transcription failed</CardTitle>
            <CardDescription>Fix the issue and try again.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormMessage variant="error">{readErrorMessage(item.metadata)}</FormMessage>
            {item.kind === 'video' && item.source_url && (
              <RetryTranscriptionButton workspaceId={workspaceId} contentId={item.id} />
            )}
          </CardContent>
        </Card>
      )}

      {item.status === 'ready' && !item.transcript && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>No transcript stored</CardTitle>
            <CardDescription>
              This content is marked ready but has no transcript text -- likely an older row.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* ── Auto-generate trigger ── */}
      <AutoGenerateTrigger
        workspaceId={workspaceId}
        contentId={item.id}
        isReady={isReady}
        hasOutputs={hasExistingOutputs}
      />

      {/* ── Tabbed content ── */}
      {hasTranscript && (
        <>
          <TabNav active={activeTab} onChange={setActiveTab} />

          {activeTab === 'overview' && (
            <OverviewTab
              item={item}
              workspaceId={workspaceId}
              hasExistingOutputs={hasExistingOutputs}
              outputCount={outputCount}
              meta={meta}
              wordCount={wordCount}
              isReady={isReady}
            />
          )}

          {activeTab === 'generate' && (
            <GenerateTab
              item={item}
              workspaceId={workspaceId}
              hasExistingOutputs={hasExistingOutputs}
              outputCount={outputCount}
              meta={meta}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsTab
              item={item}
              workspaceId={workspaceId}
              meta={meta}
              currentPlan={currentPlan}
              renders={renders}
              longLivedSourceUrl={longLivedSourceUrl}
              reviewLinks={reviewLinks}
              reviewComments={reviewComments}
              canCreateReviewLink={canCreateReviewLink}
            />
          )}
        </>
      )}

      {/* ── Delete ── */}
      <div className="border-t border-border/50 pt-4">
        <DeleteContentButton workspaceId={workspaceId} contentId={item.id} />
      </div>
    </div>
  )
}

/** Maps the Slice 8 sub-phase to a friendly label. Returns null for
 *  unknown phases — caller falls back to the generic status text. */
function phaseLabel(phase: string | null): string | null {
  switch (phase) {
    case 'queued':
      return 'Queued'
    case 'uploading':
      return 'Uploading…'
    case 'detect':
      return 'Detecting language…'
    case 'transcribe':
      return 'Transcribing…'
    case 'index':
      return 'Indexing…'
    default:
      return null
  }
}

function ProcessingPhasePill({
  status,
  phase,
  progress,
}: {
  status: 'uploading' | 'processing'
  phase: string | null
  progress: number | null
}) {
  const label =
    phaseLabel(phase) ?? (status === 'uploading' ? 'Uploading…' : 'Transcribing…')
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-amber-50/70 px-3 py-1.5 text-[12px] font-semibold text-amber-800"
    >
      <Loader2
        className="h-3 w-3 animate-spin motion-reduce:animate-none"
        strokeWidth={2.4}
        aria-hidden
      />
      <span>{label}</span>
      {progress != null ? (
        <span className="font-mono tabular-nums text-amber-700/80">
          {progress}%
        </span>
      ) : null}
    </div>
  )
}

