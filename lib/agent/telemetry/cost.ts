import 'server-only'

/**
 * Cost calculation for agent LLM usage across all supported providers.
 *
 * All prices stored as **micro-USD per token** so cost math stays in
 * bigint (no float drift across thousands of tokens). Conversion:
 *   $X per 1M tokens === X micro-USD per token
 *
 * Per-provider pricing as of 2026-05:
 *   Anthropic claude-haiku-4-5: $1 in / $5 out per 1M
 *   Anthropic claude-sonnet-4-6: $3 in / $15 out per 1M
 *   OpenAI gpt-4o-mini: $0.15 in / $0.60 out per 1M
 *   OpenAI gpt-4o: $2.50 in / $10 out per 1M
 *   Google gemini-2.0-flash: $0.075 in / $0.30 out per 1M (paid tier)
 *   Google gemini-2.0-flash-lite: $0.04 in / $0.15 out per 1M
 *
 * Sources of truth:
 *   https://www.anthropic.com/pricing
 *   https://openai.com/api/pricing/
 *   https://ai.google.dev/pricing
 *
 * If a provider ships new pricing or we add new models, update the
 * `MODEL_PRICING` map. Pricing is per-model — we never fall back to a
 * default rate (silent under-billing is worse than loud "unknown
 * model" errors).
 */

export interface ModelPricing {
  /** micro-USD per input token */
  inputMicroUsd: bigint
  /** micro-USD per output token */
  outputMicroUsd: bigint
  /** micro-USD per cache-write token (5-min TTL prefix) */
  cacheWriteMicroUsd: bigint
  /** micro-USD per cache-read token */
  cacheReadMicroUsd: bigint
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ─── Anthropic ──────────────────────────────────────────────────
  'claude-haiku-4-5-20251001': {
    inputMicroUsd: 1n,
    outputMicroUsd: 5n,
    // 5-min ephemeral cache — Anthropic charges 1.25x base input for write,
    // 0.1x base input for read. Rounded to integers (under-bills by
    // fractions of a cent at our scale, but exact billing comes from
    // Anthropic dashboards anyway).
    cacheWriteMicroUsd: 1n,
    cacheReadMicroUsd: 0n,
  },
  'claude-sonnet-4-6': {
    inputMicroUsd: 3n,
    outputMicroUsd: 15n,
    cacheWriteMicroUsd: 3n,
    cacheReadMicroUsd: 1n,
  },
  // ─── OpenAI ─────────────────────────────────────────────────────
  // OpenAI's prefix cache discounts cached tokens to 50% of input
  // rate (no separate write cost). We model `cacheReadMicroUsd` as
  // the discounted rate; cacheWrite is unused (= input rate baked in).
  'gpt-4o-mini': {
    inputMicroUsd: 0n, // 0.15 / 1M = 0.15 micro-USD; rounded to 0 (under-bills tiny amounts)
    outputMicroUsd: 1n, // 0.60 / 1M = 0.6, rounded up to 1 to avoid under-billing
    cacheWriteMicroUsd: 0n,
    cacheReadMicroUsd: 0n,
  },
  'gpt-4o': {
    inputMicroUsd: 3n, // $2.50 → 2.5, rounded up
    outputMicroUsd: 10n,
    cacheWriteMicroUsd: 3n,
    cacheReadMicroUsd: 1n,
  },
  // ─── Google ─────────────────────────────────────────────────────
  // Gemini's caching has a 32k-token minimum so we don't use it in
  // v1; cacheReadMicroUsd is set to the same as input as a defensive
  // default in case a future change activates caching.
  'gemini-2.0-flash': {
    inputMicroUsd: 0n, // 0.075 / 1M, rounded to 0
    outputMicroUsd: 1n, // 0.30 / 1M, rounded up
    cacheWriteMicroUsd: 0n,
    cacheReadMicroUsd: 0n,
  },
  'gemini-2.0-flash-lite': {
    inputMicroUsd: 0n,
    outputMicroUsd: 0n,
    cacheWriteMicroUsd: 0n,
    cacheReadMicroUsd: 0n,
  },
}

export interface UsageBreakdown {
  /** Tokens billed at the input rate (NOT including cache reads). */
  inputTokens: number
  /** Tokens billed at the output rate. */
  outputTokens: number
  /** Tokens billed at the cache-write rate. */
  cacheCreationTokens?: number
  /** Tokens billed at the cache-read rate. */
  cacheReadTokens?: number
}

/**
 * Compute the cost of a single Anthropic round-trip in micro-USD.
 *
 * The Anthropic API response shape is:
 *   {
 *     input_tokens: 1234,
 *     cache_creation_input_tokens: 567,
 *     cache_read_input_tokens: 89,
 *     output_tokens: 100
 *   }
 *
 * Note: `input_tokens` from the API does NOT include cache reads or
 * writes — the three fields are mutually exclusive. We sum all four
 * categories with their respective rates.
 *
 * Throws if the model isn't in MODEL_PRICING. Better to fail loud than
 * silently bill at $0/token when a new model ships and we forget to
 * register pricing.
 */
export function computeCallCost(params: {
  model: string
  usage: UsageBreakdown
}): bigint {
  const pricing = MODEL_PRICING[params.model]
  if (!pricing) {
    throw new Error(
      `No pricing registered for model "${params.model}". Add it to MODEL_PRICING in lib/agent/telemetry/cost.ts.`,
    )
  }

  let cost = 0n
  cost += BigInt(params.usage.inputTokens) * pricing.inputMicroUsd
  cost += BigInt(params.usage.outputTokens) * pricing.outputMicroUsd
  if (params.usage.cacheCreationTokens) {
    cost +=
      BigInt(params.usage.cacheCreationTokens) * pricing.cacheWriteMicroUsd
  }
  if (params.usage.cacheReadTokens) {
    cost += BigInt(params.usage.cacheReadTokens) * pricing.cacheReadMicroUsd
  }
  return cost
}

/** Format micro-USD as a $X.XXXX string for display. */
export function formatCost(microUsd: bigint): string {
  const usd = Number(microUsd) / 1_000_000
  return `$${usd.toFixed(4)}`
}
