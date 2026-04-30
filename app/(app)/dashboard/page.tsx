import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileVideo,
  Layers,
  Sparkles,
  Upload,
  Wand2,
  Send,
} from 'lucide-react'

import { Hero, StripPill } from '@/components/ui/editorial'
import { Reveal } from '@/components/ui/editorial-motion'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAnalytics } from '@/lib/dashboard/get-analytics'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

// ── Crextio palette ───────────────────────────────────────────────────────
// Cream + warm yellow + dark charcoal. This page intentionally departs from
// the rest of Clipflow's violet identity — the dashboard is the one place
// users come to *feel* the data, not edit it. Tokens here so they're easy
// to nudge in one spot.
const PALETTE = {
  pageBg: 'linear-gradient(125deg, #B5B8C2 0%, #D4D1BE 32%, #EDDB8B 100%)',
  cardCream: '#F9F4DC',
  cardWhite: '#FFFFFF',
  yellow: '#F4D93D',
  yellowSoft: '#F9E97A',
  yellowDeep: '#DCB91F',
  yellowGold: '#F0CC2A',
  charcoal: '#0F0F0F',
  ink: '#0F0F0F',
  inkSoft: '#2A2A2A',
  muted: '#7A7468',
  border: 'rgba(15, 15, 15, 0.06)',
  borderStrong: 'rgba(15, 15, 15, 0.14)',
  trackBg: 'rgba(15, 15, 15, 0.06)',
  // Suggests light from above on cream cards. Tiny but feels editorial.
  cardInset: 'inset 0 1px 0 rgba(255, 255, 255, 0.7)',
  // Hover lift — applied via class on cards.
  cardHoverShadow: '0 12px 32px rgba(15, 15, 15, 0.06)',
}

const STATE_LABEL: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
}

// Shared card classes — inset highlight + hover lift. Box-shadow lives in
// className so hover: can stack a second shadow without inline-style fights.
const CARD_CREAM = [
  'rounded-[24px] p-5',
  '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7)]',
  'transition-all duration-200',
  'hover:scale-[1.012]',
  'hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.7),0_12px_32px_rgba(15,15,15,0.06)]',
].join(' ')
const CARD_DARK = [
  'rounded-[24px] p-5',
  '[box-shadow:inset_0_1px_0_rgba(255,255,255,0.06)]',
  'transition-all duration-200',
].join(' ')


