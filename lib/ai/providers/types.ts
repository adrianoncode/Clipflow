/**
 * Every BYOK service a workspace can connect. LLM providers are listed
 * first — they've been supported since M2. Media-stack providers
 * (Shotstack, Replicate, ElevenLabs) joined in the April 2026 BYOK
 * expansion that moved all paid APIs off Clipflow's tab and onto each
 * user's own account.
 */
export type AiProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'shotstack'
  | 'replicate'
  | 'elevenlabs'
  | 'upload-post'
  | 'zapcap'

/** Subset that actually runs LLM inference. */
export type LlmProvider = 'openai' | 'anthropic' | 'google'

/** Subset that powers media rendering + audio. */
export type MediaProvider = 'shotstack' | 'replicate' | 'elevenlabs' | 'zapcap'

/** Subset that handles social media publishing. */
export type PublishProvider = 'upload-post'

export type ValidateResult =
  | { ok: true }
  | {
      ok: false
      code: 'invalid_key' | 'network' | 'rate_limited' | 'unknown'
      message: string
    }
