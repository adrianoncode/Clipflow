import Link from 'next/link'
import { cookies } from 'next/headers'
import {
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
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
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

// Single-color app: every platform uses the primary violet, bars are
// distinguished by width alone. No rainbow.
const PLATFORM_BAR_CLASS = 'bg-primary'

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


function UsageBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1) {
    return (
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-full rounded-full bg-primary/30" />
      </div>
    )
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  // Single-color rule: usage pressure shown via opacity darkening, not
  // by switching to amber/red. Destructive state at >= 100 % only.
  const color = pct >= 100 ? 'bg-destructive' : 'bg-primary'
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
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
      {/* Header — greeting + a short context summary + single primary
          action. The date row adds a subtle "at-a-glance" signal that
          the page is live data, not stale. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
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
            {stats && stats.totalContent > 0 ? (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[12px]">
                  <span className="font-semibold text-foreground tabular-nums">
                    {stats.totalContent}
                  </span>{' '}
                  content, <span className="font-semibold text-foreground tabular-nums">{stats.totalOutputs}</span> outputs
                </span>
              </>
            ) : null}
          </div>
        </div>
        {currentWorkspace ? (
          <Link
            href={`/workspace/${currentWorkspace.id}/content/new`}
            className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30"
          >
            <span className="text-base leading-none">+</span>
            New content
            <kbd className="ml-1.5 hidden rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-white/70 sm:inline-block">
              N
            </kbd>
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

      {/* Data masthead — editorial row of stats with hair-line dividers
          between cells. Replaces the 4-card stat grid (generic). Numbers
          are monospaced and tracking-tight; labels are mono-uppercase so
          the whole thing reads like a terminal status bar, not a kids'
          dashboard. Trend arrow is inline next to the number. */}
      {stats && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="grid grid-cols-2 divide-y divide-border/50 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {([
              {
                key: 'content',
                label: 'Content',
                value: stats.totalContent,
                delta: stats.contentThisMonth,
                icon: FileText,
              },
              {
                key: 'outputs',
                label: 'Outputs',
                value: stats.totalOutputs,
                delta: stats.outputsThisMonth,
                icon: Layers,
              },
              {
                key: 'starred',
                label: 'Starred',
                value: stats.starredOutputs,
                delta: 0,
                icon: Star,
              },
              {
                key: 'approved',
                label: 'Approved',
                value: stats.approvedOutputs,
                delta: 0,
                icon: CheckCircle2,
              },
            ] as const).map((m) => (
              <div key={m.key} className="group relative px-5 py-5">
                <div className="flex items-center gap-1.5">
                  <m.icon className="h-3 w-3 text-muted-foreground/60" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {m.label}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                    {m.value}
                  </span>
                  {m.delta > 0 ? (
                    <span className="inline-flex items-center gap-0.5 font-mono text-[11px] font-medium text-primary">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {m.delta}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline — inline row under the masthead. No card chrome, just
          mono labels with counts separated by hairlines. Reads as a
          status bar, not a "feature". */}
      {stats && currentWorkspace ? (
        <div className="flex flex-wrap items-center justify-between gap-y-2 rounded-xl border border-border/60 bg-card px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Pipeline
            </span>
            <span aria-hidden className="h-3 w-px bg-border/60" />
            <div className="flex items-center gap-4">
              {(['draft', 'review', 'approved', 'exported'] as const).map((state) => (
                <div key={state} className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${PIPELINE_DOT_COLORS[state]}`} />
                  <span className="text-[11px] text-muted-foreground">
                    {PIPELINE_LABELS[state]}
                  </span>
                  <span className="font-mono text-[12px] font-semibold tabular-nums text-foreground">
                    {stats.pipelineByState[state]}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <Link
            href={`/workspace/${currentWorkspace.id}/pipeline`}
            className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Open board
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      ) : null}

      {/* Main content: 2/3 + 1/3 layout */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Recent Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Activity — timeline-style feed with a vertical rail on the
                left, timestamps on the right. Reads like a changelog or
                commit history, not a generic "recent items" list. */}
            {stats.recentContent.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card">
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Activity
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      · last {stats.recentContent.length}
                    </span>
                  </div>
                  {currentWorkspace ? (
                    <Link
                      href={`/workspace/${currentWorkspace.id}`}
                      className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      All content →
                    </Link>
                  ) : null}
                </div>
                <ol className="relative px-5 py-3">
                  {/* Vertical timeline rail */}
                  <span
                    aria-hidden
                    className="absolute left-[34px] top-6 bottom-6 w-px bg-border/70"
                  />
                  {stats.recentContent.map((item, idx) => {
                    const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
                    const kindLabel = item.kind.replace('_', ' ')
                    const verb =
                      item.status === 'ready'
                        ? 'ready'
                        : item.status === 'processing'
                          ? 'processing'
                          : item.status === 'failed'
                            ? 'failed'
                            : 'added'
                    return (
                      <li key={item.id} className="group relative">
                        <Link
                          href={`/workspace/${currentWorkspace?.id}/content/${item.id}`}
                          className="relative flex items-center gap-3 rounded-lg px-2 py-2.5 -mx-2 transition-colors hover:bg-accent/40"
                        >
                          {/* Timeline node — circular on the rail */}
                          <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-all group-hover:border-primary/40 group-hover:bg-primary/5 group-hover:text-primary">
                            <Icon className="h-3.5 w-3.5" aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">
                              <span className="font-medium text-foreground">
                                {item.title ?? 'Untitled'}
                              </span>
                              <span className="ml-1.5 text-muted-foreground">
                                · {verb}
                              </span>
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                              <span>{kindLabel}</span>
                              {idx < stats.recentContent.length ? (
                                <>
                                  <span className="text-muted-foreground/40">·</span>
                                  <span>{formatRelative(item.created_at)}</span>
                                </>
                              ) : null}
                            </p>
                          </div>
                          <ContentStatusBadge status={item.status} />
                        </Link>
                      </li>
                    )
                  })}
                </ol>
              </div>
            )}

            {/* Recycle suggestions */}
            {currentWorkspace && recyclable && recyclable.length > 0 && (
              <RecycleSuggestions items={recyclable} workspaceId={currentWorkspace.id} />
            )}

            {/* Empty state — one confident card instead of two competing
                options. Secondary actions hang below as quiet links. */}
            {stats.totalContent === 0 && currentWorkspace && (
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    background:
                      'radial-gradient(50% 60% at 0% 0%, rgba(124,58,237,0.07), transparent 70%)',
                  }}
                />
                <CardContent className="relative flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:gap-8">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold tracking-tight">
                      Drop your first video to get going.
                    </h3>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                      Paste a YouTube link, upload an MP4, or drop a transcript. You&apos;ll
                      have 4 platform-native drafts in under a minute.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                      <Link
                        href="/settings/brand-voice"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Set brand voice first
                      </Link>
                      <span className="text-muted-foreground/40">·</span>
                      <Link
                        href="/settings/ai-keys"
                        className="font-medium text-foreground underline-offset-4 hover:underline"
                      >
                        Connect your AI key
                      </Link>
                    </div>
                  </div>
                  <Link
                    href={`/workspace/${currentWorkspace.id}/content/new`}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                  >
                    <span className="text-base leading-none">+</span>
                    New content
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT: Platform breakdown + Usage */}
          <div className="space-y-6">
            {/* Platform breakdown */}
            {stats.totalOutputs > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card">
                <div className="border-b border-border/50 px-5 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    By platform
                  </span>
                </div>
                <div className="space-y-3 p-5">
                  {Object.entries(stats.outputsByPlatform).map(([platform, count]) => {
                    const pct = Math.round((count / maxPlatformCount) * 100)
                    return (
                      <div key={platform} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            {PLATFORM_LABELS[platform] ?? platform}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                            {count}
                          </span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${PLATFORM_BAR_CLASS}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Monthly usage — compact data-sheet style */}
            {usage && (
              <div className="rounded-2xl border border-border/60 bg-card">
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    This month
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                    {new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}
                  </span>
                </div>
                <div className="space-y-4 p-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Content items</span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {usage.contentItemsThisMonth}
                        {planDef.limits.contentItemsPerMonth !== -1
                          ? ` / ${planDef.limits.contentItemsPerMonth}`
                          : ' / ∞'}
                      </span>
                    </div>
                    <UsageBar
                      used={usage.contentItemsThisMonth}
                      limit={planDef.limits.contentItemsPerMonth}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Outputs generated</span>
                      <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                        {usage.outputsThisMonth}
                        {planDef.limits.outputsPerMonth !== -1
                          ? ` / ${planDef.limits.outputsPerMonth}`
                          : ' / ∞'}
                      </span>
                    </div>
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
                      Upgrade for more →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
