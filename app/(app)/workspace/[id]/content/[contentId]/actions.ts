'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { buildFollowUpTopicsPrompt } from '@/lib/ai/prompts/follow-up-topics'
import { getUser } from '@/lib/auth/get-user'
import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { generate } from '@/lib/ai/generate/generate'
import { getContentItem } from '@/lib/content/get-content-item'
import { deleteContentItem } from '@/lib/content/delete-content-item'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Shared AI rate-limit helper. Every action in this file that makes a
 * paid LLM call (suggestFollowUpTopics, autoTag, analyzeSentiment,
 * generateShowNotes, generateNewsletter, findBestClips) funnels through
 * this so a malicious member can't loop them in a tight client script
 * and rack up the workspace's AI bill. `bucket` scopes the limit so
 * different action families don't starve each other.
 */
async function checkAiRateLimit(
  userId: string,
  bucket: string,
): Promise<string | null> {
  const rl = await checkRateLimit(
    `ai:${bucket}:${userId}`,
    RATE_LIMITS.generation.limit,
    RATE_LIMITS.generation.windowMs,
  )
  if (!rl.ok) {
    return 'You\u2019re generating too fast. Wait a minute and try again.'
  }
  return null
}

// ── Follow-up topics ──────────────────────────────────────────────────────────

const followUpSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export interface FollowUpTopic {
  title: string
  angle: string
  why: string
}

export type SuggestFollowUpState =
  | { ok?: undefined; error?: string }
  | { ok: true; topics: FollowUpTopic[] }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function suggestFollowUpTopicsAction(
  _prev: SuggestFollowUpState,
  formData: FormData,
): Promise<SuggestFollowUpState> {
  const parsed = followUpSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rlError = await checkAiRateLimit(user.id, 'followup')
  if (rlError) return { ok: false, code: 'unknown', error: rlError }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || item.status !== 'ready' || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content is not ready.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const prompt = buildFollowUpTopicsPrompt({ transcript: item.transcript })

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) {
    return { ok: false, code: 'unknown', error: gen.message }
  }

  const raw = gen.json as unknown as { topics?: unknown[] }
  const topics = Array.isArray(raw?.topics) ? raw.topics : []

  const validated: FollowUpTopic[] = topics
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      angle: typeof item.angle === 'string' ? item.angle : '',
      why: typeof item.why === 'string' ? item.why : '',
    }))
    .filter((t) => t.title.length > 0)

  if (validated.length === 0) {
    return { ok: false, code: 'unknown', error: 'No topics were generated. Try again.' }
  }

  return { ok: true, topics: validated }
}

// ── Edit transcript ───────────────────────────────────────────────────────────

const editTranscriptSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  transcript: z.string().trim().min(1, 'Transcript cannot be empty.').max(100_000),
})

export type EditTranscriptState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function editTranscriptAction(
  _prev: EditTranscriptState,
  formData: FormData,
): Promise<EditTranscriptState> {
  const parsed = editTranscriptSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    transcript: formData.get('transcript'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  // Explicit workspace membership check — don't rely on RLS as the sole
  // authz mechanism on destructive writes. Cheap extra query, massive
  // safety net if an RLS policy ever regresses.
  const check = await requireWorkspaceMember(parsed.data.workspace_id)
  if (!check.ok) return { ok: false, error: check.message }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ transcript: parsed.data.transcript })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true }
}

// ── Rename content item ───────────────────────────────────────────────────────

const renameSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  title: z.string().trim().min(1, 'Title cannot be empty.').max(200),
})

