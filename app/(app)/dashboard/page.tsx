import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
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
  TrendingUp,
  Upload,
  Video,
  Wand2,
  Youtube,
  Zap,
} from 'lucide-react'

import { Sparkline } from '@/components/dashboard/sparkline'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS, type BillingPlan } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'
// import { getRecyclableContent } from '@/lib/content/get-recyclable-content'

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

const PIPELINE_DOT: Record<string, string> = {
  draft: 'bg-zinc-400',
  review: 'bg-amber-400',
  approved: 'bg-emerald-400',
  exported: 'bg-blue-400',
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

function UsageBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1)
    return (
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 rounded-full bg-primary/30" />
      </div>
    )
  const pct = Math.min(100, Math.round((used / limit) * 100))
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-destructive' : 'bg-primary'}`}
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

  const [aiKeys, stats, usage, plan, brandVoice] =
    workspace && user
      ? await Promise.all([
          getAiKeys(workspace.id),
          getWorkspaceStats(workspace.id),
          getWorkspaceUsage(workspace.id),
          getWorkspacePlan(workspace.id),
          getActiveBrandVoice(workspace.id),
        ])
      : [[], null, null, 'free' as const, null]

  const planDef = PLANS[plan ?? 'free']
  const hasLlm = aiKeys.some((k) => ['openai', 'anthropic', 'google'].includes(k.provider))

  // Determine state for smart next-action card
  const pendingReview = stats?.pipelineByState.review ?? 0
  const processing = stats?.recentContent.find((c) => c.status === 'processing')
  const readyContent = stats?.recentContent.find((c) => c.status === 'ready')
  const isEmpty = (stats?.totalContent ?? 0) === 0
  const maxPlatformCount = stats ? Math.max(...Object.values(stats.outputsByPlatform), 1) : 1

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}, {firstName}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {workspace?.name && <span>{workspace.name}</span>}
            <span className="text-muted-foreground/30">·</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {planDef.name}
            </span>
          </div>
        </div>
        {workspace && (
          <Link
            href={`/workspace/${workspace.id}/content/new`}
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary pl-4 pr-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-lg leading-none">+</span>
            New content
          </Link>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          PLAN UPGRADE CARD — shown for free & solo users
          Highlights what they're missing + one-click upgrade CTA.
      ══════════════════════════════════════════════════════════════ */}
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

        const nextPlan: BillingPlan = plan === 'free' ? 'solo' : 'team'
        const nextPlanName = nextPlan === 'solo' ? 'Solo' : 'Team'
        const nextPlanPrice = nextPlan === 'solo' ? '$19/mo' : '$49/mo'

        return (
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              {/* Left: current plan + locked features */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {planDef.name} Plan
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — upgrade to unlock more
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {locked.slice(0, 4).map((f) => (
                    <div key={f.label} className="flex items-center gap-2">
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground">{f.label}</span>
                      <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {f.plan === 'solo' ? 'Solo' : 'Team'}+
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: CTA */}
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <Link
                  href={`/billing?workspace_id=${workspace.id}&plan=${nextPlan}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md"
                >
                  <Zap className="h-4 w-4" />
                  Upgrade to {nextPlanName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {nextPlanPrice} · cancel anytime
                </p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ══════════════════════════════════════════════════════════════
          EMPTY STATE — No content yet, has LLM key
          Show a clear 4-step workflow so the user knows exactly
          what Clipflow does and what to do first.
      ══════════════════════════════════════════════════════════════ */}
      {isEmpty && hasLlm && workspace && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          {/* How it works header */}
          <div className="border-b border-border/50 px-6 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              How Clipflow works
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Four steps from raw video to published content — AI handles the heavy lifting.
            </p>
          </div>

          {/* 4-step workflow */}
          <div className="grid grid-cols-2 divide-x divide-y divide-border/50 sm:grid-cols-4 sm:divide-y-0">
            {[
              {
                step: '1',
                icon: Upload,
                title: 'Import',
                desc: 'Paste a YouTube link, upload an MP4, or drop a transcript.',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                step: '2',
                icon: Wand2,
                title: 'Generate',
                desc: 'AI writes TikTok, LinkedIn, Reels, and Shorts drafts in seconds.',
                color: 'bg-primary/10 text-primary',
              },
              {
                step: '3',
                icon: CheckCircle2,
                title: 'Review',
                desc: 'Edit drafts, approve your favourites, star the best ones.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                step: '4',
                icon: Send,
                title: 'Publish',
                desc: 'Post to TikTok, LinkedIn, Reels & Shorts via Upload-Post.',
                color: 'bg-blue-50 text-blue-600',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
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

          {/* CTA */}
          <div className="border-t border-border/50 px-6 py-4">
            <Link
              href={`/workspace/${workspace.id}/content/new`}
              className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              Start: Import your first video
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              YouTube link, MP4, or plain text transcript — all work.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          NO LLM KEY — Critical blocker
      ══════════════════════════════════════════════════════════════ */}
      {!hasLlm && (
        <Link
          href="/settings/ai-keys"
          className="group flex items-center gap-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Add an AI key to start generating content</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              OpenAI, Anthropic, or Google — each offers free credits at signup. Takes 1 minute.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SETUP CHECKLIST — show until brand voice + 1st output done
          Compact 4-step row, collapses once fully complete
      ══════════════════════════════════════════════════════════════ */}
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
        if (done === steps.length) return null // Hide when all done

        const nextIdx = steps.findIndex((s) => !s.done)

        return (
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">
                Setup — {done} of {steps.length} done
              </p>
              <div className="flex gap-1">
                {steps.map((s) => (
                  <span
                    key={s.id}
                    className={`h-1.5 w-6 rounded-full transition-colors ${s.done ? 'bg-primary' : 'bg-border'}`}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {steps.map((step, i) => {
                const Icon = step.icon
                const isCurrent = i === nextIdx
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={`flex flex-col gap-2.5 rounded-lg border p-3 transition-all ${
                      step.done
                        ? 'pointer-events-none border-emerald-200/60 bg-emerald-50/30 opacity-60'
                        : isCurrent
                          ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/8 hover:-translate-y-0.5'
                          : 'border-border/40 bg-muted/20 opacity-50 hover:opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          step.done
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.done ? '✓' : i + 1}
                      </div>
                      {isCurrent && (
                        <Icon className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold leading-tight ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
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

      {/* ══════════════════════════════════════════════════════════════
          SMART NEXT ACTION — one card, dynamic based on state
      ══════════════════════════════════════════════════════════════ */}
      {workspace && hasLlm && !isEmpty && (
        <>
          {/* Something is processing */}
          {processing && (
            <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  &ldquo;{processing.title ?? 'Content'}&rdquo; is being processed
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Usually takes 1–3 minutes. You&apos;ll see it appear in your recent work below
                  when it&apos;s ready.
                </p>
              </div>
              <Link
                href={`/workspace/${workspace.id}/content/${processing.id}`}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Check →
              </Link>
            </div>
          )}

          {/* Outputs waiting for review */}
          {!processing && pendingReview > 0 && (
            <Link
              href={`/workspace/${workspace.id}/pipeline`}
              className="group flex items-center gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {pendingReview} draft{pendingReview !== 1 ? 's' : ''} waiting for your review
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Open the Pipeline to approve, edit, or star your best outputs before publishing.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform group-hover:translate-x-0.5">
                Review now
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}

          {/* Content ready — view outputs */}
          {!processing && pendingReview === 0 && readyContent && (
            <Link
              href={`/workspace/${workspace.id}/content/${readyContent.id}/outputs`}
              className="group flex items-center gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-background p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Wand2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  &ldquo;{readyContent.title ?? 'Content'}&rdquo; is ready
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Your AI-generated drafts are ready. Review and edit before approving.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-transform group-hover:translate-x-0.5">
                View outputs
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STATS ROW — only shown when user has data
      ══════════════════════════════════════════════════════════════ */}
      {stats && stats.totalContent > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="grid grid-cols-2 divide-y divide-border/50 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              {
                key: 'content',
                label: 'Videos',
                value: stats.totalContent,
                delta: stats.contentThisMonth,
                icon: Video,
                spark: stats.contentByDay,
                href: workspace ? `/workspace/${workspace.id}` : '#',
                hint: 'imported',
              },
              {
                key: 'outputs',
                label: 'Drafts',
                value: stats.totalOutputs,
                delta: stats.outputsThisMonth,
                icon: Layers,
                spark: stats.outputsByDay,
                href: workspace ? `/workspace/${workspace.id}/pipeline` : '#',
                hint: 'generated',
              },
              {
                key: 'starred',
                label: 'Starred',
                value: stats.starredOutputs,
                icon: Star,
                spark: null,
                href: workspace ? `/workspace/${workspace.id}/pipeline` : '#',
                hint: 'favourites',
              },
              {
                key: 'approved',
                label: 'Approved',
                value: stats.approvedOutputs,
                icon: CheckCircle2,
                spark: null,
                href: workspace ? `/workspace/${workspace.id}/pipeline` : '#',
                hint: 'ready to publish',
              },
            ].map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="group flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-1.5">
                  <m.icon className="h-3 w-3 text-muted-foreground/60" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {m.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
                      {m.value}
                    </span>
                    <span className="ml-1.5 text-[10px] text-muted-foreground">{m.hint}</span>
                  </div>
                  {'delta' in m && m.delta && m.delta > 0 ? (
                    <span className="flex items-center gap-0.5 font-mono text-[10px] font-medium text-primary">
                      <TrendingUp className="h-2.5 w-2.5" />+{m.delta}
                    </span>
                  ) : null}
                </div>
                {m.spark ? (
                  <Sparkline
                    data={m.spark}
                    width={80}
                    height={18}
                    variant="bars"
                    label={`${m.label} last 7 days`}
                  />
                ) : (
                  <div className="h-[18px]" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PIPELINE STRIP
      ══════════════════════════════════════════════════════════════ */}
      {stats && workspace && stats.totalOutputs > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-5 py-3">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Pipeline
            </span>
            <span aria-hidden className="h-3 w-px shrink-0 bg-border/60" />
            {(['draft', 'review', 'approved', 'exported'] as const).map((state) => (
              <div key={state} className="flex shrink-0 items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${PIPELINE_DOT[state]}`} />
                <span className="text-xs text-muted-foreground capitalize">{state}</span>
                <span className="font-mono text-xs font-semibold tabular-nums">
                  {stats.pipelineByState[state]}
                </span>
              </div>
            ))}
          </div>
          <Link
            href={`/workspace/${workspace.id}/pipeline`}
            className="ml-4 flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            Open
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          RECENT WORK — clean list, no timeline rail
      ══════════════════════════════════════════════════════════════ */}
      {stats && stats.recentContent.length > 0 && workspace && (
        <div className="rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Recent work
            </p>
            <Link
              href={`/workspace/${workspace.id}`}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              All content →
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {stats.recentContent.map((item) => {
              const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
              const href =
                item.status === 'ready'
                  ? `/workspace/${workspace.id}/content/${item.id}/outputs`
                  : `/workspace/${workspace.id}/content/${item.id}`
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-accent/40"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.title ?? 'Untitled'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {item.kind.replace(/_/g, ' ')} · {formatRelative(item.created_at)}
                    </p>
                  </div>
                  <ContentStatusBadge status={item.status} />
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM: Platform breakdown + Usage — only when has data
      ══════════════════════════════════════════════════════════════ */}
      {stats && (stats.totalOutputs > 0 || usage) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Platform breakdown */}
          {stats.totalOutputs > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="border-b border-border/50 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Outputs by platform
                </p>
              </div>
              <div className="space-y-3 p-5">
                {Object.entries(stats.outputsByPlatform).map(([platform, count]) => {
                  if (count === 0) return null
                  const pct = Math.round((count / maxPlatformCount) * 100)
                  return (
                    <div key={platform} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {PLATFORM_LABELS[platform] ?? platform}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Monthly usage */}
          {usage && (
            <div className="rounded-2xl border border-border/60 bg-card">
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  This month
                </p>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {new Date()
                    .toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    .toUpperCase()}
                </span>
              </div>
              <div className="space-y-4 p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">Videos imported</span>
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
                    <span className="text-xs font-medium">Drafts generated</span>
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
                {plan === 'free' && workspace && (
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
      )}
    </div>
  )
}
