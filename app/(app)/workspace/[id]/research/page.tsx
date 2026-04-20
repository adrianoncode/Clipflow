import { notFound, redirect } from 'next/navigation'

import { CreatorSearchClient } from '@/components/creators/creator-search-client'
import { PageHeading } from '@/components/workspace/page-heading'
import { getUser } from '@/lib/auth/get-user'
import { getWorkspaces } from '@/lib/auth/get-workspaces'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Creator Research' }

interface ResearchPageProps {
  params: { id: string }
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)
  if (!workspace) notFound()

  // Same gate as the sidebar's `requires: 'creatorResearch'` — URL paste
  // must not bypass it.
  const plan = await getWorkspacePlan(params.id)
  if (!checkPlanAccess(plan, 'creatorResearch')) {
    redirect(`/billing?workspace_id=${params.id}&plan=solo&feature=creatorResearch`)
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <PageHeading
        eyebrow={`${workspace.name} · Research`}
        title="Creator research."
        body="Find creators by niche across YouTube, TikTok, and Instagram. Great for competitor checks, collab ideas, or just lurking."
      />

      <CreatorSearchClient workspaceId={params.id} />
    </div>
  )
}
