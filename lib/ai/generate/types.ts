import type { AiProvider } from '@/lib/ai/providers/types'

export type GenerationErrorCode =
  | 'invalid_key'
  | 'rate_limited'
  | 'network'
  | 'provider_error'
  | 'parse_error'
  | 'schema_error'
  | 'unsupported_provider'
  | 'unknown'

/**
 * Structured output shape every platform prompt asks the model to emit.
 * LinkedIn leaves `script` as an empty string and puts the full post in
 * `caption` — see lib/ai/prompts/linkedin.ts.
 */
export interface PromptOutput {
  hook: string
  script: string
  caption: string
  hashtags: string[]
}

export interface GenerateInput {
  provider: AiProvider
  apiKey: string
  model: string
  system: string
  user: string
}

export type GenerateResult =
  | { ok: true; json: PromptOutput; model: string }
  | { ok: false; code: GenerationErrorCode; message: string }
