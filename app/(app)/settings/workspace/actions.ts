'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { AUDIT_ACTIONS } from '@/lib/audit/actions'
import { writeAuditLog } from '@/lib/audit/write'
import { createClient } from '@/lib/supabase/server'

// ── Update workspace ──────────────────────────────────────────────────────────

const updateWorkspaceSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  type: z.enum(['personal', 'team', 'client']),
})

export type UpdateWorkspaceState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function updateWorkspaceAction(
  _prev: UpdateWorkspaceState,
  formData: FormData,
): Promise<UpdateWorkspaceState> {
  const parsed = updateWorkspaceSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    name: formData.get('name'),
    type: formData.get('type'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  // Owner-only rename — explicit gate complements the RLS owner policy
  // so the intent is visible at the entry point.
  const check = await requireWorkspaceMember(parsed.data.workspace_id)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner') {
    return { ok: false, error: 'Only the workspace owner can rename it.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspaces')
    .update({ name: parsed.data.name, type: parsed.data.type })
    .eq('id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  await writeAuditLog({
    workspaceId: parsed.data.workspace_id,
    action: AUDIT_ACTIONS.workspace_updated,
    targetType: 'workspace',
    targetId: parsed.data.workspace_id,
    metadata: { name: parsed.data.name, type: parsed.data.type },
  })

  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

// ── Delete workspace ──────────────────────────────────────────────────────────

export type DeleteWorkspaceState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function deleteWorkspaceAction(
  _prev: DeleteWorkspaceState,
  formData: FormData,
): Promise<DeleteWorkspaceState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  if (!workspaceId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  // Owner-only deletion. The RLS policy on workspaces allows delete to
  // the owner only, but checking explicitly here gives us a clean error
  // message instead of a silent RLS-no-op.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }
  if (check.role !== 'owner') {
    return { ok: false, error: 'Only the workspace owner can delete it.' }
  }

  // Note: we intentionally don't write a workspace.deleted audit row here
  // — the audit_log.workspace_id FK is ON DELETE CASCADE, so any row we
  // insert would be wiped by the delete below. The log output (Sentry +
  // server logs) in writeAuditLog's error path already captures the
  // signal we'd want for post-mortems; durable history of the delete
  // lives in Supabase's deleted-row webhook / WAL if we ever need it.
  const supabase = await createClient()
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) return { ok: false, error: error.message }

  redirect('/dashboard')
}
