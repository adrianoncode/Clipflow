import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  List,
  MessageCircle,
  Send,
  Share2,
  XCircle,
} from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getScheduledPosts } from '@/lib/scheduler/get-scheduled-posts'
import { getUnscheduledOutputs } from '@/lib/scheduler/get-unscheduled-outputs'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { createAdminClient } from '@/lib/supabase/admin'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
import { CancelPostButton } from '@/components/scheduler/cancel-post-button'
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

  // Fold every per-workspace fetch into a single Promise.all — previously
  // getWorkspaces, getWorkspacePlan, and the posts/aiKeys batch each
  // awaited in sequence, costing three round-trips on every Schedule
  // render. Membership + plan-gate redirects happen after the batch.
  const [workspaces, currentPlan, posts, aiKeys, unscheduledOutputs] =
    await Promise.all([
      getWorkspaces(),
      getWorkspacePlan(params.id),
      getScheduledPosts(params.id),
      getAiKeys(params.id),
      isCalendarView ? getUnscheduledOutputs(params.id) : Promise.resolve([]),
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

  // ── Calendar View ──
  if (isCalendarView) {
    return (
      <div className="flex min-h-full flex-col">
        {/* View toggle */}
        <div className="border-b border-border/60 bg-background px-4 py-2 sm:px-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
              <Link
                href={`/workspace/${params.id}/schedule`}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <List className="h-3.5 w-3.5" />
                List
              </Link>
              <span className="flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </span>
            </div>
            <Link
              href={`/workspace/${params.id}/pipeline`}
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Drafts
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
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

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            <Link href={`/workspace/${params.id}`} className="hover:text-foreground transition-colors">Content</Link>
            {' → '}
            <Link href={`/workspace/${params.id}/pipeline`} className="hover:text-foreground transition-colors">Drafts</Link>
            {' → '}
            <span className="font-medium text-foreground">Schedule</span>
          </p>
          <h1
            className="text-[44px] leading-[1.02]"
            style={{
              fontFamily: 'var(--font-instrument-serif), serif',
              letterSpacing: '-.015em',
              color: '#2A1A3D',
            }}
          >
            Schedule.
          </h1>
          <p className="text-sm text-muted-foreground">
            {posts.length === 0
              ? 'Line up your approved posts. We push them out for you at the time you pick.'
              : `${upcomingCount} queued · ${publishedCount} live · ${posts.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
            <span className="flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              <List className="h-3.5 w-3.5" />
              List
            </span>
            <Link
              href={`/workspace/${params.id}/schedule?view=calendar`}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Calendar
            </Link>
          </div>
          <Link
            href={`/workspace/${params.id}/pipeline`}
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-md"
          >
            <CheckCircle2 className="h-4 w-4" />
            View drafts
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

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
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-px hover:bg-primary/90 hover:shadow-md"
          >
            Connect
          </Link>
        </div>
      )}

      {/* ── Queue ── */}
      {posts.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing queued up"
          description="Approve a draft first, then drag it onto the calendar to pick a time."
          actionLabel="Review drafts"
          actionHref={`/workspace/${params.id}/pipeline`}
          secondaryLabel="Open calendar"
          secondaryHref={`/workspace/${params.id}/schedule?view=calendar`}
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, items]) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                  {date}
                </h2>
                <span className="h-px flex-1 bg-border/40" />
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums text-muted-foreground">
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
                          <p className="mt-1.5 flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[11px] text-red-600">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {post.error_message}
                          </p>
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
