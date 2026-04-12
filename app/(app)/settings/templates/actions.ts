'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'

const saveTemplateSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name is required.').max(100),
  platform: z.string().trim().min(1, 'Platform is required.'),
  system_prompt: z.string().trim().min(10, 'System prompt must be at least 10 characters.'),
  structure_hint: z.string().trim().max(300).optional().default(''),
})

export type SaveTemplateState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function saveTemplateAction(
  _prev: SaveTemplateState,
  formData: FormData,
): Promise<SaveTemplateState> {
  const parsed = saveTemplateSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    name: formData.get('name'),
    platform: formData.get('platform'),
    system_prompt: formData.get('system_prompt'),
    structure_hint: formData.get('structure_hint') ?? '',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  try {
    const { error } = await supabase.from('output_templates').insert({
      workspace_id: parsed.data.workspace_id,
      name: parsed.data.name,
      platform: parsed.data.platform,
      system_prompt: parsed.data.system_prompt,
      structure_hint: parsed.data.structure_hint || null,
      is_default: false,
      created_by: user.id,
    })

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        return { ok: false, error: 'Run database migration to enable custom templates.' }
      }
      return { ok: false, error: error.message }
    }
  } catch {
    return { ok: false, error: 'Run database migration to enable custom templates.' }
  }

  revalidatePath('/settings/templates')
  return { ok: true }
}
