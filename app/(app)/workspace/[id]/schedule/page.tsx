import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Send,
  Share2,
  XCircle,
} from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { CreateStepper } from '@/components/create/create-stepper'
import { ScheduleViewTabs } from '@/components/scheduler/schedule-view-tabs'
import { ScheduleEmptyPreview } from '@/components/scheduler/schedule-empty-preview'
import { PlanClient } from '@/components/scheduler/plan-client'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getScheduledPosts } from '@/lib/scheduler/get-scheduled-posts'
import { getUnscheduledOutputs } from '@/lib/scheduler/get-unscheduled-outputs'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getLatestContentId } from '@/lib/content/get-content-items'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
import { CancelPostButton } from '@/components/scheduler/cancel-post-button'
import { RetryFailedButton } from '@/components/scheduler/retry-failed-button'
import { CalendarClient } from '@/components/workspace/calendar-client'
import {
  quickScheduleAction,
  reschedulePostAction,
} from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import { PLATFORM_LABELS, PLATFORM_SOFT_COLORS as PLATFORM_BADGE } from '@/lib/platforms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Schedule' }

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; Icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Scheduled', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', Icon: Clock },
  publishing: { label: 'Publishing', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60', Icon: Send },
  published: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60', Icon: CheckCircle2 },
  failed: { label: 'Failed', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/60', Icon: AlertTriangle },
  cancelled: { label: 'Cancelled', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border/40', Icon: XCircle },
}

function formatTimeAgo(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  const hours = Math.round(diff / 3_600_000)
  if (hours < 0) return 'overdue'
  if (hours < 1) return `in ${Math.round(diff / 60_000)}m`
  if (hours < 24) return `in ${hours}h`
  return `in ${Math.round(hours / 24)}d`
}

function formatStatNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '-'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface SchedulePageProps {
  params: { id: string }
  searchParams: { view?: string }
}

export default async function SchedulePage({ params, searchParams }: SchedulePageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const isCalendarView = searchParams.view === 'calendar'
  const isPlanView = searchParams.view === 'plan'

  // Fold every per-workspace fetch into a single Promise.all — previously
  // getWorkspaces, getWorkspacePlan, and the posts/aiKeys batch each
  // awaited in sequence, costing three round-trips on every Schedule
  // render. Membership + plan-gate redirects happen after the batch.
  const [workspaces, currentPlan, posts, aiKeys, unscheduledOutputs, latestContentId] =
    await Promise.all([
      getWorkspaces(),
      getWorkspacePlan(params.id),
      getScheduledPosts(params.id),
      getAiKeys(params.id),
      isCalendarView ? getUnscheduledOutputs(params.id) : Promise.resolve([]),
      getLatestContentId(params.id),
    ])

  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  // Hard server-gate: if the plan doesn't include scheduling, bounce to
  // the billing upsell before we render any "Schedule" UI — otherwise
  // the Pipeline's "Schedule N" button lands the user on a page that
  // silently does nothing on submit.
  if (!checkPlanAccess(currentPlan, 'scheduling')) {
    redirect(`/billing?workspace_id=${params.id}&plan=solo&feature=scheduling`)
  }

  // "Ready to auto-publish" = ANY connected destination: Upload-Post
  // bundle OR a Composio channel OR BYO X keys. Before this, workspaces
  // that only connected Composio/X saw a stale "Connect Upload-Post"
  // banner even though they were fully set up.
  const hasUploadPostKey = aiKeys.some((k) => k.provider === 'upload-post')
  let hasAnyChannel = hasUploadPostKey
  if (!hasAnyChannel) {
    try {
      const supabase = createAdminClient()
      const { data: ws } = await supabase
        .from('workspaces')
        .select('branding')
        .eq('id', params.id)
        .single()
      const branding = (ws?.branding ?? {}) as Record<string, unknown>
      const channels = (branding.channels ?? {}) as Record<string, unknown>
      hasAnyChannel = Object.keys(channels).length > 0
    } catch { /* ignore */ }
  }

  // Calendar view — server actions
  async function handleQuickSchedule(fd: FormData) {
    'use server'
    return quickScheduleAction({ ok: undefined }, fd)
  }

  async function handleReschedule(fd: FormData) {
    'use server'
    return reschedulePostAction({ ok: undefined }, fd)
  }

  // ── Plan View ──
  // The Plan tab is a thin client surface — it asks the action layer
  // to generate the next-week plan, then renders the slots. We don't
  // pre-fetch on the server because the LLM call is metered; the user
  // explicitly opts in by hitting "Generate plan".
  if (isPlanView) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4 sm:px-8 sm:pt-6">
          <div className="mx-auto max-w-5xl">
            <CreateStepper
              workspaceId={params.id}
              activeStep={6}
              contentId={latestContentId ?? undefined}
            />
          </div>
        </div>
        <div className="border-b border-border/60 bg-background px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <ScheduleViewTabs
              workspaceId={params.id}
              current="plan"
              approvedCount={unscheduledOutputs.length}
              scheduledCount={posts.length}
            />
          </div>
        </div>
        <PlanClient workspaceId={params.id} />
      </div>
    )
  }

  // ── Calendar View ──
  if (isCalendarView) {
    const approvedReady = unscheduledOutputs.length
    return (
      <div className="flex min-h-full flex-col">
        <div className="px-4 pt-4 sm:px-8 sm:pt-6">
          <div className="mx-auto max-w-5xl">
            <CreateStepper
              workspaceId={params.id}
              activeStep={6}
              contentId={latestContentId ?? undefined}
            />
          </div>
        </div>
        {/* Schedule has 3 sub-views: Calendar (drag-drop), Queue (list),
            Plan (AI-generated week). Pipeline (= Approve, Step 5) lives
            separately in the sidebar — the Stepper-Header above marks
            the section transition. */}
        <div className="border-b border-border/60 bg-background px-4 py-3 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <ScheduleViewTabs
              workspaceId={params.id}
              current="calendar"
              approvedCount={approvedReady}
              scheduledCount={posts.length}
            />
          </div>
        </div>

        <CalendarClient
          workspaceId={params.id}
          scheduledPosts={posts}
          unscheduledOutputs={unscheduledOutputs}
          quickScheduleAction={handleQuickSchedule}
          reschedulePostAction={handleReschedule}
        />
      </div>
    )
  }

  // ── List View (default) ──

  // Group by date string
  type PostRow = (typeof posts)[number]
  const groups = new Map<string, PostRow[]>()
  for (const post of posts) {
    const date = new Date(post.scheduled_for).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(post)
  }

  const upcomingCount = posts.filter((p) => p.status === 'scheduled').length
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const failedCount = posts.filter((p) => p.status === 'failed').length
  // Each failed-row block below has `aria-live="polite"` so screen-
  // reader users hear the error when a status flip lands during a
  // session — without this the failure announcement was visible-only.

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <CreateStepper
        workspaceId={params.id}
        activeStep={6}
        contentId={latestContentId ?? undefined}
      />
      <PageHeader
        category={posts.length === 0 ? 'Posts queue' : `${posts.length} post${posts.length === 1 ? '' : 's'}`}
        title="Queue."
        description={
          posts.length === 0
            ? undefined
            : `${upcomingCount} queued · ${publishedCount} live · ${failedCount} failed`
        }
      />

      <ScheduleViewTabs
        workspaceId={params.id}
        current="queue"
        scheduledCount={posts.length}
      />

      {/* ── Stats strip ── */}
      {posts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-amber-200/40 bg-amber-50/30 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold tabular-nums leading-none">{upcomingCount}</p>
              <p className="text-[10px] font-medium text-amber-700/70">Queued</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200/40 bg-emerald-50/30 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold tabular-nums leading-none">{publishedCount}</p>
              <p className="text-[10px] font-medium text-emerald-700/70">Live</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-red-200/40 bg-red-50/30 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold tabular-nums leading-none">{failedCount}</p>
              <p className="text-[10px] font-medium text-red-600/70">Failed</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Publishing status banner ── */}
      {hasAnyChannel ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Auto-posting is on
            </p>
            <p className="text-[11px] text-emerald-700/70">
              We&apos;ll publish straight to TikTok, Instagram, YouTube &amp; LinkedIn.
            </p>
          </div>
          <Link
            href="/settings/channels"
            className="shrink-0 text-[11px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            Manage →
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-background p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Send className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Let Clipflow publish for you</p>
            <p className="text-[11px] text-muted-foreground">
              Connect your TikTok, Instagram, YouTube &amp; LinkedIn so posts go live on their own. Until then they wait here.
            </p>
          </div>
          <Link
            href="/settings/channels"
            className="cf-btn-3d cf-btn-3d-primary shrink-0 rounded-xl px-4 py-2 text-[11px]"
          >
            Connect
          </Link>
        </div>
      )}

      {/* ── Queue ── */}
      {posts.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled yet."
          description="Approve a draft on the Board, then drop it onto the calendar. Posts go live exactly when you set them — no manual copy-paste."
          actionLabel="Review drafts"
          actionHref={`/workspace/${params.id}/pipeline`}
          secondaryLabel="Open calendar"
          secondaryHref={`/workspace/${params.id}/schedule?view=calendar`}
          preview={<ScheduleEmptyPreview />}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, items]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85"
                  style={{
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  <span aria-hidden className="inline-block h-px w-5 bg-primary/40" />
                  {date}
                </h2>
                <span className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/30 to-transparent" />
                <span
                  className="inline-flex h-5 items-center rounded-full border border-border/60 bg-background px-2 text-[10.5px] font-bold tabular-nums text-muted-foreground"
                  style={{
                    fontFamily:
                      'var(--font-inter-tight), var(--font-inter), sans-serif',
                  }}
                >
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((post) => {
                  const contentTitle = post.outputs?.content_items?.title ?? 'Untitled'
                  const preview = post.outputs?.body?.slice(0, 120) ?? ''
                  const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.scheduled!
                  const StatusIcon = statusCfg.Icon
                  const isScheduled = post.status === 'scheduled'
                  return (
                    <div
                      key={post.id}
                      className={`group flex items-start gap-3 rounded-xl border bg-card px-4 py-3.5 transition-all hover:-translate-y-px hover:shadow-md hover:shadow-primary/[0.04] ${statusCfg.border}`}
                    >
                      {/* Time + platform */}
                      <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 pt-0.5">
                        <span className="font-mono text-sm font-bold tabular-nums text-foreground">
                          {new Date(post.scheduled_for).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${PLATFORM_BADGE[post.platform] ?? 'bg-muted text-muted-foreground'}`}
                        >
                          {PLATFORM_LABELS[post.platform] ?? post.platform}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="relative flex flex-col items-center self-stretch">
                        <div className={`h-2.5 w-2.5 rounded-full ${post.status === 'published' ? 'bg-emerald-400' : post.status === 'failed' ? 'bg-red-400' : 'bg-primary/40'}`} />
                        <div className="flex-1 w-px bg-border/40" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{contentTitle}</p>
                        {preview && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70">
                            {preview}
                            {(post.outputs?.body?.length ?? 0) > 120 ? '…' : ''}
                          </p>
                        )}
                        {post.error_message && (
                          <div
                            role={post.status === 'failed' ? 'alert' : undefined}
                            aria-live={post.status === 'failed' ? 'polite' : undefined}
                            className="mt-1.5 flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-600"
                          >
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              {post.error_message}
                            </span>
                            {post.status === 'failed' && (
                              <RetryFailedButton
                                postId={post.id}
                                workspaceId={params.id}
                              />
                            )}
                          </div>
                        )}
                        {isScheduled && (
                          <p className="mt-1 text-[10px] text-muted-foreground/50">
                            {formatTimeAgo(post.scheduled_for)}
                          </p>
                        )}
                        {post.status === 'published' && post.metadata && typeof post.metadata === 'object' && (() => {
                          const meta = post.metadata as Record<string, unknown>
                          const views = typeof meta.views === 'number' ? meta.views : undefined
                          const likes = typeof meta.likes === 'number' ? meta.likes : undefined
                          const comments = typeof meta.comments === 'number' ? meta.comments : undefined
                          const shares = typeof meta.shares === 'number' ? meta.shares : undefined
                          const engRate = typeof meta.engagement_rate === 'number' ? meta.engagement_rate : undefined
                          if (views === undefined && likes === undefined) return null
                          return (
                            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg bg-emerald-50/50 px-2.5 py-1.5 text-[11px] text-emerald-800">
                              {views !== undefined && (
                                <span className="inline-flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {formatStatNum(views)}
                                </span>
                              )}
                              {likes !== undefined && (
                                <span className="inline-flex items-center gap-1">
                                  <Heart className="h-3 w-3" /> {formatStatNum(likes)}
                                </span>
                              )}
                              {comments !== undefined && (
                                <span className="inline-flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" /> {formatStatNum(comments)}
                                </span>
                              )}
                              {shares !== undefined && (
                                <span className="inline-flex items-center gap-1">
                                  <Share2 className="h-3 w-3" /> {formatStatNum(shares)}
                                </span>
                              )}
                              {engRate !== undefined && (
                                <span className="ml-auto font-semibold text-emerald-700">
                                  {engRate.toFixed(1)}% eng.
                                </span>
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Status + actions */}
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <StatusIcon className={`h-3 w-3 ${post.status === 'publishing' ? 'animate-pulse' : ''}`} />
                          {statusCfg.label}
                        </div>
                        {isScheduled && (
                          <CancelPostButton postId={post.id} workspaceId={params.id} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
