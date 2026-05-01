'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { checkPlanAccess } from '@/lib/billing/plans'
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

  // Membership + role gate. RLS catches non-members, but we also bar
  // reviewers/viewers from scheduling — only owner/editor are
  // expected to manage the queue.
  const member = await requireWorkspaceMember(workspaceId)
  if (!member.ok) return { ok: false, error: 'Not a workspace member.' }
  if (!['owner', 'editor'].includes(member.role)) {
    return { ok: false, error: 'Your role cannot schedule posts.' }
  }

  // Defense-in-depth: the inline schedule form on each output card is
  // reachable even when the user never visits /schedule. Check the plan
  // here too so Free users get a clear error message instead of the
  // post silently landing in the scheduled queue and never firing.
  const plan = await getWorkspacePlan(workspaceId)
  if (!checkPlanAccess(plan, 'scheduling')) {
    return {
      ok: false,
      error: 'Scheduling is on the Creator plan. Upgrade in Billing to unlock.',
    }
  }

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
