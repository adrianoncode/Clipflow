export type AiProvider = 'openai' | 'anthropic' | 'google'

export type ValidateResult =
  | { ok: true }
  | {
      ok: false
      code: 'invalid_key' | 'network' | 'rate_limited' | 'unknown'
      message: string
    }
