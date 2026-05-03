import 'server-only'

import { getContentItems } from '@/lib/content/get-content-items'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  // Reads only — no role re-check needed beyond the membership the
  // ctx already carries. RLS at the DB layer is the final gate.
  const items = await getContentItems(ctx.workspaceId, {
    limit: parsed.value.limit,
  })

  return {
    kind: 'ok',
    value: {
      count: items.length,
      items: items.map((i) => ({
        id: i.id,
        kind: i.kind,
        status: i.status,
        title: i.title,
        source_url: i.source_url,
        created_at: i.created_at,
        // Surface processing phase so the model can answer "is anything
        // still transcribing?" without a second tool call.
        processing_phase: i.processing_phase,
      })),
    },
  }
}

const tool: ToolDef = {
  name: 'list_content',
  description:
    'Lists recent content items in the current workspace. Returns id, kind, status, title, source URL, created_at, and processing_phase for each. Use this to find content to operate on or to answer "what do I have?". Read-only.',
  schema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: 'Max number of items to return (1-50). Defaults to 20.',
        minimum: 1,
        maximum: 50,
      },
    },
    required: [],
    additionalProperties: false,
  },
  handler,
  requiredRole: 'reviewer',
  mutates: false,
}

export default tool

// ─── input parsing ───────────────────────────────────────────────────

function parseInput(
  raw: unknown,
):
  | { ok: true; value: { limit: number } }
  | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { ok: true, value: { limit: 20 } }
  }
  const obj = raw as Record<string, unknown>
  let limit = 20
  if (obj.limit !== undefined) {
    if (typeof obj.limit !== 'number' || !Number.isInteger(obj.limit)) {
      return { ok: false, error: 'limit must be an integer' }
    }
    if (obj.limit < 1 || obj.limit > 50) {
      return { ok: false, error: 'limit must be between 1 and 50' }
    }
    limit = obj.limit
  }
  return { ok: true, value: { limit } }
}
