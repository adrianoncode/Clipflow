import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Star,
  TrendingDown,
  TrendingUp,
  Upload,
  Video,
  Wand2,
  Zap,
} from 'lucide-react'

import { Sparkline } from '@/components/dashboard/sparkline'
import { SmartSuggestions } from '@/components/dashboard/smart-suggestions'
import { SetupChecklist } from '@/components/dashboard/setup-checklist'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'
import { getSuggestions } from '@/lib/suggestions/get-suggestions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

/* ── Tiny helpers ─────────────────────────────────────────────── */

function DeltaBadge({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0 && current > 0)
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        <TrendingUp className="h-2.5 w-2.5" />New{suffix}
      </span>
    )
  const delta = current - previous
  if (delta === 0) return null
  const pct = Math.round((delta / previous) * 100)
  const up = delta > 0
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? '+' : ''}{pct}%{suffix}
    </span>
  )
}

function UsageBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1)
    return (
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 rounded-full bg-primary/30" />
      </div>
    )
  const pct = Math.min(100, Math.round((used / limit) * 100))
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-700 ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-primary'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const firstName = ((typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null) ?? user?.email ?? 'there').split(/[\s@]/)[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const workspace = workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  const [aiKeys, stats, usage, plan, suggestions] =
    workspace && user
      ? await Promise.all([
          getAiKeys(workspace.id),
          getWorkspaceStats(workspace.id),
          getWorkspaceUsage(workspace.id),
          getWorkspacePlan(workspace.id),
          getSuggestions(workspace.id),
        ])
      : [[], null, null, 'free' as const, []]

  const planDef = PLANS[plan ?? 'free']
  const hasLlm = aiKeys.some((k) => ['openai', 'anthropic', 'google'].includes(k.provider))

  const isNewUser = !hasLlm || (stats?.totalContent ?? 0) === 0 || (stats?.totalOutputs ?? 0) === 0
  const pendingReview = stats?.pipelineByState.review ?? 0
  const processing = stats?.recentContent.find((c) => c.status === 'processing')
  const readyContent = stats?.recentContent.find((c) => c.status === 'ready')
  const totalPipeline = stats
    ? stats.pipelineByState.draft + stats.pipelineByState.review + stats.pipelineByState.approved + stats.pipelineByState.exported
    : 0

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            {workspace?.name ? ` \u00b7 ${workspace.name}` : ''}
          </p>
        </div>
        {workspace && !isNewUser && (
          <Link
            href={`/workspace/${workspace.id}/content/new`}
            className="group inline-flex h-10 items-center gap-2 rounded-xl bg-primary pl-4 pr-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
          >
            <span className="text-lg leading-none">+</span>
            New video
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* ═══ NEW USER: Setup checklist only ═══════════════════════ */}
      {workspace && isNewUser && (
        <SetupChecklist
          hasAiKey={hasLlm}
          contentCount={stats?.totalContent ?? 0}
          outputCount={stats?.totalOutputs ?? 0}
          hasApprovedOutput={(stats?.approvedOutputs ?? 0) > 0}
          workspaceId={workspace.id}
        />
      )}

      {/* ═══ ACTIVE USER: full dashboard ═════════════════════════ */}
      {workspace && !isNewUser && (
        <>
          {/* ── Smart Suggestions ──────────────────────────────────── */}
          {suggestions.length > 0 && <SmartSuggestions suggestions={suggestions} />}

          {/* ── Smart Next Action banner ───────────────────────────── */}
          {processing && (
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/50 to-background p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">&ldquo;{processing.title ?? 'Content'}&rdquo; is processing</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Usually takes 1-3 min.</p>
              </div>
              <Link href={`/workspace/${workspace.id}/content/${processing.id}`} className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200">
                Check status &rarr;
              </Link>
            </div>
          )}

          {!processing && pendingReview > 0 && (
            <Link
              href={`/workspace/${workspace.id}/pipeline`}
              className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{pendingReview} draft{pendingReview !== 1 ? 's' : ''} waiting for review</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Approve, edit, or star your best outputs before publishing.</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
                Review now <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}

          {!processing && pendingReview === 0 && readyContent && (
            <Link
              href={`/workspace/${workspace.id}/content/${readyContent.id}/outputs`}
              className="group flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/10">
                <Wand2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">&ldquo;{readyContent.title ?? 'Content'}&rdquo; is ready for outputs</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Generate TikTok, Reels, Shorts & LinkedIn drafts.</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
                Generate <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}

          {/* ── Stats strip ────────────────────────────────────────── */}
          {stats && stats.totalContent > 0 && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { key: 'content', label: 'Videos', value: stats.totalContent, thisMonth: stats.contentThisMonth, lastMonth: stats.contentLastMonth, icon: Video, spark: stats.contentByDay, href: `/workspace/${workspace.id}`, color: 'text-violet-600 bg-violet-50' },
                { key: 'outputs', label: 'Drafts', value: stats.totalOutputs, thisMonth: stats.outputsThisMonth, lastMonth: stats.outputsLastMonth, icon: Layers, spark: stats.outputsByDay, href: `/workspace/${workspace.id}/pipeline`, color: 'text-blue-600 bg-blue-50' },
                { key: 'approved', label: 'Approved', value: stats.approvedOutputs, thisMonth: 0, lastMonth: 0, icon: CheckCircle2, spark: null, href: `/workspace/${workspace.id}/pipeline`, color: 'text-emerald-600 bg-emerald-50' },
                { key: 'starred', label: 'Starred', value: stats.starredOutputs, thisMonth: 0, lastMonth: 0, icon: Star, spark: null, href: `/workspace/${workspace.id}/pipeline`, color: 'text-amber-600 bg-amber-50' },
              ].map((m) => (
                <Link key={m.key} href={m.href} className="group flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${m.color}`}><m.icon className="h-4 w-4" /></div>
                    {(m.thisMonth > 0 || m.lastMonth > 0) && <DeltaBadge current={m.thisMonth} previous={m.lastMonth} suffix=" vs last mo" />}
                  </div>
                  <div>
                    <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">{m.value}</span>
                    <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{m.label}</p>
                  </div>
                  {m.spark ? <Sparkline data={m.spark} width={120} height={24} variant="bars" label={`${m.label} last 7 days`} /> : <div className="h-[24px]" />}
                </Link>
              ))}
            </div>
          )}

          {/* ── Workflow progress bar ──────────────────────────────── */}
          {stats && totalPipeline > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Pipeline</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">{totalPipeline} total</span>
                </div>
                <Link href={`/workspace/${workspace.id}/pipeline`} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10">
                  Open pipeline <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-5">
                <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted/50">
                  {([
                    { state: 'draft' as const, color: 'bg-zinc-400' },
                    { state: 'review' as const, color: 'bg-amber-400' },
                    { state: 'approved' as const, color: 'bg-emerald-400' },
                    { state: 'exported' as const, color: 'bg-blue-500' },
                  ] as const).map(({ state, color }) => {
                    const count = stats.pipelineByState[state]
                    if (count === 0) return null
                    return <div key={state} className={`${color} transition-all duration-700`} style={{ width: `${(count / totalPipeline) * 100}%` }} title={`${state}: ${count}`} />
                  })}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {([
                    { state: 'draft' as const, label: 'Draft', dot: 'bg-zinc-400', desc: 'Generated' },
                    { state: 'review' as const, label: 'In Review', dot: 'bg-amber-400', desc: 'Needs review' },
                    { state: 'approved' as const, label: 'Approved', dot: 'bg-emerald-400', desc: 'Ready to go' },
                    { state: 'exported' as const, label: 'Exported', dot: 'bg-blue-500', desc: 'Published' },
                  ] as const).map(({ state, label, dot, desc }) => (
                    <div key={state} className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${dot}`} />
                        <span className="font-mono text-2xl font-bold tabular-nums">{stats.pipelineByState[state]}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Quick Actions grid ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: `/workspace/${workspace.id}/content/new`, label: 'Import', desc: 'YouTube, MP4, audio', icon: Upload, color: 'text-violet-600 bg-violet-50 group-hover:bg-violet-100' },
              { href: `/workspace/${workspace.id}`, label: 'Generate', desc: 'Create new drafts', icon: Wand2, color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-100' },
              { href: `/workspace/${workspace.id}/pipeline`, label: 'Pipeline', desc: 'Review & approve', icon: Layers, color: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100' },
              { href: `/workspace/${workspace.id}/calendar`, label: 'Schedule', desc: 'Plan & publish', icon: Calendar, color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-100' },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.05]">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${a.color}`}><a.icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Monthly usage ──────────────────────────────────────── */}
          {usage && (
            <div className="rounded-2xl border border-border/50 bg-card">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Monthly usage</p>
                <span className="font-mono text-[10px] text-muted-foreground/50">
                  {new Date().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
              <div className="space-y-5 p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Videos imported</span>
                    <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
                      {usage.contentItemsThisMonth}{planDef.limits.contentItemsPerMonth !== -1 ? ` / ${planDef.limits.contentItemsPerMonth}` : ' / \u221e'}
                    </span>
                  </div>
                  <UsageBar used={usage.contentItemsThisMonth} limit={planDef.limits.contentItemsPerMonth} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Drafts generated</span>
                    <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
                      {usage.outputsThisMonth}{planDef.limits.outputsPerMonth !== -1 ? ` / ${planDef.limits.outputsPerMonth}` : ' / \u221e'}
                    </span>
                  </div>
                  <UsageBar used={usage.outputsThisMonth} limit={planDef.limits.outputsPerMonth} />
                </div>
                {plan === 'free' && (
                  <Link href="/billing" className="group flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10">
                    <Zap className="h-3.5 w-3.5" />
                    Upgrade for more
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
