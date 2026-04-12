'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SchedulerActionState =
  | { ok?: undefined }
  | { ok: true; message?: string }
  | { ok: false; error: string }

// ---------------------------------------------------------------------------
// schedulePostAction
// ---------------------------------------------------------------------------

const schedulePostSchema = z.object({
  workspaceId: z.string().uuid(),
  outputId: z.string().uuid(),
  platform: z.string().min(1),
  scheduledFor: z.string().min(1),
  socialAccountId: z.string().uuid().optional(),
})

export async function schedulePostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    outputId: formData.get('output_id')?.toString() ?? '',
    platform: formData.get('platform')?.toString() ?? '',
    scheduledFor: formData.get('scheduled_for')?.toString() ?? '',
    socialAccountId: formData.get('social_account_id')?.toString() || undefined,
  }

  const parsed = schedulePostSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, outputId, platform, scheduledFor, socialAccountId } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify the output belongs to the workspace
  const { data: output, error: outputError } = await supabase
    .from('outputs')
    .select('id')
    .eq('id', outputId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (outputError || !output) {
    return { ok: false, error: 'Output not found in this workspace.' }
  }

  const { error } = await supabase.from('scheduled_posts').insert({
    workspace_id: workspaceId,
    output_id: outputId,
    platform,
    scheduled_for: new Date(scheduledFor).toISOString(),
    social_account_id: socialAccountId ?? null,
    status: 'scheduled',
    created_by: user.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: `Scheduled for ${new Date(scheduledFor).toLocaleString()}` }
}

// ---------------------------------------------------------------------------
// cancelScheduledPostAction
// ---------------------------------------------------------------------------

const cancelSchema = z.object({
  workspaceId: z.string().uuid(),
  postId: z.string().uuid(),
})

export async function cancelScheduledPostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    postId: formData.get('post_id')?.toString() ?? '',
  }

  const parsed = cancelSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, postId } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify membership
  const { data: member } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member || !['owner', 'editor'].includes(member.role)) {
    return { ok: false, error: 'Insufficient permissions.' }
  }

  const { error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'cancelled' })
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled')

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true }
}

// ---------------------------------------------------------------------------
// saveManualTokenAction — upsert a social account with a developer token
// ---------------------------------------------------------------------------

const saveTokenSchema = z.object({
  workspaceId: z.string().uuid(),
  platform: z.string().min(1),
  accessToken: z.string().min(1),
  username: z.string().min(1),
})

export async function saveManualTokenAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    platform: formData.get('platform')?.toString() ?? '',
    accessToken: formData.get('access_token')?.toString() ?? '',
    username: formData.get('username')?.toString() ?? '',
  }

  const parsed = saveTokenSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, platform, accessToken, username } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Upsert by (workspace_id, platform, platform_user_id = username)
  const { error } = await supabase.from('social_accounts').upsert(
    {
      workspace_id: workspaceId,
      user_id: user.id,
      platform,
      platform_user_id: username,
      platform_username: username,
      access_token: accessToken,
    },
    { onConflict: 'workspace_id,platform,platform_user_id' },
  )

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule/connect`)
  return { ok: true, message: `${platform} account saved.` }
}
