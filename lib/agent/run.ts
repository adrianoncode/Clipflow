import 'server-only'

import { log } from '@/lib/log'
import { getDecryptedAiKey } from '@/lib/ai/get-decrypted-ai-key'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import {
  callAnthropicAgent,
  type AnthropicMessage,
  type ContentBlock,
} from '@/lib/agent/anthropic-call'
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
import {
  getToolByName,
  getTools,
  toAnthropicFormat,
} from '@/lib/agent/tools'
import { recordToolCall } from '@/lib/agent/telemetry/record-tool-call'
import { computeCallCost } from '@/lib/agent/telemetry/cost'
import { SYSTEM_PROMPT_CHAT } from '@/lib/agent/prompts/system-chat'
import { SYSTEM_PROMPT_AUTOPILOT } from '@/lib/agent/prompts/system-autopilot'

/**
 * Agent run loop.
 *
 * Two public entry points (`runChatTurn`, `runAutopilotRun`) wrap a
 * shared `executeToolLoop` so chat and autopilot stay technically
 * separate (different prompts, budgets, telemetry tags) while sharing
 * the core Anthropic ↔ tool dispatch dance.
 *
 * The loop:
 *   1. Build initial messages (chat: existing history + new user
 *      message; autopilot: synthetic user message describing the
 *      trigger).
 *   2. Call Anthropic.
 *   3. Append assistant response to messages.
 *   4. If stop_reason='tool_use', execute each tool_use block, collect
 *      results into a single user message with tool_result blocks,
 *      append, loop back to step 2.
 *   5. If stop_reason='end_turn' OR a tool returns 'parked', exit.
 *   6. After every Anthropic call: accumulate cost/tokens, assert
 *      within budget, checkpoint to agent_runs.
 *
 * Errors:
 *   - BudgetExceededError → mark run 'budget_exceeded', surface to
 *     caller, do NOT throw further.
 *   - ToolPermissionError → tool_result with is_error: true, model can
 *     try a different approach.
 *   - Other tool errors → same.
 *   - Anthropic errors → mark run 'failed', throw.
 */

const ANTHROPIC_PROVIDER = 'anthropic' as const

export type AgentRunResult =
  | {
      ok: true
      runId: string
      finalText: string
      messages: AnthropicMessage[]
      cost: BudgetAccumulator
      parked?: { waitingOn: WaitingOn }
    }
  | {
      ok: false
      runId: string | null
      code:
        | 'no_key'
        | 'forbidden'
        | 'budget_exceeded'
        | 'anthropic_error'
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
  priorMessages: AnthropicMessage[]
  /** New user message (text only — chat UI doesn't send blocks yet). */
  userMessage: string
  /** Per-workspace overrides loaded from agent_settings. */
  budgetOverrides?: WorkspaceBudgetOverrides | null
  /** Optional: workspace-overridden model. Falls back to platform default. */
  model?: string | null
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
  const messages: AnthropicMessage[] = [
    ...input.priorMessages,
    { role: 'user', content: input.userMessage },
  ]
  return commonExecute({
    ctx: input.ctx,
    kind: 'chat',
    conversationId: input.conversationId,
    trigger: { source: 'user_message' },
    initialMessages: messages,
    systemPrompt: SYSTEM_PROMPT_CHAT,
    budget,
    model: input.model ?? DEFAULT_MODELS.anthropic,
    allowedToolNames: null, // chat sees full toolbox
  })
}

// ─── public: autopilot run ──────────────────────────────────────────

export interface RunAutopilotInput {
  ctx: AgentContext
  /** What kicked this off — recorded on agent_runs.trigger and shown
   *  to the model as the synthetic user message. */
  trigger: {
    /** e.g. 'auto_highlights' */
    name: string
    /** Free-form scope description — becomes the user message body. */
    instruction: string
    /** Structured payload (content_id, etc.) merged into agent_runs.trigger. */
    payload?: Record<string, unknown>
  }
  /** Tool subset for this trigger. null = full toolbox (chat-equivalent).
   *  Read-only tools are always available regardless. */
  allowedToolNames?: string[] | null
  budgetOverrides?: WorkspaceBudgetOverrides | null
  model?: string | null
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
  const messages: AnthropicMessage[] = [
    { role: 'user', content: input.trigger.instruction },
  ]
  return commonExecute({
    ctx: input.ctx,
    kind: 'autopilot',
    conversationId: null,
    trigger: { name: input.trigger.name, ...(input.trigger.payload ?? {}) },
    initialMessages: messages,
    systemPrompt: SYSTEM_PROMPT_AUTOPILOT,
    budget,
    model: input.model ?? DEFAULT_MODELS.anthropic,
    allowedToolNames: input.allowedToolNames ?? null,
  })
}

