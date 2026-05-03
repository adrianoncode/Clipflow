import 'server-only'

import { getContentItem } from '@/lib/content/get-content-item'
import { hasOutputs } from '@/lib/content/has-outputs'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  const item = await getContentItem(parsed.value.contentId, ctx.workspaceId)
  if (!item) {
    return {
      kind: 'error',
      message: `Content item ${parsed.value.contentId} not found in this workspace.`,
      retryable: false,
    }
  }

  // Quick downstream-state probe so the model can answer "what step
  // is this on?" without three more tool calls. We deliberately
  // surface NORMALIZED phase labels rather than raw DB states — the
  // model reasons better with workflow-level concepts than with
  // database enums.
  const hasAnyOutputs = await hasOutputs(item.id, ctx.workspaceId)

  return {
    kind: 'ok',
    value: {
      id: item.id,
      kind: item.kind,
      title: item.title,
      source_url: item.source_url,
      created_at: item.created_at,
      pipeline_stage: derivePipelineStage(item, hasAnyOutputs),
      raw_status: item.status,
      processing_phase: item.processing_phase,
      processing_progress: item.processing_progress,
      has_transcript: !!item.transcript && item.transcript.length > 0,
      has_outputs: hasAnyOutputs,
    },
  }
}

const tool: ToolDef = {
  name: 'get_content_status',
  description:
    'Returns the pipeline stage and processing details for a single content item by id. Use this BEFORE deciding what to do next on a piece of content (e.g. is it still transcribing? does it have drafts yet?). Read-only.',
  schema: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description: 'UUID of the content item.',
      },
    },
    required: ['contentId'],
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
  | { ok: true; value: { contentId: string } }
  | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'input must be an object' }
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.contentId !== 'string' || obj.contentId.length < 10) {
    return { ok: false, error: 'contentId must be a UUID string' }
  }
  return { ok: true, value: { contentId: obj.contentId } }
}

// ─── helpers ─────────────────────────────────────────────────────────

type PipelineStage =
  | 'imported'
  | 'transcribing'
  | 'transcribed'
  | 'drafted'
  | 'failed'

function derivePipelineStage(
  item: { status: string; transcript: string | null },
  hasAnyOutputs: boolean,
): PipelineStage {
  if (item.status === 'failed') return 'failed'
  if (item.status === 'uploading' || item.status === 'processing') {
    return 'transcribing'
  }
  if (item.status === 'ready') {
    if (hasAnyOutputs) return 'drafted'
    if (item.transcript && item.transcript.length > 0) return 'transcribed'
    return 'imported'
  }
  return 'imported'
}
