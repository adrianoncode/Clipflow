'use client'

import Link from 'next/link'
import {
  BarChart3,
  Clapperboard,
  Eraser,
  Globe,
  MessageSquare,
  Move,
  Scissors,
  Sparkles,
  Tag,
  Wand2,
} from 'lucide-react'

import { AutoTagButton } from '@/components/content/auto-tag-button'
import { ClipFinder } from '@/components/content/clip-finder'
import { EditorExportPanel } from '@/components/content/editor-export-panel'
import { SentimentAnalysisButton } from '@/components/content/sentiment-analysis-button'
import { RenderHistoryPanel } from '@/components/outputs/render-history-panel'
import { ReviewLinkPanel } from '@/components/outputs/review-link-panel'
import { ReviewCommentsPanel } from '@/components/review/review-comments-panel'
import type { BestClip, SentimentResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { ContentItemRow } from '@/lib/content/get-content-item'
import type { RenderRow } from '@/lib/video/renders/list-renders'
import type { ReviewLinkRow } from '@/lib/review/get-review-links-for-content'
import type { InternalReviewComment } from '@/lib/review/get-review-comments-for-content'
import {
  checkPlanAccess,
  FEATURE_MIN_PLAN,
  type BillingPlan,
  type PlanFeatures,
} from '@/lib/billing/plans'
import { ToolCard } from './shared'

interface ToolsTabProps {
  item: ContentItemRow
  workspaceId: string
  meta: Record<string, unknown> | null
  currentPlan: BillingPlan
  /** Source-context data — moved here from /outputs page in the Slice 5
   *  page-detox. Defaults make this safe even when caller hasn't fetched. */
  renders?: RenderRow[]
  longLivedSourceUrl?: string
  reviewLinks?: ReviewLinkRow[]
  reviewComments?: InternalReviewComment[]
  canCreateReviewLink?: boolean
}

/** Build the locked descriptor for a ToolCard, or `undefined` when the
 * plan already includes it. Centralized so every tool goes through the
 * same gate rather than each card deciding for itself. */
function gate(
  feature: keyof PlanFeatures,
  currentPlan: BillingPlan,
): { requiredPlan: string; feature: string } | undefined {
  if (checkPlanAccess(currentPlan, feature)) return undefined
  return { requiredPlan: FEATURE_MIN_PLAN[feature], feature }
}

export function ToolsTab({
  item,
  workspaceId,
  meta,
  currentPlan,
  renders = [],
  longLivedSourceUrl,
  reviewLinks = [],
  reviewComments = [],
  canCreateReviewLink = false,
}: ToolsTabProps) {
  const currentTags = Array.isArray(meta?.tags) ? (meta.tags as string[]) : []
  const initialSentiment: SentimentResult | null =
    meta && 'sentiment' in meta ? (meta.sentiment as SentimentResult) : null
  const initialClips: BestClip[] | null = Array.isArray(meta?.best_clips)
    ? (meta.best_clips as BestClip[])
    : null
  const transcript = item.transcript ?? ''
  const srt = (meta?.srt as string | undefined) ?? null
  const vtt = (meta?.vtt as string | undefined) ?? null
  const estimatedDurationSec =
    typeof meta?.duration_seconds === 'number'
      ? (meta.duration_seconds as number)
      : null

  return (
    <div className="space-y-6">
      {/* Video Tools */}
      <div className="space-y-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
          Video Tools
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Viral Moments — the headline clipper feature. Lives at
              the top so users see it first when they open Tools on a
              long-form (podcast / livestream / YouTube) item. Not
              gated: this is core positioning, available on every plan
              that can render at all. */}
          <ToolCard
            icon={<Wand2 className="h-4 w-4 text-primary" />}
            label="Viral Moments"
            description="AI finds 3\u20138 postable 20\u201360s clips with hooks and karaoke captions."
            href={`/workspace/${workspaceId}/content/${item.id}/highlights`}
          />
          <ToolCard
            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
            label="Subtitles"
            description="Burn stylized captions into your video for social platforms."
            href={`/workspace/${workspaceId}/content/${item.id}/subtitles`}
            locked={gate('brollAutomation', currentPlan)}
          />
          <ToolCard
            icon={<Clapperboard className="h-4 w-4 text-muted-foreground" />}
            label="B-Roll"
            description="Auto-generate contextual B-Roll clips with AI."
            href={`/workspace/${workspaceId}/content/${item.id}/broll`}
            locked={gate('brollAutomation', currentPlan)}
          />
          <ToolCard
            icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
            label="AI Avatar"
            description="Generate a talking-head avatar from your transcript."
            href={`/workspace/${workspaceId}/content/${item.id}/avatar`}
            locked={gate('avatarVideos', currentPlan)}
          />
          {item.kind === 'video' && (
            <ToolCard
              icon={<Move className="h-4 w-4 text-muted-foreground" />}
              label="Reframe"
              description="Smart-crop horizontal video to vertical 9:16 format."
              href={`/workspace/${workspaceId}/content/${item.id}/reframe`}
              locked={gate('brollAutomation', currentPlan)}
            />
          )}
          {item.kind === 'video' && (
            <ToolCard
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              label="Auto-Dub"
              description="Translate and dub your video into other languages."
              href={`/workspace/${workspaceId}/content/${item.id}/dub`}
              locked={gate('autoDub', currentPlan)}
            />
          )}
          {/* Audio cleanup — finds "um / äh / o sea / you know" and
              friends across EN/DE/ES so creators can ship a tighter
              edit without manually scrubbing the transcript. Only
              shown for video — no audio-source items go through the
              cut pipeline yet. */}
          {item.kind === 'video' && (
            <ToolCard
              icon={<Eraser className="h-4 w-4 text-muted-foreground" />}
              label="Audio cleanup"
              description="Trim filler words (um, äh, o sea) automatically — multilingual."
              href={`/workspace/${workspaceId}/content/${item.id}/cleanup`}
              locked={gate('brollAutomation', currentPlan)}
            />
          )}
        </div>
      </div>

      {/* Analysis */}
      <div className="space-y-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
          Analysis
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Scissors className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="text-sm font-semibold text-foreground">Clip Finder</span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              AI finds the most engaging clips from your content.
            </p>
            <ClipFinder
              workspaceId={workspaceId}
              contentId={item.id}
              initialClips={initialClips}
            />
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Tag className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="text-sm font-semibold text-foreground">Auto-Tag</span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Automatically tag content with relevant topics and categories.
            </p>
            <AutoTagButton
              workspaceId={workspaceId}
              contentId={item.id}
              currentTags={currentTags}
            />
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </span>
              <span className="text-sm font-semibold text-foreground">Sentiment</span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Analyze the emotional tone and sentiment of your content.
            </p>
            <SentimentAnalysisButton
              workspaceId={workspaceId}
              contentId={item.id}
              initialSentiment={initialSentiment}
            />
          </div>
        </div>
      </div>

      {/* Source — moved from /outputs in the Slice 5 page-detox. These
          are about the source video itself (renders of the source +
          export of source assets to external editors), not about
          per-platform drafts, so they belong here in the per-video tab. */}
      <div className="space-y-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
          Source
        </h3>
        <RenderHistoryPanel initialRenders={renders} />
        <EditorExportPanel
          contentId={item.id}
          contentTitle={item.title ?? 'Untitled'}
          transcript={transcript}
          srt={srt}
          vtt={vtt}
          clips={initialClips}
          estimatedDurationSec={estimatedDurationSec}
          sourceUrl={longLivedSourceUrl ?? null}
        />
      </div>

      {/* Collaboration — review-link sharing + reviewer comments live
          here for now. They're scoped to a single content_item, so the
          per-video page is a clean home until Step 5 (Pipeline) gets
          its own collaboration surface in a later slice. */}
      <div className="space-y-3">
        <h3 className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
          Collaboration
        </h3>
        {canCreateReviewLink ? (
          <ReviewLinkPanel
            workspaceId={workspaceId}
            contentId={item.id}
            links={reviewLinks}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-5">
            <p className="text-sm font-semibold">Client review links</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Share a no-login link with a client to collect feedback on
              these drafts. White-label, optional expiry. Available on
              the Studio plan.
            </p>
            <Link
              href={`/billing?plan=agency&feature=clientReviewLink`}
              className="cf-btn-3d cf-btn-3d-primary mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              Upgrade to unlock
            </Link>
          </div>
        )}
        <ReviewCommentsPanel comments={reviewComments} />
      </div>
    </div>
  )
}
