import 'server-only'

/**
 * Hard budget caps for agent runs. Two named profiles — one for
 * interactive chat, one for autonomous (autopilot) runs — because the
 * tradeoffs are different:
 *
 *   - Chat: a human is watching, can hit the brakes. Lower per-run
 *     ceiling, higher per-conversation ceiling (a long debugging
 *     conversation across many turns may legitimately spend more).
 *
 *   - Autopilot: nobody's watching. Strict per-run ceiling. Tools per
 *     run capped lower because autopilot is scoped to a single step
 *     (e.g. "Auto-Highlights for content X"), not free-form
 *     exploration.
 *
 * Defaults here are platform fallbacks. Each workspace can override via
 * `agent_settings` (the migration column names mirror the field names
 * in `BudgetProfile`).
 *
 * Costs are tracked in **micro-USD** (bigint-safe) — 1 USD = 1_000_000
 * micro-USD. Float math on dollars drifts; integer math on micro-USD
 * doesn't.
 */

export interface BudgetProfile {
  /** Tool calls allowed per single user-message turn (chat only). */
  maxToolsPerTurn: number
  /** Tool calls allowed across the entire run (chat conversation OR autopilot run). */
  maxToolsPerRun: number
  /**
   * Max cost for the whole run, in micro-USD. For chat this is the
   * per-conversation cap (sum across all turns). For autopilot it's
   * the single-run cap (autopilot runs don't accumulate across
   * triggers).
   */
  maxCostMicroUsd: bigint
  /**
   * Cap on tokens per single Anthropic call (max_tokens param). Keeps
   * any single request from blowing the cost budget in one shot.
   */
  maxTokensPerCall: number
}

/** Defaults baked into platform code — overrideable per workspace. */
export const CHAT_BUDGET: BudgetProfile = {
  maxToolsPerTurn: 8,
  maxToolsPerRun: 25,
  maxCostMicroUsd: 500_000n, // $0.50 per conversation
  maxTokensPerCall: 4_000,
}

export const AUTOPILOT_BUDGET: BudgetProfile = {
  maxToolsPerTurn: 12, // ~entire pipeline in one shot if needed
  maxToolsPerRun: 12, // autopilot is one shot, not a conversation
  maxCostMicroUsd: 5_000_000n, // $5.00 per autopilot run
  maxTokensPerCall: 4_000,
}

/**
 * Mutable accumulator handed to the loop. Caller (chat route /
 * autopilot tick) creates one per run, the loop calls `accumulate()`
 * after every Anthropic round-trip, and `assertWithinBudget()` aborts
 * the loop the moment a ceiling is breached.
 *
 * The accumulator is a plain object (not a class) on purpose — it
 * serializes cleanly into agent_runs columns + telemetry without a
 * `.toJSON()` dance.
 */
export interface BudgetAccumulator {
  toolsThisTurn: number
  toolsThisRun: number
  costMicroUsd: bigint
  inputTokens: number
  outputTokens: number
}

export function newBudgetAccumulator(): BudgetAccumulator {
  return {
    toolsThisTurn: 0,
    toolsThisRun: 0,
    costMicroUsd: 0n,
    inputTokens: 0,
    outputTokens: 0,
  }
}

export interface AccumulateInput {
  /** New tool calls executed since the last accumulate call. */
  toolCalls: number
  /** Anthropic-reported usage from the last response. */
  inputTokens: number
  outputTokens: number
  /** Pre-computed micro-USD cost for this round-trip (see telemetry/cost.ts). */
  costMicroUsd: bigint
}

export function accumulate(
  acc: BudgetAccumulator,
  input: AccumulateInput,
): void {
  acc.toolsThisTurn += input.toolCalls
  acc.toolsThisRun += input.toolCalls
  acc.inputTokens += input.inputTokens
  acc.outputTokens += input.outputTokens
  acc.costMicroUsd += input.costMicroUsd
}

/** Reset the per-turn counter at the start of each chat turn. */
export function resetTurn(acc: BudgetAccumulator): void {
  acc.toolsThisTurn = 0
}

