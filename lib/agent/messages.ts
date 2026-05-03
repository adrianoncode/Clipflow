import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { log } from '@/lib/log'
import type { NormalizedMessage } from '@/lib/agent/llm/types'

/**
 * Persist + load helpers for `agent_messages`. The chat route insert
 * lifecycle is:
 *
 *   1. POST /api/agent/chat → insert one user row with the typed text
 *   2. runChatTurn returns the full message history (priorMessages
 *      + new turns)
 *   3. Insert each new turn AFTER index `priorMessages.length` — so we
 *      capture the model's intermediate tool_result + tool_use blocks
 *      verbatim. Required so the next turn's priorMessages contain the
 *      complete Anthropic-shaped block sequence.
 *
 * agent_messages.content is stored as the Anthropic-style block array
 * (text|tool_use|tool_result). NormalizedMessage.blocks is exactly
 * that shape, so persistence is a direct passthrough.
 */
function db() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAdminClient() as any
}

type AgentMessageRole = 'user' | 'assistant' | 'tool'

export interface PersistMessageInput {
  conversationId: string
  runId: string | null
  /**
   * The 'tool' role is reserved for free-standing tool-result rows the
   * UI persists for renderability — the loop itself only emits user +
   * assistant. We accept the broader type here for future use.
   */
  role: AgentMessageRole
  /** Anthropic-block-shape content (NormalizedBlock[] or any jsonb). */
  content: unknown
  tokensInput?: number
  tokensOutput?: number
  costMicroUsd?: bigint | string | number
}

export async function persistAgentMessage(
  input: PersistMessageInput,
): Promise<string> {
  const { data, error } = await db()
    .from('agent_messages')
    .insert({
      conversation_id: input.conversationId,
      run_id: input.runId,
      role: input.role,
      content: input.content,
      tokens_input: input.tokensInput ?? null,
      tokens_output: input.tokensOutput ?? null,
      cost_micro_usd:
        input.costMicroUsd === undefined
          ? null
          : typeof input.costMicroUsd === 'bigint'
            ? input.costMicroUsd.toString()
            : input.costMicroUsd,
    })
    .select('id')
    .single()

  if (error || !data) {
    log.error('persistAgentMessage failed', error, {
      conversationId: input.conversationId,
    })
    throw new Error(
      `Failed to persist agent message: ${error?.message ?? 'no row'}`,
    )
  }
  return data.id as string
}

/**
 * Load the existing conversation history into NormalizedMessage[] shape
 * for `priorMessages`. Ordered oldest first.
 *
 * Filters:
 *  - role='tool' rows are skipped — those are UI-only annotations the
 *    loop never produced, never needs to consume.
 *  - empty/malformed content rows are skipped, logged. A single bad
 *    row shouldn't poison the whole conversation context.
 */
export async function loadConversationMessages(
  conversationId: string,
): Promise<NormalizedMessage[]> {
  const { data, error } = await db()
    .from('agent_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    log.error('loadConversationMessages failed', error, { conversationId })
    return []
  }

  const out: NormalizedMessage[] = []
  for (const row of data ?? []) {
    const role = row.role as AgentMessageRole
    if (role !== 'user' && role !== 'assistant') continue

    const blocks = normalizeStoredBlocks(row.content)
    if (!blocks || blocks.length === 0) {
      log.warn('agent message had unrecognized content shape', {
        conversationId,
        role,
      })
      continue
    }
    out.push({ role, blocks })
  }
  return out
}

/**
 * Coerce the stored jsonb back into a NormalizedBlock-compatible array.
 * Accepts:
 *   - `{ blocks: [...] }` shape (what we write)
 *   - bare block array (legacy / debug rows)
 *   - plain string (very early debug rows — wrap as text block)
 */
function normalizeStoredBlocks(
  raw: unknown,
): NormalizedMessage['blocks'] | null {
  if (raw == null) return null
  if (typeof raw === 'string') {
    return [{ type: 'text', text: raw }]
  }
  if (Array.isArray(raw)) {
    return validateBlocks(raw)
  }
  if (typeof raw === 'object' && Array.isArray((raw as { blocks?: unknown }).blocks)) {
    return validateBlocks((raw as { blocks: unknown[] }).blocks)
  }
  return null
}

function validateBlocks(arr: unknown[]): NormalizedMessage['blocks'] | null {
  const out: NormalizedMessage['blocks'] = []
  for (const b of arr) {
    if (!b || typeof b !== 'object') continue
    const block = b as Record<string, unknown>
    if (block.type === 'text' && typeof block.text === 'string') {
      out.push({ type: 'text', text: block.text })
    } else if (
      block.type === 'tool_use' &&
      typeof block.id === 'string' &&
      typeof block.name === 'string'
    ) {
      out.push({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input: block.input ?? {},
      })
    } else if (
      block.type === 'tool_result' &&
      typeof (block.toolUseId ?? block.tool_use_id) === 'string' &&
      typeof block.content === 'string'
    ) {
      out.push({
        type: 'tool_result',
        toolUseId: (block.toolUseId ?? block.tool_use_id) as string,
        content: block.content,
        isError:
          typeof block.isError === 'boolean'
            ? (block.isError as boolean)
            : block.is_error === true,
      })
    }
  }
  return out.length > 0 ? out : null
}

/**
 * Persist the new turns produced by a single runChatTurn invocation.
 * Pass the returned `messages` array and the `priorLength` value the
 * caller passed in — only the slice [priorLength:] is persisted.
 */
export async function persistNewTurns(params: {
  conversationId: string
  runId: string
  allMessages: NormalizedMessage[]
  priorLength: number
}): Promise<void> {
  const { conversationId, runId, allMessages, priorLength } = params
  const newSlice = allMessages.slice(priorLength)
  for (const msg of newSlice) {
    await persistAgentMessage({
      conversationId,
      runId,
      role: msg.role,
      content: { blocks: msg.blocks },
    })
  }

  // Bump conversation last_message_at so the chat list orders correctly.
  await db()
    .from('agent_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
}
