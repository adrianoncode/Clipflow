'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { insertAiKey } from '@/lib/ai/insert-ai-key'
import { getUser } from '@/lib/auth/get-user'
import { AUDIT_ACTIONS } from '@/lib/audit/actions'
import { writeAuditLog } from '@/lib/audit/write'
import { createClient } from '@/lib/supabase/server'
import type { AiKeyFormState } from '@/components/ai-keys/ai-key-form'
import { log } from '@/lib/log'

const saveSchema = z.object({
  provider: z.enum([
    'openai',
    'anthropic',
    'google',
    'shotstack',
    'replicate',
    'elevenlabs',
    'upload-post',
    'zapcap',
  ]),
  label: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  api_key: z.string().trim().min(10, 'Please paste a full API key.'),
  /**
   * ZapCap-only — webhook secret from the dashboard. We need both
   * values at runtime (api key on requests, webhook secret on
   * inbound HMAC verification), so we pack them as JSON into the
   * single encrypted column.
   */
  webhook_secret: z.string().trim().min(8).optional(),
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
    webhook_secret: formData.get('webhook_secret') ?? undefined,
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

  // ZapCap stores TWO secrets (apiKey + webhookSecret) in one
  // encrypted column as JSON. Every other provider stores the API
  // key as plaintext directly.
  let plaintextKey = parsed.data.api_key
  if (parsed.data.provider === 'zapcap') {
    if (!parsed.data.webhook_secret) {
      return {
        ok: false,
        error: 'ZapCap also needs your webhook secret from the dashboard.',
      }
    }
    plaintextKey = JSON.stringify({
      apiKey: parsed.data.api_key,
      webhookSecret: parsed.data.webhook_secret,
    })
  }

  const result = await insertAiKey({
    workspaceId: parsed.data.workspace_id,
    provider: parsed.data.provider,
    label: parsed.data.label,
    plaintextKey,
    userId: user.id,
  })

  if (!result.ok) {
    return { ok: false, error: result.error }
  }

  await writeAuditLog({
    workspaceId: parsed.data.workspace_id,
    action: AUDIT_ACTIONS.ai_key_added,
    targetType: 'ai_key',
    metadata: { provider: parsed.data.provider, label: parsed.data.label },
  })

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
  // Pull the provider so the audit row carries "which key was removed"
  // instead of just an opaque UUID.
  const { data: prior } = await supabase
    .from('ai_keys')
    .select('provider')
    .eq('id', parsed.data.key_id)
    .eq('workspace_id', parsed.data.workspace_id)
    .maybeSingle()

  const { error } = await supabase
    .from('ai_keys')
    .delete()
    .eq('id', parsed.data.key_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) {
    log.error('deleteAiKey failed', error)
  } else {
    await writeAuditLog({
      workspaceId: parsed.data.workspace_id,
      action: AUDIT_ACTIONS.ai_key_removed,
      targetType: 'ai_key',
      targetId: parsed.data.key_id,
      metadata: { provider: prior?.provider ?? null },
    })
  }

  revalidatePath('/settings/ai-keys')
  revalidatePath('/dashboard')
}
