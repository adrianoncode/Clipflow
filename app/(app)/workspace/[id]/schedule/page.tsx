import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getScheduledPosts } from '@/lib/scheduler/get-scheduled-posts'
import { getSocialAccounts } from '@/lib/scheduler/get-social-accounts'
import { CancelPostButton } from '@/components/scheduler/cancel-post-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Scheduler' }

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
}

const PLATFORM_EMOJIS: Record<string, string> = {
  tiktok: '🎵',
  instagram: '📸',
  linkedin: '💼',
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  instagram: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  linkedin: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  publishing: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  published: 'bg-green-500/10 text-green-700 border-green-500/20',
  failed: 'bg-red-500/10 text-red-700 border-red-500/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
}

interface SchedulePageProps {
  params: { id: string }
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const [posts, accounts] = await Promise.all([
    getScheduledPosts(params.id),
    getSocialAccounts(params.id),
  ])

  const connectedPlatforms = new Set(accounts.map((a) => a.platform))
  const SUPPORTED_PLATFORMS = ['tiktok', 'instagram', 'linkedin']

  // Group by date string
  type PostRow = (typeof posts)[number]
  const groups = new Map<string, PostRow[]>()
  for (const post of posts) {
    const date = new Date(post.scheduled_for).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(post)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Scheduler</h1>
          <p className="text-sm text-muted-foreground">
            Schedule outputs to publish automatically on social platforms.
          </p>
        </div>
        <Link
          href={`/workspace/${params.id}/schedule/connect`}
          className="shrink-0 rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          Connect accounts &rarr;
        </Link>
      </div>

      {/* Connected accounts row */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Connected platforms
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_PLATFORMS.map((platform) => {
            const connected = connectedPlatforms.has(platform)
            const account = accounts.find((a) => a.platform === platform)
            return (
              <div
                key={platform}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                  connected
                    ? 'border-green-500/30 bg-green-500/10 text-green-700'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                <span>{PLATFORM_EMOJIS[platform]}</span>
                <span>{PLATFORM_LABELS[platform]}</span>
                {connected ? (
                  <span className="text-green-600">
                    {account?.platform_username ? `@${account.platform_username}` : '✓'}
                  </span>
                ) : (
                  <span className="opacity-50">Not connected</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming posts */}
      {posts.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-8 text-center space-y-2">
          <p className="text-sm font-medium">No posts scheduled yet</p>
          <p className="text-xs text-muted-foreground">
            Open any output card and click{' '}
            <span className="font-mono rounded bg-muted px-1">Schedule</span> to queue it for
            publishing.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, items]) => (
            <div key={date}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{date}</h2>
              <ul className="divide-y rounded-md border">
                {items.map((post) => {
                  const contentTitle =
                    post.outputs?.content_items?.title ?? 'Untitled'
                  const preview = post.outputs?.body?.slice(0, 80) ?? ''
                  return (
                    <li key={post.id} className="flex items-start gap-3 px-4 py-3">
                      {/* Platform badge */}
                      <span
                        className={`mt-0.5 shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[post.platform] ?? 'bg-muted text-muted-foreground border-border'}`}
                      >
                        {PLATFORM_EMOJIS[post.platform]} {PLATFORM_LABELS[post.platform] ?? post.platform}
                      </span>

                      {/* Content preview */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{contentTitle}</p>
                        {preview && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {preview}
                            {(post.outputs?.body?.length ?? 0) > 80 ? '…' : ''}
                          </p>
                        )}
                        {post.error_message && (
                          <p className="mt-1 text-xs text-red-600">{post.error_message}</p>
                        )}
                      </div>

                      {/* Time */}
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(post.scheduled_for).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status] ?? 'bg-muted text-muted-foreground border-border'}`}
                      >
                        {post.status}
                      </span>

                      {/* Cancel button (only for scheduled posts) */}
                      {post.status === 'scheduled' && (
                        <CancelPostButton
                          postId={post.id}
                          workspaceId={params.id}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