/**
 * Distinct error class so the loop can catch this specifically and
 * mark the run with status='budget_exceeded' rather than 'failed' —
 * helps Phase 2.5 telemetry separate "agent broke" from "agent ran
 * out of budget" (very different problems).
 */
export class BudgetExceededError extends Error {
  readonly code = 'BUDGET_EXCEEDED' as const
  readonly reason:
    | 'tools_per_turn'
    | 'tools_per_run'
    | 'cost_per_run'
  readonly snapshot: BudgetAccumulator

  constructor(
    reason: 'tools_per_turn' | 'tools_per_run' | 'cost_per_run',
    snapshot: BudgetAccumulator,
    message: string,
  ) {
    super(message)
    this.name = 'BudgetExceededError'
    this.reason = reason
    // Shallow clone so callers can't mutate ours by accident.
    this.snapshot = { ...snapshot }
  }
}

/**
 * Throws BudgetExceededError if any cap has been crossed. Call after
 * every accumulate() — caller wraps the loop in try/catch and
 * promotes the error to a visible "budget exceeded" message rather
 * than silently truncating.
 */
export function assertWithinBudget(
  acc: BudgetAccumulator,
  profile: BudgetProfile,
): void {
  if (acc.toolsThisTurn > profile.maxToolsPerTurn) {
    throw new BudgetExceededError(
      'tools_per_turn',
      acc,
      `Tool budget exceeded: ${acc.toolsThisTurn} tools used in this turn (max ${profile.maxToolsPerTurn}).`,
    )
  }
  if (acc.toolsThisRun > profile.maxToolsPerRun) {
    throw new BudgetExceededError(
      'tools_per_run',
      acc,
      `Tool budget exceeded: ${acc.toolsThisRun} tools used in this run (max ${profile.maxToolsPerRun}).`,
    )
  }
  if (acc.costMicroUsd > profile.maxCostMicroUsd) {
    const spent = (Number(acc.costMicroUsd) / 1_000_000).toFixed(4)
    const cap = (Number(profile.maxCostMicroUsd) / 1_000_000).toFixed(2)
    throw new BudgetExceededError(
      'cost_per_run',
      acc,
      `Cost budget exceeded: $${spent} spent (max $${cap}).`,
    )
  }
}

/**
 * Resolve the effective budget for a workspace — platform default
 * overlaid with any per-workspace overrides from agent_settings. The
 * caller fetches the `agent_settings` row once and passes the relevant
 * fields here; this keeps `budget.ts` free of database dependencies
 * (easier to unit test).
 */
export interface WorkspaceBudgetOverrides {
  chatMaxCostMicroUsd?: bigint | null
  autopilotMaxCostMicroUsd?: bigint | null
  chatMaxToolsPerTurn?: number | null
  chatMaxToolsPerRun?: number | null
  autopilotMaxToolsPerRun?: number | null
}

export function resolveBudget(
  kind: 'chat' | 'autopilot',
  overrides: WorkspaceBudgetOverrides | null,
): BudgetProfile {
  const base = kind === 'chat' ? CHAT_BUDGET : AUTOPILOT_BUDGET
  if (!overrides) return base

  if (kind === 'chat') {
    return {
      ...base,
      maxCostMicroUsd: overrides.chatMaxCostMicroUsd ?? base.maxCostMicroUsd,
      maxToolsPerTurn: overrides.chatMaxToolsPerTurn ?? base.maxToolsPerTurn,
      maxToolsPerRun: overrides.chatMaxToolsPerRun ?? base.maxToolsPerRun,
    }
  }

  return {
    ...base,
    maxCostMicroUsd: overrides.autopilotMaxCostMicroUsd ?? base.maxCostMicroUsd,
    maxToolsPerRun: overrides.autopilotMaxToolsPerRun ?? base.maxToolsPerRun,
    // autopilot has no concept of "per-turn" — alias it to per-run cap.
    maxToolsPerTurn: overrides.autopilotMaxToolsPerRun ?? base.maxToolsPerRun,
  }
}
