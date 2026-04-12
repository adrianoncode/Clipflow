export const dynamic = 'force-dynamic'
export const metadata = { title: 'Reports' }

import { cookies } from 'next/headers'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getReportData } from '@/lib/reports/get-report-data'
import { getUser } from '@/lib/auth/get-user'
import { SendReportButton } from './send-report-button'

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-center">
      <div className="text-3xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function PlatformBreakdown({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown)
  if (!entries.length) return <p className="text-sm text-muted-foreground">No outputs yet.</p>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-2 font-medium">Platform</th>
          <th className="pb-2 text-right font-medium">Outputs</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([platform, count]) => (
          <tr key={platform} className="border-b last:border-0">
            <td className="py-2">{platform}</td>
            <td className="py-2 text-right">{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TopContentList({
  items,
}: {
  items: Array<{ id: string; title: string | null; outputs: number }>
}) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No content yet.</p>
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 text-xs text-muted-foreground">{i + 1}.</span>
            <span className="truncate">{item.title ?? '(untitled)'}</span>
          </span>
          <span className="shrink-0 text-muted-foreground">{item.outputs} output{item.outputs !== 1 ? 's' : ''}</span>
        </li>
      ))}
    </ol>
  )
}

export default async function ReportsPage() {
  const user = await getUser()
  const workspaces = await getWorkspaces()
  const cookieWorkspaceId = cookies().get(CURRENT_WORKSPACE_COOKIE)?.value
  const personal = workspaces.find((w) => w.type === 'personal')
  const currentWorkspace =
    workspaces.find((w) => w.id === cookieWorkspaceId) ?? personal ?? workspaces[0]

  if (!currentWorkspace) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">No workspace found.</p>
      </div>
    )
  }

  const [weekReport, monthReport] = await Promise.all([
    getReportData(currentWorkspace.id, 'week'),
    getReportData(currentWorkspace.id, 'month'),
  ])

  const userEmail = user?.email ?? ''

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Activity Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace activity for <span className="font-medium">{currentWorkspace.name}</span>.
        </p>
      </div>

      {/* This Week */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">This Week</h2>
          <SendReportButton
            workspaceId={currentWorkspace.id}
            period="week"
            userEmail={userEmail}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Content Created" value={weekReport.contentCreated} />
          <StatBox label="Outputs Generated" value={weekReport.outputsGenerated} />
          <StatBox label="Approved" value={weekReport.outputsApproved} />
          <StatBox label="Starred" value={weekReport.starredOutputs} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Platform Breakdown</h3>
            <PlatformBreakdown breakdown={weekReport.platformBreakdown} />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Top Content</h3>
            <TopContentList items={weekReport.topContent} />
          </div>
        </div>
      </section>

      <hr />

      {/* This Month */}
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium">{monthReport.period.label}</h2>
          <SendReportButton
            workspaceId={currentWorkspace.id}
            period="month"
            userEmail={userEmail}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Content Created" value={monthReport.contentCreated} />
          <StatBox label="Outputs Generated" value={monthReport.outputsGenerated} />
          <StatBox label="Approved" value={monthReport.outputsApproved} />
          <StatBox label="Starred" value={monthReport.starredOutputs} />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Platform Breakdown</h3>
            <PlatformBreakdown breakdown={monthReport.platformBreakdown} />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Top Content</h3>
            <TopContentList items={monthReport.topContent} />
          </div>
        </div>
      </section>

      <hr />

      {/* Scheduled reports */}
      <section className="rounded-lg border border-dashed p-6 text-center">
        <h3 className="font-medium">Scheduled Reports</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Coming soon — weekly digest emails delivered straight to your inbox.
        </p>
      </section>
    </div>
  )
}
