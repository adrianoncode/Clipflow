import 'server-only'

import { generateWithAnthropic } from '@/lib/ai/generate/anthropic'
import { generateWithGoogle } from '@/lib/ai/generate/google'
import { generateWithOpenAi } from '@/lib/ai/generate/openai'
import type { GenerateInput, GenerateResult } from '@/lib/ai/generate/types'

/**
 * Generation dispatcher. Selects the right provider adapter based on
 * `input.provider` and returns the discriminated result.
 *
 * Mirrors `lib/ai/transcription/transcribe.ts` intentionally — new
 * providers slot in by adding a new case and a new adapter file, no
 * changes at the call site.
 */
export async function generate(input: GenerateInput): Promise<GenerateResult> {
  switch (input.provider) {
    case 'openai':
      return generateWithOpenAi(input)
    case 'anthropic':
      return generateWithAnthropic(input)
    case 'google':
      return generateWithGoogle(input)
  }
}
