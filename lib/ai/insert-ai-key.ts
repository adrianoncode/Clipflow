import 'server-only'

import { maskKey } from '@/lib/ai/mask-key'
import { validateAiKey } from '@/lib/ai/validate-key'
import type { AiProvider, ValidateResult } from '@/lib/ai/providers/types'
import { encrypt } from '@/lib/crypto/encryption'
import { createClient } from '@/lib/supabase/server'

export type InsertAiKeyInput = {
  workspaceId: string
  provider: AiProvider
  label: string | null
  plaintextKey: string
  userId: string
}

export type InsertAiKeyResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

/**
 * Validates, encrypts, and persists a BYOK AI key. Shared between the
 * onboarding Step-3 action and the settings "Add key" action so both code
 * paths treat keys identically.
 *
 * Plaintext key never touches the database; the encrypted ciphertext + iv +
 * auth_tag are base64-encoded and stored in ai_keys, along with the
 * non-sensitive masked_preview for UI display.
 */
export async function insertAiKey(
  input: InsertAiKeyInput,
): Promise<InsertAiKeyResult> {
  const validation: ValidateResult = await validateAiKey(
    input.provider,
    input.plaintextKey,
  )
  if (!validation.ok) {
    return { ok: false, error: validation.message }
  }

  const payload = encrypt(input.plaintextKey)
  const masked = maskKey(input.provider, input.plaintextKey)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('ai_keys')
    .insert({
      workspace_id: input.workspaceId,
      provider: input.provider,
      label: input.label,
      ciphertext: payload.ciphertext,
      iv: payload.iv,
      auth_tag: payload.authTag,
      masked_preview: masked,
      created_by: input.userId,
    })
    .select('id')
    .single()

  if (error || !data) {
    // eslint-disable-next-line no-console
    console.error('[insertAiKey]', error?.message ?? 'unknown error')
    return { ok: false, error: 'Could not save the key. Please try again.' }
  }

  return { ok: true, id: data.id }
}
