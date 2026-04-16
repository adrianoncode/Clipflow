'use client'

import { useState } from 'react'
import { Eye, Users2 } from 'lucide-react'

import { CompetitorSpyClient } from '@/components/workspace/competitor-spy-client'
import { CreatorSearchClient } from '@/components/creators/creator-search-client'

type ResearchTab = 'competitors' | 'creators'

interface ResearchTabsProps {
  workspaceId: string
  initialTab?: ResearchTab
}

const TABS: { key: ResearchTab; label: string; description: string; icon: typeof Eye }[] = [
  {
    key: 'competitors',
    label: 'Competitor Spy',
    description: "Analyze one competitor's strategy — tone, topics, gaps",
    icon: Eye,
  },
  {
    key: 'creators',
    label: 'Creator Search',
    description: 'Find creators by niche across YouTube, TikTok, Instagram',
    icon: Users2,
  },
]

export function ResearchTabs({ workspaceId, initialTab = 'competitors' }: ResearchTabsProps) {
  const [active, setActive] = useState<ResearchTab>(initialTab)

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div
        role="tablist"
        aria-label="Research mode"
        className="flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-muted/20 p-1.5"
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
              onClick={() => setActive(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Sub-description — context-aware */}
      <p className="text-sm text-muted-foreground">
        {TABS.find((t) => t.key === active)?.description}
      </p>

      {/* Active tab content */}
      <div role="tabpanel">
        {active === 'competitors' ? (
          <CompetitorSpyClient workspaceId={workspaceId} />
        ) : (
          <CreatorSearchClient workspaceId={workspaceId} />
        )}
      </div>
    </div>
  )
}
