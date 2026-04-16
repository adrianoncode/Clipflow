import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Mic,
  Rss,
  Send,
  Star,
  TrendingDown,
  TrendingUp,
  Upload,
  Video,
  Wand2,
  Youtube,
  Zap,
  Clapperboard,
  PenTool,
  Lightbulb,
  Play,
  BarChart3,
} from 'lucide-react'

import { Sparkline } from '@/components/dashboard/sparkline'
import { SmartSuggestions } from '@/components/dashboard/smart-suggestions'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS, type BillingPlan } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'
import { getSuggestions } from '@/lib/suggestions/get-suggestions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard' }

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
  linkedin: 'bg-blue-600',
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.round(diff / 60_000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const h = Math.round(min / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.round(h / 24)}d ago`
  } catch {
    return iso
  }
}

function DeltaBadge({ current, previous, suffix = '' }: { current: number; previous: number; suffix?: string }) {
  if (previous === 0 && current === 0) return null
  if (previous === 0 && current > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
        <TrendingUp className="h-2.5 w-2.5" />
        New{suffix}
      </span>
    )
  }
  const delta = current - previous
  if (delta === 0) return null
  const pct = Math.round((delta / previous) * 100)
  const isUp = delta > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
      }`}
    >
      {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {isUp ? '+' : ''}{pct}%{suffix}
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

export default async function DashboardPage() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const fullName =
    typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null
  const firstName = (fullName ?? user?.email ?? 'there').split(/[\s@]/)[0] ?? 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const workspace = workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  const [aiKeys, stats, usage, plan, brandVoice, suggestions] =
    workspace && user
      ? await Promise.all([
          getAiKeys(workspace.id),
          getWorkspaceStats(workspace.id),
          getWorkspaceUsage(workspace.id),
          getWorkspacePlan(workspace.id),
          getActiveBrandVoice(workspace.id),
          getSuggestions(workspace.id),
        ])
      : [[], null, null, 'free' as const, null, []]

  const planDef = PLANS[plan ?? 'free']
  const hasLlm = aiKeys.some((k) => ['openai', 'anthropic', 'google'].includes(k.provider))
  const hasPublishKey = aiKeys.some((k) => k.provider === 'upload-post')
  const hasShotstack = aiKeys.some((k) => k.provider === 'shotstack')

  const pendingReview = stats?.pipelineByState.review ?? 0
  const processing = stats?.recentContent.find((c) => c.status === 'processing')
  const readyContent = stats?.recentContent.find((c) => c.status === 'ready')
  const isEmpty = (stats?.totalContent ?? 0) === 0
  const totalPipelineOutputs = stats
    ? stats.pipelineByState.draft + stats.pipelineByState.review + stats.pipelineByState.approved + stats.pipelineByState.exported
    : 0

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">

      {/* ── Hero Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground/70">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <div className="mt-1.5 flex items-center gap-2">
            {workspace?.name && (
              <span className="text-sm text-muted-foreground">{workspace.name}</span>
            )}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {planDef.name}
            </span>
          </div>
        </div>
        {workspace && (
          <div className="flex items-center gap-2">
            <Link
              href={`/workspace/${workspace.id}/content/new`}
              className="group inline-flex h-10 items-center gap-2 rounded-xl bg-primary pl-4 pr-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
            >
              <span className="text-lg leading-none">+</span>
              New video
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>

      {/* ── NO LLM KEY — blocker banner ──────────────────────────────── */}
      {!hasLlm && (
        <Link
          href="/settings/ai-keys"
          className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-100/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Add an AI key to start generating</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              OpenAI, Anthropic, or Google — each offers free credits at signup. Takes 1 minute.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {/* ── SMART NEXT ACTION — contextual based on state ────────────── */}
      {workspace && hasLlm && !isEmpty && (
        <>
          {processing && (
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/50 to-background p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  &ldquo;{processing.title ?? 'Content'}&rdquo; is processing
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Usually takes 1–3 min. You&apos;ll see it below when ready.
                </p>
              </div>
              <Link
                href={`/workspace/${workspace.id}/content/${processing.id}`}
                className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
              >
                Check status →
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
                <p className="font-semibold">
                  {pendingReview} draft{pendingReview !== 1 ? 's' : ''} waiting for review
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Approve, edit, or star your best outputs before publishing.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all group-hover:shadow-md">
                Review now
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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
                <p className="font-semibold">
                  &ldquo;{readyContent.title ?? 'Content'}&rdquo; is ready for outputs
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Generate TikTok, Reels, Shorts & LinkedIn drafts.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all group-hover:shadow-md">
                Generate
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}
        </>
      )}

      {/* ── SMART SUGGESTIONS ─────────────────────────────────────── */}
      {workspace && suggestions.length > 0 && (
        <SmartSuggestions suggestions={suggestions} />
      )}

      {/* ── STATS GRID ─────────────────────────────────────────────── */}
      {stats && stats.totalContent > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              key: 'content',
              label: 'Videos',
              value: stats.totalContent,
              thisMonth: stats.contentThisMonth,
              lastMonth: stats.contentLastMonth,
              icon: Video,
              spark: stats.contentByDay,
              href: workspace ? `/workspace/${workspace.id}` : '#',
              color: 'text-violet-600 bg-violet-50',
            },
            {
              key: 'outputs',
              label: 'Drafts',
              value: stats.totalOutputs,
              thisMonth: stats.outputsThisMonth,
              lastMonth: stats.outputsLastMonth,
              icon: Layers,
              spark: stats.outputsByDay,
              href: workspace ? `/workspace/${workspace.id}/pipeline` : '#',
              color: 'text-blue-600 bg-blue-50',
            },
            {
              key: 'starred',
              label: 'Starred',
              value: stats.starredOutputs,
              thisMonth: 0,
              lastMonth: 0,
              icon: Star,
              spark: null,
              href: workspace ? `/workspace/${workspace.id}/pipeline` : '#',
              color: 'text-amber-600 bg-amber-50',
            },
            {
              key: 'approved',
              label: 'Approved',
              value: stats.approvedOutputs,
              thisMonth: 0,
              lastMonth: 0,
              icon: CheckCircle2,
              spark: null,
              href: workspace ? `/workspace/${workspace.id}/pipeline` : '#',
              color: 'text-emerald-600 bg-emerald-50',
            },
          ].map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="group flex flex-col gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.06]"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${m.color}`}>
                  <m.icon className="h-4 w-4" />
                </div>
                {m.thisMonth > 0 || m.lastMonth > 0 ? (
                  <DeltaBadge current={m.thisMonth} previous={m.lastMonth} suffix=" vs last mo" />
                ) : null}
              </div>
              <div>
                <span className="font-mono text-3xl font-bold tabular-nums tracking-tight">
                  {m.value}
                </span>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{m.label}</p>
              </div>
              {m.spark ? (
                <Sparkline
                  data={m.spark}
                  width={120}
                  height={24}
                  variant="bars"
                  label={`${m.label} last 7 days`}
                />
              ) : (
                <div className="h-[24px]" />
              )}
            </Link>
          ))}
        </div>
      )}

      {/* ── WORKFLOW PROGRESS ─────────────────────────────────────── */}
      {stats && workspace && stats.totalOutputs > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Pipeline
              </p>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
                {totalPipelineOutputs} total
              </span>
            </div>
            <Link
              href={`/workspace/${workspace.id}/pipeline`}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Open pipeline
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {/* Visual pipeline bar */}
            {totalPipelineOutputs > 0 && (
              <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted/50">
                {([
                  { state: 'draft' as const, color: 'bg-zinc-400' },
                  { state: 'review' as const, color: 'bg-amber-400' },
                  { state: 'approved' as const, color: 'bg-emerald-400' },
                  { state: 'exported' as const, color: 'bg-blue-500' },
                ] as const).map(({ state, color }) => {
                  const count = stats.pipelineByState[state]
                  if (count === 0) return null
                  const pct = (count / totalPipelineOutputs) * 100
                  return (
                    <div
                      key={state}
                      className={`${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                      title={`${state}: ${count}`}
                    />
                  )
                })}
              </div>
            )}
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
                    <span className="font-mono text-2xl font-bold tabular-nums">
                      {stats.pipelineByState[state]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK ACTIONS — contextual shortcuts ──────────────────── */}
      {workspace && hasLlm && !isEmpty && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              href: `/workspace/${workspace.id}/content/new`,
              label: 'Import video',
              desc: 'YouTube, MP4, audio',
              icon: Upload,
              color: 'text-violet-600 bg-violet-50 group-hover:bg-violet-100',
            },
            {
              href: `/workspace/${workspace.id}/studio`,
              label: 'Video Studio',
              desc: 'Render MP4s',
              icon: Clapperboard,
              color: 'text-pink-600 bg-pink-50 group-hover:bg-pink-100',
            },
            {
              href: `/workspace/${workspace.id}/ghostwriter`,
              label: 'Ghostwriter',
              desc: 'Write from scratch',
              icon: PenTool,
              color: 'text-blue-600 bg-blue-50 group-hover:bg-blue-100',
            },
            {
              href: `/workspace/${workspace.id}/ideas`,
              label: 'Get ideas',
              desc: 'AI brainstorm',
              icon: Lightbulb,
              color: 'text-amber-600 bg-amber-50 group-hover:bg-amber-100',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.05]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{action.label}</p>
                <p className="text-[11px] text-muted-foreground">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── EMPTY STATE — 4-step workflow ─────────────────────────── */}
      {isEmpty && hasLlm && workspace && (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="border-b border-border/40 px-6 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              How Clipflow works
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Four steps from raw video to published content.
            </p>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-border/40 sm:grid-cols-4 sm:divide-y-0">
            {[
              {
                step: '1',
                icon: Upload,
                title: 'Import',
                desc: 'YouTube link, MP4, transcript, or audio.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                step: '2',
                icon: Wand2,
                title: 'Generate',
                desc: 'AI writes TikTok, LinkedIn, Reels & Shorts drafts.',
                color: 'bg-primary/10 text-primary',
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Review',
                desc: 'Edit, approve, star your favourites.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                step: '4',
                icon: Send,
                title: 'Publish',
                desc: 'Post to all platforms via Upload-Post.',
                color: 'bg-blue-50 text-blue-600',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    Step {step}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 px-6 py-4">
            <Link
              href={`/workspace/${workspace.id}/content/new`}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/25"
            >
              Import your first video
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── SETUP CHECKLIST ──────────────────────────────────────── */}
      {workspace && (() => {
        const steps = [
          {
            id: 'key',
            label: 'Add AI key',
            hint: 'OpenAI, Anthropic or Google',
            done: hasLlm,
            href: '/settings/ai-keys',
            icon: KeyRound,
          },
          {
            id: 'brand',
            label: 'Set brand voice',
            hint: 'Tone, style, audience',
            done: !!brandVoice,
            href: '/settings/brand-voice',
            icon: Mic,
          },
          {
            id: 'content',
            label: 'Import content',
            hint: 'Video, YouTube, transcript',
            done: (stats?.totalContent ?? 0) > 0,
            href: `/workspace/${workspace.id}/content/new`,
            icon: Upload,
          },
          {
            id: 'outputs',
            label: 'Generate outputs',
            hint: 'TikTok, LinkedIn, Reels…',
            done: (stats?.totalOutputs ?? 0) > 0,
            href: `/workspace/${workspace.id}`,
            icon: Wand2,
          },
        ]
        const done = steps.filter((s) => s.done).length
        if (done === steps.length) return null

        const nextIdx = steps.findIndex((s) => !s.done)

        return (
          <div className="rounded-2xl border border-border/50 bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Get started</p>
                <p className="text-[11px] text-muted-foreground">{done} of {steps.length} complete</p>
              </div>
              <div className="flex h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(done / steps.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {steps.map((step, i) => {
                const isCurrent = i === nextIdx
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={`group flex flex-col gap-3 rounded-xl border p-3.5 transition-all ${
                      step.done
                        ? 'pointer-events-none border-emerald-200/60 bg-emerald-50/30 opacity-50'
                        : isCurrent
                          ? 'border-primary/30 bg-primary/[0.04] hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md'
                          : 'border-border/40 bg-muted/10 opacity-40 hover:opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                          step.done
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.done ? '✓' : i + 1}
                      </div>
                      {isCurrent && !step.done && (
                        <ArrowRight className="h-3.5 w-3.5 text-primary transition-transform group-hover:translate-x-0.5" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                      >
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{step.hint}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* ── INTEGRATION STATUS — show what's connected ──────────── */}
      {workspace && !isEmpty && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'AI Provider',
              connected: hasLlm,
              connectedText: aiKeys.filter((k) => ['openai', 'anthropic', 'google'].includes(k.provider)).map((k) => k.provider).join(', ') || 'Connected',
              disconnectedText: 'Add key to generate',
              href: '/settings/ai-keys',
              icon: Wand2,
            },
            {
              label: 'Video Rendering',
              connected: hasShotstack,
              connectedText: 'Shotstack connected',
              disconnectedText: 'Add Shotstack key',
              href: '/settings/ai-keys',
              icon: Play,
            },
            {
              label: 'Publishing',
              connected: hasPublishKey,
              connectedText: 'Upload-Post connected',
              disconnectedText: 'Connect Upload-Post',
              href: '/settings/ai-keys',
              icon: Send,
            },
          ].map((svc) => (
            <Link
              key={svc.label}
              href={svc.href}
              className={`group flex items-center gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                svc.connected
                  ? 'border-emerald-200/60 bg-emerald-50/30'
                  : 'border-border/50 bg-card'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  svc.connected
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <svc.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted-foreground">{svc.label}</p>
                <p className={`text-xs font-semibold ${svc.connected ? 'text-emerald-700' : 'text-foreground'}`}>
                  {svc.connected ? svc.connectedText : svc.disconnectedText}
                </p>
              </div>
              {!svc.connected && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              )}
              {svc.connected && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
            </Link>
          ))}
        </div>
      )}

      {/* ── RECENT IMPORTS ───────────────────────────────────────── */}
      {stats && stats.recentContent.length > 0 && workspace && (
        <div className="rounded-2xl border border-border/50 bg-card">
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Recent imports
            </p>
            <Link
              href={`/workspace/${workspace.id}`}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              All videos
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/30">
            {stats.recentContent.slice(0, 5).map((item) => {
              const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
              const href =
                item.status === 'ready'
                  ? `/workspace/${workspace.id}/content/${item.id}/outputs`
                  : `/workspace/${workspace.id}/content/${item.id}`
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/30"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background text-muted-foreground transition-all group-hover:border-primary/25 group-hover:text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold group-hover:text-primary">
                      {item.title ?? 'Untitled'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {item.kind.replace(/_/g, ' ')} · {formatRelative(item.created_at)}
                    </p>
                  </div>
                  <ContentStatusBadge status={item.status} />
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary/50" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BOTTOM ROW: Platforms + Usage ──────────────────────────── */}
      {stats && (stats.totalOutputs > 0 || usage) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Platform breakdown */}
          {stats.totalOutputs > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Platform distribution
                </p>
                {workspace && (
                  <Link
                    href="/analytics"
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary/70 transition-colors hover:text-primary"
                  >
                    <BarChart3 className="h-3 w-3" />
                    Analytics
                  </Link>
                )}
              </div>
              <div className="space-y-3.5 p-5">
                {Object.entries(stats.outputsByPlatform).map(([platform, count]) => {
                  if (count === 0) return null
                  const maxCount = Math.max(...Object.values(stats.outputsByPlatform), 1)
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={platform} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${PLATFORM_COLORS[platform] ?? 'bg-muted-foreground'}`} />
                          <span className="text-xs font-semibold">
                            {PLATFORM_LABELS[platform] ?? platform}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${PLATFORM_COLORS[platform] ?? 'bg-muted-foreground'}`}
                          style={{ width: `${pct}%`, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Usage */}
          {usage && (
            <div className="rounded-2xl border border-border/50 bg-card">
              <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Monthly usage
                </p>
                <span className="font-mono text-[10px] text-muted-foreground/50">
                  {new Date()
                    .toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    .toUpperCase()}
                </span>
              </div>
              <div className="space-y-5 p-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Videos imported</span>
                    <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Drafts generated</span>
                    <span className="font-mono text-[11px] font-bold tabular-nums text-muted-foreground">
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
                {plan === 'free' && workspace && (
                  <Link
                    href="/billing"
                    className="group flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/10"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Upgrade for more
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── UPGRADE CARD — for free/solo users ───────────────────── */}
      {workspace && plan !== 'team' && plan !== 'agency' && (() => {
        type FeatureLock = { label: string; plan: BillingPlan }
        const locked: FeatureLock[] = []
        if (planDef.limits.videoRendersPerMonth === 0)
          locked.push({ label: 'Video Reframe & Rendering', plan: 'solo' })
        if (planDef.limits.avatarVideosPerMonth === 0)
          locked.push({ label: 'AI Avatar Videos', plan: 'solo' })
        if (planDef.limits.dubVideosPerMonth === 0)
          locked.push({ label: 'Voice Dubbing (ElevenLabs)', plan: 'team' })
        if (!planDef.features.trendingSounds)
          locked.push({ label: 'Trending Sounds', plan: 'solo' })
        if (!planDef.features.competitorAnalysis)
          locked.push({ label: 'Competitor Analysis', plan: 'solo' })
        if (!planDef.features.backgroundMusic)
          locked.push({ label: 'Background Music', plan: 'solo' })
        if (locked.length === 0) return null

        const nextPlan: BillingPlan = plan === 'free' ? 'solo' : 'team'
        const nextPlanName = nextPlan === 'solo' ? 'Solo' : 'Team'
        const nextPlanPrice = nextPlan === 'solo' ? '$19/mo' : '$49/mo'

        return (
          <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] via-background to-background">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">Unlock more with {nextPlanName}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {locked.slice(0, 4).map((f) => (
                    <span
                      key={f.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      <Lock className="h-3 w-3 text-muted-foreground/50" />
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                <Link
                  href={`/billing?workspace_id=${workspace.id}&plan=${nextPlan}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade — {nextPlanPrice}
                </Link>
                <p className="text-[10px] text-muted-foreground">Cancel anytime</p>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
