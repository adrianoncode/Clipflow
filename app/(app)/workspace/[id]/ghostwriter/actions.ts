'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generate } from '@/lib/ai/generate/generate'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { createClient } from '@/lib/supabase/server'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'

const lengthMap = {
  short: '30-60 seconds',
  medium: '60-120 seconds',
  long: '120-180 seconds',
} as const

const ghostwriteSchema = z.object({
  workspaceId: z.string().uuid(),
  topic: z.string().min(10, 'Topic must be at least 10 characters').max(500, 'Topic must be under 500 characters'),
  tone: z.enum(['casual', 'professional', 'educational', 'entertaining']),
  targetLength: z.enum(['short', 'medium', 'long']),
  platforms: z.string().optional().default('tiktok,instagram_reels,youtube_shorts,linkedin'),
})

export type GhostwriteState =
  | { ok?: undefined; error?: string }
  | {
      ok: true
      contentId: string
      title: string
      script: string
      keyPoints: string[]
      hook: string
    }
  | { ok: false; error: string }

export async function ghostwriteAction(
  _prevState: unknown,
  formData: FormData,
): Promise<GhostwriteState> {
  const parsed = ghostwriteSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    topic: formData.get('topic'),
    tone: formData.get('tone'),
    targetLength: formData.get('targetLength'),
    platforms: formData.get('platforms') ?? 'tiktok,instagram_reels,youtube_shorts,linkedin',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rl = await checkWorkspaceRateLimit(parsed.data.workspaceId, 'generation')
  if (!rl.ok) return { ok: false, error: rl.error }

  const pick = await pickGenerationProvider(parsed.data.workspaceId)
  if (!pick.ok) {
    return { ok: false, error: pick.message }
  }

  const systemPrompt =
    'You are an expert social media scriptwriter. Write an original, engaging script on the given topic. Return a JSON object with: { "title": string (catchy content title), "script": string (full spoken script, no stage directions), "key_points": string[] (3-5 bullet points), "hook": string (opening line to grab attention in 1-2 sentences) }'

  const userPrompt = `Topic: ${parsed.data.topic}\nTone: ${parsed.data.tone}\nTarget length: ${parsed.data.targetLength} (${lengthMap[parsed.data.targetLength]})\n\nWrite a complete, original script.`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) {
    return { ok: false, error: gen.message }
  }

  // The generate function returns PromptOutput shape. We need to extract our ghostwriter shape.
  // The model will put the ghostwriter JSON in the hook/script/caption fields or as raw JSON in caption.
  // We try to parse the raw JSON from the generation result.
  let parsed2: { title?: string; script?: string; key_points?: string[]; hook?: string } | null = null

  const raw = gen.json as unknown
  if (typeof raw === 'object' && raw !== null && 'title' in raw) {
    parsed2 = raw as { title?: string; script?: string; key_points?: string[]; hook?: string }
  } else if (typeof raw === 'string') {
    try {
      parsed2 = JSON.parse(raw)
    } catch {
      // fall through
    }
  } else if (typeof raw === 'object' && raw !== null) {
    // Try to find nested JSON in any string field
    const obj = raw as Record<string, unknown>
    for (const val of Object.values(obj)) {
      if (typeof val === 'string') {
        try {
          const inner = JSON.parse(val)
          if (typeof inner === 'object' && inner !== null && 'title' in inner) {
            parsed2 = inner as { title?: string; script?: string; key_points?: string[]; hook?: string }
            break
          }
        } catch {
          // continue
        }
      }
    }
  }

  // Fallback: build from PromptOutput fields if structured parse failed
  if (!parsed2?.title) {
    const po = gen.json
    parsed2 = {
      title: parsed.data.topic.slice(0, 80),
      script: po.script || po.caption || '',
      key_points: [],
      hook: po.hook || '',
    }
  }

  const title = parsed2.title ?? parsed.data.topic.slice(0, 80)
  const script = parsed2.script ?? ''
  const keyPoints = Array.isArray(parsed2.key_points) ? (parsed2.key_points as string[]) : []
  const hook = parsed2.hook ?? ''

  const supabase = createClient()
  const { data: newItem, error: insertError } = await supabase
    .from('content_items')
    .insert({
      workspace_id: parsed.data.workspaceId,
      kind: 'text',
      status: 'ready',
      title,
      transcript: script,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError || !newItem) {
    return { ok: false, error: insertError?.message ?? 'Failed to save content item.' }
  }

  return {
    ok: true,
    contentId: newItem.id,
    title,
    script,
    keyPoints,
    hook,
  }
}
