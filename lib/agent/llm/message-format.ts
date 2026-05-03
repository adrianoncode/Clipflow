import 'server-only'

import type { NormalizedMessage, NormalizedBlock } from '@/lib/agent/llm/types'

/**
 * Message-shape converters between our normalized format and each
 * provider's wire format. The agent loop only ever holds normalized
 * messages — converters run at the API boundary.
 *
 * The trickiest part is `tool_result` block placement, because each
 * provider pairs tool calls with results differently:
 *
 *   - Anthropic: inline content blocks. tool_use blocks live in
 *     assistant turns; tool_result blocks live in following user
 *     turns and reference `tool_use_id`. Multiple results pack into
 *     one user turn's content array.
 *
 *   - OpenAI: tool_calls live as a property on assistant messages;
 *     each result is its OWN message with role='tool' and
 *     tool_call_id. So one normalized user-turn-with-multiple-results
 *     fans out into N OpenAI messages.
 *
 *   - Gemini: assistant turns can have multiple `parts`, each with
 *     either text or functionCall. Results come back as user-role
 *     messages with `functionResponse` parts. Like Anthropic, results
 *     can pack into one user message — different field name but same
 *     structural pattern.
 */

// ─── Anthropic ───────────────────────────────────────────────────────

export type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | {
      type: 'tool_result'
      tool_use_id: string
      content: string | Array<{ type: 'text'; text: string }>
      is_error?: boolean
    }

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: AnthropicContentBlock[] | string
}

export function toAnthropicMessages(
  msgs: NormalizedMessage[],
): AnthropicMessage[] {
  return msgs.map((m) => ({
    role: m.role,
    content: m.blocks.map(normalizedToAnthropicBlock),
  }))
}

function normalizedToAnthropicBlock(b: NormalizedBlock): AnthropicContentBlock {
  switch (b.type) {
    case 'text':
      return { type: 'text', text: b.text }
    case 'tool_use':
      return { type: 'tool_use', id: b.id, name: b.name, input: b.input }
    case 'tool_result':
      return {
        type: 'tool_result',
        tool_use_id: b.toolUseId,
        content: b.content,
        is_error: b.isError,
      }
  }
}

/**
 * Convert an Anthropic API response's content array back into normalized
 * blocks. Only text + tool_use appear in responses (tool_result is
 * user-side); the loop ignores anything else (server_tool_use,
 * thinking blocks, etc. — not used in v1).
 */
export function fromAnthropicResponseContent(
  raw: unknown,
): Array<Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>> {
  if (!Array.isArray(raw)) return []
  const out: Array<Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>> = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const b = item as Record<string, unknown>
    if (b.type === 'text' && typeof b.text === 'string') {
      out.push({ type: 'text', text: b.text })
    } else if (
      b.type === 'tool_use' &&
      typeof b.id === 'string' &&
      typeof b.name === 'string'
    ) {
      out.push({ type: 'tool_use', id: b.id, name: b.name, input: b.input })
    }
  }
  return out
}

// ─── OpenAI ──────────────────────────────────────────────────────────

export interface OpenAiToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    /** OpenAI returns arguments as a JSON-encoded STRING, not an
     *  object — the loop must JSON.parse. */
    arguments: string
  }
}

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string | null
  /** Assistant messages only — present when the model called tools. */
  tool_calls?: OpenAiToolCall[]
  /** Tool result messages only. */
  tool_call_id?: string
  /** Optional name (mostly for tool messages, equals the function name). */
  name?: string
}

/**
 * Convert normalized messages → OpenAI Chat Completions messages array.
 * The big behavior difference vs Anthropic: a single normalized user
 * turn containing multiple tool_result blocks fans out into N OpenAI
 * `tool` messages, one per tool call.
 *
 * Text blocks in user turns coexist with tool_results: text becomes
 * a separate `user` message preceding the tool messages (OpenAI doesn't
 * accept tool messages with prepended text content in one envelope).
 */
export function toOpenAiMessages(
  msgs: NormalizedMessage[],
): OpenAiMessage[] {
  const out: OpenAiMessage[] = []
  for (const m of msgs) {
    if (m.role === 'assistant') {
      out.push(toOpenAiAssistantMessage(m.blocks))
    } else {
      out.push(...toOpenAiUserMessages(m.blocks))
    }
  }
  return out
}

