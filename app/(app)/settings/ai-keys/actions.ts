'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { insertAiKey } from '@/lib/ai/insert-ai-key'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import type { AiKeyFormState } from '@/components/ai-keys/ai-key-form'
import { log } from '@/lib/log'

const saveSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  label: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  api_key: z.string().trim().min(10, 'Please paste a full API key.'),
  workspace_id: z.string().uuid(),
})

/**
 * Save action for the settings AI Key Vault. Stays on the page (no
 * redirect) so the dialog can close itself after a successful save via the
 * form's useEffect watching `state.ok`.
 */
export async function saveAiKeySettingsAction(
  _prev: AiKeyFormState,
  formData: FormData,
): Promise<AiKeyFormState> {
  const parsed = saveSchema.safeParse({
    provider: formData.get('provider'),
    label: formData.get('label') ?? undefined,
    api_key: formData.get('api_key'),
    workspace_id: formData.get('workspace_id'),
  })
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input.',
    }
  }

  const user = await getUser()
  if (!user) {
    return { ok: false, error: 'You must be signed in.' }
  }

  const result = await insertAiKey({
    workspaceId: parsed.data.workspace_id,
    provider: parsed.data.provider,
    label: parsed.data.label,
    plaintextKey: parsed.data.api_key,
    userId: user.id,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  revalidatePath('/settings/ai-keys')
  revalidatePath('/dashboard')
  return { ok: true }
}

const deleteSchema = z.object({
  key_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
})

/**
 * Delete action for the vault. Scoped to the workspace via .eq() so even
 * with RLS disabled (it isn't) we don't leak deletes across workspaces.
 */
export async function deleteAiKeyAction(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({
    key_id: formData.get('key_id'),
    workspace_id: formData.get('workspace_id'),
  })
  if (!parsed.success) {
    return
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('ai_keys')
    .delete()
    .eq('id', parsed.data.key_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) {
    log.error('deleteAiKey failed', error)
  }

  revalidatePath('/settings/ai-keys')
  revalidatePath('/dashboard')
}
