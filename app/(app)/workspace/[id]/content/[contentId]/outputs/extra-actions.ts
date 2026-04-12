'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { buildNewsletterPrompt } from '@/lib/ai/prompts/newsletter'
import { buildCarouselPrompt } from '@/lib/ai/prompts/carousel'
import { buildClipExtractorPrompt } from '@/lib/ai/prompts/clip-extractor'
import { buildContentCalendarPrompt } from '@/lib/ai/prompts/content-calendar'

const contentSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
})

/* ─── Newsletter Generator ──────────────────────────────────── */

export async function generateNewsletterAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: boolean; newsletter?: unknown; error?: string }> {
  const parsed = contentSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item?.transcript) return { ok: false, error: 'No transcript available.' }

  const provider = await pickGenerationProvider(parsed.data.workspace_id)
  if (!provider.ok) return { ok: false, error: provider.message }

  const prompt = buildNewsletterPrompt({ transcript: item.transcript, title: item.title ?? undefined })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, newsletter: gen.json }
}

/* ─── Carousel Generator ────────────────────────────────────── */

export async function generateCarouselAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: boolean; carousel?: unknown; error?: string }> {
  const parsed = contentSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item?.transcript) return { ok: false, error: 'No transcript available.' }

  const provider = await pickGenerationProvider(parsed.data.workspace_id)
  if (!provider.ok) return { ok: false, error: provider.message }

  const prompt = buildCarouselPrompt({ transcript: item.transcript })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, carousel: gen.json }
}

/* ─── Clip Extractor (Phase 4, Feature 8) ───────────────────── */

export async function extractClipsAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: boolean; clips?: unknown; error?: string }> {
  const parsed = contentSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
  })
  if (!parsed.success) return { ok: false, error: 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const item = await getContentItem(parsed.data.content_id, parsed.data.workspace_id)
  if (!item?.transcript) return { ok: false, error: 'No transcript available.' }

  const provider = await pickGenerationProvider(parsed.data.workspace_id)
  if (!provider.ok) return { ok: false, error: provider.message }

  const prompt = buildClipExtractorPrompt({ transcript: item.transcript })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, clips: gen.json }
}

/* ─── Content Calendar (Phase 3, Feature 4) ─────────────────── */

const calendarSchema = z.object({
  workspace_id: z.string().uuid(),
  niche: z.string().min(2).max(200),
  posting_frequency: z.string().min(1).max(100),
})

export async function generateContentCalendarAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok?: boolean; entries?: unknown; error?: string }> {
  const parsed = calendarSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    niche: formData.get('niche'),
    posting_frequency: formData.get('posting_frequency'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }

  const user = await getUser()
  if (!user) redirect('/login')

  const provider = await pickGenerationProvider(parsed.data.workspace_id)
  if (!provider.ok) return { ok: false, error: provider.message }

  const prompt = buildContentCalendarPrompt({
    niche: parsed.data.niche,
    postingFrequency: parsed.data.posting_frequency,
  })

  const gen = await generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })

  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, entries: gen.json }
}