function toOpenAiAssistantMessage(blocks: NormalizedBlock[]): OpenAiMessage {
  const texts: string[] = []
  const toolCalls: OpenAiToolCall[] = []
  for (const b of blocks) {
    if (b.type === 'text') texts.push(b.text)
    else if (b.type === 'tool_use') {
      toolCalls.push({
        id: b.id,
        type: 'function',
        function: {
          name: b.name,
          arguments: JSON.stringify(b.input ?? {}),
        },
      })
    }
    // tool_result blocks should never appear in assistant turns —
    // silently drop.
  }
  const msg: OpenAiMessage = {
    role: 'assistant',
    // OpenAI requires content=null when there are tool_calls and no text.
    content: texts.length > 0 ? texts.join('\n') : null,
  }
  if (toolCalls.length > 0) msg.tool_calls = toolCalls
  return msg
}

function toOpenAiUserMessages(blocks: NormalizedBlock[]): OpenAiMessage[] {
  const out: OpenAiMessage[] = []
  const texts: string[] = []
  for (const b of blocks) {
    if (b.type === 'text') texts.push(b.text)
  }
  if (texts.length > 0) {
    out.push({ role: 'user', content: texts.join('\n') })
  }
  for (const b of blocks) {
    if (b.type === 'tool_result') {
      out.push({
        role: 'tool',
        tool_call_id: b.toolUseId,
        // OpenAI expects tool result content as a plain string.
        // is_error is conveyed by the model interpreting the content;
        // unlike Anthropic, OpenAI has no structured is_error field.
        // We prefix errored results so the model sees them clearly.
        content: b.isError ? `[error] ${b.content}` : b.content,
      })
    }
  }
  return out
}

/**
 * Convert an OpenAI assistant message back to normalized blocks. The
 * input is one item from `choices[0].message`.
 */
export function fromOpenAiAssistantMessage(
  raw: unknown,
): Array<Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>> {
  if (!raw || typeof raw !== 'object') return []
  const m = raw as Record<string, unknown>
  const out: Array<Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>> = []

  if (typeof m.content === 'string' && m.content.trim().length > 0) {
    out.push({ type: 'text', text: m.content })
  }

  if (Array.isArray(m.tool_calls)) {
    for (const tc of m.tool_calls) {
      if (!tc || typeof tc !== 'object') continue
      const call = tc as Record<string, unknown>
      const id = call.id
      const fn = call.function as
        | { name?: unknown; arguments?: unknown }
        | undefined
      if (
        typeof id !== 'string' ||
        !fn ||
        typeof fn.name !== 'string'
      ) {
        continue
      }
      // Arguments come as a JSON-encoded string — try to parse, fall
      // back to wrapping the raw string if parsing fails (the tool's
      // own input parser will reject malformed input cleanly).
      let input: unknown = {}
      if (typeof fn.arguments === 'string') {
        try {
          input = JSON.parse(fn.arguments)
        } catch {
          input = { _raw: fn.arguments }
        }
      } else if (fn.arguments && typeof fn.arguments === 'object') {
        input = fn.arguments
      }
      out.push({ type: 'tool_use', id, name: fn.name, input })
    }
  }

  return out
}

// ─── Gemini ──────────────────────────────────────────────────────────

export interface GeminiPart {
  text?: string
  functionCall?: {
    name: string
    args: Record<string, unknown>
  }
  functionResponse?: {
    name: string
    response: { content: string; isError?: boolean }
  }
}

/**
 * Gemini's "messages" are called `contents` and use role 'user' or
 * 'model' (note: 'model' not 'assistant'). Parts within a content
 * are an array of objects each carrying ONE of: text, functionCall,
 * functionResponse.
 *
 * functionResponse parts must reference the function name (not a call
 * id — Gemini doesn't issue per-call ids). So if a model calls the
 * same tool twice in one turn, the responses correlate by ORDER, not
 * by id. We preserve order from the normalized blocks to keep the
 * pairing right.
 */
export interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

