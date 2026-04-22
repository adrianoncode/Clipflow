'use client'

import {
  BarChart3,
  Clapperboard,
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
import { SentimentAnalysisButton } from '@/components/content/sentiment-analysis-button'
import type { BestClip, SentimentResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { ContentItemRow } from '@/lib/content/get-content-item'
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

export function ToolsTab({ item, workspaceId, meta, currentPlan }: ToolsTabProps) {
  const currentTags = Array.isArray(meta?.tags) ? (meta.tags as string[]) : []
  const initialSentiment: SentimentResult | null =
    meta && 'sentiment' in meta ? (meta.sentiment as SentimentResult) : null
  const initialClips: BestClip[] | null = Array.isArray(meta?.best_clips)
    ? (meta.best_clips as BestClip[])
    : null

  return (
    <div className="space-y-6">
      {/* Video Tools */}
      <div className="space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
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
        </div>
      </div>

      {/* Analysis */}
      <div className="space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
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
    </div>
  )
}
