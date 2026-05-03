import 'server-only'

import { log } from '@/lib/log'
import { callAgentLlm } from '@/lib/agent/llm'
import { resolveAgentProvider } from '@/lib/agent/llm/resolve-provider'
import type {
  NormalizedBlock,
  NormalizedMessage,
} from '@/lib/agent/llm/types'
import {
  AUTOPILOT_BUDGET,
  CHAT_BUDGET,
  BudgetExceededError,
  accumulate,
  assertWithinBudget,
  newBudgetAccumulator,
  resetTurn,
  resolveBudget,
  type BudgetAccumulator,
  type BudgetProfile,
  type WorkspaceBudgetOverrides,
} from '@/lib/agent/budget'
import {
  ToolPermissionError,
  assertStillMember,
  type AgentContext,
} from '@/lib/agent/context'
import {
  RunHandle,
  createRun,
  type AgentRunKind,
  type WaitingOn,
} from '@/lib/agent/state'
import { getToolByName, getTools } from '@/lib/agent/tools'
import { recordToolCall } from '@/lib/agent/telemetry/record-tool-call'
import { computeCallCost } from '@/lib/agent/telemetry/cost'
import { SYSTEM_PROMPT_CHAT } from '@/lib/agent/prompts/system-chat'
import { SYSTEM_PROMPT_AUTOPILOT } from '@/lib/agent/prompts/system-autopilot'
import type { AgentEvent, AgentEventListener } from '@/lib/agent/events'
import {
  getActiveBrandVoice,
  getActiveBrandVoiceAdmin,
  buildBrandVoiceInstruction,
} from '@/lib/brand-voice/get-active-brand-voice'

/**
 * Agent run loop. Provider-agnostic — talks to Anthropic, OpenAI, or
 * Gemini via the unified `callAgentLlm` router. The provider is
 * resolved per workspace at run start (via `resolveAgentProvider`).
 *
 * Two public entry points (`runChatTurn`, `runAutopilotRun`) wrap a
 * shared `commonExecute` so chat and autopilot stay technically
 * separate (different prompts, budgets, telemetry tags) while sharing
 * the core LLM ↔ tool dispatch dance.
 *
 * The loop:
 *   1. Resolve provider + decrypted key + model for the workspace.
 *   2. Build initial messages (chat: existing history + new user
 *      message; autopilot: synthetic user message describing the
 *      trigger).
 *   3. Call the LLM router.
 *   4. Append assistant response (text + tool_use blocks) to messages.
 *   5. If stop_reason='tool_use', execute each tool_use block, collect
 *      results into a single user message with tool_result blocks,
 *      append, loop back to step 3.
 *   6. If stop_reason='end_turn' OR a tool returns 'parked', exit.
 *   7. After every LLM call: accumulate cost/tokens, assert within
 *      budget, checkpoint to agent_runs.
 *
 * Errors:
 *   - BudgetExceededError → mark run 'budget_exceeded', surface to
 *     caller, do NOT throw further.
 *   - ToolPermissionError → tool_result with is_error: true, model can
 *     try a different approach.
 *   - Other tool errors → same.
 *   - LLM provider errors → mark run 'failed', return with
 *     code='anthropic_error' (legacy name kept for compatibility —
 *     covers all provider error classes).
 */

export type AgentRunResult =
  | {
      ok: true
      runId: string
      finalText: string
      messages: NormalizedMessage[]
      cost: BudgetAccumulator
      provider: 'anthropic' | 'openai' | 'google'
      model: string
      parked?: { waitingOn: WaitingOn }
    }
  | {
      ok: false
      runId: string | null
      code:
        | 'no_key'
        | 'forbidden'
        | 'budget_exceeded'
        | 'anthropic_error' // generic provider error (kept name for compat)
        | 'tool_loop_runaway'
        | 'unexpected'
      message: string
      cost?: BudgetAccumulator
    }

// ─── public: chat turn ──────────────────────────────────────────────

