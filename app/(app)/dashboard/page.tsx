import Link from 'next/link'
import { cookies } from 'next/headers'
import { FileText, Globe, Rss, Video, Youtube } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddAiKeyBanner } from '@/components/dashboard/add-ai-key-banner'
import { ContentStatusBadge } from '@/components/content/content-status-badge'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { getWorkspaceStats } from '@/lib/dashboard/get-workspace-stats'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard',
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

const KIND_ICON = {
  video: Video,
  youtube: Youtube,
  url: Globe,
  rss: Rss,
  text: FileText,
} as const

function UsageBar({ used, limit }: { used: number; limit: number }) {
  if (limit === -1) {
    return <span className="text-xs text-muted-foreground">Unlimited</span>
  }
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-500' : 'bg-primary'
  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {used} / {limit} used
      </p>
    </div>
  )
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const minutes = Math.round(diff / 60_000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours} h ago`
    const days = Math.round(hours / 24)
    if (days < 7) return `${days} d ago`
    return new Date(iso).toLocaleDateString()
  } catch {
    return iso
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok',
  instagram_reels: 'Reels',
  youtube_shorts: 'Shorts',
  linkedin: 'LinkedIn',
}

export default async function DashboardPage() {
  const [user, workspaces] = await Promise.all([getUser(), getWorkspaces()])
  const fullName =
    typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : null
  const displayName = fullName ?? user?.email ?? 'there'

  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  const [aiKeys, stats, usage, plan] = currentWorkspace
    ? await Promise.all([
        getAiKeys(currentWorkspace.id),
        getWorkspaceStats(currentWorkspace.id),
        getWorkspaceUsage(currentWorkspace.id),
        getWorkspacePlan(currentWorkspace.id),
      ])
    : [[], null, null, 'free' as const]

  const showAiKeyNudge =
    !!currentWorkspace && currentWorkspace.role === 'owner' && aiKeys.length === 0

  const planDef = PLANS[plan ?? 'free']

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome, {displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {currentWorkspace
              ? `${currentWorkspace.name} · `
              : ''}
            <span className="rounded-full border px-2 py-0.5 text-xs font-medium">
              {planDef.name} plan
            </span>
          </p>
        </div>
        {currentWorkspace && (
          <Link
            href={`/workspace/${currentWorkspace.id}/content/new`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            + New content
          </Link>
        )}
      </div>

      {showAiKeyNudge && currentWorkspace ? (
        <AddAiKeyBanner workspaceName={currentWorkspace.name} />
      ) : null}

      {/* Stats row */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalContent}</p>
              <p className="mt-1 text-xs text-muted-foreground">content items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total outputs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalOutputs}</p>
              <p className="mt-1 text-xs text-muted-foreground">platform drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Starred</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">⭐ {stats.starredOutputs}</p>
              <p className="mt-1 text-xs text-muted-foreground">strong outputs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.approvedOutputs}</p>
              <p className="mt-1 text-xs text-muted-foreground">ready to publish</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Usage */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Content items</p>
                <UsageBar
                  used={usage.contentItemsThisMonth}
                  limit={planDef.limits.contentItemsPerMonth}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Outputs generated</p>
                <UsageBar
                  used={usage.outputsThisMonth}
                  limit={planDef.limits.outputsPerMonth}
                />
              </div>
              {plan === 'free' && currentWorkspace && (
                <Link
                  href="/billing"
                  className="block text-center text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Upgrade for more →
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* Platform breakdown */}
        {stats && stats.totalOutputs > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outputs by platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(stats.outputsByPlatform).map(([platform, count]) => (
                <div key={platform} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {PLATFORM_LABELS[platform] ?? platform}
                  </span>
                  <span className="text-xs font-medium">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent content */}
        {stats && stats.recentContent.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Recent content</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {stats.recentContent.map((item) => {
                  const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/workspace/${currentWorkspace?.id}/content/${item.id}`}
                        className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-accent"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="flex-1 truncate text-xs">
                          {item.title ?? 'Untitled'}
                        </span>
                        <ContentStatusBadge status={item.status} />
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {currentWorkspace && (
                <Link
                  href={`/workspace/${currentWorkspace.id}`}
                  className="mt-3 block text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  View all →
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions if no content yet */}
      {stats && stats.totalContent === 0 && currentWorkspace && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Start creating</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Upload a video, paste a YouTube link, or drop a script. Clipflow transcribes it and generates TikTok, Reels, Shorts, and LinkedIn drafts automatically.</p>
              <Link
                href={`/workspace/${currentWorkspace.id}/content/new`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                New content
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Set your brand voice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Tell the AI your tone, what to avoid, and give it an example hook. Every draft will automatically match your style.</p>
              <Link
                href="/settings/brand-voice"
                className="inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
              >
                Configure brand voice
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
