import 'server-only'

import { getContentItem } from '@/lib/content/get-content-item'
import { runOnePlatform } from '@/lib/outputs/run-one-platform'
import { resolveAgentProvider } from '@/lib/agent/llm/resolve-provider'
import { OUTPUT_PLATFORMS, type OutputPlatform } from '@/lib/platforms'
import { requireEditor } from '@/lib/agent/context'
import type { ToolDef, ToolHandler } from '@/lib/agent/tools/types'

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
      message: `Content item ${parsed.value.contentId} not found.`,
      retryable: false,
    }
  }
  if (!item.transcript || item.transcript.trim().length < 50) {
    return {
      kind: 'error',
      message:
        'Cannot generate drafts — content item has no usable transcript.',
      retryable: false,
    }
  }

  // Resolve LLM provider/key/model via the same logic the agent loop
  // uses for itself. Workspace explicit setting wins; otherwise we
  // pick the first stored key in [anthropic, openai, google] order.
  const llm = await resolveAgentProvider(ctx.workspaceId)
  if (!llm.ok) {
    return {
      kind: 'error',
      message: llm.message,
      retryable: false,
    }
  }

  // runOnePlatform writes one outputs row + one output_states(draft)
  // row per call. We run platforms sequentially — parallelizing here
  // would multiply the LLM cost spike and we don't want a model that
  // fans out 4 LLM calls inside a single tool. Sequential is also
  // friendlier to BYOK rate limits.
  const results: Array<{
    platform: OutputPlatform
    ok: boolean
    error?: string
  }> = []

  for (const platform of parsed.value.platforms) {
    const r = await runOnePlatform({
      platform,
      transcript: item.transcript,
      sourceKind: item.kind,
      sourceTitle: item.title ?? 'Untitled',
      provider: llm.provider,
      apiKey: llm.apiKey,
      model: llm.model,
      workspaceId: ctx.workspaceId,
      contentId: item.id,
      userId: ctx.userId,
      targetLanguage: parsed.value.targetLanguage,
    })
    results.push(
      r.ok
        ? { platform: r.platform, ok: true }
        : { platform: r.platform, ok: false, error: r.error },
    )
  }

  const successes = results.filter((r) => r.ok).length
  const failures = results.length - successes

  return {
    kind: 'ok',
    value: {
      content_id: item.id,
      provider: llm.provider,
      model: llm.model,
      requested: results.length,
      succeeded: successes,
      failed: failures,
      results,
      // Reminder for the model — the user has to approve before any
      // schedule_post call will succeed. Keeps the system prompt and
      // tool output aligned.
      next_step:
        successes > 0
          ? 'Drafts saved in `draft` state. They must be moved to `review` and then approved BY A HUMAN before scheduling.'
          : 'No drafts were saved. Read the per-platform errors and fix upstream.',
    },
  }
}

const tool: ToolDef = {
  name: 'generate_drafts',
  description:
    'Generates per-platform draft outputs for a content item that already has a transcript. Pass `platforms` (subset of tiktok, instagram_reels, youtube_shorts, linkedin) to choose targets. Each draft is written to `outputs` with state=draft. Drafts must be APPROVED BY A HUMAN before they can be scheduled — there is no agent path to approval.',
  schema: {
    type: 'object',
    properties: {
      contentId: {
        type: 'string',
        description: 'UUID of the content item with a transcript.',
      },
      platforms: {
        type: 'array',
        description:
          'Output platforms to generate for. Defaults to all four if omitted.',
        items: {
          type: 'string',
          enum: ['tiktok', 'instagram_reels', 'youtube_shorts', 'linkedin'],
        },
        minItems: 1,
        maxItems: 4,
      },
      targetLanguage: {
        type: 'string',
        description:
          'BCP-47 code (e.g. "en", "de", "es"). Defaults to "en". Use this when the user explicitly asks for non-English drafts.',
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

interface ParsedInput {
  contentId: string
  platforms: OutputPlatform[]
  targetLanguage: string
}

function parseInput(
  raw: unknown,
): { ok: true; value: ParsedInput } | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'input must be an object' }
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.contentId !== 'string' || obj.contentId.length < 10) {
    return { ok: false, error: 'contentId must be a UUID string' }
  }

  let platforms: OutputPlatform[] = [...OUTPUT_PLATFORMS]
  if (obj.platforms !== undefined) {
    if (!Array.isArray(obj.platforms)) {
      return { ok: false, error: 'platforms must be an array' }
    }
    const normalized: OutputPlatform[] = []
    for (const p of obj.platforms) {
      if (typeof p !== 'string') {
        return { ok: false, error: 'platforms entries must be strings' }
      }
      if (!(OUTPUT_PLATFORMS as readonly string[]).includes(p)) {
        return {
          ok: false,
          error: `Unknown platform "${p}". Allowed: ${OUTPUT_PLATFORMS.join(', ')}.`,
        }
      }
      normalized.push(p as OutputPlatform)
    }
    if (normalized.length === 0) {
      return { ok: false, error: 'platforms must have at least one entry' }
    }
    // De-dup while preserving order.
    platforms = Array.from(new Set(normalized))
  }

  let targetLanguage = 'en'
  if (obj.targetLanguage !== undefined) {
    if (
      typeof obj.targetLanguage !== 'string' ||
      obj.targetLanguage.length < 2 ||
      obj.targetLanguage.length > 10
    ) {
      return {
        ok: false,
        error: 'targetLanguage must be a BCP-47 code like "en" or "de".',
      }
    }
    targetLanguage = obj.targetLanguage
  }

  return { ok: true, value: { contentId: obj.contentId, platforms, targetLanguage } }
}
