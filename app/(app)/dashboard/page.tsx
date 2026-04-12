import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  Layers,
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
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'

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

const PIPELINE_COLORS: Record<string, string> = {
  draft: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
  review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  exported: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
}

const PIPELINE_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  exported: 'Exported',
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1) {
    return <span className="text-xs text-muted-foreground">Unlimited</span>
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-500' : 'bg-primary'
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
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

  const [aiKeys, stats, usage, plan, brandVoice] = currentWorkspace
    ? await Promise.all([
        getAiKeys(currentWorkspace.id),
        getWorkspaceStats(currentWorkspace.id),
        getWorkspaceUsage(currentWorkspace.id),
        getWorkspacePlan(currentWorkspace.id),
        getActiveBrandVoice(currentWorkspace.id),
      ])
    : [[], null, null, 'free' as const, null]

  const showAiKeyNudge =
    !!currentWorkspace && currentWorkspace.role === 'owner' && aiKeys.length === 0

  const planDef = PLANS[plan ?? 'free']

  const maxPlatformCount = stats
    ? Math.max(...Object.values(stats.outputsByPlatform), 1)
    : 1

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {currentWorkspace ? `${currentWorkspace.name} · ` : ''}
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
              <Zap className="h-2.5 w-2.5" />
              {planDef.name} plan
            </span>
          </p>
        </div>
        {currentWorkspace && (
          <Link
            href={`/workspace/${currentWorkspace.id}/content/new`}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
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
          {/* Total Content */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Total content
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{stats.totalContent}</p>
              {stats.contentThisMonth > 0 ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.contentThisMonth} this month
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">content items</p>
              )}
            </CardContent>
          </Card>

          {/* Total Outputs */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Layers className="h-3.5 w-3.5" />
                Total outputs
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{stats.totalOutputs}</p>
              {stats.outputsThisMonth > 0 ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.outputsThisMonth} this month
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">platform drafts</p>
              )}
            </CardContent>
          </Card>

          {/* Starred */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Star className="h-3.5 w-3.5" />
                Starred
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{stats.starredOutputs}</p>
              <p className="mt-1 text-xs text-muted-foreground">strong outputs</p>
            </CardContent>
          </Card>

          {/* Approved */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-3xl font-bold">{stats.approvedOutputs}</p>
              <p className="mt-1 text-xs text-muted-foreground">ready to publish</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content: 2/3 + 1/3 layout */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Pipeline + Recent Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Pipeline overview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Content Pipeline
                  </CardTitle>
                  {currentWorkspace && (
                    <Link
                      href={`/workspace/${currentWorkspace.id}/pipeline`}
                      className="flex items-center gap-0.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
                    >
                      View full pipeline
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(['draft', 'review', 'approved', 'exported'] as const).map((state) => (
                    <div
                      key={state}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${PIPELINE_COLORS[state]}`}
                    >
                      <span>{PIPELINE_LABELS[state]}</span>
                      <span className="font-bold">{stats.pipelineByState[state]}</span>
                    </div>
                  ))}
                </div>
                {stats.totalOutputs === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No outputs yet — generate some from a content item.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Content */}
            {stats.recentContent.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Recent content</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {stats.recentContent.map((item) => {
                      const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
                      return (
                        <li key={item.id}>
                          <Link
                            href={`/workspace/${currentWorkspace?.id}/content/${item.id}`}
                            className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-accent"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span className="flex-1 truncate text-sm">
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
                                outputs →
                              </Link>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  {currentWorkspace && (
                    <div className="border-t px-6 py-3">
                      <Link
                        href={`/workspace/${currentWorkspace.id}`}
                        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                      >
                        View all content →
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty state */}
            {stats.totalContent === 0 && currentWorkspace && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Start creating</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Upload a video, paste a YouTube link, or drop a script. Clipflow transcribes it and generates platform drafts automatically.</p>
                    <Link
                      href={`/workspace/${currentWorkspace.id}/content/new`}
                      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                    >
                      New content
                    </Link>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Set your brand voice</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Tell the AI your tone, what to avoid, and give it an example hook. Every draft will automatically match your style.</p>
                    <Link
                      href="/settings/brand-voice"
                      className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                    >
                      Configure brand voice
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Platform breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.outputsByPlatform).map(([platform, count]) => {
                    const pct = Math.round((count / maxPlatformCount) * 100)
                    return (
                      <div key={platform} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {PLATFORM_LABELS[platform] ?? platform}
                          </span>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className={`h-1.5 rounded-full ${PLATFORM_COLORS[platform] ?? 'bg-primary'}`}
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
              <Card>
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
                      className="block text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Upgrade for more →
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
