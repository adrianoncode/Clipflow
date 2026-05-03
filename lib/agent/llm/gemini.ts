import 'server-only'

import { log } from '@/lib/log'
import {
  fromGeminiCandidateParts,
  toGeminiContentsWithToolNames,
} from '@/lib/agent/llm/message-format'
import { toGeminiTools } from '@/lib/agent/llm/tool-format'
import type {
  AgentLlmRequest,
  AgentLlmResult,
  NormalizedStopReason,
} from '@/lib/agent/llm/types'

const REQUEST_TIMEOUT_MS = 60_000

/**
 * Google Gemini adapter. Uses the v1beta `generateContent` endpoint.
 *
 * Notes vs Anthropic / OpenAI:
 *   - Endpoint URL embeds the model name (not in the body).
 *   - API key is a query param (`?key=...`), not a header. (Yes, really.)
 *   - Roles are 'user' and 'model' (NOT 'assistant').
 *   - System instruction is a top-level field, NOT a system message.
 *   - Tool calls are `functionCall` parts; results are
 *     `functionResponse` parts paired by NAME, not id.
 *   - We synthesize call ids in the response and resolve them back
 *     to names when sending the next request (see message-format.ts).
 *   - Caching exists but min 32k tokens — skipped for v1.
 */
export async function callGemini(
  req: AgentLlmRequest,
): Promise<AgentLlmResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(req.model)}:generateContent?key=${encodeURIComponent(req.apiKey)}`

  const body: Record<string, unknown> = {
    contents: toGeminiContentsWithToolNames(req.messages),
    systemInstruction: {
      role: 'system',
      parts: [{ text: req.system }],
    },
    generationConfig: {
      maxOutputTokens: req.maxTokens,
      temperature: req.temperature ?? 0.7,
    },
  }
  if (req.tools.length > 0) {
    body.tools = toGeminiTools(req.tools)
    // 'AUTO' = model decides whether to call. Default is also AUTO
    // but we set it explicitly for clarity.
    body.toolConfig = {
      functionCallingConfig: { mode: 'AUTO' },
    }
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return {
        ok: false,
        code: 'timeout',
        message: 'Gemini request timed out after 60s.',
      }
    }
    return {
      ok: false,
      code: 'network',
      message: 'Could not reach Gemini.',
    }
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    if (response.status === 400 || response.status === 401 || response.status === 403) {
      // Gemini lumps invalid key + invalid request together as 400.
      // The error body usually clarifies — log it but report as
      // invalid_key for the common case (401/403) and provider_error
      // for 400 (could be malformed request OR bad key).
      const code: AgentLlmResult & { ok: false } extends never
        ? never
        : 'invalid_key' | 'provider_error' = response.status === 400
        ? errBody.includes('API key not valid') ? 'invalid_key' : 'provider_error'
        : 'invalid_key'
      return {
        ok: false,
        code,
        status: response.status,
        message:
          code === 'invalid_key'
            ? 'Gemini rejected the API key.'
            : `Gemini returned 400: ${errBody.slice(0, 150)}`,
      }
    }
    if (response.status === 429) {
      return {
        ok: false,
        code: 'rate_limited',
        status: 429,
        message: 'Gemini rate-limited this request.',
      }
    }
    if (response.status === 503) {
      return {
        ok: false,
        code: 'overloaded',
        status: 503,
        message: 'Gemini is overloaded.',
      }
    }
    log.error('agent.llm.gemini unexpected status', new Error(errBody), {
      status: response.status,
      bodyPreview: errBody.slice(0, 300),
    })
    return {
      ok: false,
      code: 'provider_error',
      status: response.status,
      message: `Gemini returned ${response.status}.`,
    }
  }

  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Could not parse Gemini response JSON.',
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Gemini response was not an object.',
    }
  }

  const r = parsed as {
    candidates?: Array<{
      content?: unknown
      finishReason?: string
    }>
    usageMetadata?: {
      promptTokenCount?: number
      candidatesTokenCount?: number
      cachedContentTokenCount?: number
    }
  }

  const candidate = r.candidates?.[0]
  if (!candidate) {
    return {
      ok: false,
      code: 'parse_error',
      message: 'Gemini response had no candidates.',
    }
  }

  const blocks = fromGeminiCandidateParts(candidate.content)
  const stopReason = mapStopReason(candidate.finishReason, blocks)
  if (!stopReason) {
    return {
      ok: false,
      code: 'parse_error',
      message: `Unknown finishReason: ${String(candidate.finishReason)}`,
    }
  }

  const cached = r.usageMetadata?.cachedContentTokenCount ?? 0
  const promptTokens = r.usageMetadata?.promptTokenCount ?? 0
  const uncached = Math.max(0, promptTokens - cached)

  return {
    ok: true,
    stopReason,
    blocks,
    usage: {
      inputTokens: uncached,
      outputTokens: r.usageMetadata?.candidatesTokenCount ?? 0,
      cacheReadTokens: cached > 0 ? cached : undefined,
    },
    model: req.model,
  }
}

/**
 * Gemini's finishReason doesn't distinguish "stopped because the
 * model called tools and is waiting for results" from "stopped
 * naturally" — both are 'STOP'. We disambiguate by checking whether
 * the response contained any tool_use blocks: if yes, the loop must
 * dispatch them; if no, this is end_turn.
 */
function mapStopReason(
  raw: string | undefined,
  blocks: ReturnType<typeof fromGeminiCandidateParts>,
): NormalizedStopReason | null {
  switch (raw) {
    case 'STOP': {
      const hasToolCall = blocks.some((b) => b.type === 'tool_use')
      return hasToolCall ? 'tool_use' : 'end_turn'
    }
    case 'MAX_TOKENS':
      return 'max_tokens'
    case 'SAFETY':
    case 'RECITATION':
    case 'BLOCKLIST':
    case 'PROHIBITED_CONTENT':
    case 'SPII':
      return 'refusal'
    case 'OTHER':
      return 'end_turn' // pragmatic default
    default:
      return null
  }
}
