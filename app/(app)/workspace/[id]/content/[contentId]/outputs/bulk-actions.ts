'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { getContentItem } from '@/lib/content/get-content-item'
import { runOnePlatform } from '@/lib/outputs/run-one-platform'
import type { OutputPlatform } from '@/lib/supabase/types'
import { log } from '@/lib/log'

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

/**
 * Bulk regenerate — regenerates every selected draft in place.
 *
 * Agency workflow: updating Brand Voice used to require clicking
 * Regenerate per card; this action lets the bulk-bar queue all
 * selected outputs in one shot. We regenerate one-by-one (sequential,
 * not parallel) so per-workspace rate limits on AI providers still
 * apply cleanly and we don't burn someone's OpenAI quota in a burst.
 *
 * Returns a partial-success shape: `count` succeeded, `failed` didn't,
 * `firstError` surfaces the first failure message for toast UX.
 */
export async function bulkRegenerateAction(
  _prev: BulkActionState,
  formData: FormData,
): Promise<BulkActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const outputIds = formData.get('output_ids')?.toString() ?? ''
  const ids = outputIds.split(',').filter(Boolean)
  if (!workspaceId || ids.length === 0) {
    return { ok: false, error: 'No drafts selected.' }
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner' && check.role !== 'editor') {
    return { ok: false, error: 'Only owners or editors can regenerate drafts.' }
  }

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  const supabase = createClient()
  const { data: outputs } = await supabase
    .from('outputs')
    .select('id, content_id, platform')
    .in('id', ids)
    .eq('workspace_id', workspaceId)

  if (!outputs || outputs.length === 0) {
    return { ok: false, error: 'No matching drafts.' }
  }

  let succeeded = 0
  let failed = 0
  let firstError: string | undefined

  for (const output of outputs) {
    try {
      const content = await getContentItem(output.content_id, workspaceId)
      if (!content?.transcript) {
        failed++
        firstError ??= 'Source content missing transcript — skipped.'
        continue
      }

      // Hard-delete the old output first so run-one-platform inserts
      // a fresh row with the same platform. This matches what the
      // single-draft regenerate action does.
      await supabase
        .from('outputs')
        .delete()
        .eq('id', output.id)
        .eq('workspace_id', workspaceId)

      const result = await runOnePlatform({
        platform: output.platform as OutputPlatform,
        transcript: content.transcript,
        sourceKind: content.kind,
        sourceTitle: content.title ?? 'Untitled',
        provider: pick.provider,
        apiKey: pick.apiKey,
        model: DEFAULT_MODELS[pick.provider],
        workspaceId,
        contentId: output.content_id,
        userId: user.id,
      })

      if (result.ok) {
        succeeded++
      } else {
        failed++
        firstError ??= result.error
      }
    } catch (err) {
      failed++
      firstError ??= err instanceof Error ? err.message : 'Unknown error'
      log.error('bulk regenerate failed for output', err, { outputId: output.id })
    }
  }

  revalidatePath(`/workspace/${workspaceId}`)
  if (succeeded === 0) {
    return { ok: false, error: firstError ?? 'All regenerations failed.' }
  }
  return { ok: true, count: succeeded, failed, firstError }
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
