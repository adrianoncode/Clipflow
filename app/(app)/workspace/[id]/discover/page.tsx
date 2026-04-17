import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Lightbulb, PenLine, Search, TrendingUp, Upload } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import { TrendRadarClient } from '@/components/workspace/trend-radar-client'
import { ResearchTabs } from '@/components/workspace/research-tabs'
import { IdeasPanel } from '@/components/ideas/ideas-panel'
import { GapAnalysisPanel } from '@/components/ideas/gap-analysis-panel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Discover' }

type DiscoverTab = 'trends' | 'research' | 'ideas'

const TABS: { key: DiscoverTab; label: string; icon: typeof TrendingUp; description: string }[] = [
  {
    key: 'trends',
    label: 'Trends',
    icon: TrendingUp,
    description: "What's trending right now — matched to your content",
  },
  {
    key: 'research',
    label: 'Research',
    icon: Search,
    description: 'Analyze competitors and find creators to collaborate with',
  },
  {
    key: 'ideas',
    label: 'Ideas',
    icon: Lightbulb,
    description: 'Generate platform-specific content ideas from your niche',
  },
]

interface DiscoverPageProps {
  params: { id: string }
  searchParams: { tab?: string }
}

export default async function DiscoverPage({ params, searchParams }: DiscoverPageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const plan = await getWorkspacePlan(params.id)
  const activeTab: DiscoverTab =
    searchParams.tab === 'research' || searchParams.tab === 'ideas'
      ? searchParams.tab
      : 'trends'

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Discover</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeTabConfig.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspace/${params.id}/ghostwriter`}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary hover:shadow-sm"
          >
            <PenLine className="h-3.5 w-3.5" />
            Write script
          </Link>
          <Link
            href={`/workspace/${params.id}/content/new`}
            className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Upload className="h-3.5 w-3.5" />
            Create content
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.key === activeTab
          return (
            <Link
              key={tab.key}
              href={`/workspace/${params.id}/discover${tab.key === 'trends' ? '' : `?tab=${tab.key}`}`}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-background font-semibold text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'trends' && (
        <UpgradeGate
          currentPlan={plan ?? 'free'}
          requiredPlan="solo"
          workspaceId={params.id}
          featureName="Trend Radar"
          description="See what's trending right now on TikTok, Instagram, and YouTube — matched to your content niche. Powered by Apify scrapers."
        >
          <TrendRadarClient workspaceId={params.id} />
        </UpgradeGate>
      )}

      {activeTab === 'research' && (
        <UpgradeGate
          currentPlan={plan ?? 'free'}
          requiredPlan="solo"
          workspaceId={params.id}
          featureName="Research"
          description="Deep research on competitors and creators across YouTube, TikTok, and Instagram. Available from Solo plan."
        >
          <ResearchTabs workspaceId={params.id} initialTab="competitors" />
        </UpgradeGate>
      )}

      {activeTab === 'ideas' && (
        <div className="space-y-6">
          <IdeasPanel workspaceId={params.id} />
          <hr className="border-border" />
          <GapAnalysisPanel workspaceId={params.id} />
        </div>
      )}
    </div>
  )
}
