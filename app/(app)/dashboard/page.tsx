import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  CheckCircle2,
  FileVideo,
  Layers,
  Send,
  Upload,
  Wand2,
} from 'lucide-react'

import { Hero, StripPill } from '@/components/ui/editorial'
import { Reveal } from '@/components/ui/editorial-motion'
import { AnimatedDonut } from '@/components/dashboard/animated-donut'
import { BarChartWeek } from '@/components/dashboard/bar-chart-week'
import { FeaturedCard } from '@/components/dashboard/featured-card'
import { FunnelStackCard } from '@/components/dashboard/funnel-stack'
import { ScheduleWeekCard } from '@/components/dashboard/schedule-week-card'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAnalytics } from '@/lib/dashboard/get-analytics'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

// ── Crextio palette ───────────────────────────────────────────────────────
// Cream + warm yellow + dark charcoal. The Dashboard's intentional
// departure from the rest of Clipflow's violet identity — it's the one
// place users come to *feel* the data, not edit it.
const PALETTE = {
  yellow: '#F4D93D',
  yellowSoft: '#F9E97A',
  yellowDeep: '#DCB91F',
  charcoal: '#0F0F0F',
  ink: '#0F0F0F',
  inkSoft: '#2A2A2A',
  border: 'rgba(15, 15, 15, 0.06)',
  borderStrong: 'rgba(15, 15, 15, 0.14)',
}

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

  const featured = analytics.topContent[0] ?? null

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
          <Reveal>
            <EmptyDashboardHero workspaceId={currentWorkspace.id} />
          </Reveal>
        ) : (
          <>
            {/* ── Pulse-strip: 3 animated percent indicators in a glassy
                 container. Each pill rolls 0 → target on mount and
                 breathes subtly to feel "alive". ── */}
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
                  animated
                  label="Velocity"
                  value={Math.round((importsDelta + generatedDelta) / 2)}
                  variant="dark"
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
                  featured={featured}
                  workspaceName={currentWorkspace.name}
                />
              </Reveal>
              <Reveal index={1}>
                <BarChartWeek
                  data={weekData}
                  max={weekMax}
                  peakIndex={weekPeakIndex}
                  total={weekTotal}
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
