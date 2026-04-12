'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

const upsertSchema = z.object({
  workspace_id: z.string().uuid(),
  persona_id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  backstory: z.string().max(2000).optional(),
  expertise_areas: z.string().max(1000).optional(),
  writing_quirks: z.string().max(1000).optional(),
  example_responses: z.string().max(2000).optional(),
})

export type UpsertPersonaState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function upsertPersonaAction(
  _prev: UpsertPersonaState,
  formData: FormData,
): Promise<UpsertPersonaState> {
  const parsed = upsertSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    persona_id: formData.get('persona_id') || undefined,
    name: formData.get('name'),
    backstory: formData.get('backstory') || undefined,
    expertise_areas: formData.get('expertise_areas') || undefined,
    writing_quirks: formData.get('writing_quirks') || undefined,
    example_responses: formData.get('example_responses') || undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const expertiseArray = parsed.data.expertise_areas
    ? parsed.data.expertise_areas.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  if (parsed.data.persona_id) {
    const { error } = await supabase
      .from('ai_personas')
      .update({
        name: parsed.data.name,
        backstory: parsed.data.backstory ?? '',
        expertise_areas: expertiseArray,
        writing_quirks: parsed.data.writing_quirks ?? '',
        example_responses: parsed.data.example_responses ?? '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.persona_id)
      .eq('workspace_id', parsed.data.workspace_id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('ai_personas')
      .insert({
        workspace_id: parsed.data.workspace_id,
        name: parsed.data.name,
        backstory: parsed.data.backstory ?? '',
        expertise_areas: expertiseArray,
        writing_quirks: parsed.data.writing_quirks ?? '',
        example_responses: parsed.data.example_responses ?? '',
      })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath('/settings/personas')
  return { ok: true }
}

export async function setActivePersonaAction(
  _prev: UpsertPersonaState,
  formData: FormData,
): Promise<UpsertPersonaState> {
  const workspaceId = formData.get('workspace_id')?.toString()
  const personaId = formData.get('persona_id')?.toString()

  if (!workspaceId) return { ok: false, error: 'Missing workspace.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Deactivate all personas for this workspace
  await supabase
    .from('ai_personas')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId)

  // Activate the selected one (if personaId provided — otherwise just deactivate all)
  if (personaId) {
    await supabase
      .from('ai_personas')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', personaId)
      .eq('workspace_id', workspaceId)
  }

  revalidatePath('/settings/personas')
  return { ok: true }
}

export async function deletePersonaAction(
  _prev: UpsertPersonaState,
  formData: FormData,
): Promise<UpsertPersonaState> {
  const workspaceId = formData.get('workspace_id')?.toString()
  const personaId = formData.get('persona_id')?.toString()

  if (!workspaceId || !personaId) return { ok: false, error: 'Missing data.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('ai_personas')
    .delete()
    .eq('id', personaId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/settings/personas')
  return { ok: true }
}
