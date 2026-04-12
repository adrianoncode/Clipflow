export const metadata = { title: 'Auto-Dub' }

import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { DubbingClient } from '@/components/content/dubbing-client'
import type { DubJob } from '@/app/(app)/workspace/[id]/content/[contentId]/dub/actions'

interface PageProps {
  params: { id: string; contentId: string }
}

export default async function DubPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(params.contentId, params.id)
  if (!item) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingJobs: DubJob[] = ((item.metadata as any)?.dub_jobs as DubJob[]) ?? []

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <DubbingClient
        workspaceId={params.id}
        contentId={params.contentId}
        hasElevenLabsKey={!!process.env.ELEVENLABS_API_KEY}
        sourceHasVideo={!!item.source_url && item.kind === 'video'}
        existingJobs={existingJobs}
      />
    </div>
  )
}
