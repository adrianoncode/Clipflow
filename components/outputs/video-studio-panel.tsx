import Link from 'next/link'
import {
  Clapperboard,
  Globe,
  MessageSquare,
  Move,
  Scissors,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'

import { MakeVideoButton } from '@/components/outputs/make-video-button'

interface VideoStudioPanelProps {
  workspaceId: string
  contentId: string
  /** Whether the source item is a video (enables reframe/dub). */
  isVideo: boolean
  renderCount: number
  /** Team+ gate: trending-sound picker only shown on paid tiers. */
  trendingSoundsEnabled: boolean
}

interface Tool {
  key: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  desc: string
  href: string
  videoOnly?: boolean
}

/**
 * Big, loud Video Studio section on the outputs page. Previously the
 * video features were buried in a "AI Tools" grid on the content
 * detail page — users landed here, saw 4 text drafts, and concluded
 * "it only generates scripts". This panel is the direct answer to that.
 */
export function VideoStudioPanel({
  workspaceId,
  contentId,
  isVideo,
  renderCount,
  trendingSoundsEnabled,
}: VideoStudioPanelProps) {
  const tools: Tool[] = [
    {
      key: 'subtitles',
      icon: MessageSquare,
      label: 'Subtitles',
      desc: 'Word-timed captions, burned into video',
      href: `/workspace/${workspaceId}/content/${contentId}/subtitles`,
    },
    {
      key: 'broll',
      icon: Clapperboard,
      label: 'B-Roll',
      desc: 'Stock footage stitched to the script',
      href: `/workspace/${workspaceId}/content/${contentId}/broll`,
    },
    {
      key: 'reframe',
      icon: Move,
      label: 'Reframe',
      desc: 'Auto-crop 16:9 → 9:16, 1:1',
      href: `/workspace/${workspaceId}/content/${contentId}/reframe`,
      videoOnly: true,
    },
    {
      key: 'avatar',
      icon: Sparkles,
      label: 'AI Avatar',
      desc: 'Talking-head video from your script',
      href: `/workspace/${workspaceId}/content/${contentId}/avatar`,
    },
    {
      key: 'dub',
      icon: Globe,
      label: 'Auto-Dub',
      desc: 'Translate & voiceover in 30+ languages',
      href: `/workspace/${workspaceId}/content/${contentId}/dub`,
      videoOnly: true,
    },
    {
      key: 'clip',
      icon: Scissors,
      label: 'Clip Finder',
      desc: 'Auto-detect viral moments',
      href: `/workspace/${workspaceId}/content/${contentId}`,
    },
  ]

  const visibleTools = tools.filter((t) => !t.videoOnly || isVideo)

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.04] via-background to-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, hsl(var(--primary) / 0.18), transparent 70%)',
        }}
      />

      <div className="relative flex flex-col gap-4 border-b border-primary/10 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            Video Studio
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight">
            Now render actual videos.
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            One click turns the drafts above into a rendered MP4 with
            captions, your aspect ratio, and optional trending audio.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          {renderCount > 0 ? (
            <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {renderCount} rendered
            </span>
          ) : null}
          {isVideo ? (
            <MakeVideoButton
              workspaceId={workspaceId}
              contentId={contentId}
              trendingSoundsEnabled={trendingSoundsEnabled}
            />
          ) : null}
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.key}
              href={tool.href}
              className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-all group-hover:bg-primary/15 group-hover:ring-primary/25">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {tool.label}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  {tool.desc}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
