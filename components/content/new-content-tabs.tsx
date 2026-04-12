'use client'

import { useState } from 'react'

import { RssInputForm } from '@/components/content/rss-input-form'
import { TextInputForm } from '@/components/content/text-input-form'
import { UrlInputForm } from '@/components/content/url-input-form'
import { VideoUploadForm } from '@/components/content/video-upload-form'
import { YoutubeInputForm } from '@/components/content/youtube-input-form'
import { cn } from '@/lib/utils'

type TabKey = 'video' | 'youtube' | 'url' | 'rss' | 'text'

interface NewContentTabsProps {
  workspaceId: string
  hasOpenAiKey: boolean
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'video', label: 'Video upload' },
  { key: 'youtube', label: 'YouTube URL' },
  { key: 'url', label: 'Website URL' },
  { key: 'rss', label: 'Podcast RSS' },
  { key: 'text', label: 'Text / script' },
]

export function NewContentTabs({ workspaceId, hasOpenAiKey }: NewContentTabsProps) {
  const [active, setActive] = useState<TabKey>('video')

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="New content type"
        className="flex flex-wrap gap-1 rounded-md border bg-muted/30 p-1"
      >
        {TABS.map((tab) => {
          const isActive = tab.key === active
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
                'flex-1 rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="tabpanel-video" aria-labelledby="tab-video" hidden={active !== 'video'}>
        {active === 'video' ? (
          <VideoUploadForm workspaceId={workspaceId} hasOpenAiKey={hasOpenAiKey} />
        ) : null}
      </div>

      <div role="tabpanel" id="tabpanel-youtube" aria-labelledby="tab-youtube" hidden={active !== 'youtube'}>
        {active === 'youtube' ? <YoutubeInputForm workspaceId={workspaceId} /> : null}
      </div>

      <div role="tabpanel" id="tabpanel-url" aria-labelledby="tab-url" hidden={active !== 'url'}>
        {active === 'url' ? <UrlInputForm workspaceId={workspaceId} /> : null}
      </div>

      <div role="tabpanel" id="tabpanel-rss" aria-labelledby="tab-rss" hidden={active !== 'rss'}>
        {active === 'rss' ? <RssInputForm workspaceId={workspaceId} /> : null}
      </div>

      <div role="tabpanel" id="tabpanel-text" aria-labelledby="tab-text" hidden={active !== 'text'}>
        {active === 'text' ? <TextInputForm workspaceId={workspaceId} /> : null}
      </div>
    </div>
  )
}
