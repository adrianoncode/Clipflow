import 'server-only'

import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import type { MediaProvider } from '@/lib/ai/providers/types'
import { AUDIT_ACTIONS } from '@/lib/audit/actions'
import { writeAuditLog } from '@/lib/audit/write'
import { log } from '@/lib/log'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * BYOK resolver for non-LLM services (Shotstack / Replicate / ElevenLabs).
 *
 * Resolution order:
 *   1. Workspace BYOK key (encrypted in `ai_keys` table)
 *   2. Platform-owned env key — ONLY if `workspaces.platform_keys_enabled`
 *      is true. Off by default: every new workspace must connect their
 *      own key. The flag exists so we can incrementally cut over the
 *      legacy user base without bricking anyone mid-flow.
 *   3. `missing` — caller renders "connect your key".
 *
 * Every platform-fallback consumption is audit-logged so:
 *   - Unmetered usage is visible (someone's burning our credits)
 *   - Support can email the workspace owner with a "connect your own
 *     key" prompt
 *   - Bills stay attributable
 */
export async function getServiceKey(
  workspaceId: string,
  provider: MediaProvider,
): Promise<{
  key: string | null
  source: 'byok' | 'platform' | 'missing'
}> {
  // 1. BYOK first — always preferred
  const byok = await getDecryptedAiKey(workspaceId, provider)
  if (byok.ok) return { key: byok.plaintext, source: 'byok' }

  // 2. Platform fallback — gated by per-workspace flag
  const admin = createAdminClient()
  const { data: workspace } = await admin
    .from('workspaces')
    .select('platform_keys_enabled')
    .eq('id', workspaceId)
    .maybeSingle()

  if (!workspace?.platform_keys_enabled) {
    return { key: null, source: 'missing' }
  }

  const envVar =
    provider === 'shotstack'
      ? process.env.SHOTSTACK_API_KEY
      : provider === 'replicate'
        ? process.env.REPLICATE_API_TOKEN
        : provider === 'elevenlabs'
          ? process.env.ELEVENLABS_API_KEY
          : undefined

  if (!envVar) {
    return { key: null, source: 'missing' }
  }

  // Audit-log the platform-fallback consumption. Best-effort so a
  // logging hiccup never blocks a publish/render. The action string is
  // canonical (see lib/audit/actions.ts) and `metadata.provider` lets
  // operators answer "which platform key is being burned today?".
  void writeAuditLog({
    workspaceId,
    action: AUDIT_ACTIONS.service_key_platform_fallback,
    targetType: 'service_key',
    targetId: provider,
    metadata: { provider },
    actor: { id: null, email: 'system@platform-fallback' },
  }).catch((err) => log.warn('audit: platform-fallback log failed', { err }))

  return { key: envVar, source: 'platform' }
}

/** Convenience — just the key string or null. */
export async function resolveServiceKey(
  workspaceId: string,
  provider: MediaProvider,
): Promise<string | null> {
  const result = await getServiceKey(workspaceId, provider)
  return result.key
}
