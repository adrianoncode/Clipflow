'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export type BulkActionState =
  | { ok?: undefined }
  | { ok: true; count: number }
  | { ok: false; error: string }

/**
 * Bulk approve: transitions multiple outputs to 'approved' state.
 */
export async function bulkApproveAction(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputIds = formData.get('output_ids')?.toString() ?? ''
  const ids = outputIds.split(',').filter(Boolean)

  if (!workspaceId || ids.length === 0) return { ok: false, error: 'No outputs selected.' }

  const supabase = createClient()
  let count = 0

  for (const id of ids) {
    const { error } = await supabase
      .from('output_states')
      .insert({
        output_id: id,
        workspace_id: workspaceId,
        state: 'approved',
        changed_by: user.id,
        note: 'Bulk approved',
      })

    if (!error) count++
  }

  revalidatePath(`/workspace/${workspaceId}`)
  return { ok: true, count }
}

/**
 * Bulk export: marks multiple outputs as 'exported'.
 */
export async function bulkExportAction(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputIds = formData.get('output_ids')?.toString() ?? ''
  const ids = outputIds.split(',').filter(Boolean)

  if (!workspaceId || ids.length === 0) return { ok: false, error: 'No outputs selected.' }

  const supabase = createClient()
  let count = 0

  for (const id of ids) {
    const { error } = await supabase
      .from('output_states')
      .insert({
        output_id: id,
        workspace_id: workspaceId,
        state: 'exported',
        changed_by: user.id,
        note: 'Bulk exported',
      })

    if (!error) count++
  }

  revalidatePath(`/workspace/${workspaceId}`)
  return { ok: true, count }
}

/**
 * Bulk star: stars multiple outputs at once.
 */
export async function bulkStarAction(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputIds = formData.get('output_ids')?.toString() ?? ''
  const ids = outputIds.split(',').filter(Boolean)

  if (!workspaceId || ids.length === 0) return { ok: false, error: 'No outputs selected.' }

  const supabase = createClient()
  const { error } = await supabase
    .from('outputs')
    .update({ is_starred: true })
    .in('id', ids)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}`)
  return { ok: true, count: ids.length }
}
