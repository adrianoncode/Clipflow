'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

export type BulkActionState =
  | { ok?: undefined }
  | { ok: true; count: number; failed?: number; firstError?: string }
  | { ok: false; error: string }

interface BulkTransitionOptions {
  targetState: 'approved' | 'exported'
  note: string
}

/**
 * Shared bulk state-transition routine. Returns partial success — the
 * number of outputs successfully transitioned + how many failed. The
 * caller surfaces `failed` and `firstError` when > 0 so the user doesn't
 * think all rows succeeded when some silently errored.
 */
async function bulkTransition(
  formData: FormData,
  { targetState, note }: BulkTransitionOptions,
): Promise<BulkActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputIds = formData.get('output_ids')?.toString() ?? ''
  const ids = outputIds.split(',').filter(Boolean)

  if (!workspaceId || ids.length === 0) return { ok: false, error: 'No outputs selected.' }

  const supabase = createClient()

  // Single bulk insert instead of one round-trip per output — a 30-item
  // bulk approve used to cost 30 sequential Supabase calls. The trigger
  // that maintains outputs.current_state fires per-row either way, so
  // behaviour is identical. Partial-failure detection is coarser (we
  // either got all rows or an error) but bulk INSERTs on a set of valid
  // uuids either succeed or fail as a unit in practice.
  const rows = ids.map((id) => ({
    output_id: id,
    workspace_id: workspaceId,
    state: targetState,
    changed_by: user.id,
    note,
  }))

  const { data, error } = await supabase
    .from('output_states')
    .insert(rows)
    .select('id')

  revalidatePath(`/workspace/${workspaceId}`)

  if (error) {
    return { ok: false, error: error.message }
  }

  const count = data?.length ?? 0
  return { ok: true, count, failed: ids.length - count }
}

export async function bulkApproveAction(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  return bulkTransition(formData, { targetState: 'approved', note: 'Bulk approved' })
}

export async function bulkExportAction(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  return bulkTransition(formData, { targetState: 'exported', note: 'Bulk exported' })
}

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
  const { error, count } = await supabase
    .from('outputs')
    .update({ is_starred: true }, { count: 'exact' })
    .in('id', ids)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}`)
  return { ok: true, count: count ?? ids.length }
}
