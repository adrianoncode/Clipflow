export const dynamic = 'force-dynamic'
export const metadata = { title: 'Content Calendar' }

import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getScheduledPosts } from '@/lib/scheduler/get-scheduled-posts'
import { CalendarClient } from '@/components/workspace/calendar-client'

interface PageProps {
  params: { id: string }
}

export default async function CalendarPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = params.id
  if (!workspaceId) notFound()

  const scheduledPosts = await getScheduledPosts(workspaceId)

  return (
    <CalendarClient
      workspaceId={workspaceId}
      scheduledPosts={scheduledPosts}
    />
  )
}