// ─── private: shared loop ───────────────────────────────────────────

interface CommonExecuteParams {
  ctx: AgentContext
  kind: AgentRunKind
  conversationId: string | null
  trigger: Record<string, unknown>
  initialMessages: AnthropicMessage[]
  systemPrompt: string
  budget: BudgetProfile
  model: string
  allowedToolNames: string[] | null
}

async function commonExecute(
  params: CommonExecuteParams,
): Promise<AgentRunResult> {
  // Fetch BYOK Anthropic key for this workspace. This is the entry
  // point where "no key" fails fast — don't even create a run row,
  // since it would be empty.
  const keyResult = await getDecryptedAiKey(
    params.ctx.workspaceId,
    ANTHROPIC_PROVIDER,
  )
  if (!keyResult.ok) {
    return {
      ok: false,
      runId: null,
      code: keyResult.code === 'forbidden' ? 'forbidden' : 'no_key',
      message: keyResult.message,
    }
  }

  const apiKey = keyResult.plaintext

  // Create run + open handle (encapsulates optimistic-locked transitions).
  const runId = await createRun({
    workspaceId: params.ctx.workspaceId,
    userId: params.ctx.userId,
    kind: params.kind,
    conversationId: params.conversationId,
    trigger: params.trigger,
  })
  const handle = await RunHandle.open(runId)
  await handle.markRunning()

  const acc = newBudgetAccumulator()
  const messages: AnthropicMessage[] = [...params.initialMessages]
  const tools = getTools({ allow: params.allowedToolNames })
  const anthropicTools = toAnthropicFormat(tools)
  let parkedWaitingOn: WaitingOn | null = null
  let lastAssistantText = ''

  // Hard outer cap as a paranoia ceiling — each loop iteration is one
  // Anthropic round-trip + zero-or-more tool calls. Budget caps below
  // are the real gate; this just prevents an unbounded while(true).
  const MAX_ITERATIONS = 30
  let iter = 0

  try {
    while (iter < MAX_ITERATIONS) {
      iter++
      resetTurn(acc)

      const response = await callAnthropicAgent({
        apiKey,
        model: params.model,
        system: params.systemPrompt,
        messages,
        tools: anthropicTools,
        maxTokens: params.budget.maxTokensPerCall,
        temperature: params.kind === 'autopilot' ? 0.3 : 0.7,
      })

      if (!response.ok) {
        const errMsg = `${response.code}: ${response.message}`
        await handle.markFailed(acc, errMsg)
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
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheCreationTokens: response.usage.cache_creation_input_tokens,
          cacheReadTokens: response.usage.cache_read_input_tokens,
        },
      })

      // Append assistant turn verbatim (must include tool_use blocks
      // for the next user-side tool_result blocks to bind correctly).
      messages.push({ role: 'assistant', content: response.content })

      // Capture trailing text so caller has something to show even
      // when the model also calls tools in the same turn.
      const trailingText = response.content
        .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      if (trailingText) lastAssistantText = trailingText

      const toolUses = response.content.filter(
        (b): b is Extract<ContentBlock, { type: 'tool_use' }> =>
          b.type === 'tool_use',
      )

      accumulate(acc, {
        toolCalls: toolUses.length,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        costMicroUsd: cost,
      })
      assertWithinBudget(acc, params.budget)
      await handle.checkpointCost(acc)

      // Done? (no more tool calls = end of conversation turn)
      if (response.stopReason === 'end_turn' || toolUses.length === 0) {
        await handle.markComplete(acc)
        return {
          ok: true,
          runId,
          finalText: lastAssistantText,
          messages,
          cost: acc,
        }
      }

      // Execute each tool_use block. We re-check membership ONCE
      // before the batch, then per-tool role gating runs inside the
      // dispatch (handlers can also call requireEditor / requireOwner).
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

      const toolResultBlocks: ContentBlock[] = []
      for (const tu of toolUses) {
        const dispatch = await dispatchToolCall({
          ctx: params.ctx,
          runId,
          toolUse: tu,
        })

        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: tu.id,
          content: typeof dispatch.content === 'string'
            ? dispatch.content
            : JSON.stringify(dispatch.content),
          is_error: dispatch.isError || undefined,
        })

        if (dispatch.parked) {
          parkedWaitingOn = dispatch.parked
          // Stop processing further tool_uses in the same turn — the
          // run is going to sleep and resume later. Anything after
          // would be wasted work the resumed run would re-issue
          // anyway based on fresh state.
          break
        }
      }

      // If we parked, write tool_result blocks back so the resumed
      // turn sees them, then park the run.
      if (parkedWaitingOn) {
        messages.push({ role: 'user', content: toolResultBlocks })
        await handle.park(parkedWaitingOn, acc)
        return {
          ok: true,
          runId,
          finalText: lastAssistantText,
          messages,
          cost: acc,
          parked: { waitingOn: parkedWaitingOn },
        }
      }

      // Otherwise: append tool results, loop again.
      messages.push({ role: 'user', content: toolResultBlocks })
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

