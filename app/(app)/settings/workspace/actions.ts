'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
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

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspaces')
    .update({ name: parsed.data.name, type: parsed.data.type })
    .eq('id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

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

  const supabase = await createClient()
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) return { ok: false, error: error.message }

  redirect('/dashboard')
}
