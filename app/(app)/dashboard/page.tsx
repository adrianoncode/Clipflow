import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  CheckCircle2,
  FileVideo,
  Layers,
  Send,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react'

import { Hero, StripPill } from '@/components/ui/editorial'
import { Reveal } from '@/components/ui/editorial-motion'
import { AnimatedDonut } from '@/components/dashboard/animated-donut'
import { BarChartRange } from '@/components/dashboard/bar-chart-range'
import { FeaturedCard } from '@/components/dashboard/featured-card'
import { FunnelStackCard } from '@/components/dashboard/funnel-stack'
import { RangeFilter } from '@/components/dashboard/range-filter'
import { ScheduleWeekCard } from '@/components/dashboard/schedule-week-card'
import { TimeAwareGreeting } from '@/components/dashboard/time-aware-greeting'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAnalytics } from '@/lib/dashboard/get-analytics'
import { DASHBOARD_PALETTE as PALETTE } from '@/lib/dashboard/palette'
import { parseRange, RANGE_LABELS } from '@/lib/dashboard/range'
import { buildNarrative } from '@/lib/dashboard/narrative'
import { computeNextAction } from '@/lib/dashboard/next-action'
import { getDashboardQuota } from '@/lib/dashboard/quota'
import { QuotaIndicator } from '@/components/dashboard/quota-indicator'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

