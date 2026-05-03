import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import type { LlmProvider } from '@/lib/agent/llm/types'

/**
 * Pick which provider + model + key the agent should use for a given
 * workspace.
 *
 * Resolution order:
 *
 *   1. Workspace explicitly set `agent_settings.agent_provider`. We
 *      use that if (a) the column is non-null AND (b) the workspace
 *      has a stored key for that provider. If they set 'openai' but
 *      have no OpenAI key in `ai_keys`, we surface a clean error
 *      rather than silently falling back — ambiguous fallback
 *      behavior is worse than a precise "no key" message.
 *
 *   2. No explicit setting → try in priority order [anthropic, openai,
 *      google], pick the FIRST one with a stored key. Anthropic
 *      first because it's our recommended default for tool-use
 *      quality (see the plan file).
 *
 *   3. No stored keys for any of the three → error.
 *
 * Model selection:
 *   - If `agent_settings.agent_model` is set AND non-null, use it.
 *   - Otherwise, fall back to `DEFAULT_MODELS[provider]`.
 *
 * The returned `apiKey` is plaintext — the loop hands it directly to
 * the adapter. Caller is responsible for not logging it.
 */

const PRIORITY: LlmProvider[] = ['anthropic', 'openai', 'google']

export type ResolveProviderResult =
  | {
      ok: true
      provider: LlmProvider
      apiKey: string
      model: string
    }
  | {
      ok: false
      code: 'no_keys' | 'preferred_provider_no_key' | 'forbidden'
      message: string
    }

interface AgentSettingsLite {
  agent_provider: LlmProvider | null
  agent_model: string | null
}

export async function resolveAgentProvider(
  workspaceId: string,
): Promise<ResolveProviderResult> {
  const settings = await loadSettings(workspaceId)

  // Path 1: explicit workspace preference.
  if (settings?.agent_provider) {
    const preferred = settings.agent_provider
    const keyResult = await getDecryptedAiKey(workspaceId, preferred)
    if (keyResult.ok) {
      return {
        ok: true,
        provider: preferred,
        apiKey: keyResult.plaintext,
        model: settings.agent_model ?? DEFAULT_MODELS[preferred],
      }
    }
    if (keyResult.code === 'forbidden') {
      return { ok: false, code: 'forbidden', message: keyResult.message }
    }
    // Settings says use X but no X key — fail loud rather than fall
    // back to a different provider unexpectedly.
    return {
      ok: false,
      code: 'preferred_provider_no_key',
      message: `Agent is configured to use ${preferred}, but no ${preferred} key is saved. Add one in Settings → AI Keys, or change the agent provider in Settings → Agent.`,
    }
  }

  // Path 2: priority fallback.
  for (const provider of PRIORITY) {
    const keyResult = await getDecryptedAiKey(workspaceId, provider)
    if (keyResult.ok) {
      return {
        ok: true,
        provider,
        apiKey: keyResult.plaintext,
        model: settings?.agent_model ?? DEFAULT_MODELS[provider],
      }
    }
    // Forbidden = membership problem, propagate immediately. no_key
    // = try the next provider.
    if (keyResult.code === 'forbidden') {
      return { ok: false, code: 'forbidden', message: keyResult.message }
    }
  }

  return {
    ok: false,
    code: 'no_keys',
    message:
      'No AI key saved for the agent. Add an Anthropic, OpenAI, or Google key in Settings → AI Keys.',
  }
}

// ─── helpers ─────────────────────────────────────────────────────────

async function loadSettings(
  workspaceId: string,
): Promise<AgentSettingsLite | null> {
  // Service-role read is fine here — we're only fetching a settings
  // row by workspace id, no user context required. The caller has
  // already validated workspace membership.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('agent_settings')
    .select('agent_provider, agent_model')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (!data) return null
  return {
    agent_provider: (data.agent_provider as LlmProvider | null) ?? null,
    agent_model: (data.agent_model as string | null) ?? null,
  }
}
