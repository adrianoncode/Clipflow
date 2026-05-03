import 'server-only'

import { findAndPersistHighlights } from '@/lib/highlights/find-and-persist-highlights'
import { requireEditor } from '@/lib/agent/context'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  requireEditor(ctx)

  const result = await findAndPersistHighlights({
    workspaceId: ctx.workspaceId,
    contentId: parsed.value.contentId,
    userId: ctx.userId,
  })

  if (!result.ok) {
    // no_key, no_transcript, not_found are NOT retryable on the same
    // input — the user has to fix something upstream. detection_failed
    // and insert_failed CAN be retried.
    const retryable =
      result.code === 'detection_failed' || result.code === 'insert_failed'
    return { kind: 'error', message: result.error, retryable }
  }

  return {
    kind: 'ok',
    value: {
      count: result.count,
      highlights: result.highlights.map((h) => ({
        id: h.id,
        start_seconds: h.start_seconds,
        end_seconds: h.end_seconds,
        hook_text: h.hook_text,
        virality_score: h.virality_score,
        // Surface which clips the system pre-selected for drafts so
        // the model can answer "which ones did you pick?" without a
        // second tool call.
        selected_for_drafts: h.selected_for_drafts,
      })),
    },
  }
}

const tool: ToolDef = {
  name: 'find_highlights',
  description:
    'Runs viral-moment detection on a content item that has a transcript. Persists the detected moments as `draft` content_highlights and seeds the top N (per workspace settings) as `selected_for_drafts`. Returns the persisted highlights with ids + scores. Requires an OpenAI key on the workspace.',
  schema: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description:
          'UUID of the content item. Must have a transcript (call start_transcription first if it does not).',
      },
    },
    required: ['contentId'],
    additionalProperties: false,
  },
  handler,
  requiredRole: 'editor',
  mutates: true,
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
