import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  Inbox,
  MessageCircle,
  Send,
  Share2,
  XCircle,
} from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getScheduledPosts } from '@/lib/scheduler/get-scheduled-posts'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { CancelPostButton } from '@/components/scheduler/cancel-post-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Schedule' }

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  instagram_reels: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  youtube_shorts: 'YouTube',
}

const PLATFORM_BADGE: Record<string, string> = {
  tiktok: 'bg-pink-100 text-pink-700',
  instagram: 'bg-purple-100 text-purple-700',
  instagram_reels: 'bg-purple-100 text-purple-700',
  linkedin: 'bg-blue-100 text-blue-700',
  youtube: 'bg-red-100 text-red-700',
  youtube_shorts: 'bg-red-100 text-red-700',
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; Icon: typeof CheckCircle2 }> = {
  scheduled: { label: 'Scheduled', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60', Icon: CalendarClock },
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
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const [posts, aiKeys] = await Promise.all([
    getScheduledPosts(params.id),
    getAiKeys(params.id),
  ])

  const hasUploadPostKey = aiKeys.some((k) => k.provider === 'upload-post')

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
          <h1 className="text-xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            {posts.length === 0
              ? 'Queue approved outputs to publish automatically.'
              : `${upcomingCount} upcoming · ${publishedCount} published · ${posts.length} total`}
          </p>
        </div>
        <Link
          href={`/workspace/${params.id}/pipeline`}
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/10 hover:shadow-md"
        >
          <CheckCircle2 className="h-4 w-4" />
          View Pipeline
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
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
              <p className="text-[10px] font-medium text-amber-700/70">Upcoming</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200/40 bg-emerald-50/30 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-mono text-lg font-bold tabular-nums leading-none">{publishedCount}</p>
              <p className="text-[10px] font-medium text-emerald-700/70">Published</p>
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
      {hasUploadPostKey ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Upload-Post connected
            </p>
            <p className="text-[11px] text-emerald-700/70">
              Auto-publishing to TikTok, Reels, Shorts &amp; LinkedIn.
            </p>
          </div>
          <Link
            href="/settings/ai-keys"
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
            <p className="text-sm font-semibold">Connect Upload-Post to auto-publish</p>
            <p className="text-[11px] text-muted-foreground">
              One API key → TikTok, Reels, Shorts &amp; LinkedIn. Posts stay queued until connected.
            </p>
          </div>
          <Link
            href="/settings/ai-keys"
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
          title="Nothing scheduled yet"
          description="Approve outputs in the pipeline, then drag them onto the calendar to schedule."
          actionLabel="Open Pipeline"
          actionHref={`/workspace/${params.id}/pipeline`}
          secondaryLabel="View Calendar"
          secondaryHref={`/workspace/${params.id}/calendar`}
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
