export const metadata = { title: 'AI Avatar' }

import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { AvatarClient } from '@/components/content/avatar-client'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { UpgradeGate } from '@/components/billing/upgrade-gate'

interface PageProps {
  params: { id: string; contentId: string }
}

export default async function AvatarPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const [item, plan] = await Promise.all([
    getContentItem(params.contentId, params.id),
    getWorkspacePlan(params.id),
  ])
  if (!item) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingJob = ((item.metadata as any)?.avatar_job) ?? null

  const planDef = PLANS[plan ?? 'free']
  const hasDid = !!process.env.DID_API_KEY
  const canAvatar = planDef.limits.avatarVideosPerMonth !== 0

  return (
    <UpgradeGate
      currentPlan={plan ?? 'free'}
      requiredPlan="agency"
      workspaceId={params.id}
      featureName="AI Avatar"
      description="Turn any script into a photorealistic talking-head video with D-ID. Unlocks on the Studio plan."
    >
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
        <AvatarClient
          workspaceId={params.id}
          contentId={params.contentId}
          transcript={item.transcript}
          hasHeyGenKey={hasDid && canAvatar}
          existingJob={existingJob}
        />
      </div>
    </UpgradeGate>
  )
}
