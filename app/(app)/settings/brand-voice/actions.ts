'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

const upsertBrandVoiceSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(80).default('Default'),
  tone: z.string().max(300).optional().nullable(),
  avoid: z.string().max(300).optional().nullable(),
  example_hook: z.string().max(500).optional().nullable(),
})

export type UpsertBrandVoiceState =
  | { ok?: undefined; error?: string }
  | { ok: true }
  | { ok: false; error: string }

export async function upsertBrandVoiceAction(
  _prev: UpsertBrandVoiceState,
  formData: FormData,
): Promise<UpsertBrandVoiceState> {
  const parsed = upsertBrandVoiceSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    name: formData.get('name') ?? 'Default',
    tone: formData.get('tone') || null,
    avoid: formData.get('avoid') || null,
    example_hook: formData.get('example_hook') || null,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { workspace_id, ...fields } = parsed.data

  // Check if an active brand voice already exists for this workspace.
  const { data: existing } = await supabase
    .from('brand_voices')
    .select('id')
    .eq('workspace_id', workspace_id)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('brand_voices')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('workspace_id', workspace_id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('brand_voices')
      .insert({ workspace_id, ...fields, is_active: true })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/settings/brand-voice`)
  return { ok: true }
}

export type DeleteBrandVoiceState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function deleteBrandVoiceAction(
  _prev: DeleteBrandVoiceState,
  formData: FormData,
): Promise<DeleteBrandVoiceState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const voiceId = formData.get('voice_id')?.toString() ?? ''

  if (!workspaceId || !voiceId) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { error } = await supabase
    .from('brand_voices')
    .delete()
    .eq('id', voiceId)
    .eq('workspace_id', workspaceId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/settings/brand-voice`)
  return { ok: true }
}
