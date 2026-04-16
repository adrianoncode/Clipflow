export const dynamic = 'force-dynamic'
export const metadata = { title: 'Content Calendar' }

import { notFound, redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getScheduledPosts } from '@/lib/scheduler/get-scheduled-posts'
import { getUnscheduledOutputs } from '@/lib/scheduler/get-unscheduled-outputs'
import { CalendarClient } from '@/components/workspace/calendar-client'
import {
  quickScheduleAction,
  reschedulePostAction,
} from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'

interface PageProps {
  params: { id: string }
}

export default async function CalendarPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = params.id
  if (!workspaceId) notFound()

  const [scheduledPosts, unscheduledOutputs] = await Promise.all([
    getScheduledPosts(workspaceId),
    getUnscheduledOutputs(workspaceId),
  ])

  // Bind server actions to simple (FormData) => Promise signatures for the client
  async function handleQuickSchedule(fd: FormData) {
    'use server'
    return quickScheduleAction({ ok: undefined }, fd)
  }

  async function handleReschedule(fd: FormData) {
    'use server'
    return reschedulePostAction({ ok: undefined }, fd)
  }

  return (
    <CalendarClient
      workspaceId={workspaceId}
      scheduledPosts={scheduledPosts}
      unscheduledOutputs={unscheduledOutputs}
      quickScheduleAction={handleQuickSchedule}
      reschedulePostAction={handleReschedule}
    />
  )
}
