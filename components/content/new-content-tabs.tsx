'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FileText, Link2, Mic, Video, Youtube, Globe, Rss } from 'lucide-react'

import { RssInputForm } from '@/components/content/rss-input-form'
import { TextInputForm } from '@/components/content/text-input-form'
import { UrlInputForm } from '@/components/content/url-input-form'
import { VideoUploadForm } from '@/components/content/video-upload-form'
import { VoiceRecorder } from '@/components/content/voice-recorder'
import { YoutubeInputForm } from '@/components/content/youtube-input-form'
import { cn } from '@/lib/utils'

type TabKey = 'video' | 'audio' | 'link' | 'text'
type LinkMode = 'youtube' | 'url' | 'rss'

interface NewContentTabsProps {
  workspaceId: string
  hasOpenAiKey: boolean
}

const TABS: {
  key: TabKey
  label: string
  icon: typeof Video
  description: string
}[] = [
  {
    key: 'video',
    label: 'Video',
    icon: Video,
    description: 'Upload a video file from your device.',
  },
  {
    key: 'audio',
    label: 'Audio',
    icon: Mic,
    description: 'Record audio in your browser — auto-transcribed instantly.',
  },
  {
    key: 'link',
    label: 'Link',
    icon: Link2,
    description: 'Paste a YouTube URL, website, or podcast link.',
  },
  {
    key: 'text',
    label: 'Text',
    icon: FileText,
    description: 'Paste an existing transcript or script — no transcription needed.',
  },
]

const LINK_MODES: { key: LinkMode; label: string; icon: typeof Youtube }[] = [
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'url', label: 'Website', icon: Globe },
  { key: 'rss', label: 'Podcast', icon: Rss },
]

export function NewContentTabs({ workspaceId, hasOpenAiKey }: NewContentTabsProps) {
  const router = useRouter()
  const [active, setActive] = useState<TabKey>('video')
  const [linkMode, setLinkMode] = useState<LinkMode>('youtube')

  const activeTab = TABS.find((t) => t.key === active)!

  return (
    <div className="space-y-5">
      {/* Primary tab selector */}
      <div
        role="tablist"
        aria-label="Content type"
        className="grid grid-cols-4 gap-1 rounded-2xl border border-border/60 bg-muted/20 p-1.5"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === active
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-xs font-semibold transition-all duration-150 sm:flex-row sm:gap-2',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Subheader description */}
      <p className="text-sm text-muted-foreground">{activeTab.description}</p>

      {/* Panels */}
      <div role="tabpanel" id="tabpanel-video" aria-labelledby="tab-video" hidden={active !== 'video'}>
        {active === 'video' ? (
          <VideoUploadForm workspaceId={workspaceId} hasOpenAiKey={hasOpenAiKey} />
        ) : null}
      </div>

      <div role="tabpanel" id="tabpanel-audio" aria-labelledby="tab-audio" hidden={active !== 'audio'}>
        {active === 'audio' ? (
          <VoiceRecorder
            workspaceId={workspaceId}
            onCreated={(id) => router.push(`/workspace/${workspaceId}/content/${id}`)}
          />
        ) : null}
      </div>

      <div role="tabpanel" id="tabpanel-link" aria-labelledby="tab-link" hidden={active !== 'link'}>
        {active === 'link' ? (
          <div className="space-y-4">
            {/* Link sub-mode selector — compact segmented control */}
            <div
              role="tablist"
              aria-label="Link source"
              className="inline-flex rounded-xl border border-border/60 bg-muted/20 p-1"
            >
              {LINK_MODES.map((mode) => {
                const isActive = mode.key === linkMode
                const Icon = mode.icon
                return (
                  <button
                    key={mode.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setLinkMode(mode.key)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {mode.label}
                  </button>
                )
              })}
            </div>

            {/* Link form */}
            <div>
              {linkMode === 'youtube' && <YoutubeInputForm workspaceId={workspaceId} />}
              {linkMode === 'url' && <UrlInputForm workspaceId={workspaceId} />}
              {linkMode === 'rss' && <RssInputForm workspaceId={workspaceId} />}
            </div>
          </div>
        ) : null}
      </div>

      <div role="tabpanel" id="tabpanel-text" aria-labelledby="tab-text" hidden={active !== 'text'}>
        {active === 'text' ? <TextInputForm workspaceId={workspaceId} /> : null}
      </div>
    </div>
  )
}