export interface RunChatTurnInput {
  ctx: AgentContext
  conversationId: string
  /** Prior turns, oldest first. Empty array = first turn. */
  priorMessages: NormalizedMessage[]
  /** New user message (text only — chat UI doesn't send blocks yet). */
  userMessage: string
  /** Per-workspace overrides loaded from agent_settings. */
  budgetOverrides?: WorkspaceBudgetOverrides | null
  /**
   * Optional event sink — invoked synchronously as the loop progresses.
   * Used by the SSE chat endpoint to stream tool calls and assistant
   * text to the browser as they happen. Throws inside the listener are
   * SWALLOWED (logged + ignored) to avoid crashing the loop on a
   * stale/closed stream.
   */
  onEvent?: AgentEventListener
}

export async function runChatTurn(
  input: RunChatTurnInput,
): Promise<AgentRunResult> {
  if (input.ctx.runKind !== 'chat') {
    throw new Error(
      `runChatTurn called with ctx.runKind="${input.ctx.runKind}" — must be "chat"`,
    )
  }
  const budget = resolveBudget('chat', input.budgetOverrides ?? null)
  const messages: NormalizedMessage[] = [
    ...input.priorMessages,
    { role: 'user', blocks: [{ type: 'text', text: input.userMessage }] },
  ]

  const voice = await getActiveBrandVoice(input.ctx.workspaceId)
  const systemPrompt = SYSTEM_PROMPT_CHAT + buildBrandVoiceInstruction(voice)

  return commonExecute({
    ctx: input.ctx,
    kind: 'chat',
    conversationId: input.conversationId,
    trigger: { source: 'user_message' },
    initialMessages: messages,
    systemPrompt,
    budget,
    allowedToolNames: null,
    onEvent: input.onEvent,
  })
}

// ─── public: autopilot run ──────────────────────────────────────────

export interface RunAutopilotInput {
  ctx: AgentContext
  trigger: {
    name: string
    instruction: string
    payload?: Record<string, unknown>
  }
  /** Tool subset for this trigger. null = full toolbox.
   *  Read-only tools are always available regardless. */
  allowedToolNames?: string[] | null
  budgetOverrides?: WorkspaceBudgetOverrides | null
}

export async function runAutopilotRun(
  input: RunAutopilotInput,
): Promise<AgentRunResult> {
  if (input.ctx.runKind !== 'autopilot') {
    throw new Error(
      `runAutopilotRun called with ctx.runKind="${input.ctx.runKind}" — must be "autopilot"`,
    )
  }
  const budget = resolveBudget('autopilot', input.budgetOverrides ?? null)
  const messages: NormalizedMessage[] = [
    {
      role: 'user',
      blocks: [{ type: 'text', text: input.trigger.instruction }],
    },
  ]

  const voice = await getActiveBrandVoiceAdmin(input.ctx.workspaceId)
  const systemPrompt = SYSTEM_PROMPT_AUTOPILOT + buildBrandVoiceInstruction(voice)

  return commonExecute({
    ctx: input.ctx,
    kind: 'autopilot',
    conversationId: null,
    trigger: { name: input.trigger.name, ...(input.trigger.payload ?? {}) },
    initialMessages: messages,
    systemPrompt,
    budget,
    allowedToolNames: input.allowedToolNames ?? null,
  })
}

// ─── private: shared loop ───────────────────────────────────────────

interface CommonExecuteParams {
  ctx: AgentContext
  kind: AgentRunKind
  conversationId: string | null
  trigger: Record<string, unknown>
  initialMessages: NormalizedMessage[]
  systemPrompt: string
  budget: BudgetProfile
  allowedToolNames: string[] | null
  onEvent?: AgentEventListener
}

/**
 * Defensive wrapper around the optional event listener — listener
 * exceptions never propagate into the loop. Stream consumers
 * (browsers) close mid-run all the time; we treat that as a no-op and
 * keep telemetry flowing to the DB.
 */
function emit(
  listener: AgentEventListener | undefined,
  event: AgentEvent,
): void {
  if (!listener) return
  try {
    listener(event)
  } catch (err) {
    log.warn('agent.run onEvent listener threw', {
      eventType: event.type,
      err: err instanceof Error ? err.message : String(err),
    })
  }
}

