'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import {
  listPinterestBoards,
  type PinterestBoard,
} from '@/lib/publish/composio-publish'

// ---------------------------------------------------------------------------
// fetchPinterestBoardsAction — read-only helper for the schedule UI.
// Returns the user's Pinterest boards via Composio. Cheap-ish: hits
// Pinterest once per call. The dialog calls it lazily on open.
// ---------------------------------------------------------------------------

export async function fetchPinterestBoardsAction(
  workspaceId: string,
): Promise<
  | { ok: true; boards: PinterestBoard[] }
  | { ok: false; error: string }
> {
  if (!workspaceId) return { ok: false, error: 'No workspace.' }
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: 'Not a member.' }

  try {
    const boards = await listPinterestBoards(workspaceId)
    return { ok: true, boards }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to load boards.',
    }
  }
}

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
  // Pinterest only — required when platform === 'pinterest', otherwise
  // we have no way to know which board the pin should land on. The UI
  // enforces this via a board picker; we double-check on the server.
  pinterestBoardId: z.string().min(1).optional(),
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
    pinterestBoardId:
      formData.get('pinterest_board_id')?.toString() || undefined,
  }

  const parsed = schedulePostSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, outputId, platform, scheduledFor, socialAccountId, pinterestBoardId } =
    parsed.data

  // Server-side guard: Pinterest pins MUST have a board picked. The
  // UI prevents submitting without one, but a tampered request would
  // otherwise create an unschedulable scheduled_posts row.
  if (platform === 'pinterest' && !pinterestBoardId) {
    return {
      ok: false,
      error: 'Pinterest pins need a board — pick one before scheduling.',
    }
  }

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

  // Pinterest's board choice rides along in the metadata JSONB column —
  // the publish worker reads it back at fire-time and passes it as
  // pinterestBoardId to the Composio publish action. Other platforms
  // get a clean empty metadata object.
  const metadata: Record<string, string> = {}
  if (platform === 'pinterest' && pinterestBoardId) {
    metadata.pinterest_board_id = pinterestBoardId
  }

  const { error } = await supabase.from('scheduled_posts').insert({
    workspace_id: workspaceId,
    output_id: outputId,
    platform,
    scheduled_for: new Date(scheduledFor).toISOString(),
    social_account_id: socialAccountId ?? null,
    status: 'scheduled',
    created_by: user.id,
    metadata,
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
// reschedulePostAction — drag-and-drop: move existing post to a new date/time
// ---------------------------------------------------------------------------

const rescheduleSchema = z.object({
  workspaceId: z.string().uuid(),
  postId: z.string().uuid(),
  scheduledFor: z.string().min(1),
})

export async function reschedulePostAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    postId: formData.get('post_id')?.toString() ?? '',
    scheduledFor: formData.get('scheduled_for')?.toString() ?? '',
  }

  const parsed = rescheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, postId, scheduledFor } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

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
    .update({ scheduled_for: new Date(scheduledFor).toISOString() })
    .eq('id', postId)
    .eq('workspace_id', workspaceId)
    .eq('status', 'scheduled')

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: `Rescheduled to ${new Date(scheduledFor).toLocaleString()}` }
}

// ---------------------------------------------------------------------------
// quickScheduleAction — drag unscheduled output onto calendar date
// ---------------------------------------------------------------------------

const quickScheduleSchema = z.object({
  workspaceId: z.string().uuid(),
  outputId: z.string().uuid(),
  platform: z.string().min(1),
  scheduledFor: z.string().min(1),
})

export async function quickScheduleAction(
  _prev: SchedulerActionState,
  formData: FormData,
): Promise<SchedulerActionState> {
  const raw = {
    workspaceId: formData.get('workspace_id')?.toString() ?? '',
    outputId: formData.get('output_id')?.toString() ?? '',
    platform: formData.get('platform')?.toString() ?? '',
    scheduledFor: formData.get('scheduled_for')?.toString() ?? '',
  }

  const parsed = quickScheduleSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, outputId, platform, scheduledFor } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Verify output belongs to workspace
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
    status: 'scheduled',
    created_by: user.id,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/schedule`)
  return { ok: true, message: `Scheduled for ${new Date(scheduledFor).toLocaleString()}` }
}

