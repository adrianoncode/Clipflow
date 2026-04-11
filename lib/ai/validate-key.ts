import 'server-only'

import { validateAnthropicKey } from '@/lib/ai/providers/anthropic'
import { validateGoogleKey } from '@/lib/ai/providers/google'
import { validateOpenAiKey } from '@/lib/ai/providers/openai'
import type { AiProvider, ValidateResult } from '@/lib/ai/providers/types'

/**
 * Dispatches BYOK validation to the right provider adapter. Returns a
 * discriminated union — callers should switch on `result.ok` rather than
 * checking for truthiness.
 *
 * This module is `server-only` because the underlying provider adapters
 * import `server-only` and we don't want the key ever shipped to the
 * browser.
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
  }
}