async function commonExecute(
  params: CommonExecuteParams,
): Promise<AgentRunResult> {
  // Pick provider + key + model for this workspace. Bails fast if no
  // key is stored (clean error envelope, no run row created).
  const resolved = await resolveAgentProvider(params.ctx.workspaceId)
  if (!resolved.ok) {
    return {
      ok: false,
      runId: null,
      code: resolved.code === 'forbidden' ? 'forbidden' : 'no_key',
      message: resolved.message,
    }
  }

  const { provider, apiKey, model } = resolved

  // Create run + open handle (encapsulates optimistic-locked transitions).
  const runId = await createRun({
    workspaceId: params.ctx.workspaceId,
    userId: params.ctx.userId,
    kind: params.kind,
    conversationId: params.conversationId,
    trigger: { ...params.trigger, provider, model },
  })
  const handle = await RunHandle.open(runId)
  await handle.markRunning()

  emit(params.onEvent, {
    type: 'run_start',
    runId,
    conversationId: params.conversationId,
    provider,
    model,
  })

  const acc = newBudgetAccumulator()
  const messages: NormalizedMessage[] = [...params.initialMessages]
  const tools = getTools({ allow: params.allowedToolNames })
  let parkedWaitingOn: WaitingOn | null = null
  let lastAssistantText = ''

  // Hard outer cap as a paranoia ceiling — each iteration is one LLM
  // round-trip + zero-or-more tool calls. Budget caps are the real
  // gate; this just prevents an unbounded while(true).
  const MAX_ITERATIONS = 30
  let iter = 0

  try {
    while (iter < MAX_ITERATIONS) {
      iter++
      resetTurn(acc)

      const response = await callAgentLlm({
        provider,
        apiKey,
        model,
        system: params.systemPrompt,
        messages,
        tools,
        maxTokens: params.budget.maxTokensPerCall,
        temperature: params.kind === 'autopilot' ? 0.3 : 0.7,
      })

      if (!response.ok) {
        const errMsg = `${response.code}: ${response.message}`
        await handle.markFailed(acc, errMsg)
        emit(params.onEvent, {
          type: 'error',
          code: 'anthropic_error',
          message: errMsg,
        })
        return {
          ok: false,
          runId,
          code: 'anthropic_error',
          message: errMsg,
          cost: acc,
        }
      }

      const cost = computeCallCost({
        model: response.model,
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          cacheCreationTokens: response.usage.cacheCreationTokens,
          cacheReadTokens: response.usage.cacheReadTokens,
        },
      })

      // Append assistant turn (text + tool_use blocks) to history.
      // Required for multi-turn correctness — the next user turn's
      // tool_result blocks must immediately follow the assistant
      // turn that contains the matching tool_use blocks.
      messages.push({ role: 'assistant', blocks: response.blocks })

      // Capture trailing text so caller has something to display
      // even when the model also calls tools in the same turn.
      const trailingText = response.blocks
        .filter((b): b is Extract<NormalizedBlock, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      if (trailingText) {
        lastAssistantText = trailingText
        emit(params.onEvent, { type: 'assistant_text', text: trailingText })
      }

      const toolUses = response.blocks.filter(
        (b): b is Extract<NormalizedBlock, { type: 'tool_use' }> =>
          b.type === 'tool_use',
      )

      // Emit tool_use events upfront so the UI can render "calling X..."
      // cards even before the result lands. Each tool_result event
      // below is correlated by toolUseId.
      for (const tu of toolUses) {
        emit(params.onEvent, {
          type: 'tool_use',
          id: tu.id,
          name: tu.name,
          input: tu.input,
        })
      }

      accumulate(acc, {
        toolCalls: toolUses.length,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        costMicroUsd: cost,
      })
      assertWithinBudget(acc, params.budget)
      await handle.checkpointCost(acc)
      emit(params.onEvent, {
        type: 'cost_update',
        costMicroUsd: acc.costMicroUsd.toString(),
        toolsThisRun: acc.toolsThisRun,
        inputTokens: acc.inputTokens,
        outputTokens: acc.outputTokens,
      })

      // Done? (no more tool calls = end of conversation turn)
      if (response.stopReason === 'end_turn' || toolUses.length === 0) {
        await handle.markComplete(acc)
        emit(params.onEvent, { type: 'done', finalText: lastAssistantText })
        return {
          ok: true,
          runId,
          finalText: lastAssistantText,
          messages,
          cost: acc,
          provider,
          model,
        }
      }

      // Refusal stops the loop, surfaced as a soft "ok" with the
      // refusal text — same as end_turn from the user's POV, just
      // rendered with a hint. The model won't keep retrying.
      if (response.stopReason === 'refusal') {
        await handle.markComplete(acc)
        const refusalText =
          lastAssistantText || '(The model refused to respond to this request.)'
        emit(params.onEvent, { type: 'done', finalText: refusalText })
        return {
          ok: true,
          runId,
          finalText: refusalText,
          messages,
          cost: acc,
          provider,
          model,
        }
      }

      // Re-check membership ONCE before the tool batch — cheap and
      // catches role downgrades that happen mid-run.
      const memberCheck = await assertStillMember(params.ctx)
      if (!memberCheck.ok) {
        const msg = `Membership lost mid-run: ${memberCheck.reason}`
        await handle.markFailed(acc, msg)
        return {
          ok: false,
          runId,
          code: 'forbidden',
          message: msg,
          cost: acc,
        }
      }

      const toolResultBlocks: NormalizedBlock[] = []
      for (const tu of toolUses) {
        const dispatch = await dispatchToolCallWithRetry({
          ctx: params.ctx,
          runId,
          toolUse: tu,
        })

        toolResultBlocks.push({
          type: 'tool_result',
          toolUseId: tu.id,
          content:
            typeof dispatch.content === 'string'
              ? dispatch.content
              : JSON.stringify(dispatch.content),
          isError: dispatch.isError || undefined,
        })

        emit(params.onEvent, {
          type: 'tool_result',
          toolUseId: tu.id,
          toolName: tu.name,
          output: dispatch.content,
          isError: dispatch.isError,
          latencyMs: dispatch.latencyMs,
        })

        if (dispatch.parked) {
          parkedWaitingOn = dispatch.parked
          // Stop processing further tool_uses in this turn — the run
          // is going to sleep. Anything after would be wasted work
          // the resumed run would re-issue based on fresh state.
          break
        }
      }

      // Park if a tool requested it; otherwise continue with results.
      if (parkedWaitingOn) {
        messages.push({ role: 'user', blocks: toolResultBlocks })
        await handle.park(parkedWaitingOn, acc)
        emit(params.onEvent, {
          type: 'done',
          finalText: lastAssistantText,
          parked: { waitingOn: parkedWaitingOn },
        })
        return {
          ok: true,
          runId,
          finalText: lastAssistantText,
          messages,
          cost: acc,
          provider,
          model,
          parked: { waitingOn: parkedWaitingOn },
        }
      }

      messages.push({ role: 'user', blocks: toolResultBlocks })
    }

    // Hit the iteration cap without a clean stop — treat as runaway.
    const msg = `Tool loop did not terminate in ${MAX_ITERATIONS} iterations.`
    await handle.markFailed(acc, msg)
    return {
      ok: false,
      runId,
      code: 'tool_loop_runaway',
      message: msg,
      cost: acc,
    }
  } catch (err) {
    if (err instanceof BudgetExceededError) {
      await handle.markBudgetExceeded(acc, err.message)
      emit(params.onEvent, {
        type: 'error',
        code: 'budget_exceeded',
        message: err.message,
      })
      return {
        ok: false,
        runId,
        code: 'budget_exceeded',
        message: err.message,
        cost: acc,
      }
    }
    const msg = err instanceof Error ? err.message : String(err)
    log.error('agent.run unexpected', err instanceof Error ? err : new Error(msg), {
      runId,
      kind: params.kind,
    })
    await handle.markFailed(acc, msg).catch(() => {})
    emit(params.onEvent, { type: 'error', code: 'unexpected', message: msg })
    return {
      ok: false,
      runId,
      code: 'unexpected',
      message: msg,
      cost: acc,
    }
  }
}

