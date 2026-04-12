'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

// ── Create project ────────────────────────────────────────��──────────────────

const createProjectSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional().nullable(),
})

export type CreateProjectState =
  | { ok?: undefined }
  | { ok: true; projectId: string }
  | { ok: false; error: string }

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const parsed = createProjectSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    name: formData.get('name'),
    description: formData.get('description') || null,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: parsed.data.workspace_id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to create project.' }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/projects`)
  return { ok: true, projectId: data.id }
}

// ── Delete project ────────────────────���──────────────────────────────────────

export type DeleteProjectState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function deleteProjectAction(
  _prev: DeleteProjectState,
  formData: FormData,
): Promise<DeleteProjectState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const projectId = formData.get('project_id')?.toString() ?? ''

  if (!workspaceId || !projectId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}/projects`)
  redirect(`/workspace/${workspaceId}/projects`)
}

// ── Assign content to project ────────────────────────────────────────────────

export type AssignContentState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function assignContentToProjectAction(
  _prev: AssignContentState,
  formData: FormData,
): Promise<AssignContentState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''
  // project_id can be empty string (= unassign)
  const projectId = formData.get('project_id')?.toString() || null

  if (!workspaceId || !contentId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ project_id: projectId })
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${workspaceId}`)
  revalidatePath(`/workspace/${workspaceId}/projects`)
  return { ok: true }
}
