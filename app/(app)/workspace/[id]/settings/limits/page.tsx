import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { getWorkspaceUsage } from '@/lib/billing/get-usage'
import { getPlanLimits, isUnlimited, PLANS } from '@/lib/billing/plans'
import { PageHeading } from '@/components/workspace/page-heading'

interface LimitsPageProps {
  params: { id: string }
}

export const metadata = { title: 'Usage Limits' }

export const dynamic = 'force-dynamic'

function ProgressBar({ used, limit }: { used: number; limit: number }) {
  if (isUnlimited(limit)) return null
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-yellow-500' : 'bg-primary'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatusBadge({ used, limit }: { used: number; limit: number }) {
  if (isUnlimited(limit)) {
    return <span className="text-xs text-green-600 font-medium">Unlimited</span>
  }
  const pct = (used / limit) * 100
  if (pct >= 90) {
    return <span className="text-xs text-destructive font-medium">Near limit</span>
  }
  if (pct >= 70) {
    return <span className="text-xs text-yellow-600 font-medium">Warning</span>
  }
  return <span className="text-xs text-green-600 font-medium">OK</span>
}

export default async function LimitsPage({ params }: LimitsPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  const [plan, usage] = await Promise.all([
    getWorkspacePlan(params.id),
    getWorkspaceUsage(params.id),
  ])

  const limits = getPlanLimits(plan)
  const planDef = PLANS[plan]

  const rows = [
    {
      feature: 'Content items this month',
      limit: limits.contentItemsPerMonth,
      used: usage.contentItemsThisMonth,
    },
    {
      feature: 'Outputs this month',
      limit: limits.outputsPerMonth,
      used: usage.outputsThisMonth,
    },
    {
      feature: 'Workspaces',
      limit: limits.workspaces,
      used: workspaces.length,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-8">
      <PageHeading
        eyebrow={`${workspace.name} · Limits`}
        title="Usage &amp; limits."
        body={
          <>
            On the <span style={{ color: '#181511', fontWeight: 600 }}>{planDef.name}</span> plan.
          </>
        }
      />

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Feature</th>
              <th className="px-4 py-3 text-right font-medium">Limit</th>
              <th className="px-4 py-3 text-right font-medium">Used</th>
              <th className="px-4 py-3 text-left font-medium">Progress</th>
              <th className="px-4 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{row.feature}</td>
                <td className="px-4 py-3 text-right">
                  {isUnlimited(row.limit) ? '∞' : row.limit}
                </td>
                <td className="px-4 py-3 text-right font-medium">{row.used}</td>
                <td className="px-4 py-3 min-w-[120px]">
                  <ProgressBar used={row.used} limit={row.limit} />
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge used={row.used} limit={row.limit} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">
          Limits are based on your current plan.{' '}
          {plan !== 'agency' ? (
            <>
              Need more?{' '}
              <Link href="/billing" className="font-medium underline underline-offset-4">
                Upgrade your plan
              </Link>
              .
            </>
          ) : (
            'You are on the Agency plan with unlimited usage.'
          )}
        </p>
      </div>
    </div>
  )
}
