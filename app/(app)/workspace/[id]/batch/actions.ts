'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { deleteOutputsForContent } from '@/lib/outputs/delete-outputs-for-content'
import { runOnePlatform } from '@/lib/outputs/run-one-platform'
import type { OutputPlatform } from '@/lib/supabase/types'

const PLATFORMS: readonly OutputPlatform[] = [
  'tiktok',
  'instagram_reels',
  'youtube_shorts',
  'linkedin',
]

const batchSchema = z.object({
  workspaceId: z.string().uuid(),
  contentIds: z.array(z.string().uuid()).min(1, 'Select at least one item').max(10, 'Maximum 10 items at once'),
})

export interface BatchResultItem {
  contentId: string
  title: string
  generated: number
  failed: number
}

export type BatchGenerateState =
  | { ok?: undefined; error?: string }
  | { ok: true; results: BatchResultItem[] }
  | { ok: false; error: string }

export async function batchGenerateAction(
  _prevState: unknown,
  formData: FormData,
): Promise<BatchGenerateState> {
  const rawIds = formData.get('contentIds')?.toString() ?? '[]'
  let contentIds: string[]
  try {
    contentIds = JSON.parse(rawIds) as string[]
  } catch {
    return { ok: false, error: 'Invalid content IDs.' }
  }

  const parsed = batchSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    contentIds,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const pick = await pickGenerationProvider(parsed.data.workspaceId)
  if (!pick.ok) {
    return { ok: false, error: pick.message }
  }

  const supabase = createClient()
  const results: BatchResultItem[] = []

  for (const contentId of parsed.data.contentIds) {
    const { data: item } = await supabase
      .from('content_items')
      .select('id, title, kind, transcript, status')
      .eq('id', contentId)
      .eq('workspace_id', parsed.data.workspaceId)
      .single()

    if (!item || item.status !== 'ready' || !item.transcript) {
      results.push({ contentId, title: item?.title ?? 'Untitled', generated: 0, failed: PLATFORMS.length })
      continue
    }

    // Clear existing outputs
    await deleteOutputsForContent(contentId, parsed.data.workspaceId)

    const provider = pick.provider
    const apiKey = pick.apiKey
    const model = DEFAULT_MODELS[provider]

    let generated = 0
    let failed = 0

    // Run platforms sequentially to avoid rate limits
    for (const platform of PLATFORMS) {
      const result = await runOnePlatform({
        platform,
        transcript: item.transcript,
        sourceKind: item.kind as Parameters<typeof runOnePlatform>[0]['sourceKind'],
        sourceTitle: item.title ?? 'Untitled',
        provider,
        apiKey,
        model,
        workspaceId: parsed.data.workspaceId,
        contentId,
        userId: user.id,
      })
      if (result.ok) {
        generated++
      } else {
        failed++
      }
    }

    results.push({ contentId, title: item.title ?? 'Untitled', generated, failed })
  }

  return { ok: true, results }
}
