import 'server-only'

import { getContentItem } from '@/lib/content/get-content-item'
import { requireEditor } from '@/lib/agent/context'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

/**
 * Why this tool only PARKS — it doesn't actually kick off a Whisper
 * call:
 *
 * Real transcription happens server-side inside the upload action,
 * which has the audio blob + the BYOK OpenAI key + the storage path.
 * The agent never has the blob (and shouldn't — re-uploading is
 * wasteful and breaks the streaming-write pattern). So the tool's
 * job is to ensure the run doesn't proceed past transcription
 * blindly: it inspects the current content_item state and either
 *
 *   - returns ok immediately (already has a transcript), or
 *   - parks the run on `content_item_status` waiting for `ready`, or
 *   - returns error (failed / not-a-video).
 *
 * The webhook from Whisper-completion (or the upload-finish hook)
 * fires `wakeRunsWaitingOn({kind:'content_item_status', id})` to
 * resume the run.
 */
const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  requireEditor(ctx)

  const item = await getContentItem(parsed.value.contentId, ctx.workspaceId)
  if (!item) {
    return {
      kind: 'error',
      message: `Content item ${parsed.value.contentId} not found in this workspace.`,
      retryable: false,
    }
  }

  if (item.transcript && item.transcript.trim().length > 200) {
    return {
      kind: 'ok',
      value: {
        content_id: item.id,
        status: item.status,
        already_transcribed: true,
        transcript_chars: item.transcript.length,
      },
    }
  }

  if (item.status === 'failed') {
    return {
      kind: 'error',
      message:
        'Transcription previously failed for this item. Re-run the import from the UI to retry.',
      retryable: false,
    }
  }

  if (item.status === 'ready' && (!item.transcript || item.transcript.trim().length < 200)) {
    // Status says ready but transcript is empty — likely an unsupported
    // source (image-only, no audio). Don't park forever, fail visibly.
    return {
      kind: 'error',
      message:
        'Item is marked ready but has no usable transcript. Re-import with a different source.',
      retryable: false,
    }
  }

  // status === 'uploading' | 'processing' — park the run and return.
  // The upload/transcription pipeline already has the blob + key and
  // will flip status to 'ready' (or 'failed') when done. Webhook
  // resume re-enters the loop.
  return {
    kind: 'parked',
    waitingOn: {
      kind: 'content_item_status',
      id: item.id,
      expected: 'ready',
    },
  }
}

const tool: ToolDef = {
  name: 'start_transcription',
  description:
    'Ensures a content item has a transcript before continuing. If the item already has one, returns immediately. If it is currently processing, the run is parked and will resume automatically when transcription finishes. Does NOT re-trigger transcription — that runs as part of the import pipeline.',
  schema: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description: 'UUID of the content item to wait on.',
      },
    },
    required: ['contentId'],
    additionalProperties: false,
  },
  handler,
  requiredRole: 'editor',
  mutates: true,
  canPark: true,
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
