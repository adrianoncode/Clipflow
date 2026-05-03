import 'server-only'

import type { ToolDef } from '@/lib/agent/tools/types'

/**
 * Convert our internal ToolDef[] into each provider's tool-schema
 * shape. The semantic content (name, description, parameters) is
 * identical — only the wrapping differs.
 *
 *   Anthropic:  { name, description, input_schema }
 *   OpenAI:     { type: 'function', function: { name, description, parameters } }
 *   Gemini:     wrapped in `tools: [{ functionDeclarations: [...] }]`
 */

// ─── Anthropic ───────────────────────────────────────────────────────

export interface AnthropicTool {
  name: string
  description: string
  input_schema: ToolDef['schema']
  /** Optional cache marker — adapters set this on the LAST tool only
   *  to make the entire tools array a cacheable prefix block. */
  cache_control?: { type: 'ephemeral' }
}

export function toAnthropicTools(tools: ToolDef[]): AnthropicTool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.schema,
  }))
}

// ─── OpenAI ──────────────────────────────────────────────────────────

export interface OpenAiTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: ToolDef['schema']
    /** When true, OpenAI guarantees the model emits arguments matching
     *  the JSON Schema exactly. Worth it for our use case — we'd
     *  rather pay slightly more latency than parse malformed JSON. */
    strict?: boolean
  }
}

export function toOpenAiTools(tools: ToolDef[]): OpenAiTool[] {
  return tools.map((t) => {
    // OpenAI strict mode requires `additionalProperties: false` AND
    // every property listed in `required`. Tools with optional
    // parameters (like list_content's `limit`) can't satisfy that, so
    // we downgrade to non-strict for those — the tool's own
    // parseInput() catches malformed input cleanly anyway. Only flip
    // strict on when the tool's contract is fully required.
    const propKeys = Object.keys(t.schema.properties ?? {})
    const requiredKeys = t.schema.required ?? []
    const allRequired =
      propKeys.length > 0 && requiredKeys.length === propKeys.length

    return {
      type: 'function',
      function: {
        name: t.name,
        description: t.description,
        parameters: stripUnsupportedKeysForOpenAi(t.schema),
        strict: allRequired,
      },
    }
  })
}

/**
 * OpenAI strict mode rejects a few JSON Schema features we don't use,
 * but we strip them defensively in case a tool author adds something
 * unsupported. Currently a no-op — placeholder for future tools.
 */
function stripUnsupportedKeysForOpenAi(schema: ToolDef['schema']): ToolDef['schema'] {
  return schema
}

// ─── Gemini ──────────────────────────────────────────────────────────

/**
 * Gemini wraps tools differently — there's an outer container with
 * a `functionDeclarations` array. The shape per declaration is similar
 * to OpenAI's `function` payload but with `parameters` (not nested
 * under `function`).
 */
export interface GeminiToolDeclaration {
  name: string
  description: string
  parameters: ToolDef['schema']
}

export interface GeminiToolWrapper {
  functionDeclarations: GeminiToolDeclaration[]
}

export function toGeminiTools(tools: ToolDef[]): GeminiToolWrapper[] {
  if (tools.length === 0) return []
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: stripUnsupportedKeysForGemini(t.schema),
      })),
    },
  ]
}

/**
 * Gemini's function-calling schema doesn't support some draft-2020 JSON
 * Schema features. Specifically, `additionalProperties` is ignored and
 * a few annotations get dropped. Our tool schemas keep things simple
 * enough that this is currently a no-op, but the function exists so
 * later tools that try to use unsupported features fail in one place
 * rather than at the wire.
 */
function stripUnsupportedKeysForGemini(
  schema: ToolDef['schema'],
): ToolDef['schema'] {
  // Clone to avoid mutating the registered schema.
  const clone: ToolDef['schema'] = {
    type: schema.type,
    properties: schema.properties,
  }
  if (schema.required) clone.required = schema.required
  // Note: deliberately NOT copying additionalProperties — Gemini
  // ignores it and warning-on-unknown-key is set at the model side.
  return clone
}
