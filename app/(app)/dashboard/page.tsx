import Link from 'next/link'
import { cookies } from 'next/headers'
import {
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
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddAiKeyBanner } from '@/components/dashboard/add-ai-key-banner'
import { GettingStartedChecklist } from '@/components/dashboard/getting-started-checklist'
import { ReferralHeroStat } from '@/components/dashboard/referral-hero-stat'
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
import { getReferralStats } from '@/lib/referrals/get-stats'

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

// Stat cards share a single accent so the dashboard reads calm — the
// four cards are distinguished by their icons + numbers, not a
// rainbow of background colors.
const STAT_CARD_STYLES = [
  { iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { iconBg: 'bg-primary/10', iconColor: 'text-primary' },
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

  const [aiKeys, stats, usage, plan, brandVoice, recyclable, referralStats] = currentWorkspace && user
    ? await Promise.all([
        getAiKeys(currentWorkspace.id),
        getWorkspaceStats(currentWorkspace.id),
        getWorkspaceUsage(currentWorkspace.id),
        getWorkspacePlan(currentWorkspace.id),
        getActiveBrandVoice(currentWorkspace.id),
        getRecyclableContent(currentWorkspace.id),
        getReferralStats(user.id),
      ])
    : [[], null, null, 'free' as const, null, [], { pending: 0, confirmed: 0 }]

  const showAiKeyNudge =
    !!currentWorkspace && currentWorkspace.role === 'owner' && aiKeys.length === 0

  const planDef = PLANS[plan ?? 'free']

  const maxPlatformCount = stats
    ? Math.max(...Object.values(stats.outputsByPlatform), 1)
    : 1

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* Header — greeting + single primary action. Secondary tools live
          in the sidebar and the quick-actions row below, so we don't
          double-up here. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {displayName.split(' ')[0] ?? displayName}
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">
              {currentWorkspace ? currentWorkspace.name : ''}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {planDef.name} plan
            </span>
          </div>
        </div>
        {currentWorkspace ? (
          <Link
            href={`/workspace/${currentWorkspace.id}/content/new`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30"
          >
            <span className="text-base leading-none">+</span>
            New content
          </Link>
        ) : null}
      </div>

      {/* Banners */}
      {showAiKeyNudge && currentWorkspace ? (
        <AddAiKeyBanner workspaceName={currentWorkspace.name} />
      ) : null}

      {/* Referral achievement — shown only when user has paid conversions. */}
      <ReferralHeroStat
        confirmedCount={referralStats.confirmed}
        pendingCount={referralStats.pending}
        currentPlan={plan ?? 'free'}
        monthlyBaseCents={planDef.monthlyPrice}
      />


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
              <Card
                key={card.label}
                className="relative overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.iconBg}`}>
                      <card.icon className={`h-4 w-4 ${style.iconColor}`} />
                    </span>
                    {card.trendUp ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                        <TrendingUp className="h-2.5 w-2.5" />
                        +{card.label === 'Total content' ? stats.contentThisMonth : stats.outputsThisMonth}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">
                    {card.value}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Quick actions — minimal row, one accent color, no emojis so
          the dashboard reads as a tool rather than a kids' app. */}
      {currentWorkspace && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: `/workspace/${currentWorkspace.id}/content/new`, label: 'New content', desc: 'Upload or paste', icon: FileText },
            { href: `/workspace/${currentWorkspace.id}/ghostwriter`, label: 'Ghostwriter', desc: 'AI writes scripts', icon: PenTool },
            { href: `/workspace/${currentWorkspace.id}/trends`, label: 'Trend Radar', desc: 'Find trending topics', icon: TrendingUp },
            { href: `/workspace/${currentWorkspace.id}/tools`, label: 'All tools', desc: '30+ in one place', icon: Layers },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <action.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{action.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {action.desc}
                </p>
              </div>
            </Link>
          ))}
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
            <div className="grid grid-cols-4 gap-px overflow-hidden rounded-xl border border-border/50 bg-border/50">
              {(['draft', 'review', 'approved', 'exported'] as const).map((state) => (
                <div
                  key={state}
                  className="flex flex-col items-center gap-1 bg-card px-3 py-3 text-center"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${PIPELINE_DOT_COLORS[state]}`} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {PIPELINE_LABELS[state]}
                    </span>
                  </div>
                  <span className="text-2xl font-semibold tabular-nums">
                    {stats.pipelineByState[state]}
                  </span>
                </div>
              ))}
            </div>
            {stats.totalOutputs === 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                No outputs yet — generate some from a content item.
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
