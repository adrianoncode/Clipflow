import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import { CompetitorSpyClient } from '@/components/workspace/competitor-spy-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Competitor Spy' }

interface PageProps {
  params: { id: string }
}

export default async function CompetitorsPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const plan = await getWorkspacePlan(params.id)
  const planDef = PLANS[plan ?? 'free']
  const _canAnalyze = planDef.features.competitorAnalysis && planDef.limits.competitorAnalysesPerMonth !== 0

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to workspace
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Competitor Spy</h1>
        <p className="mt-1 text-muted-foreground">
          Analyze any competitor&apos;s content strategy — tone, topics, gaps, and how to stand out
        </p>
      </div>
      <UpgradeGate
        currentPlan={plan ?? 'free'}
        requiredPlan="solo"
        workspaceId={params.id}
        featureName="Competitor Analysis"
        description="Analyze any competitor's content strategy, gaps, and how to stand out. Powered by Apify scrapers."
      >
        <CompetitorSpyClient workspaceId={params.id} />
      </UpgradeGate>
    </div>
  )
}