interface ToolDispatchOutput {
  /** Serialized output to put inside the tool_result content block. */
  content: unknown
  /** True if the tool refused or threw — sets is_error on the block. */
  isError: boolean
  /** Set when the tool returned `kind: 'parked'`. */
  parked?: WaitingOn
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
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: params.toolUse.name,
      input: params.toolUse.input,
      output: { error: msg },
      latencyMs: Date.now() - start,
      success: false,
      error: msg,
    })
    return { content: { error: msg }, isError: true }
  }

  // Per-tool role gate (defense in depth on top of context-builder).
  if (!isRoleAtOrAbove(params.ctx.role, tool.requiredRole)) {
    const msg = `Tool ${tool.name} requires role ${tool.requiredRole}; you are ${params.ctx.role}.`
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: tool.name,
      input: params.toolUse.input,
      output: { error: msg },
      latencyMs: Date.now() - start,
      success: false,
      error: msg,
    })
    return { content: { error: msg }, isError: true }
  }

  try {
    const result = await tool.handler(params.ctx, params.toolUse.input)
    const latency = Date.now() - start
    if (result.kind === 'ok') {
      await recordToolCall({
        runId: params.runId,
        workspaceId: params.ctx.workspaceId,
        toolName: tool.name,
        input: params.toolUse.input,
        output: result.value,
        latencyMs: latency,
        success: true,
      })
      return { content: result.value, isError: false }
    }
    if (result.kind === 'parked') {
      await recordToolCall({
        runId: params.runId,
        workspaceId: params.ctx.workspaceId,
        toolName: tool.name,
        input: params.toolUse.input,
        output: { parked: result.waitingOn },
        latencyMs: latency,
        success: true,
      })
      return {
        content: {
          status: 'parked',
          message: `Started async work; will resume when ${result.waitingOn.kind} ${result.waitingOn.id} completes.`,
        },
        isError: false,
        parked: result.waitingOn,
      }
    }
    // error
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: tool.name,
      input: params.toolUse.input,
      output: { error: result.message },
      latencyMs: latency,
      success: false,
      error: result.message,
    })
    return {
      content: { error: result.message, retryable: result.retryable ?? false },
      isError: true,
    }
  } catch (err) {
    const isPerm = err instanceof ToolPermissionError
    const msg = err instanceof Error ? err.message : String(err)
    await recordToolCall({
      runId: params.runId,
      workspaceId: params.ctx.workspaceId,
      toolName: tool.name,
      input: params.toolUse.input,
      output: { error: msg },
      latencyMs: Date.now() - start,
      success: false,
      error: msg,
    })
    return {
      content: { error: msg, retryable: !isPerm },
      isError: true,
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