export function toGeminiContents(
  msgs: NormalizedMessage[],
): GeminiContent[] {
  return msgs.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: m.blocks.map(normalizedToGeminiPart).filter(isPart),
  }))
}

function normalizedToGeminiPart(b: NormalizedBlock): GeminiPart | null {
  switch (b.type) {
    case 'text':
      return { text: b.text }
    case 'tool_use':
      return {
        functionCall: {
          name: b.name,
          args:
            b.input && typeof b.input === 'object'
              ? (b.input as Record<string, unknown>)
              : {},
        },
      }
    case 'tool_result':
      // Gemini doesn't track tool_use_id — it pairs by name + order.
      // We need the function name; since our normalized tool_result
      // doesn't carry name, we look it up via the surrounding turn.
      // To keep this converter pure (no surrounding context), we
      // encode the tool's name into toolUseId as a `name:id` prefix
      // when emitting tool_use → tool_result conversion. A pragmatic
      // hack — see toGeminiContentsWithToolNames below.
      return null
  }
}

function isPart(p: GeminiPart | null): p is GeminiPart {
  return p !== null
}

/**
 * Real entry point used by the loop: converts normalized → Gemini
 * contents AND resolves tool_result block names by walking the prior
 * assistant turn for matching tool_use ids. Without this, Gemini
 * would receive functionResponse parts with name = "unknown".
 *
 * The loop must call this version, not `toGeminiContents` directly.
 */
export function toGeminiContentsWithToolNames(
  msgs: NormalizedMessage[],
): GeminiContent[] {
  // Build an id → name map by scanning all assistant turns.
  const idToName = new Map<string, string>()
  for (const m of msgs) {
    if (m.role !== 'assistant') continue
    for (const b of m.blocks) {
      if (b.type === 'tool_use') idToName.set(b.id, b.name)
    }
  }

  const contents: GeminiContent[] = []
  for (const m of msgs) {
    const parts: GeminiPart[] = []
    for (const b of m.blocks) {
      if (b.type === 'text') {
        parts.push({ text: b.text })
      } else if (b.type === 'tool_use') {
        parts.push({
          functionCall: {
            name: b.name,
            args:
              b.input && typeof b.input === 'object'
                ? (b.input as Record<string, unknown>)
                : {},
          },
        })
      } else if (b.type === 'tool_result') {
        const name = idToName.get(b.toolUseId) ?? 'unknown'
        parts.push({
          functionResponse: {
            name,
            response: {
              content: b.content,
              ...(b.isError ? { isError: true } : {}),
            },
          },
        })
      }
    }
    if (parts.length === 0) continue
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    })
  }
  return contents
}

/**
 * Convert one Gemini candidate's content.parts back to normalized
 * blocks. Gemini doesn't issue per-call ids, so we synthesize ones —
 * the loop uses these only as opaque correlation handles for the
 * follow-up tool_result.
 */
export function fromGeminiCandidateParts(
  raw: unknown,
): Array<Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>> {
  if (!raw || typeof raw !== 'object') return []
  const c = raw as { parts?: unknown }
  if (!Array.isArray(c.parts)) return []

  const out: Array<Extract<NormalizedBlock, { type: 'text' | 'tool_use' }>> = []
  let callIdx = 0
  for (const p of c.parts) {
    if (!p || typeof p !== 'object') continue
    const part = p as Record<string, unknown>
    if (typeof part.text === 'string' && part.text.trim().length > 0) {
      out.push({ type: 'text', text: part.text })
    }
    if (part.functionCall && typeof part.functionCall === 'object') {
      const fc = part.functionCall as { name?: unknown; args?: unknown }
      if (typeof fc.name === 'string') {
        out.push({
          type: 'tool_use',
          // Synthetic id — Gemini doesn't issue them. Use call index
          // to keep ids unique per response. The follow-up tool_result
          // block carries this synthetic id back, and the
          // toGeminiContentsWithToolNames mapper resolves it to the
          // function name (which is what Gemini actually pairs on).
          id: `gemini-${callIdx++}`,
          name: fc.name,
          input:
            fc.args && typeof fc.args === 'object'
              ? (fc.args as Record<string, unknown>)
              : {},
        })
      }
    }
  }
  return out
}