export type RenameContentState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function renameContentAction(
  _prev: RenameContentState,
  formData: FormData,
): Promise<RenameContentState> {
  const parsed = renameSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    title: formData.get('title'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const check = await requireWorkspaceMember(parsed.data.workspace_id)
  if (!check.ok) return { ok: false, error: check.message }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { error } = await supabase
    .from('content_items')
    .update({ title: parsed.data.title })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  revalidatePath(`/workspace/${parsed.data.workspace_id}`)
  return { ok: true }
}

// ── Auto-tag content item ─────────────────────────────────────────────────────

const autoTagSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export type AutoTagState =
  | { ok?: undefined }
  | { ok: true; tags: string[] }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function autoTagContentAction(
  _prev: AutoTagState,
  formData: FormData,
): Promise<AutoTagState> {
  const parsed = autoTagSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rlError = await checkAiRateLimit(user.id, 'autotag')
  if (rlError) return { ok: false, code: 'unknown', error: rlError }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content has no transcript to tag.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const transcriptSnippet = item.transcript.slice(0, 3000)
  const systemPrompt =
    'You are a content tagging assistant. Return ONLY a valid JSON array of strings. No explanation, no markdown, just the JSON array.'
  const userPrompt = `Extract 3-7 topic tags from this transcript. Return a JSON array of short lowercase tags (1-3 words each). Example: ["productivity", "morning routine", "mindset"]. Transcript: ${transcriptSnippet}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) {
    return { ok: false, code: 'unknown', error: gen.message }
  }

  // The generate function returns structured JSON via PromptOutput, but here
  // we need a raw array. Parse from the hook field as a fallback.
  let tags: string[] = []
  try {
    // Try to extract JSON array from the response
    const raw = gen.json as unknown
    if (Array.isArray(raw)) {
      tags = (raw as unknown[]).filter((t): t is string => typeof t === 'string')
    } else if (typeof raw === 'object' && raw !== null) {
      // The model may have nested it — try common keys
      const obj = raw as Record<string, unknown>
      const candidate =
        obj['tags'] ?? obj['result'] ?? obj['hook'] ?? Object.values(obj)[0]
      if (Array.isArray(candidate)) {
        tags = (candidate as unknown[]).filter((t): t is string => typeof t === 'string')
      } else if (typeof candidate === 'string') {
        // Try to parse JSON embedded in a string field
        const match = candidate.match(/\[[\s\S]*\]/)
        if (match) {
          const parsed2 = JSON.parse(match[0])
          if (Array.isArray(parsed2)) {
            tags = (parsed2 as unknown[]).filter((t): t is string => typeof t === 'string')
          }
        }
      }
    }
  } catch {
    // ignore parse errors
  }

  if (tags.length === 0) {
    return { ok: false, code: 'unknown', error: 'No tags could be extracted. Try again.' }
  }

  // Normalize tags
  tags = tags.map((t) => t.toLowerCase().trim()).filter(Boolean).slice(0, 7)

  // Update metadata.tags in DB
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const { error } = await supabase
    .from('content_items')
    .update({ metadata: { ...existingMetadata, tags } })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) {
    return { ok: false, code: 'unknown', error: error.message }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true, tags }
}

// ── Sentiment analysis ────────────────────────────────────────────────────────

const sentimentSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export interface SentimentResult {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed'
  energy: 'high' | 'medium' | 'low'
  emotions: string[]
  score: number
  summary: string
}

export type AnalyzeSentimentState =
  | { ok?: undefined }
  | { ok: true; sentiment: SentimentResult }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function analyzeSentimentAction(
  _prev: AnalyzeSentimentState,
  formData: FormData,
): Promise<AnalyzeSentimentState> {
  const parsed = sentimentSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rlError = await checkAiRateLimit(user.id, 'sentiment')
  if (rlError) return { ok: false, code: 'unknown', error: rlError }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content has no transcript to analyze.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return {
      ok: false,
      code: pick.code === 'no_key' ? 'no_key' : 'unknown',
      error: pick.message,
    }
  }

  const systemPrompt =
    'You are a sentiment and emotion analyzer. Analyze the provided transcript and return a JSON object with exactly these fields: { "overall": "positive" | "negative" | "neutral" | "mixed", "energy": "high" | "medium" | "low", "emotions": [up to 3 strings from: "inspiring", "educational", "entertaining", "motivational", "humorous", "serious", "empathetic", "urgent", "calm"], "score": number between -1.0 and 1.0, "summary": string of max 80 chars describing the emotional tone }. Return only valid JSON.'
  const userPrompt = item.transcript.slice(0, 4000)

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) {
    return { ok: false, code: 'unknown', error: gen.message }
  }

  let parsedResult: SentimentResult | null = null
  try {
    const raw = gen.json as unknown
    if (
      typeof raw === 'object' &&
      raw !== null &&
      'overall' in raw &&
      'energy' in raw &&
      'emotions' in raw &&
      'score' in raw &&
      'summary' in raw
    ) {
      parsedResult = raw as SentimentResult
    } else if (typeof raw === 'string') {
      parsedResult = JSON.parse(raw) as SentimentResult
    } else {
      // Try nested — model may wrap it
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'string') {
        parsedResult = JSON.parse(candidate) as SentimentResult
      } else if (typeof candidate === 'object' && candidate !== null) {
        parsedResult = candidate as SentimentResult
      }
    }
  } catch {
    return { ok: false, code: 'unknown', error: 'Could not parse sentiment response.' }
  }

  if (
    !parsedResult ||
    !parsedResult.overall ||
    !parsedResult.energy ||
    !Array.isArray(parsedResult.emotions) ||
    typeof parsedResult.score !== 'number' ||
    !parsedResult.summary
  ) {
    return { ok: false, code: 'unknown', error: 'Sentiment response is missing expected fields.' }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const { error } = await supabase
    .from('content_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, sentiment: parsedResult } as any })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) {
    return { ok: false, code: 'unknown', error: error.message }
  }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true, sentiment: parsedResult }
}

// ── Show Notes ────────────────────────────────────────────────────────────────

const showNotesSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export interface ShowNotesResult {
  summary: string
  keyPoints: string[]
  topics: Array<{ time: string; topic: string }>
  resourcesMentioned: string[]
  quotableQuotes: string[]
  callToAction: string
}

export type GenerateShowNotesState =
  | { ok?: undefined }
  | { ok: true; showNotes: ShowNotesResult }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function generateShowNotesAction(
  _prev: GenerateShowNotesState,
  formData: FormData,
): Promise<GenerateShowNotesState> {
  const parsed = showNotesSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rlError = await checkAiRateLimit(user.id, 'shownotes')
  if (rlError) return { ok: false, code: 'unknown', error: rlError }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content has no transcript.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return { ok: false, code: pick.code === 'no_key' ? 'no_key' : 'unknown', error: pick.message }
  }

  const systemPrompt =
    'You are a professional podcast producer. Generate comprehensive show notes from the provided transcript. Return a JSON object with: { "summary": string (2-3 sentence episode summary), "keyPoints": string[] (5-7 main takeaways), "topics": Array<{time: string, topic: string}> (estimated timestamps like \'0:00\', \'2:30\' for major topic shifts — estimate based on content flow), "resourcesMentioned": string[] (any books, tools, people, websites mentioned), "quotableQuotes": string[] (2-3 most impactful quotes from transcript), "callToAction": string (suggested CTA for the episode) }'
  const userPrompt = item.transcript.slice(0, 6000)

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, code: 'unknown', error: gen.message }

  let parsedResult: ShowNotesResult | null = null
  try {
    const raw = gen.json as unknown
    if (typeof raw === 'object' && raw !== null && 'summary' in raw) {
      parsedResult = raw as ShowNotesResult
    } else if (typeof raw === 'string') {
      parsedResult = JSON.parse(raw) as ShowNotesResult
    } else {
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'object' && candidate !== null) {
        parsedResult = candidate as ShowNotesResult
      } else if (typeof candidate === 'string') {
        parsedResult = JSON.parse(candidate) as ShowNotesResult
      }
    }
  } catch {
    return { ok: false, code: 'unknown', error: 'Could not parse show notes response.' }
  }

  if (!parsedResult?.summary) {
    return { ok: false, code: 'unknown', error: 'Show notes response is missing expected fields.' }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const { error } = await supabase
    .from('content_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, show_notes: parsedResult } as any })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, code: 'unknown', error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true, showNotes: parsedResult }
}

// ── Newsletter ─────────────────────────────────────────────────────────────────

const newsletterSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  tone: z.enum(['conversational', 'professional', 'storytelling']).default('conversational'),
})

export interface NewsletterResult {
  subject: string
  preheader: string
  greeting: string
  body: string
  cta: string
  ctaNote: string
}

export type GenerateNewsletterState =
  | { ok?: undefined }
  | { ok: true; newsletter: NewsletterResult }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function generateNewsletterAction(
  _prev: GenerateNewsletterState,
  formData: FormData,
): Promise<GenerateNewsletterState> {
  const parsed = newsletterSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    tone: formData.get('tone') ?? 'conversational',
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rlError = await checkAiRateLimit(user.id, 'newsletter')
  if (rlError) return { ok: false, code: 'unknown', error: rlError }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content has no transcript.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return { ok: false, code: pick.code === 'no_key' ? 'no_key' : 'unknown', error: pick.message }
  }

  const systemPrompt =
    'You are an expert newsletter writer. Convert the provided transcript into a newsletter email. Return JSON: { "subject": string (compelling email subject line), "preheader": string (preview text, max 90 chars), "greeting": string (opening line), "body": string (main newsletter body in markdown, 200-400 words, engaging and well-structured), "cta": string (call to action text), "ctaNote": string (brief note about what action to take) }'
  const userPrompt = `Tone: ${parsed.data.tone}\n\nTranscript:\n${item.transcript.slice(0, 5000)}`

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) return { ok: false, code: 'unknown', error: gen.message }

  let parsedResult: NewsletterResult | null = null
  try {
    const raw = gen.json as unknown
    if (typeof raw === 'object' && raw !== null && 'subject' in raw) {
      parsedResult = raw as NewsletterResult
    } else if (typeof raw === 'string') {
      parsedResult = JSON.parse(raw) as NewsletterResult
    } else {
      const obj = raw as Record<string, unknown>
      const candidate = Object.values(obj)[0]
      if (typeof candidate === 'object' && candidate !== null) {
        parsedResult = candidate as NewsletterResult
      } else if (typeof candidate === 'string') {
        parsedResult = JSON.parse(candidate) as NewsletterResult
      }
    }
  } catch {
    return { ok: false, code: 'unknown', error: 'Could not parse newsletter response.' }
  }

  if (!parsedResult?.subject) {
    return { ok: false, code: 'unknown', error: 'Newsletter response is missing expected fields.' }
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  const { error } = await supabase
    .from('content_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, newsletter: parsedResult } as any })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  if (error) return { ok: false, code: 'unknown', error: error.message }

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true, newsletter: parsedResult }
}

// ── Find best clips ───────────────────────────────────────────────────────────

const findClipsSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

export interface BestClip {
  quote: string
  reason: string
  position_pct: number
  type: 'hook' | 'insight' | 'story' | 'controversial' | 'funny'
  energy: 'high' | 'medium'
  estimated_duration: string
}

export type FindBestClipsState =
  | { ok?: undefined }
  | { ok: true; clips: BestClip[] }
  | { ok: false; code: 'no_key' | 'unknown'; error: string }

export async function findBestClipsAction(
  _prev: FindBestClipsState,
  formData: FormData,
): Promise<FindBestClipsState> {
  const parsed = findClipsSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) {
    return { ok: false, code: 'unknown', error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const user = await getUser()
  if (!user) redirect('/login')

  const rlError = await checkAiRateLimit(user.id, 'clips')
  if (rlError) return { ok: false, code: 'unknown', error: rlError }

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item || !item.transcript) {
    return { ok: false, code: 'unknown', error: 'Content has no transcript to analyze.' }
  }

  const pick = await pickGenerationProvider(parsed.data.workspace_id)
  if (!pick.ok) {
    return { ok: false, code: pick.code === 'no_key' ? 'no_key' : 'unknown', error: pick.message }
  }

  const systemPrompt =
    'You are a viral content editor. Analyze this transcript and find the 3-5 best clip-worthy moments. For each clip, identify: the exact quote, why it\'s clip-worthy, estimated start position (as percentage 0-100 of total content), and clip type. Return JSON: { "clips": [{ "quote": string (exact words, 10-50 words), "reason": string (why this is clip-worthy), "position_pct": number (0-100), "type": "hook"|"insight"|"story"|"controversial"|"funny", "energy": "high"|"medium", "estimated_duration": string (e.g. "15-30 seconds") }] }'

  const userPrompt = item.transcript.slice(0, 8000)

  const gen = await generate({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: systemPrompt,
    user: userPrompt,
  })

  if (!gen.ok) {
    return { ok: false, code: 'unknown', error: gen.message }
  }

  let clips: BestClip[] = []
  try {
    const raw = gen.json as unknown
    let clipsArr: unknown[] = []

    if (typeof raw === 'object' && raw !== null && 'clips' in raw) {
      const obj = raw as Record<string, unknown>
      if (Array.isArray(obj.clips)) {
        clipsArr = obj.clips
      }
    } else if (Array.isArray(raw)) {
      clipsArr = raw
    }

    clips = clipsArr
      .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
      .map((c) => ({
        quote: typeof c.quote === 'string' ? c.quote : '',
        reason: typeof c.reason === 'string' ? c.reason : '',
        position_pct: typeof c.position_pct === 'number' ? c.position_pct : 0,
        type: (['hook', 'insight', 'story', 'controversial', 'funny'] as const).includes(c.type as 'hook')
          ? (c.type as BestClip['type'])
          : 'insight',
        energy: (c.energy === 'high' ? 'high' : 'medium') as BestClip['energy'],
        estimated_duration: typeof c.estimated_duration === 'string' ? c.estimated_duration : '15-30 seconds',
      }))
      .filter((c) => c.quote.length > 0)
  } catch {
    return { ok: false, code: 'unknown', error: 'Could not parse clips response.' }
  }

  if (clips.length === 0) {
    return { ok: false, code: 'unknown', error: 'No clips found. Try again.' }
  }

  // Store in metadata
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()

  const existingMetadata =
    item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {}

  await supabase
    .from('content_items')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: { ...existingMetadata, best_clips: clips } as any })
    .eq('id', parsed.data.content_id)
    .eq('workspace_id', parsed.data.workspace_id)

  revalidatePath(`/workspace/${parsed.data.workspace_id}/content/${parsed.data.content_id}`)
  return { ok: true, clips }
}

// ── Delete content item ───────────────────────────────────────────────────────

export type DeleteContentState =
  | { ok?: undefined }
  | { ok: true }
  | { ok: false; error: string }

export async function deleteContentAction(
  _prev: DeleteContentState,
  formData: FormData,
): Promise<DeleteContentState> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''

  if (!workspaceId || !contentId) return { ok: false, error: 'Invalid input.' }

  // Destructive action — explicit membership check before we let
  // deleteContentItem run, even though it's already workspace-scoped.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) return { ok: false, error: check.message }

  const result = await deleteContentItem(contentId, workspaceId)
  if (!result.ok) return { ok: false, error: result.error }

  revalidatePath(`/workspace/${workspaceId}`)
  redirect(`/workspace/${workspaceId}`)
}
