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
  let count = 0
  let failed = 0
  let firstError: string | undefined

  for (const id of ids) {
    const { error } = await supabase.from('output_states').insert({
      output_id: id,
      workspace_id: workspaceId,
      state: targetState,
      changed_by: user.id,
      note,
    })

    if (error) {
      failed++
      if (!firstError) firstError = error.message
    } else {
      count++
    }
  }

  revalidatePath(`/workspace/${workspaceId}`)

  // All rows failed → treat as outright error so the UI shows red, not green
  if (count === 0 && failed > 0) {
    return { ok: false, error: firstError ?? 'All transitions failed.' }
  }

  return { ok: true, count, failed, firstError }
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
