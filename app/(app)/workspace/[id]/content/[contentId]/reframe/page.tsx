export const dynamic = 'force-dynamic'
export const metadata = { title: 'Auto-Reframe' }

import { notFound } from 'next/navigation'

import { ReframeClient } from '@/components/content/reframe-client'
import { getContentItem } from '@/lib/content/get-content-item'
import { getSignedUrl } from '@/lib/content/get-signed-url'
import { getServiceKey } from '@/lib/ai/get-service-key'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { UpgradeGate } from '@/components/billing/upgrade-gate'

interface ReframePageProps {
  params: { id: string; contentId: string }
}

export default async function ReframePage({ params }: ReframePageProps) {
  const { id: workspaceId, contentId } = params

  const item = await getContentItem(contentId, workspaceId)

  if (!item) {
    notFound()
  }

  if (item.kind !== 'video' || !item.source_url) {
    return (
      <div className="mx-auto w-full max-w-2xl p-8 text-center">
        <p className="text-muted-foreground">
          Auto-Reframe is only available for uploaded videos with a source file.
        </p>
      </div>
    )
  }

  const needsSignedUrl =
    item.source_url != null && !item.source_url.startsWith('http')

  const videoUrl = needsSignedUrl
    ? await getSignedUrl(item.source_url)
    : item.source_url

  // Read existing reframe job from metadata if present
  const meta =
    item.metadata &&
    typeof item.metadata === 'object' &&
    !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const existingJob =
    meta.reframe_job &&
    typeof meta.reframe_job === 'object' &&
    !Array.isArray(meta.reframe_job)
      ? (meta.reframe_job as { jobId: string; aspectRatio: string })
      : null

  // BYOK-first: check user's own Replicate key, fall back to platform key
  const [{ key: replicateKey }, plan] = await Promise.all([
    getServiceKey(workspaceId, 'replicate'),
    getWorkspacePlan(workspaceId),
  ])
  const hasReplicateKey = !!replicateKey
  const planDef = PLANS[plan ?? 'free']
  const canRender = planDef.limits.videoRendersPerMonth !== 0

  return (
    <UpgradeGate
      currentPlan={plan ?? 'free'}
      requiredPlan="solo"
      workspaceId={workspaceId}
      featureName="Video Reframe"
      description="Automatically crop and resize your video for TikTok, Reels, Shorts, or landscape. AI keeps the subject centred."
    >
      <ReframeClient
        workspaceId={workspaceId}
        contentId={contentId}
        videoUrl={videoUrl}
        existingJob={existingJob}
        hasReplicateKey={hasReplicateKey && canRender}
      />
    </UpgradeGate>
  )
}