interface DashboardPageProps {
  searchParams: { range?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const range = parseRange(searchParams.range)

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

  const [analytics, quota] = await Promise.all([
    getAnalytics(currentWorkspace.id, range),
    getDashboardQuota(currentWorkspace.id),
  ])

  const totalPublished = analytics.publishingStats.published
  const totalScheduled = analytics.publishingStats.scheduled
  const totalFailed = analytics.publishingStats.failed

  // ── Progressive states ─────────────────────────────────────────────
  // Three states drive what the dashboard body renders:
  //   • "blank"      → nothing imported. Yellow hero + 3-step recipe.
  //   • "imported"   → videos imported but no outputs generated yet.
  //                    Mid-state hero — points to Generate, not Import.
  //   • "active"     → at least one output exists. Full bento dashboard.
  // The previous binary `hasAnyData = content>0 || outputs>0` skipped
  // the mid-state and dropped users into a sea of zero-percent tiles.
  const hasOutputs = analytics.totalOutputs > 0
  const hasImports = analytics.totalContent > 0
  const stage: 'blank' | 'imported' | 'active' = hasOutputs
    ? 'active'
    : hasImports
      ? 'imported'
      : 'blank'

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

  // FeaturedCard's "what should the user do next?" recommendation —
  // computed server-side so the card body is dumb and just renders
  // whatever action it gets handed. Decision tree lives in
  // lib/dashboard/next-action.ts.
  const nextAction = computeNextAction({
    analytics,
    workspaceName: currentWorkspace.name,
  })

  // Bucket-shaped chart data. Naming was `weekData/weekMax/weekTotal/
  // weekPeakIndex` from when this component only ever showed a 7-day
  // window; the bucket vocabulary cleared up after Phase 2 made
  // bucketing range-aware.
  const bucketData = analytics.outputsByBucket.map((b) => ({
    label: b.label,
    count: b.count,
    isoDay: b.isoStart,
  }))
  const bucketMax = Math.max(...bucketData.map((d) => d.count), 1)
  const bucketTotal = bucketData.reduce((a, b) => a + b.count, 0)
  const bucketPeakIndex = bucketData.findIndex(
    (d) => d.count === bucketMax && d.count > 0,
  )

  // One-line "what's changed" summary, computed server-side from
  // analytics. Only shown in the active stage — blank/imported states
  // already have a hero that does the same job louder.
  const narrative = stage === 'active' ? buildNarrative(analytics, range) : null

  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        {/* ── Hero: greeting (left) + KPI triade (right) ────────────────
             KPI animations only kick in once there's real data to count
             up to — for blank/imported workspaces showing 0 → 0 with a
             tween reads as fake motion. */}
        <Hero
          kicker={`${currentWorkspace.name} · Insights`}
          title={<TimeAwareGreeting name={currentWorkspace.name} />}
          animated={stage === 'active'}
          kpis={[
            {
              Icon: FileVideo,
              value: analytics.totalContent,
              label: 'Videos',
              // null when no prior baseline — KpiDelta hides the chip
              // entirely instead of showing a misleading "0%".
              delta: analytics.velocityContent.deltaPct,
            },
            {
              Icon: Layers,
              value: analytics.totalOutputs,
              label: 'Posts',
              delta: analytics.velocityOutputs.deltaPct,
            },
            // Approved has no period-over-period delta in the analytics
            // schema yet — leave delta off so the chip is hidden.
            { Icon: CheckCircle2, value: analytics.totalApproved, label: 'Approved' },
          ]}
        />

        {stage === 'blank' ? (
          <Reveal>
            <EmptyDashboardHero workspaceId={currentWorkspace.id} />
          </Reveal>
        ) : stage === 'imported' ? (
          <Reveal>
            <ImportedNoOutputsHero
              workspaceId={currentWorkspace.id}
              importedCount={analytics.totalContent}
            />
          </Reveal>
        ) : (
          <>
            {/* ── "What's changed" narrative — one sentence summary
                 server-rendered from analytics. Shows on top of the
                 range filter so the reader sees the take-away before
                 the controls. Aria-live=polite keeps screen-readers in
                 sync when the user re-ranges and the line updates. ── */}
            {narrative && (
              <Reveal>
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2.5 rounded-2xl px-4 py-3"
                  style={{
                    background: 'rgba(255, 253, 248, 0.7)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${
                      narrative.tone === 'critical'
                        ? 'rgba(155,32,24,0.25)'
                        : narrative.tone === 'caution'
                          ? 'rgba(204,132,37,0.25)'
                          : narrative.tone === 'positive'
                            ? 'rgba(15,107,77,0.18)'
                            : 'rgba(15,15,15,0.08)'
                    }`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
                  }}
                >
                  {/* Tone-coloured dot — matches the legal-footer
                      "secure" indicator pattern so the language of
                      severity reads consistently across the app. */}
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background:
                        narrative.tone === 'critical'
                          ? '#9B2018'
                          : narrative.tone === 'caution'
                            ? '#CC8425'
                            : narrative.tone === 'positive'
                              ? '#0F6B4D'
                              : '#7A7468',
                    }}
                  />
                  <p
                    className="m-0 text-[13px] font-medium"
                    style={{ color: PALETTE.ink, lineHeight: 1.45 }}
                  >
                    {/* Severity prefix in bold — colour alone isn't an
                        accessible signal (~8% of men can't reliably
                        distinguish red/green), so the bold-text marker
                        carries the same information without leaning on
                        the dot/border tone. */}
                    {narrative.tone === 'critical' && (
                      <strong style={{ fontWeight: 700 }}>Heads up — </strong>
                    )}
                    {narrative.tone === 'caution' && (
                      <strong style={{ fontWeight: 700 }}>Slowdown — </strong>
                    )}
                    {narrative.tone === 'positive' && (
                      <strong style={{ fontWeight: 700 }}>Looking good — </strong>
                    )}
                    {narrative.text}
                  </p>
                </div>
              </Reveal>
            )}

            {/* ── Quota indicator — slim row showing the metric
                 closest to its monthly cap. Self-hides on unlimited
                 plans. Drives Stripe-style "you're on Plan X, here's
                 where you stand" awareness without dedicated billing
                 UI. ── */}
            {quota && (
              <Reveal>
                <QuotaIndicator
                  planName={quota.planName}
                  metricLabel={quota.metricLabel}
                  used={quota.used}
                  limit={quota.limit}
                  isPaid={quota.isPaid}
                  upgradeHref="/billing"
                />
              </Reveal>
            )}

            {/* ── Range filter: segmented pill, URL-sync. Sits on top
                 of the pulse strip so the user controls the comparison
                 window before reading the deltas underneath. ── */}
            <div className="flex items-center justify-between gap-3">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  color: PALETTE.inkSoft,
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                }}
              >
                {RANGE_LABELS[range]}
              </span>
              <RangeFilter active={range} />
            </div>
            {/* ── Pulse-strip: 4 animated percent indicators in a glassy
                 container. Each pill rolls 0 → target on mount and
                 breathes subtly to feel "alive".

                 The previous "Velocity" pill averaged the imports- and
                 outputs-delta which is mathematically meaningless
                 (averaging two ratios with different denominators).
                 Split into two honest deltas + the two existing rate
                 metrics. Four also visually rhymes with the 4-column
                 bento underneath. ── */}
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StripPill
                  animated
                  label="Imports"
                  value={importsDelta}
                  variant="dark"
                  showSign
                />
                <StripPill
                  animated
                  label="Outputs"
                  value={generatedDelta}
                  variant="outline"
                  showSign
                />
                <StripPill animated label="Approval" value={approvalPct} variant="bar" />
                <StripPill animated label="Live" value={livePct} variant="accent" />
              </div>
            </section>

            {/* ── Bento grid: stagger reveal + each tile owns its own
                 mount/hover motion. ── */}
            <section className="grid auto-rows-[220px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Reveal index={0} className="row-span-2">
                <FeaturedCard
                  workspaceId={currentWorkspace.id}
                  action={nextAction}
                />
              </Reveal>
              <Reveal index={1}>
                <BarChartRange
                  data={bucketData}
                  max={bucketMax}
                  peakIndex={bucketPeakIndex}
                  total={bucketTotal}
                  rangeLabel={RANGE_LABELS[range]}
                />
              </Reveal>
              <Reveal index={2}>
                <AnimatedDonut pct={approvalPct} approved={analytics.totalApproved} />
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
                  upcoming={analytics.upcomingPosts}
                />
              </Reveal>
            </section>
          </>
        )}
      </div>
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
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[20px] border"
        style={{ borderColor: 'rgba(15,15,15,0.16)' }}
      />
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
              className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,15,15,0.10)]"
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
            className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_22px_-6px_rgba(15,15,15,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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

// ── ImportedNoOutputsHero — mid-state for the "I've imported videos
//    but never generated drafts" path. Same paper-yellow surface as
//    the blank hero so the visual rhythm carries; the copy + CTA
//    swap to "Generate", and the workspace's actual import count is
//    surfaced as the eyebrow so the reader sees their progress instead
//    of a generic welcome message.
//
//    Why a separate component: the blank hero teaches the 3-step
//    recipe; this hero assumes step 1 is done and pushes hard on
//    step 2. Same shell, different choreography. Sharing one
//    component with conditional rendering would be cheaper but harder
//    to evolve — each state has its own copy iteration cadence.
function ImportedNoOutputsHero({
  workspaceId,
  importedCount,
}: {
  workspaceId: string
  importedCount: number
}) {
  const noun = importedCount === 1 ? 'recording' : 'recordings'
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
      <span
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[20px] border"
        style={{ borderColor: 'rgba(15,15,15,0.16)' }}
      />
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
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase"
            style={{
              color: 'rgba(15,15,15,0.7)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.22em',
            }}
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            Step 02 · Generate drafts
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
            {importedCount} {noun} ready
            <br />
            for the AI pipeline.
          </h2>
          <p
            className="m-0 max-w-[52ch] text-[14px]"
            style={{ color: PALETTE.inkSoft, lineHeight: 1.55 }}
          >
            Pick a workspace, hit Generate, and Clipflow turns each recording
            into hooks, captions, carousels, and clips on every channel — in
            your voice. Most first runs land in under four minutes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}`}
            className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px] font-bold transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_22px_-6px_rgba(15,15,15,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background: PALETTE.ink,
              color: PALETTE.yellow,
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.14), 0 8px 18px -6px rgba(15,15,15,0.45)',
            }}
          >
            <Wand2 className="h-4 w-4" />
            Generate first drafts
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/workspace/${workspaceId}/content/new`}
            className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors hover:bg-[rgba(15,15,15,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F0F0F] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              border: `1px solid ${PALETTE.borderStrong}`,
              color: PALETTE.ink,
            }}
          >
            Import another
          </Link>
          <span
            className="ml-auto hidden text-[10px] font-semibold uppercase sm:inline"
            style={{
              color: 'rgba(15,15,15,0.55)',
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              letterSpacing: '0.22em',
            }}
          >
            ↳ ~ 4 min per recording
          </span>
        </div>
      </div>
    </div>
  )
}