export default async function DashboardPage() {
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

  const supabaseForStats = createClient()
  const [analytics, lastStatsRowResult] = await Promise.all([
    getAnalytics(currentWorkspace.id),
    supabaseForStats
      .from('scheduled_posts')
      .select('stats_fetched_at')
      .eq('workspace_id', currentWorkspace.id)
      .not('stats_fetched_at', 'is', null)
      .order('stats_fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  void lastStatsRowResult

  const totalPublished = analytics.publishingStats.published
  const totalScheduled = analytics.publishingStats.scheduled
  const totalFailed = analytics.publishingStats.failed
  const hasAnyData = analytics.totalContent > 0 || analytics.totalOutputs > 0

  // ─── Derived figures ───────────────────────────────────────────────────
  const importsDelta = analytics.velocityContent.deltaPct ?? 0
  const generatedDelta = analytics.velocityOutputs.deltaPct ?? 0
  const approvalPct = analytics.approvalRate

  const totalAttempted = totalPublished + totalScheduled + totalFailed
  const livePct = totalAttempted > 0 ? Math.round((totalPublished / totalAttempted) * 100) : 0

  // 3-segment funnel (matches Crextio "Onboarding 18%" with 3 progress bars)
  const funnelImported = analytics.funnel.find((s) => s.key === 'imported')?.count ?? 0
  const funnelApproved = analytics.funnel.find((s) => s.key === 'approved')?.count ?? 0
  const funnelLive = analytics.funnel.find((s) => s.key === 'exported')?.count ?? 0
  const funnelDenom = Math.max(funnelImported, 1)
  const stage1Pct = Math.min(100, Math.round((funnelImported / funnelDenom) * 100))
  const stage2Pct = Math.min(100, Math.round((funnelApproved / funnelDenom) * 100))
  const stage3Pct = Math.min(100, Math.round((funnelLive / funnelDenom) * 100))
  const overallFunnel = Math.round((stage1Pct + stage2Pct + stage3Pct) / 3)

  // Featured tile: top-starred content with most outputs.
  const featured = analytics.topContent[0] ?? null

  // Real per-day data for the "Progress" bar chart
  const weekData = analytics.outputsByDayLast7Days.map((d) => {
    const date = new Date(d.day)
    const label = date.toLocaleDateString(undefined, { weekday: 'narrow' })
    return { label, count: d.count, isoDay: d.day }
  })
  const weekMax = Math.max(...weekData.map((d) => d.count), 1)
  const weekTotal = weekData.reduce((a, b) => a + b.count, 0)
  const weekPeakIndex = weekData.findIndex((d) => d.count === weekMax && d.count > 0)

  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        {/* ── Hero: greeting (left) + KPI triade (right) ──────────────── */}
        <Hero
          kicker={`${currentWorkspace.name} · Insights`}
          title={<>Welcome back, {currentWorkspace.name}.</>}
          animated={hasAnyData}
          kpis={[
            { Icon: FileVideo, value: analytics.totalContent, label: 'Videos' },
            { Icon: Layers, value: analytics.totalOutputs, label: 'Posts' },
            { Icon: CheckCircle2, value: analytics.totalApproved, label: 'Approved' },
          ]}
        />

        {!hasAnyData ? (
          // Brand-new workspace — instead of dumping eleven `0`s into a
          // dashboard that looks broken, give the user a clear single
          // path forward. The bento returns once they have data to fill
          // it with.
          <Reveal>
            <EmptyDashboardHero workspaceId={currentWorkspace.id} />
          </Reveal>
        ) : (
          <>
            {/* ── Pulse-strip: 3 percentage indicators in a single
                 unified glassy container (was 4 floating pills). ── */}
            <section
              className="rounded-[20px] p-3.5"
              style={{
                background: 'rgba(255, 253, 248, 0.55)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(15,15,15,0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StripPill
                  label="Velocity"
                  value={Math.round((importsDelta + generatedDelta) / 2)}
                  variant="dark"
                  showSign
                />
                <StripPill label="Approval" value={approvalPct} variant="bar" />
                <StripPill label="Live" value={livePct} variant="accent" />
              </div>
            </section>

            {/* ── Bento grid: 4 cols × 2 rows on lg, 2 cols on sm,
                 stack on mobile. Each tile staggers in by index for a
                 polished entrance. ── */}
            <section className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Reveal index={0} className="row-span-2">
                <FeaturedCard
                  workspaceId={currentWorkspace.id}
                  featured={featured}
                  workspaceName={currentWorkspace.name}
                />
              </Reveal>
              <Reveal index={1}>
                <PostsWeekCard
                  data={weekData}
                  max={weekMax}
                  peakIndex={weekPeakIndex}
                  total={weekTotal}
                />
              </Reveal>
              <Reveal index={2}>
                <ApprovalDonutCard
                  pct={approvalPct}
                  approved={analytics.totalApproved}
                />
              </Reveal>
              <Reveal index={3} className="row-span-2">
                <FunnelStackCard
                  stage1Pct={stage1Pct}
                  stage2Pct={stage2Pct}
                  stage3Pct={stage3Pct}
                  overallPct={overallFunnel}
                  stuckDrafts={analytics.stuckDrafts}
                  workspaceId={currentWorkspace.id}
                />
              </Reveal>
              <Reveal index={4}>
                <ScheduleWeekCard
                  scheduled={totalScheduled}
                  published={totalPublished}
                  workspaceId={currentWorkspace.id}
                />
              </Reveal>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

// ── Featured tall card ──────────────────────────────────────────────────────
function FeaturedCard({
  workspaceId,
  featured,
  workspaceName,
}: {
  workspaceId: string
  featured: { id: string; title: string | null; starred: number; total_outputs: number } | null
  workspaceName: string
}) {
  const hasFeatured = featured !== null

  return (
    <div
      className="group relative flex flex-col justify-end overflow-hidden rounded-[24px] p-5 row-span-2 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.55)] transition-all duration-200 hover:scale-[1.012] hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.55),0_16px_40px_rgba(220,185,31,0.18)]"
      style={{
        background: `linear-gradient(170deg, ${PALETTE.yellowSoft} 0%, ${PALETTE.yellow} 55%, ${PALETTE.yellowDeep} 100%)`,
        border: `1px solid ${PALETTE.border}`,
        minHeight: 360,
      }}
    >
      {/* Hairline print-frame — inset 12px from each edge. Pure editorial
          ornament, says "this card is the hero". */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[16px] border"
        style={{ borderColor: 'rgba(15,15,15,0.16)' }}
      />

      {/* Subtle grain overlay — premium "paper" texture. SVG noise inline so
          we don't ship an extra asset request. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: '160px 160px',
        }}
      />

      {/* Decorative ornament — top-right sparkle (drops out when a stat
          tag takes that corner). */}
      {!hasFeatured && (
        <Sparkles
          aria-hidden
          className="absolute right-7 top-7 h-7 w-7"
          style={{ color: PALETTE.ink, opacity: 0.28 }}
        />
      )}

      {/* Top-right stat tag — Crextio's "$1,200" pill, our equivalent is
          the workflow's headline count when there's data to brag about. */}
      {hasFeatured && (
        <span
          className="absolute right-5 top-5 inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold tabular-nums"
          style={{
            background: 'rgba(15,15,15,0.10)',
            color: PALETTE.ink,
            border: `1px solid ${PALETTE.borderStrong}`,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
        >
          {featured.total_outputs}× drafts
        </span>
      )}

      {/* Bottom-left content */}
      <div className="relative z-10 flex flex-col gap-1.5 pl-2">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.22em]"
          style={{
            color: PALETTE.charcoal,
            opacity: 0.6,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
        >
          {hasFeatured ? 'Top performer' : 'Workspace'}
        </p>
        <h3
          className="text-[26px] leading-[1.02]"
          style={{
            fontFamily: 'var(--font-instrument-serif), Georgia, serif',
            color: PALETTE.ink,
            fontWeight: 400,
            letterSpacing: '-0.012em',
          }}
        >
          {hasFeatured ? (featured.title ?? 'Untitled') : workspaceName}
        </h3>

        {hasFeatured && (
          <p
            className="text-[11px] tabular-nums"
            style={{
              color: PALETTE.inkSoft,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {featured.total_outputs} draft{featured.total_outputs === 1 ? '' : 's'}
            {featured.starred > 0 ? ` · ${featured.starred} starred` : ''}
          </p>
        )}

        <Link
          href={
            hasFeatured
              ? `/workspace/${workspaceId}/content/${featured.id}/outputs`
              : `/workspace/${workspaceId}`
          }
          className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-transform duration-200 group-hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4D93D]"
          style={{
            background: 'rgba(15,15,15,0.08)',
            color: PALETTE.ink,
            border: `1px solid ${PALETTE.borderStrong}`,
          }}
        >
          {hasFeatured ? 'Open drafts' : 'Open workflow'}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

// ── Posts this week — bar chart ─────────────────────────────────────────────
function PostsWeekCard({
  data,
  max,
  peakIndex,
  total,
}: {
  data: Array<{ label: string; count: number; isoDay: string }>
  max: number
  peakIndex: number
  total: number
}) {
  return (
    <div
      className={`flex flex-col justify-between gap-4 ${CARD_CREAM}`}
      style={{ background: PALETTE.cardCream, border: `1px solid ${PALETTE.border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
            Progress
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span
              className="text-[34px] leading-none tabular-nums"
              style={{
                fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
                color: PALETTE.ink,
                fontWeight: 400,
                letterSpacing: '-0.025em',
              }}
            >
              {total}
            </span>
            <span className="text-[11px] leading-tight" style={{ color: PALETTE.inkSoft }}>
              posts
              <br />
              this week
            </span>
          </div>
        </div>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(15,15,15,0.06)' }}
          aria-hidden
        >
          <ArrowUpRight className="h-4 w-4" style={{ color: PALETTE.ink }} />
        </span>
      </div>

      <div className="flex h-[88px] items-end gap-1.5">
        {data.map((d, i) => {
          const isPeak = i === peakIndex && d.count > 0
          const heightPct = Math.max(Math.round((d.count / max) * 100), d.count > 0 ? 8 : 4)
          return (
            <div key={d.isoDay} className="relative flex flex-1 flex-col items-center gap-1.5">
              {isPeak && (
                <span
                  className="absolute -top-5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums"
                  style={{ background: PALETTE.yellow, color: PALETTE.ink }}
                >
                  {d.count}
                </span>
              )}
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-full transition-all duration-500"
                  style={{
                    height: `${heightPct}%`,
                    background: isPeak ? PALETTE.yellow : PALETTE.charcoal,
                    minHeight: 4,
                  }}
                />
              </div>
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ color: PALETTE.inkSoft }}
              >
                {d.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Approval donut ──────────────────────────────────────────────────────────
function ApprovalDonutCard({
  pct,
  approved,
}: {
  pct: number
  approved: number
}) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(Math.max(pct, 0), 100) / 100) * circumference

  return (
    <div
      className={`flex flex-col justify-between gap-2 ${CARD_CREAM}`}
      style={{ background: PALETTE.cardCream, border: `1px solid ${PALETTE.border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
          Approval rate
        </p>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'rgba(15,15,15,0.06)' }}
          aria-hidden
        >
          <ArrowUpRight className="h-4 w-4" style={{ color: PALETTE.ink }} />
        </span>
      </div>

      <div className="relative mx-auto flex h-[110px] w-[110px] items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
          {/* Solid muted track — visible even at 0% so the ring shape
              always reads as "approval rate ring" rather than empty space. */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(15,15,15,0.10)"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Yellow fill — the actual approval percentage. Linear gradient
              gives the arc dimension instead of a flat highlight. */}
          <defs>
            <linearGradient id="donut-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={PALETTE.yellowSoft} />
              <stop offset="100%" stopColor={PALETTE.yellowDeep} />
            </linearGradient>
          </defs>
          {pct > 0 && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="url(#donut-fill)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
            />
          )}
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className="text-[24px] leading-none tabular-nums"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            {pct}%
          </span>
          <span className="mt-0.5 text-[9.5px] uppercase tracking-wider" style={{ color: PALETTE.inkSoft }}>
            of reviewed
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span
          className="flex h-6 items-center rounded-full px-2.5 text-[10px] font-semibold"
          style={{ background: PALETTE.charcoal, color: '#FFFFFF' }}
        >
          {approved} approved
        </span>
        <span
          className="text-[10px] tabular-nums"
          style={{
            color: PALETTE.inkSoft,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
          }}
        >
          all-time
        </span>
      </div>
    </div>
  )
}

// ── Funnel + stuck-drafts tall stack (col 4, both rows) ─────────────────────
function FunnelStackCard({
  stage1Pct,
  stage2Pct,
  stage3Pct,
  overallPct,
  stuckDrafts,
  workspaceId,
}: {
  stage1Pct: number
  stage2Pct: number
  stage3Pct: number
  overallPct: number
  stuckDrafts: Array<{
    id: string
    title: string | null
    state: 'draft' | 'review'
    daysSince: number
    contentId: string
  }>
  workspaceId: string
}) {
  // Conversions between stages — what makes a funnel a funnel.
  // stage2Conv: approved / imported. stage3Conv: live / approved.
  const stage2Conv = stage1Pct > 0 ? Math.round((stage2Pct / stage1Pct) * 100) : 0
  const stage3Conv = stage2Pct > 0 ? Math.round((stage3Pct / stage2Pct) * 100) : 0

  return (
    <div className="flex flex-col gap-3 row-span-2" style={{ minHeight: 360 }}>
      {/* Top: True funnel ladder — bar widths decrease with conversion,
          arrow chips show stage-to-stage conversion %. */}
      <div
        className={`flex flex-col gap-2 ${CARD_CREAM}`}
        style={{ background: PALETTE.cardCream, border: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[12px]" style={{ color: PALETTE.inkSoft }}>
            Funnel
          </span>
          <span
            className="text-[26px] leading-none tabular-nums"
            style={{
              fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            {overallPct}%
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {/* IMPORTED is the funnel baseline — bar = 100% when there ARE
              imports, 0 when the workspace is empty. Same for the rest. */}
          <FunnelLadderRow
            label="Imported"
            widthPct={stage1Pct > 0 ? 100 : 0}
            variant="yellow"
          />
          <FunnelArrow conversion={stage2Conv} />
          <FunnelLadderRow label="Approved" widthPct={stage2Pct} variant="dark" />
          <FunnelArrow conversion={stage3Conv} />
          <FunnelLadderRow label="Live" widthPct={stage3Pct} variant="muted" />
        </div>
      </div>

      {/* Bottom: dark stuck-drafts task list (matches Crextio Onboarding Tasks) */}
      <div
        className={`flex flex-1 flex-col gap-3 ${CARD_DARK}`}
        style={{ background: PALETTE.charcoal }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold" style={{ color: '#FFFFFF' }}>
            Stuck drafts
          </span>
          <span
            className="text-[11px] tabular-nums"
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {stuckDrafts.length}
          </span>
        </div>

        {stuckDrafts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-6 w-6" style={{ color: PALETTE.yellow }} />
            <p className="text-[12px] font-semibold" style={{ color: '#FFFFFF' }}>
              You&apos;re caught up.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {stuckDrafts.slice(0, 5).map((d) => (
              <li key={d.id} className="flex items-center gap-2.5 rounded-lg p-1">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  aria-hidden
                >
                  <FileVideo
                    className="h-3 w-3"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12px] font-semibold"
                    style={{ color: '#FFFFFF' }}
                  >
                    {d.title ?? 'Untitled'}
                  </p>
                  <p
                    className="text-[10px] tabular-nums"
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                    }}
                  >
                    {STATE_LABEL[d.state] ?? d.state} · {d.daysSince}d cold
                  </p>
                </div>
                <Link
                  href={`/workspace/${workspaceId}/content/${d.contentId}/outputs`}
                  aria-label={`Review ${d.title ?? 'draft'}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4D93D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]"
                  style={{ background: PALETTE.yellow }}
                >
                  <ChevronRight className="h-3 w-3" style={{ color: PALETTE.ink }} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// FunnelLadderRow — one stage of the true funnel.
//
// Layout: [fixed-width label LEFT] [bar fills remaining row · width = pct]
// The label always lives outside the bar, so a 0%-bar still reads cleanly
// instead of showing truncated "APPROVED 0%" inside a 28%-wide bar.
// Percentage chip floats inside the bar when it fits, falls outside on
// the right when the bar is too narrow.
function FunnelLadderRow({
  label,
  widthPct,
  variant,
}: {
  label: string
  widthPct: number
  variant: 'yellow' | 'dark' | 'muted'
}) {
  const fill =
    variant === 'yellow'
      ? PALETTE.yellow
      : variant === 'dark'
        ? PALETTE.charcoal
        : 'rgba(15, 15, 15, 0.22)'
  const pctColor = variant === 'dark' ? '#FFFFFF' : PALETTE.ink
  // Always show at least a sliver — readers expect to see "the bar exists".
  const w = Math.max(4, Math.min(100, widthPct))
  // Below ~18% the bar is too narrow for the percent chip to sit inside.
  const pctOutside = w < 18

  // First letter of the stage name doubles as a non-color stage
  // indicator — so users with color-vision-deficiency don't rely on
  // yellow-vs-charcoal-vs-grey to read the funnel order.
  const stageLetter = label.charAt(0).toUpperCase()
  return (
    <div className="flex items-center gap-3">
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums"
        style={{
          background:
            variant === 'yellow'
              ? PALETTE.ink
              : variant === 'dark'
                ? PALETTE.yellow
                : 'rgba(15,15,15,0.10)',
          color:
            variant === 'yellow'
              ? PALETTE.yellow
              : variant === 'dark'
                ? PALETTE.ink
                : PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
        aria-hidden
      >
        {stageLetter}
      </span>
      <span
        className="w-14 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: PALETTE.inkSoft }}
      >
        {label}
      </span>
      <div className="relative h-7 flex-1">
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full px-2.5 transition-all duration-700"
          style={{
            width: `${w}%`,
            background: fill,
            boxShadow:
              variant === 'yellow'
                ? 'inset 0 1px 0 rgba(255,255,255,0.45), 0 1px 2px rgba(15,15,15,0.05)'
                : variant === 'dark'
                  ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
                  : undefined,
          }}
        >
          {!pctOutside && (
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{
                color: pctColor,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              {widthPct}%
            </span>
          )}
        </div>
        {pctOutside && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums"
            style={{
              left: `calc(${w}% + 8px)`,
              color: PALETTE.inkSoft,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            {widthPct}%
          </span>
        )}
      </div>
    </div>
  )
}

// FunnelArrow — conversion-rate chip between stages. The "→ 72%"
// vocabulary that turns three bars into a real funnel narrative.
function FunnelArrow({ conversion }: { conversion: number }) {
  return (
    <div className="flex items-center gap-1.5 pl-3">
      <span
        aria-hidden
        className="block h-3 w-px"
        style={{ background: 'rgba(15,15,15,0.18)' }}
      />
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.14em] tabular-nums"
        style={{
          color: PALETTE.inkSoft,
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        ↓ {conversion}%
      </span>
    </div>
  )
}

// ── EmptyDashboardHero — full-width path-forward when the workspace
//    has zero content. Replaces the old "everything reads 0%" bento
//    grid with a single decisive CTA and the three-step recipe.  ────────────
function EmptyDashboardHero({ workspaceId }: { workspaceId: string }) {
  const steps: Array<{
    n: string
    label: string
    sub: string
    Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  }> = [
    {
      n: '01',
      label: 'Import',
      sub: 'Drop a video, paste a YouTube link, or upload a script.',
      Icon: Upload,
    },
    {
      n: '02',
      label: 'Generate',
      sub: 'Hooks, captions, carousels — written in your voice.',
      Icon: Wand2,
    },
    {
      n: '03',
      label: 'Schedule',
      sub: 'Approve, queue across channels, auto-publish.',
      Icon: Send,
    },
  ]
  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-6 sm:p-9"
      style={{
        background: `linear-gradient(160deg, ${PALETTE.yellowSoft} 0%, ${PALETTE.yellow} 55%, ${PALETTE.yellowDeep} 100%)`,
        border: `1px solid ${PALETTE.border}`,
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.55), 0 18px 46px -22px rgba(220,185,31,0.45)',
      }}
    >
      {/* Print-frame ornament — same hairline trick as Featured. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[20px] border"
        style={{ borderColor: 'rgba(15,15,15,0.16)' }}
      />
      {/* Grain — paper texture so the gradient doesn't feel flat. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-multiply"
        style={{
          opacity: 0.04,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: '160px 160px',
        }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span
            className="text-[10px] font-semibold uppercase"
            style={{
              color: 'rgba(15,15,15,0.6)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.22em',
            }}
          >
            — Get started
          </span>
          <h2
            className="m-0"
            style={{
              fontFamily: 'var(--font-instrument-serif), Georgia, serif',
              fontSize: 'clamp(34px, 4.6vw, 54px)',
              lineHeight: 1,
              letterSpacing: '-0.022em',
              color: PALETTE.ink,
              fontWeight: 400,
            }}
          >
            Let&rsquo;s make your first
            <br />
            month of posts.
          </h2>
          <p
            className="m-0 max-w-[52ch] text-[14px]"
            style={{ color: PALETTE.inkSoft, lineHeight: 1.55 }}
          >
            One recording becomes hooks, captions, carousels and clips on every
            channel — usually in under four minutes. BYOK for AI, so you pay your
            providers at cost.
          </p>
        </div>

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,253,248,0.55)',
                border: '1px solid rgba(15,15,15,0.10)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)',
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid h-6 w-6 place-items-center rounded-md"
                  style={{ background: PALETTE.ink, color: PALETTE.yellow }}
                >
                  <s.Icon className="h-3 w-3" />
                </span>
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{
                    color: 'rgba(15,15,15,0.6)',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    letterSpacing: '0.22em',
                  }}
                >
                  {s.n}
                </span>
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: PALETTE.ink }}
                >
                  {s.label}
                </span>
              </div>
              <p
                className="mt-2 text-[12px]"
                style={{ color: PALETTE.inkSoft, lineHeight: 1.5 }}
              >
                {s.sub}
              </p>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}/content/new`}
            className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-bold transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background: PALETTE.ink,
              color: PALETTE.yellow,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 18px -6px rgba(15,15,15,0.45)',
            }}
          >
            <Upload className="h-4 w-4" />
            Import your first recording
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/workspace/${workspaceId}`}
            className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors hover:bg-[rgba(15,15,15,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              border: `1px solid ${PALETTE.borderStrong}`,
              color: PALETTE.ink,
            }}
          >
            Open Workflow
          </Link>
          <span
            className="ml-auto hidden text-[10px] font-semibold uppercase sm:inline"
            style={{
              color: 'rgba(15,15,15,0.55)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.22em',
            }}
          >
            ↳ Average setup · 4 min
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Schedule preview week strip (col 3 row 2) ───────────────────────────────
function ScheduleWeekCard({
  scheduled,
  published,
  workspaceId,
}: {
  scheduled: number
  published: number
  workspaceId: string
}) {
  const today = new Date()
  const dayIdx = (today.getDay() + 6) % 7 // Mon=0..Sun=6
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayIdx)
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  return (
    <Link
      href={`/workspace/${workspaceId}/schedule`}
      className={`flex flex-col justify-between gap-4 ${CARD_CREAM} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
      style={{ background: PALETTE.cardCream, border: `1px solid ${PALETTE.border}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" style={{ color: PALETTE.inkSoft }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{
              color: PALETTE.inkSoft,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
            }}
          >
            This week
          </span>
        </div>
        <ArrowUpRight className="h-3.5 w-3.5" style={{ color: PALETTE.ink }} />
      </div>

      <div className="grid grid-cols-6 gap-1 text-center">
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString()
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ color: PALETTE.inkSoft }}
              >
                {d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}
              </span>
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums"
                style={{
                  background: isToday ? PALETTE.charcoal : 'transparent',
                  color: isToday ? '#FFFFFF' : PALETTE.ink,
                  border: isToday ? undefined : `1px solid ${PALETTE.border}`,
                }}
              >
                {d.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-[11px]" style={{ color: PALETTE.inkSoft }}>
        <span
          className="tabular-nums"
          style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          {scheduled} queued · {published} live
        </span>
        <span
          className="flex items-center gap-1 text-[12px] font-semibold"
          style={{ color: PALETTE.ink }}
        >
          Open <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
