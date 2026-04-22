'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { generate } from '@/lib/ai/generate/generate'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export interface ContentIdea {
  title: string
  hook: string
  outline: string[]
  bestPlatforms: string[]
  estimatedLengthMinutes: number
}

const schema = z.object({
  workspace_id: z.string().uuid(),
  topic: z.string().trim().min(3, 'Give me at least a few words of topic.').max(500),
  /** Optional constraints — "for Coach audience", "under 60s", etc. */
  constraints: z.string().trim().max(300).optional().default(''),
})

export type IdeaGeneratorState =
  | { ok?: undefined }
  | { ok: true; ideas: ContentIdea[] }
  | { ok: false; error: string }

export async function generateIdeasAction(
  _prev: IdeaGeneratorState,
  formData: FormData,
): Promise<IdeaGeneratorState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const parsed = schema.safeParse({
    workspace_id: formData.get('workspace_id'),
    topic: formData.get('topic'),
    constraints: formData.get('constraints') ?? '',
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const check = await requireWorkspaceMember(parsed.data.workspace_id)
  if (!check.ok) return { ok: false, error: check.message }

  // Rate-limit paid LLM calls so a scripted client can't loop-drain
  // the workspace's BYOK quota.
  const rl = await checkRateLimit(
    `ai:ideas:${check.userId}`,
    RATE_LIMITS.generation.limit,
    RATE_LIMITS.generation.windowMs,
  )
  if (!rl.ok) {
    return {
      ok: false,
      error: 'You\u2019re generating ideas too fast. Wait a minute and try again.',
    }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      error:
        pick.code === 'no_key'
          ? 'Connect an AI provider first — Settings → AI Keys.'
          : pick.message,
    }
  }

  const voice = await getActiveBrandVoice(parsed.data.workspace_id)
  const voiceBlock = voice
    ? `Tone: ${voice.tone ?? 'n/a'}\nWords to avoid: ${voice.avoid ?? 'n/a'}\nExample hook: ${voice.example_hook ?? 'n/a'}`
    : 'No brand voice configured — default to a confident, audience-first creator tone.'

  const systemPrompt = `You are a content strategist helping a creator decide what to record next. Generate 8-10 distinct content ideas rooted in the topic and the creator's brand voice.

Respond with JSON of this exact shape:
{
  "ideas": [
    {
      "title": "<string — snappy working title, max 70 chars>",
      "hook": "<string — the first line the video/post would open with, max 140 chars>",
      "outline": ["<string>", "<string>", "<string>"] (3-5 bullet points outlining the clip/post, each under 90 chars),
      "bestPlatforms": ["tiktok" | "instagram_reels" | "youtube_shorts" | "linkedin" | "youtube"] (at least 1),
      "estimatedLengthMinutes": <number — realistic length, 1-30>
    }
  ]
}

Rules:
- Respect the brand voice below verbatim — tone, avoid-list, hook style.
- No two ideas should be trivial rewordings of each other.
- Favor concrete angles (lessons, contrarian takes, case stories, frameworks) over vague "tips" lists.
- Only use the allowed platform strings. Never invent new platforms.

Brand voice:
${voiceBlock}

Return only valid JSON, no markdown fences.`

  const userPrompt = `Topic: ${parsed.data.topic}${parsed.data.constraints ? `\nConstraints: ${parsed.data.constraints}` : ''}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  let ideas: ContentIdea[] = []
  try {
    const raw = gen.json as unknown
    let obj: Record<string, unknown>
    if (typeof raw === 'string') {
      obj = JSON.parse(raw)
    } else if (typeof raw === 'object' && raw !== null) {
      obj = raw as Record<string, unknown>
    } else {
      return { ok: false, error: 'Empty response from the model.' }
    }
    const arr = obj.ideas
    if (!Array.isArray(arr)) return { ok: false, error: 'Response missing ideas[] array.' }
    ideas = arr.map((x: unknown): ContentIdea => {
      const r = (x ?? {}) as Partial<ContentIdea>
      return {
        title: String(r.title ?? 'Untitled').slice(0, 120),
        hook: String(r.hook ?? '').slice(0, 200),
        outline: Array.isArray(r.outline) ? r.outline.slice(0, 6).map(String) : [],
        bestPlatforms: Array.isArray(r.bestPlatforms)
          ? r.bestPlatforms.filter((p): p is string => typeof p === 'string').slice(0, 5)
          : [],
        estimatedLengthMinutes:
          typeof r.estimatedLengthMinutes === 'number'
            ? Math.max(1, Math.min(60, r.estimatedLengthMinutes))
            : 5,
      }
    })
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not parse ideas.',
    }
  }

  return { ok: true, ideas }
}
