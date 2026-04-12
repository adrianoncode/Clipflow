'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export type ScheduleOutputState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function scheduleOutputAction(
  _prev: ScheduleOutputState,
  formData: FormData,
): Promise<ScheduleOutputState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputId = formData.get('output_id')?.toString() ?? ''
  const scheduledFor = formData.get('scheduled_for')?.toString() || null

  if (!workspaceId || !outputId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('outputs')
    .update({ scheduled_for: scheduledFor })
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  revalidatePath(`/workspace/${workspaceId}`)
  return { ok: true }
}
