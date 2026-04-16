'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

// ── Shared types ──────────────────────────────────────────────────────────────

export type BulkContentState =
  | { ok?: undefined }
  | { ok: true; count: number; failed?: number; firstError?: string }
  | { ok: false; error: string }

const bulkSchema = z.object({
  workspace_id: z.string().uuid(),
  content_ids: z.string().min(1),
})

function parseIds(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-fA-F-]{36}$/.test(s))
}

// ── Bulk delete ───────────────────────────────────────────────────────────────

/**
 * Bulk delete content items. Uses a single DELETE with `.in('id', ids)` so the
 * database enforces RLS + workspace_id scoping on every row atomically.
 */
export async function bulkDeleteContentAction(
  _prev: BulkContentState,
  formData: FormData,
): Promise<BulkContentState> {
  const parsed = bulkSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_ids: formData.get('content_ids'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const ids = parseIds(parsed.data.content_ids)
  if (ids.length === 0) return { ok: false, error: 'No valid content IDs provided.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { error, count } = await supabase
    .from('content_items')
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  const deleted = count ?? 0
  const failed = ids.length - deleted

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  return {
    ok: true,
    count: deleted,
    failed: failed > 0 ? failed : undefined,
    firstError:
      failed > 0 ? `${failed} item${failed === 1 ? '' : 's'} could not be deleted.` : undefined,
  }
}

// ── Bulk assign to project ────────────────────────────────────────────────────

const assignSchema = z.object({
  workspace_id: z.string().uuid(),
  content_ids: z.string().min(1),
  /** Null/empty string = unassign from any project. */
  project_id: z.string().optional().nullable(),
})

export async function bulkAssignToProjectAction(
  _prev: BulkContentState,
  formData: FormData,
): Promise<BulkContentState> {
  const rawProjectId = formData.get('project_id')?.toString() ?? ''
  const parsed = assignSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_ids: formData.get('content_ids'),
    project_id: rawProjectId || null,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const ids = parseIds(parsed.data.content_ids)
  if (ids.length === 0) return { ok: false, error: 'No valid content IDs provided.' }

  // Accept either a uuid or empty (= unassign)
  const projectId = parsed.data.project_id
  if (projectId && !/^[0-9a-fA-F-]{36}$/.test(projectId)) {
    return { ok: false, error: 'Invalid project ID.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { error, count } = await supabase
    .from('content_items')
    .update({ project_id: projectId }, { count: 'exact' })
    .in('id', ids)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  const updated = count ?? 0
  const failed = ids.length - updated

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  if (projectId) {
    revalidatePath(`/workspace/${parsed.data.workspace_id}/projects/${projectId}`)
  }

  return {
    ok: true,
    count: updated,
    failed: failed > 0 ? failed : undefined,
    firstError:
      failed > 0 ? `${failed} item${failed === 1 ? '' : 's'} could not be moved.` : undefined,
  }
}
