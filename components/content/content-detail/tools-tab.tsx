'use client'

import Link from 'next/link'
import {
  BarChart3,
  Clapperboard,
  Globe,
  MessageSquare,
  Move,
  Play,
  Scissors,
  Sparkles,
  Tag,
} from 'lucide-react'

import { AutoTagButton } from '@/components/content/auto-tag-button'
import { ClipFinder } from '@/components/content/clip-finder'
import { SentimentAnalysisButton } from '@/components/content/sentiment-analysis-button'
import type { BestClip, SentimentResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { ContentItemRow } from '@/lib/content/get-content-item'
import { ToolCard } from './shared'

interface ToolsTabProps {
  item: ContentItemRow
  workspaceId: string
  meta: Record<string, unknown> | null
}

export function ToolsTab({ item, workspaceId, meta }: ToolsTabProps) {
  const currentTags = Array.isArray(meta?.tags) ? (meta.tags as string[]) : []
  const initialSentiment: SentimentResult | null =
    meta && 'sentiment' in meta ? (meta.sentiment as SentimentResult) : null
  const initialClips: BestClip[] | null = Array.isArray(meta?.best_clips)
    ? (meta.best_clips as BestClip[])
    : null

  return (
    <div className="space-y-6">
      {/* Studio shortcut */}
      {(item.kind === 'video' || item.kind === 'youtube') && (
        <Link
          href={`/workspace/${workspaceId}/studio?content_id=${item.id}`}
          className="group flex w-full items-center justify-between rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.06] to-background px-5 py-4 transition-all hover:border-primary/50 hover:bg-primary/[0.08] hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
              <Play className="h-4 w-4 fill-current text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Render in Video Studio</p>
              <p className="text-xs text-muted-foreground">
                AI captions + reframe → ready-to-post MP4 in ~60 s
              </p>
            </div>
          </div>
          <Clapperboard className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary/60" />
        </Link>
      )}

      {/* Video Tools */}
      <div className="space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Video Tools
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ToolCard
            icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
            label="Subtitles"
            description="Burn stylized captions into your video for social platforms."
            href={`/workspace/${workspaceId}/content/${item.id}/subtitles`}
          />
          <ToolCard
            icon={<Clapperboard className="h-4 w-4 text-muted-foreground" />}
            label="B-Roll"
            description="Auto-generate contextual B-Roll clips with AI."
            href={`/workspace/${workspaceId}/content/${item.id}/broll`}
          />
          <ToolCard
            icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
            label="AI Avatar"
            description="Generate a talking-head avatar from your transcript."
            href={`/workspace/${workspaceId}/content/${item.id}/avatar`}
          />
          {item.kind === 'video' && (
            <ToolCard
              icon={<Move className="h-4 w-4 text-muted-foreground" />}
              label="Reframe"
              description="Smart-crop horizontal video to vertical 9:16 format."
              href={`/workspace/${workspaceId}/content/${item.id}/reframe`}
            />
          )}
          {item.kind === 'video' && (
            <ToolCard
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
              label="Auto-Dub"
              description="Translate and dub your video into other languages."
              href={`/workspace/${workspaceId}/content/${item.id}/dub`}
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
