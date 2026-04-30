import { notFound, redirect } from 'next/navigation'
import { Telescope } from 'lucide-react'

import { CreatorSearchClient } from '@/components/creators/creator-search-client'
import { SettingsHero } from '@/components/settings/settings-hero'
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
    <div className="mx-auto w-full max-w-5xl space-y-7 p-4 sm:p-8">
      <SettingsHero
        visual={
          <span
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white sm:h-16 sm:w-16"
            style={{
              background:
                'linear-gradient(140deg, #0F0F0F 0%, #1A1A1A 60%, #0F0F0F 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 10px 24px -12px rgba(15,15,15,0.55)',
            }}
            aria-hidden
          >
            <span
              className="pointer-events-none absolute inset-1 rounded-[14px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              }}
            />
            <Telescope className="relative h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.6} />
          </span>
        }
        eyebrow={`${workspace.name} · Research`}
        title="Creator research."
        body="Find creators by niche across YouTube, TikTok, Instagram, X and LinkedIn — competitor checks, collab ideas, or just lurking the scene."
      />

      <CreatorSearchClient workspaceId={params.id} />
    </div>
  )
}
