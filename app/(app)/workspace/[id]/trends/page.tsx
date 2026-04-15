import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import { TrendRadarClient } from '@/components/workspace/trend-radar-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Trend Radar' }

interface PageProps {
  params: { id: string }
}

export default async function TrendsPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const plan = await getWorkspacePlan(params.id)

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
        <h1 className="text-2xl font-bold tracking-tight">Trend Radar</h1>
        <p className="mt-1 text-muted-foreground">
          What&apos;s trending right now — matched to your content
        </p>
      </div>
      <UpgradeGate
        currentPlan={plan ?? 'free'}
        requiredPlan="solo"
        workspaceId={params.id}
        featureName="Trend Radar"
        description="See what's trending right now on TikTok, Instagram, and YouTube — matched to your content niche. Powered by Apify scrapers."
      >
        <TrendRadarClient workspaceId={params.id} />
      </UpgradeGate>
    </div>
  )
}
