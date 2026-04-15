import 'server-only'

import { validateAnthropicKey } from '@/lib/ai/providers/anthropic'
import { validateGoogleKey } from '@/lib/ai/providers/google'
import { validateOpenAiKey } from '@/lib/ai/providers/openai'
import type { AiProvider, ValidateResult } from '@/lib/ai/providers/types'

/**
 * Dispatches BYOK validation to the right provider adapter. LLM keys
 * are validated with a tiny probe request; media-stack keys
 * (Shotstack, Replicate, ElevenLabs) are accepted at their claimed
 * shape — a real API probe would cost credits and most providers'
 * mis-typed keys produce 401 on first use anyway.
 */
export async function validateAiKey(
  provider: AiProvider,
  key: string,
): Promise<ValidateResult> {
  switch (provider) {
    case 'openai':
      return validateOpenAiKey(key)
    case 'anthropic':
      return validateAnthropicKey(key)
    case 'google':
      return validateGoogleKey(key)
    case 'shotstack':
    case 'replicate':
    case 'elevenlabs':
      // Basic shape check: non-empty, no whitespace, at least 20 chars.
      if (!key || /\s/.test(key) || key.length < 20) {
        return {
          ok: false,
          code: 'invalid_key',
          message: 'Key looks too short — paste the full secret from your provider.',
        }
      }
      return { ok: true }
  }
}
