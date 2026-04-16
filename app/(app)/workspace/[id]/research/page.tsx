import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import { ResearchTabs } from '@/components/workspace/research-tabs'

export const metadata = { title: 'Research' }
export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
  searchParams: { tab?: string }
}

export default async function ResearchPage({ params, searchParams }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const plan = await getWorkspacePlan(params.id)
  const initialTab = searchParams.tab === 'creators' ? 'creators' : 'competitors'

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Research</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyze competitors and find creators to collaborate with. Powered by Apify scrapers.
        </p>
      </div>
      <UpgradeGate
        currentPlan={plan ?? 'free'}
        requiredPlan="solo"
        workspaceId={params.id}
        featureName="Research"
        description="Deep research on competitors and creators across YouTube, TikTok, and Instagram. Available from Solo plan."
      >
        <ResearchTabs workspaceId={params.id} initialTab={initialTab} />
      </UpgradeGate>
    </div>
  )
}
