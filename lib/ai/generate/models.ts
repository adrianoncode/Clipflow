import type { LlmProvider } from '@/lib/ai/providers/types'

/**
 * Default model per provider for M4 output generation.
 *
 * These are picked for "cheapest reasonable tier with native structured
 * output support" as of April 2026. Bump them here — single source of
 * truth — when a new cheap-and-capable tier ships. A future milestone
 * can add a per-workspace override in settings without touching this
 * file.
 *
 * Verify via:
 *   curl -H "Authorization: Bearer $KEY" https://api.openai.com/v1/models
 *   curl -H "x-api-key: $KEY" -H "anthropic-version: 2023-06-01" https://api.anthropic.com/v1/models
 *   curl "https://generativelanguage.googleapis.com/v1beta/models?key=$KEY"
 */
export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  google: 'gemini-2.0-flash',
} as const

/**
 * A single chat completion should never need more than 60 seconds.
 * Longer-running flows chunk the work, not extend this timeout.
 */
export const GENERATION_TIMEOUT_MS = 60_000

/**
 * Default temperature for generation. Slightly above zero because we
 * want some stylistic variety in hooks and captions, but below 1 to
 * keep structured JSON emission stable.
 */
export const GENERATION_TEMPERATURE = 0.7

/**
 * Hard cap on response tokens per provider call. 1500 is enough room
 * for a LinkedIn post (~300 words) plus schema boilerplate with
 * headroom.
 */
export const GENERATION_MAX_TOKENS = 1500
