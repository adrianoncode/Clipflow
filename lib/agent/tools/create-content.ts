import 'server-only'

import { createContentItem } from '@/lib/content/create-content-item'
import { fetchYoutubeTranscript } from '@/lib/content/fetch-youtube-transcript'
import { requireEditor } from '@/lib/agent/context'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

const handler: ToolHandler = async (ctx, input) => {
  const parsed = parseInput(input)
  if (!parsed.ok) {
    return { kind: 'error', message: parsed.error, retryable: false }
  }

  // Defense in depth — context-builder already verified membership, but
  // create_content writes data, so re-check role at the boundary.
  requireEditor(ctx)

  if (parsed.value.mode === 'text') {
    const result = await createContentItem({
      workspaceId: ctx.workspaceId,
      kind: 'text',
      title: parsed.value.title ?? null,
      // Text imports already have their full content — skip the
      // processing pipeline and land in 'ready' so highlights/drafts
      // can run immediately.
      status: 'ready',
      transcript: parsed.value.body,
      sourceUrl: null,
      createdBy: ctx.userId,
    })
    if (!result.ok) {
      return { kind: 'error', message: result.error, retryable: true }
    }
    return {
      kind: 'ok',
      value: {
        content_id: result.id,
        kind: 'text' as const,
        status: 'ready' as const,
        transcript_chars: parsed.value.body.length,
      },
    }
  }

  // mode === 'youtube' — fetch the transcript inline. We treat YouTube
  // as kind='video' (the source IS a video) but mark status='ready' as
  // soon as we have the captions, since no Whisper pass is needed.
  const fetched = await fetchYoutubeTranscript(parsed.value.url)
  if (!fetched.ok) {
    return {
      kind: 'error',
      message: `Could not fetch YouTube transcript: ${fetched.error}`,
      retryable: false,
    }
  }

  const result = await createContentItem({
    workspaceId: ctx.workspaceId,
    kind: 'video',
    title: parsed.value.title ?? fetched.title,
    status: 'ready',
    transcript: fetched.transcript,
    sourceUrl: parsed.value.url,
    createdBy: ctx.userId,
  })
  if (!result.ok) {
    return { kind: 'error', message: result.error, retryable: true }
  }

  return {
    kind: 'ok',
    value: {
      content_id: result.id,
      kind: 'video' as const,
      status: 'ready' as const,
      title: fetched.title,
      transcript_chars: fetched.transcript.length,
      source_url: parsed.value.url,
    },
  }
}

const tool: ToolDef = {
  name: 'create_content',
  description:
    'Imports a new content item into the workspace. Two modes: pass `body` (and optional `title`) to import raw text/transcript, OR pass `youtube_url` to fetch a YouTube video transcript and import it as a video item. Returns the new content_id. Use this BEFORE find_highlights or generate_drafts.',
  schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Optional human-readable title (max 200 chars).',
      },
      body: {
        type: 'string',
        description:
          'Raw text/transcript body. Mutually exclusive with youtube_url.',
      },
      youtube_url: {
        type: 'string',
        description:
          'Public YouTube watch URL. Transcript is fetched server-side. Mutually exclusive with body.',
      },
    },
    required: [],
    additionalProperties: false,
  },
  handler,
  requiredRole: 'editor',
  mutates: true,
}

export default tool

// ─── input parsing ───────────────────────────────────────────────────

type ParsedInput =
  | { mode: 'text'; body: string; title: string | null }
  | { mode: 'youtube'; url: string; title: string | null }

function parseInput(
  raw: unknown,
): { ok: true; value: ParsedInput } | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'input must be an object' }
  }
  const obj = raw as Record<string, unknown>
  const title =
    typeof obj.title === 'string' && obj.title.trim().length > 0
      ? obj.title.trim().slice(0, 200)
      : null

  const hasBody = typeof obj.body === 'string' && obj.body.trim().length > 0
  const hasUrl =
    typeof obj.youtube_url === 'string' && obj.youtube_url.trim().length > 0

  if (hasBody && hasUrl) {
    return {
      ok: false,
      error: 'Pass either `body` or `youtube_url`, not both.',
    }
  }
  if (!hasBody && !hasUrl) {
    return {
      ok: false,
      error: 'Pass `body` (text content) or `youtube_url`.',
    }
  }

  if (hasBody) {
    const body = (obj.body as string).trim()
    if (body.length > 200_000) {
      return { ok: false, error: 'body must be at most 200,000 characters.' }
    }
    return { ok: true, value: { mode: 'text', body, title } }
  }

  const url = (obj.youtube_url as string).trim()
  return { ok: true, value: { mode: 'youtube', url, title } }
}