// ─── tool dispatch ──────────────────────────────────────────────────

const RETRY_DELAYS_MS = [500, 1500]

async function dispatchToolCallWithRetry(params: {
  ctx: AgentContext
  runId: string
  toolUse: { id: string; name: string; input: unknown }
}): Promise<ToolDispatchOutput> {
  let result = await dispatchToolCall(params)

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (!result.isError) break
    const content = result.content as Record<string, unknown> | undefined
    if (!content?.retryable) break

    log.info('agent.tool retrying', {
      runId: params.runId,
      tool: params.toolUse.name,
      attempt: attempt + 2,
      delayMs: RETRY_DELAYS_MS[attempt],
    })
    await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
    result = await dispatchToolCall(params)
  }

  return result
}

interface ToolDispatchOutput {
  /** Serialized output to put inside the tool_result content block. */
  content: unknown
  /** True if the tool refused or threw — sets is_error on the block. */
  isError: boolean
  /** Set when the tool returned `kind: 'parked'`. */
  parked?: WaitingOn
  /** Wall-clock dispatch latency, surfaced via events for the UI. */
  latencyMs: number
}

async function dispatchToolCall(params: {
  ctx: AgentContext
  runId: string
  toolUse: { id: string; name: string; input: unknown }
}): Promise<ToolDispatchOutput> {
  const start = Date.now()
  const tool = getToolByName(params.toolUse.name)
  if (!tool) {
    const msg = `Unknown tool: ${params.toolUse.name}`
    const latencyMs = Date.now() - start
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: params.toolUse.name,
      input: params.toolUse.input,
      output: { error: msg },
      latencyMs,
      success: false,
      error: msg,
    })
    return { content: { error: msg }, isError: true, latencyMs }
  }

  // Per-tool role gate (defense in depth on top of context-builder).
  if (!isRoleAtOrAbove(params.ctx.role, tool.requiredRole)) {
    const msg = `Tool ${tool.name} requires role ${tool.requiredRole}; you are ${params.ctx.role}.`
    const latencyMs = Date.now() - start
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: tool.name,
      input: params.toolUse.input,
      output: { error: msg },
      latencyMs,
      success: false,
      error: msg,
    })
    return { content: { error: msg }, isError: true, latencyMs }
  }

  try {
    const result = await tool.handler(params.ctx, params.toolUse.input)
    const latencyMs = Date.now() - start
    if (result.kind === 'ok') {
      await recordToolCall({
        runId: params.runId,
        workspaceId: params.ctx.workspaceId,
        toolName: tool.name,
        input: params.toolUse.input,
        output: result.value,
        latencyMs,
        success: true,
      })
      return { content: result.value, isError: false, latencyMs }
    }
    if (result.kind === 'parked') {
      await recordToolCall({
        runId: params.runId,
        workspaceId: params.ctx.workspaceId,
        toolName: tool.name,
        input: params.toolUse.input,
        output: { parked: result.waitingOn },
        latencyMs,
        success: true,
      })
      return {
        content: {
          status: 'parked',
          message: `Started async work; will resume when ${result.waitingOn.kind} ${result.waitingOn.id} completes.`,
        },
        isError: false,
        parked: result.waitingOn,
        latencyMs,
      }
    }
    // error
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: tool.name,
      input: params.toolUse.input,
      output: { error: result.message },
      latencyMs,
      success: false,
      error: result.message,
    })
    return {
      content: { error: result.message, retryable: result.retryable ?? false },
      isError: true,
      latencyMs,
    }
  } catch (err) {
    const isPerm = err instanceof ToolPermissionError
    const msg = err instanceof Error ? err.message : String(err)
    const latencyMs = Date.now() - start
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: tool.name,
      input: params.toolUse.input,
      output: { error: msg },
      latencyMs,
      success: false,
      error: msg,
    })
    return {
      content: { error: msg, retryable: !isPerm },
      isError: true,
      latencyMs,
    }
  }
}

function isRoleAtOrAbove(
  actual: AgentContext['role'],
  required: AgentContext['role'],
): boolean {
  const order = ['reviewer', 'editor', 'owner'] as const
  return order.indexOf(actual) >= order.indexOf(required)
}

// Re-export the budget profiles so callers (debug route) can reference
// them without pulling in the whole budget module.
export { CHAT_BUDGET, AUTOPILOT_BUDGET }
