import { cookies } from 'next/headers'
import { BarChart3, CheckCircle2, FileText, Layers, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getAnalytics } from '@/lib/dashboard/get-analytics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Analytics' }

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

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
  linkedin: 'bg-blue-500',
}

const STATE_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400',
  review: 'bg-amber-400',
  approved: 'bg-green-500',
  exported: 'bg-blue-500',
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  approved: 'Approved',
  exported: 'Exported',
}

function shortMonth(yyyyMm: string): string {
  try {
    const [year, month] = yyyyMm.split('-')
    const d = new Date(Number(year), Number(month) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short' })
  } catch {
    return yyyyMm
  }
}

function BarChart({ data, color }: { data: Array<{ month: string; count: number }>; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex h-32 items-end gap-2">
      {data.map(({ month, count }) => {
        const pct = Math.round((count / max) * 100)
        return (
          <div key={month} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">{count > 0 ? count : ''}</span>
            <div className="w-full rounded-t" style={{ height: `${Math.max(pct, count > 0 ? 4 : 2)}%` }}>
              <div className={`h-full w-full rounded-t ${color}`} />
            </div>
            <span className="text-[10px] text-muted-foreground">{shortMonth(month)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default async function AnalyticsPage() {
  const [workspaces] = await Promise.all([getWorkspaces()])
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

  const analytics = await getAnalytics(currentWorkspace.id)

  const maxPlatform = Math.max(...Object.values(analytics.platformBreakdown), 1)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{currentWorkspace.name}</p>
      </div>

      {/* Stat boxes */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Total content
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold">{analytics.totalContent}</p>
            <p className="mt-1 text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Total outputs
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold">{analytics.totalOutputs}</p>
            <p className="mt-1 text-xs text-muted-foreground">platform drafts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              Starred
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold">{analytics.totalStarred}</p>
            <p className="mt-1 text-xs text-muted-foreground">strong outputs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-3xl font-bold">{analytics.totalApproved}</p>
            <p className="mt-1 text-xs text-muted-foreground">ready to publish</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content by month */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Content created (last 6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={analytics.contentByMonth} color="bg-primary" />
          </CardContent>
        </Card>

        {/* Outputs by month */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Outputs generated (last 6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={analytics.outputsByMonth} color="bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      {/* Platform + Pipeline row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Platform breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.keys(PLATFORM_LABELS).map((platform) => {
              const count = analytics.platformBreakdown[platform] ?? 0
              const pct = Math.round((count / maxPlatform) * 100)
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{PLATFORM_LABELS[platform]}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-1.5 rounded-full ${PLATFORM_COLORS[platform] ?? 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.values(analytics.platformBreakdown).every((v) => v === 0) && (
              <p className="text-xs text-muted-foreground">No outputs yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Output pipeline funnel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Output pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['draft', 'review', 'approved', 'exported'] as const).map((state) => {
              const count = analytics.stateBreakdown[state] ?? 0
              const total = Object.values(analytics.stateBreakdown).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={state} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{STATE_LABELS[state]}</span>
                    <span className="text-xs text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-1.5 rounded-full ${STATE_COLORS[state] ?? 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.values(analytics.stateBreakdown).every((v) => v === 0) && (
              <p className="text-xs text-muted-foreground">No output state data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top performing content */}
      {analytics.topContent.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top performing content</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="px-6 py-2 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">
                    <Star className="inline h-3.5 w-3.5" />
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-muted-foreground">Outputs</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.topContent.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-2 truncate max-w-xs text-sm">{item.title ?? 'Untitled'}</td>
                    <td className="px-4 py-2 text-center text-amber-600 dark:text-amber-400 font-medium">
                      {item.starred}
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground">{item.total_outputs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
