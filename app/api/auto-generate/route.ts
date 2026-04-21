import { NextResponse } from 'next/server'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { checkLimit } from '@/lib/billing/check-limit'
import { getContentItem } from '@/lib/content/get-content-item'
import { deleteOutputsForContent } from '@/lib/outputs/delete-outputs-for-content'
import { runOnePlatform } from '@/lib/outputs/run-one-platform'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { triggerWebhooks } from '@/lib/webhooks/trigger-webhook'
import { notifyOutputsGenerated } from '@/lib/notifications/triggers'
import type { OutputPlatform } from '@/lib/supabase/types'

export const maxDuration = 300

const schema = z.object({
  workspaceId: z.string().uuid(),
  contentId: z.string().uuid(),
  targetLanguage: z.string().min(2).max(5).optional().default('en'),
})

const PLATFORMS: readonly OutputPlatform[] = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'linkedin',
]

/**
 * Auto-generate API route.
 *
 * Called by AutoGenerateTrigger component when content becomes "ready"
 * and has no outputs yet. Uses the same generation logic as the manual
 * generateOutputsAction, but exposed as an API route for client-side
 * fetch calls (server actions can't be called from useEffect).
 */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rl = await checkRateLimit(
    `gen:${user.id}`,
    RATE_LIMITS.generation.limit,
    RATE_LIMITS.generation.windowMs,
  )
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 },
    )
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { workspaceId, contentId, targetLanguage } = parsed.data

  // Explicit workspace-member gate — defense in depth. RLS already
  // blocks cross-tenant reads on content_items, but relying on that
  // alone means a single policy regression would let any logged-in
  // user burn another workspace's BYOK quota by posting this endpoint
  // with someone else's workspaceId.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status })
  }

  // Check output limit
  const outputLimit = await checkLimit(workspaceId, 'outputs')
  if (!outputLimit.ok) {
    return NextResponse.json(
      { error: outputLimit.message ?? 'Monthly output limit reached.' },
      { status: 400 },
    )
  }

  // Get content item
  const item = await getContentItem(contentId, workspaceId)
  if (!item) {
    return NextResponse.json({ error: 'Content not found.' }, { status: 404 })
  }
  if (item.status !== 'ready' || !item.transcript || item.transcript.length === 0) {
    return NextResponse.json(
      { error: 'Content has no transcript yet.' },
      { status: 400 },
    )
  }

  // Pick AI provider
  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) {
    return NextResponse.json({ error: pick.message }, { status: 400 })
  }

  const provider = pick.provider
  const apiKey = pick.apiKey
  const model = DEFAULT_MODELS[provider]
  const title = item.title ?? 'Untitled'

  // Wipe any existing outputs (idempotent)
  const cleared = await deleteOutputsForContent(contentId, workspaceId)
  if (!cleared.ok) {
    return NextResponse.json({ error: cleared.error }, { status: 500 })
  }

  // Generate for all 4 platforms in parallel
  const settled = await Promise.allSettled(
    PLATFORMS.map((platform) =>
      runOnePlatform({
        platform,
        transcript: item.transcript!,
        sourceKind: item.kind,
        sourceTitle: title,
        provider,
        apiKey,
        model,
        workspaceId,
        contentId,
        userId: user.id,
        targetLanguage,
      }),
    ),
  )

  const generated: OutputPlatform[] = []
  const failed: Array<{ platform: OutputPlatform; error: string }> = []

  settled.forEach((result, idx) => {
    const platform = PLATFORMS[idx]!
    if (result.status === 'fulfilled') {
      if (result.value.ok) {
        generated.push(platform)
      } else {
        failed.push({ platform, error: result.value.error })
      }
    } else {
      failed.push({
        platform,
        error: result.reason instanceof Error ? result.reason.message : 'Unknown error.',
      })
    }
  })

  // Notifications & webhooks (fire-and-forget)
  if (generated.length > 0) {
    triggerWebhooks(workspaceId, 'output.generated', {
      content_id: contentId,
      title,
      platforms: generated,
      failed: failed.map((f) => f.platform),
    })

    try {
      notifyOutputsGenerated({
        userId: user.id,
        workspaceId,
        contentTitle: title,
        contentId,
        platformCount: generated.length,
      })
    } catch {}
  }

  return NextResponse.json({
    ok: generated.length > 0,
    generated,
    failed,
  })
}
