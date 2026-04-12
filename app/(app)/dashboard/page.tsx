import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  Layers,
  PenTool,
  Rss,
  Star,
  TrendingUp,
  Video,
  Youtube,
  Zap,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddAiKeyBanner } from '@/components/dashboard/add-ai-key-banner'
import { GettingStartedChecklist } from '@/components/dashboard/getting-started-checklist'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { RecycleSuggestions } from '@/components/content/recycle-suggestions'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'
import { getRecyclableContent } from '@/lib/content/get-recyclable-content'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

const KIND_ICON = {
  video: Video,
  youtube: Youtube,
  url: Globe,
  rss: Rss,
  text: FileText,
} as const

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Reels',
  youtube_shorts: 'Shorts',
  linkedin: 'LinkedIn',
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500',
  instagram_reels: 'bg-purple-500',
  youtube_shorts: 'bg-red-500',
  linkedin: 'bg-blue-500',
}

const PIPELINE_DOT_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400',
  review: 'bg-amber-400',
  approved: 'bg-emerald-400',
  exported: 'bg-blue-400',
}

const PIPELINE_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  exported: 'Exported',
}

const STAT_CARD_STYLES = [
  { iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
  { iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
  { iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
  { iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
] as const

function UsageBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1) {
    return <span className="text-xs text-muted-foreground">Unlimited</span>
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-500' : 'bg-primary'
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {used} / {limit} used
      </p>
    </div>
  )
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days} d ago`
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

export default async function DashboardPage() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const fullName =
    typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null
  const displayName = fullName ?? user?.email ?? 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  const [aiKeys, stats, usage, plan, brandVoice, recyclable] = currentWorkspace
    ? await Promise.all([
        getAiKeys(currentWorkspace.id),
        getWorkspaceStats(currentWorkspace.id),
        getWorkspaceUsage(currentWorkspace.id),
        getWorkspacePlan(currentWorkspace.id),
        getActiveBrandVoice(currentWorkspace.id),
        getRecyclableContent(currentWorkspace.id),
      ])
    : [[], null, null, 'free' as const, null, []]

  const showAiKeyNudge =
    !!currentWorkspace && currentWorkspace.role === 'owner' && aiKeys.length === 0

  const planDef = PLANS[plan ?? 'free']

  const maxPlatformCount = stats
    ? Math.max(...Object.values(stats.outputsByPlatform), 1)
    : 1

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {currentWorkspace ? `${currentWorkspace.name}` : ''}
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium">
              <Zap className="h-2.5 w-2.5 text-primary" />
              {planDef.name}
            </span>
          </p>
        </div>
        {currentWorkspace && (
          <Link
            href={`/workspace/${currentWorkspace.id}/content/new`}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            <span className="text-base leading-none">+</span>
            New content
          </Link>
        )}
      </div>

      {/* Banners */}
      {showAiKeyNudge && currentWorkspace ? (
        <AddAiKeyBanner workspaceName={currentWorkspace.name} />
      ) : null}

      {currentWorkspace && stats ? (
        <GettingStartedChecklist
          workspaceId={currentWorkspace.id}
          hasAiKey={aiKeys.length > 0}
          hasContent={stats.totalContent > 0}
          hasOutputs={stats.totalOutputs > 0}
          hasBrandVoice={!!brandVoice}
        />
      ) : null}

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total content',
              value: stats.totalContent,
              icon: FileText,
              trend: stats.contentThisMonth > 0 ? `+${stats.contentThisMonth} this month` : 'content items',
              trendUp: stats.contentThisMonth > 0,
            },
            {
              label: 'Total outputs',
              value: stats.totalOutputs,
              icon: Layers,
              trend: stats.outputsThisMonth > 0 ? `+${stats.outputsThisMonth} this month` : 'platform drafts',
              trendUp: stats.outputsThisMonth > 0,
            },
            {
              label: 'Starred',
              value: stats.starredOutputs,
              icon: Star,
              trend: 'strong outputs',
              trendUp: false,
            },
            {
              label: 'Approved',
              value: stats.approvedOutputs,
              icon: CheckCircle2,
              trend: 'ready to publish',
              trendUp: false,
            },
          ].map((card, i) => {
            const style = STAT_CARD_STYLES[i] ?? STAT_CARD_STYLES[0]
            return (
              <Card key={card.label} className="relative overflow-hidden border-border/50 card-hover">
                <CardHeader className="pb-1 pt-4">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${style.iconBg}`}>
                      <card.icon className={`h-3.5 w-3.5 ${style.iconColor}`} />
                    </span>
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-3xl font-bold tabular-nums">{card.value}</p>
                  <p className={`mt-1 flex items-center gap-1 text-xs ${
                    card.trendUp ? 'text-emerald-500' : 'text-muted-foreground'
                  }`}>
                    {card.trendUp && <TrendingUp className="h-3 w-3" />}
                    {!card.trendUp && <ArrowRight className="h-3 w-3" />}
                    {card.trend}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pipeline funnel */}
      {stats && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Content Pipeline
              </CardTitle>
              {currentWorkspace && (
                <Link
                  href={`/workspace/${currentWorkspace.id}/pipeline`}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  View full pipeline
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {(['draft', 'review', 'approved', 'exported'] as const).map((state, i) => (
                <div key={state} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5">
                    <span className={`h-2 w-2 rounded-full ${PIPELINE_DOT_COLORS[state]}`} />
                    <span className="text-xs font-medium text-muted-foreground">{PIPELINE_LABELS[state]}</span>
                    <span className="text-sm font-bold tabular-nums">{stats.pipelineByState[state]}</span>
                  </div>
                  {i < 3 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
            {stats.totalOutputs === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                No outputs yet -- generate some from a content item.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main content: 2/3 + 1/3 layout */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Recent Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Recent Content */}
            {stats.recentContent.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Recent content</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y divide-border/50">
                    {stats.recentContent.map((item) => {
                      const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
                      return (
                        <li key={item.id}>
                          <Link
                            href={`/workspace/${currentWorkspace?.id}/content/${item.id}`}
                            className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-accent/50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                            </div>
                            <span className="flex-1 truncate text-sm font-medium">
                              {item.title ?? 'Untitled'}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatRelative(item.created_at)}
                            </span>
                            <ContentStatusBadge status={item.status} />
                            {item.status === 'ready' && (
                              <Link
                                href={`/workspace/${currentWorkspace?.id}/content/${item.id}/outputs`}
                                className="shrink-0 text-xs text-primary underline-offset-4 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                outputs
                              </Link>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  {currentWorkspace && (
                    <div className="border-t border-border/50 px-6 py-3">
                      <Link
                        href={`/workspace/${currentWorkspace.id}`}
                        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        View all content
                        <ChevronRight className="ml-0.5 inline h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recycle suggestions */}
            {currentWorkspace && recyclable && recyclable.length > 0 && (
              <RecycleSuggestions items={recyclable} workspaceId={currentWorkspace.id} />
            )}

            {/* Empty state */}
            {stats.totalContent === 0 && currentWorkspace && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border/50 card-hover">
                  <CardContent className="flex flex-col items-center py-8 text-center">
                    <div className="mb-4 rounded-2xl bg-blue-500/10 p-4">
                      <Video className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-base font-medium">Start creating</h3>
                    <p className="mt-1 max-w-[220px] text-sm text-muted-foreground">
                      Upload a video, paste a YouTube link, or drop a script to get started.
                    </p>
                    <Link
                      href={`/workspace/${currentWorkspace.id}/content/new`}
                      className="mt-4 inline-flex h-9 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                    >
                      New content
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-border/50 card-hover">
                  <CardContent className="flex flex-col items-center py-8 text-center">
                    <div className="mb-4 rounded-2xl bg-purple-500/10 p-4">
                      <PenTool className="h-8 w-8 text-purple-500" />
                    </div>
                    <h3 className="text-base font-medium">Set your brand voice</h3>
                    <p className="mt-1 max-w-[220px] text-sm text-muted-foreground">
                      Tell the AI your tone and style. Every draft will match automatically.
                    </p>
                    <Link
                      href="/settings/brand-voice"
                      className="mt-4 inline-flex h-9 items-center rounded-xl border border-border px-5 text-sm font-medium transition-colors hover:bg-accent"
                    >
                      Configure voice
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* RIGHT: Platform breakdown + Usage */}
          <div className="space-y-6">
            {/* Platform breakdown */}
            {stats.totalOutputs > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Platform breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.outputsByPlatform).map(([platform, count]) => {
                    const pct = Math.round((count / maxPlatformCount) * 100)
                    return (
                      <div key={platform} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {PLATFORM_LABELS[platform] ?? platform}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${PLATFORM_COLORS[platform] ?? 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Monthly usage */}
            {usage && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Monthly usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Content items</p>
                    <UsageBar
                      used={usage.contentItemsThisMonth}
                      limit={planDef.limits.contentItemsPerMonth}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Outputs generated</p>
                    <UsageBar
                      used={usage.outputsThisMonth}
                      limit={planDef.limits.outputsPerMonth}
                    />
                  </div>
                  {plan === 'free' && currentWorkspace && (
                    <Link
                      href="/billing"
                      className="block rounded-lg border border-primary/20 bg-primary/5 py-2 text-center text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      Upgrade for more
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
