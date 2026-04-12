export const metadata = { title: 'AI Avatar' }

import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { AvatarClient } from '@/components/content/avatar-client'

interface PageProps {
  params: { id: string; contentId: string }
}

export default async function AvatarPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(params.contentId, params.id)
  if (!item) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingJob = ((item.metadata as any)?.avatar_job) ?? null

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <AvatarClient
        workspaceId={params.id}
        contentId={params.contentId}
        transcript={item.transcript}
        hasHeyGenKey={!!process.env.DID_API_KEY}
        existingJob={existingJob}
      />
    </div>
  )
}
