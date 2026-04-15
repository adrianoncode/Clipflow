import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { PLANS } from '@/lib/billing/plans'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import { getContentItems } from '@/lib/content/get-content-items'
import { listRenders } from '@/lib/video/renders/list-renders'
import { getServiceKey } from '@/lib/ai/get-service-key'
import { RenderStudioClient } from '@/components/studio/render-studio-client'

export const metadata = { title: 'Video Studio' }
export const dynamic = 'force-dynamic'

export default async function StudioPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const [plan, contentItems, recentRenders, { key: shotstackKey }] = await Promise.all([
    getWorkspacePlan(params.id),
    getContentItems(params.id, { limit: 12 }),
    listRenders({ workspaceId: params.id, limit: 10 }),
    getServiceKey(params.id, 'shotstack'),
  ])

  const planDef = PLANS[plan ?? 'free']
  const canRender = planDef.limits.videoRendersPerMonth !== 0

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Video Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a video → choose style → render. AI adds captions, reframes, and exports
            a ready-to-post MP4 in ~60 seconds.
          </p>
        </div>
        <Link
          href={`/workspace/${params.id}/content/new`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Import video
        </Link>
      </div>

      {/* Upgrade gate — renders locked on free plan */}
      <UpgradeGate
        currentPlan={plan ?? 'free'}
        requiredPlan="solo"
        workspaceId={params.id}
        featureName="Video Studio"
        description="Render polished short-form videos with AI captions, hooks, and style presets. Available from Solo ($19/mo)."
      >
        <RenderStudioClient
          workspaceId={params.id}
          contentItems={contentItems}
          recentRenders={recentRenders}
          hasShotstackKey={!!shotstackKey}
        />
      </UpgradeGate>
    </div>
  )
}
