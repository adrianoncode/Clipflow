import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Eye,
  Heart,
  Layers,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
} from 'lucide-react'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAnalytics } from '@/lib/dashboard/get-analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Reels',
  instagram: 'Instagram',
  youtube_shorts: 'Shorts',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
}

const PLATFORM_COLOR: Record<string, string> = {
  tiktok: 'bg-pink-500',
  instagram_reels: 'bg-purple-500',
  instagram: 'bg-purple-500',
  youtube_shorts: 'bg-red-500',
  youtube: 'bg-red-500',
  linkedin: 'bg-blue-500',
}

const STATE_COLOR: Record<string, string> = {
  draft: 'bg-zinc-400',
  review: 'bg-amber-400',
  approved: 'bg-emerald-500',
  exported: 'bg-violet-500',
}

const STATE_LABEL: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  exported: 'Published',
}

function shortMonth(yyyyMm: string): string {
  try {
    const [year, month] = yyyyMm.split('-')
    const d = new Date(Number(year), Number(month) - 1, 1)
    return d.toLocaleDateString(undefined, { month: 'short' })
  } catch {
    return yyyyMm
  }
}

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

/** Compact bar chart used for timeline views. */
function BarChart({
  data,
  color,
}: {
  data: Array<{ month: string; count: number }>
  color: string
}) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-28 items-end gap-2">
      {data.map(({ month, count }) => {
        const pct = Math.max(Math.round((count / max) * 100), count > 0 ? 4 : 2)
        return (
          <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
              {count > 0 ? count : ''}
            </span>
            <div className="relative flex w-full flex-1 items-end">
              <div
                className={`w-full rounded-t transition-all duration-500 ${color}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {shortMonth(month)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="font-mono text-[10px] text-muted-foreground/60">—</span>
    )
  }
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
        0%
      </span>
    )
  }
  const up = pct > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono text-[10px] font-bold ${
        up ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(pct)}%
    </span>
  )
}

export default async function AnalyticsPage() {
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-8">
        <p className="text-sm text-muted-foreground">No workspace found.</p>
      </div>
    )
  }

  const analytics = await getAnalytics(currentWorkspace.id)

  const maxPlatform = Math.max(...Object.values(analytics.platformBreakdown), 1)
  const totalItemsWithCoverage =
    analytics.platformCoverage.full +
    analytics.platformCoverage.partial +
    analytics.platformCoverage.none
  const funnelMax = Math.max(...analytics.funnel.map((s) => s.count), 1)

  const hasEngagement = analytics.engagement.totalViews > 0 || analytics.engagement.totalLikes > 0
  const totalPublished = analytics.publishingStats.published

  // Approval rate zone
  const approvalZone =
    analytics.approvalRate >= 70
      ? { label: 'Healthy', class: 'text-emerald-700 bg-emerald-50' }
      : analytics.approvalRate >= 40
        ? { label: 'Mixed', class: 'text-amber-700 bg-amber-50' }
        : { label: 'Low', class: 'text-red-700 bg-red-50' }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{currentWorkspace.name}</p>
      </div>

      {/* ── Velocity row — KPI cards with week-over-week deltas ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Upload}
          label="Content imported"
          value={analytics.velocityContent.thisWeek}
          helper="this week"
          delta={analytics.velocityContent.deltaPct}
          tint="violet"
        />
        <KpiCard
          icon={Layers}
          label="Drafts generated"
          value={analytics.velocityOutputs.thisWeek}
          helper="this week"
          delta={analytics.velocityOutputs.deltaPct}
          tint="primary"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approval rate"
          value={`${analytics.approvalRate}%`}
          helper={`${approvalZone.label} · drafts reviewed`}
          badge={approvalZone}
          tint="emerald"
        />
        <KpiCard
          icon={Send}
          label="Published"
          value={totalPublished}
          helper={`${analytics.publishingStats.scheduled} scheduled · ${analytics.publishingStats.failed} failed`}
          tint="amber"
        />
      </div>

      {/* ── Engagement stats (only when data exists) ── */}
      {hasEngagement && (
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Real engagement
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              From your published posts
            </span>
          </div>

          {/* Engagement KPI row */}
          <div className="grid grid-cols-2 divide-x divide-border/40 sm:grid-cols-5">
            <EngagementStat icon={Eye} label="Views" value={analytics.engagement.totalViews} />
            <EngagementStat icon={Heart} label="Likes" value={analytics.engagement.totalLikes} />
            <EngagementStat icon={MessageCircle} label="Comments" value={analytics.engagement.totalComments} />
            <EngagementStat icon={Share2} label="Shares" value={analytics.engagement.totalShares} />
            <div className="col-span-2 flex flex-col items-center justify-center gap-1 border-t border-border/40 p-4 sm:col-span-1 sm:border-t-0">
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {analytics.engagement.avgEngagementRate !== null
                  ? `${analytics.engagement.avgEngagementRate}%`
                  : '-'}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Avg. engagement
              </span>
            </div>
          </div>

          {/* Per-platform engagement breakdown */}
          {Object.keys(analytics.engagementByPlatform).length > 0 && (
            <div className="border-t border-border/40">
              <div className="grid gap-0 divide-y divide-border/30 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                {Object.entries(analytics.engagementByPlatform).map(([platform, data]) => (
                  <div key={platform} className="p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          PLATFORM_COLOR[platform] ?? 'bg-gray-500'
                        }`}
                      />
                      <span className="text-xs font-bold">
                        {PLATFORM_LABELS[platform] ?? platform}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <MicroStat icon={Eye} value={data.totalViews} />
                      <MicroStat icon={Heart} value={data.totalLikes} />
                      <MicroStat icon={MessageCircle} value={data.totalComments} />
                      <MicroStat icon={Share2} value={data.totalShares} />
                    </div>
                    {data.avgEngagementRate !== null && (
                      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/60">
                        {data.avgEngagementRate}% engagement
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Top published posts (when engagement data exists) ── */}
      {analytics.topPublished.length > 0 && analytics.topPublished.some(p => p.views !== null) && (
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Top published posts
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              By views
            </span>
          </div>
          <ul className="divide-y divide-border/40">
            {analytics.topPublished
              .filter(p => p.views !== null)
              .slice(0, 8)
              .map((post, i) => (
              <li
                key={post.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white ${
                    PLATFORM_COLOR[post.platform] ?? 'bg-gray-500'
                  }`}
                >
                  {PLATFORM_LABELS[post.platform] ?? post.platform}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {post.contentTitle ?? 'Untitled'}
                  </p>
                  {post.published_at && (
                    <p className="text-[10px] text-muted-foreground/60">
                      Published {new Date(post.published_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums text-muted-foreground">
                  {post.views !== null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="h-3 w-3" /> {formatNum(post.views)}
                    </span>
                  )}
                  {post.likes !== null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {formatNum(post.likes)}
                    </span>
                  )}
                  {post.comments !== null && (
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" /> {formatNum(post.comments)}
                    </span>
                  )}
                </div>
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[10px] font-medium text-primary hover:underline"
                  >
                    View
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Conversion funnel ── */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Conversion funnel
          </p>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            All-time
          </span>
        </div>

        <div className="grid grid-cols-1 divide-border/40 sm:grid-cols-4 sm:divide-x">
          {analytics.funnel.map((stage, i) => {
            const barWidth = Math.max(Math.round((stage.count / funnelMax) * 100), 4)
            return (
              <div
                key={stage.key}
                className="flex flex-col gap-2 border-b border-border/40 p-5 last:border-b-0 sm:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    {stage.key === 'exported' ? 'Published' : stage.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-3xl font-semibold tabular-nums">
                    {stage.count}
                  </span>
                  {stage.conversion !== null && (
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        stage.conversion >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : stage.conversion >= 30
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {stage.conversion}% ↓
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Stuck drafts + Platform coverage ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Stuck drafts — spans 3/5 */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Stuck drafts
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {analytics.stuckDrafts.length} · &gt;7d old
            </span>
          </div>
          {analytics.stuckDrafts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500/60" />
              <p className="text-sm font-semibold text-foreground">Nothing stuck</p>
              <p className="text-xs text-muted-foreground">
                All drafts have been touched within the last week.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {analytics.stuckDrafts.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
                >
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      d.state === 'draft'
                        ? 'bg-zinc-100 text-zinc-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {STATE_LABEL[d.state]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {d.title ?? 'Untitled'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                      {PLATFORM_LABELS[d.platform] ?? d.platform}
                      <span className="mx-1.5 text-muted-foreground/30">·</span>
                      {d.daysSince}d without update
                    </p>
                  </div>
                  <Link
                    href={`/workspace/${currentWorkspace.id}/content/${d.contentId}/outputs`}
                    className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-primary/70 transition-colors hover:text-primary"
                  >
                    Review
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Platform coverage — spans 2/5 */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card lg:col-span-2">
          <div className="border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Platform coverage
            </p>
          </div>
          <div className="space-y-3 p-5">
            {totalItemsWithCoverage === 0 ? (
              <p className="text-xs text-muted-foreground">
                Import content to see coverage.
              </p>
            ) : (
              <>
                <CoverageRow
                  label="All 4 platforms"
                  count={analytics.platformCoverage.full}
                  total={totalItemsWithCoverage}
                  color="bg-emerald-500"
                />
                <CoverageRow
                  label="Some platforms"
                  count={analytics.platformCoverage.partial}
                  total={totalItemsWithCoverage}
                  color="bg-amber-400"
                />
                <CoverageRow
                  label="No outputs yet"
                  count={analytics.platformCoverage.none}
                  total={totalItemsWithCoverage}
                  color="bg-zinc-300"
                />
              </>
            )}
          </div>
        </section>
      </div>

      {/* ── Timeline row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Imports · last 6 months
            </p>
          </div>
          <div className="p-5">
            <BarChart data={analytics.contentByMonth} color="bg-primary" />
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Drafts generated · last 6 months
            </p>
          </div>
          <div className="p-5">
            <BarChart data={analytics.outputsByMonth} color="bg-blue-500" />
          </div>
        </section>
      </div>

      {/* ── Platform + draft state breakdown row ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Drafts by platform
            </p>
          </div>
          <div className="space-y-3 p-5">
            {Object.keys(PLATFORM_LABELS)
              .filter((p) => (analytics.platformBreakdown[p] ?? 0) > 0 || ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'].includes(p))
              .map((platform) => {
              const count = analytics.platformBreakdown[platform] ?? 0
              const pct = Math.round((count / maxPlatform) * 100)
              return (
                <div key={platform} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {PLATFORM_LABELS[platform]}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        PLATFORM_COLOR[platform] ?? 'bg-primary'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.values(analytics.platformBreakdown).every((v) => v === 0) && (
              <p className="text-xs text-muted-foreground">No drafts yet.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Draft status
            </p>
          </div>
          <div className="space-y-3 p-5">
            {(['draft', 'review', 'approved', 'exported'] as const).map((state) => {
              const count = analytics.stateBreakdown[state] ?? 0
              const total = Object.values(analytics.stateBreakdown).reduce(
                (a, b) => a + b,
                0,
              )
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={state} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{STATE_LABEL[state]}</span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${STATE_COLOR[state] ?? 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* ── Top content by stars ── */}
      {analytics.topContent.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Top content by stars
            </p>
          </div>
          <ul className="divide-y divide-border/40">
            {analytics.topContent.map((item, i) => (
              <li
                key={item.id}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <Link
                  href={`/workspace/${currentWorkspace.id}/content/${item.id}/outputs`}
                  className="min-w-0 flex-1 truncate text-sm font-semibold hover:text-primary"
                >
                  {item.title ?? 'Untitled'}
                </Link>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  <Star className="h-2.5 w-2.5 fill-current" />
                  {item.starred}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">
                  {item.total_outputs} drafts
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Connect CTA (only when no engagement data yet) ── */}
      {!hasEngagement && analytics.totalContent > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">
              Want to see real engagement data here?
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              Connect Upload-Post in AI Connections to publish posts and track views, likes, comments, and shares for each platform.
            </p>
          </div>
          <Link
            href="/settings/ai-keys"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-xl border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
          >
            Connect
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  helper,
  delta,
  badge,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
  helper: string
  delta?: number | null
  badge?: { label: string; class: string }
  tint: 'primary' | 'violet' | 'emerald' | 'amber'
}) {
  const iconBg =
    tint === 'primary'
      ? 'bg-primary/10 text-primary'
      : tint === 'violet'
        ? 'bg-violet-50 text-violet-600'
        : tint === 'emerald'
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-amber-50 text-amber-600'

  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        {delta !== undefined && <DeltaBadge pct={delta ?? null} />}
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.class}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div>
        <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {label}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{helper}</p>
      </div>
    </div>
  )
}

function EngagementStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-4">
      <Icon className="h-4 w-4 text-muted-foreground/60" />
      <span className="font-mono text-2xl font-semibold tabular-nums">
        {formatNum(value)}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
    </div>
  )
}

function MicroStat({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
}) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
      <Icon className="h-3 w-3" />
      {formatNum(value)}
    </span>
  )
}

function CoverageRow({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
