export const metadata = { title: 'Auto-Dub' }

import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { DubbingClient } from '@/components/content/dubbing-client'
import { getServiceKey } from '@/lib/ai/get-service-key'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import type { DubJob } from '@/app/(app)/workspace/[id]/content/[contentId]/dub/actions'

interface PageProps {
  params: { id: string; contentId: string }
}

export default async function DubPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const [item, { key: elevenLabsKey }, plan] = await Promise.all([
    getContentItem(params.contentId, params.id),
    getServiceKey(params.id, 'elevenlabs'),
    getWorkspacePlan(params.id),
  ])
  if (!item) notFound()

  const planDef = PLANS[plan ?? 'free']
  const canDub = planDef.limits.dubVideosPerMonth !== 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingJobs: DubJob[] = ((item.metadata as any)?.dub_jobs as DubJob[]) ?? []

  return (
    <UpgradeGate
      currentPlan={plan ?? 'free'}
      requiredPlan="agency"
      workspaceId={params.id}
      featureName="Voice Dubbing"
      description="Dub your video into another language with ElevenLabs voice cloning. Unlocks on the Studio plan."
    >
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
        <DubbingClient
          workspaceId={params.id}
          contentId={params.contentId}
          hasElevenLabsKey={!!elevenLabsKey && canDub}
          sourceHasVideo={!!item.source_url && item.kind === 'video'}
          existingJobs={existingJobs}
        />
      </div>
    </UpgradeGate>
  )
}
