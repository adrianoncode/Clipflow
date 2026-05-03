import 'server-only'

/**
 * Cost calculation for Anthropic API usage.
 *
 * All prices stored as **micro-USD per token** so cost math stays in
 * bigint (no float drift across thousands of tokens). Conversion:
 *   $X per 1M tokens === X micro-USD per token
 *
 * Pricing as of 2026-05 (Anthropic public pricing, claude-haiku-4-5):
 *   input         $1   / 1M
 *   output        $5   / 1M
 *   cache_write   $1.25 / 1M  (5-min TTL — what we use)
 *   cache_read    $0.10 / 1M
 *
 * Source of truth: https://www.anthropic.com/pricing
 *
 * If Anthropic ships new pricing or we add new models, update the
 * `MODEL_PRICING` map and add a row. Pricing is per-model — we never
 * fall back to a default rate (silent under-billing is worse than
 * loud "unknown model" errors).
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
  'claude-haiku-4-5-20251001': {
    inputMicroUsd: 1n,
    outputMicroUsd: 5n,
    // 5-min ephemeral cache — Anthropic charges 1.25x base input for write,
    // 0.1x base input for read. Encoded directly to avoid runtime math.
    cacheWriteMicroUsd: 1250n / 1000n, // = 1.25 micro-USD per token, rounded down
    cacheReadMicroUsd: 100n / 1000n, // = 0.1 micro-USD per token, rounded down
  },
  // Sonnet 4.6 — exposed as an upgrade option for power-user workspaces.
  // Verify pricing at https://www.anthropic.com/pricing before enabling
  // workspace-level model overrides in the agent_settings UI.
  'claude-sonnet-4-6': {
    inputMicroUsd: 3n,
    outputMicroUsd: 15n,
    cacheWriteMicroUsd: 3n,
    cacheReadMicroUsd: 1n,
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
