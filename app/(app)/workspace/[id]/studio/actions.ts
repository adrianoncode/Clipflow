'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { getUser } from '@/lib/auth/get-user'
import { checkRenderQuota } from '@/lib/billing/check-feature'
import { makeVideoPipeline } from '@/lib/video/make-video-pipeline'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import type { CaptionStyle } from '@/lib/video/shotstack-render'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'

// ── Studio Render ─────────────────────────────────────────────────────────────

const studioRenderSchema = z.object({
  workspace_id: z.string().uuid(),
  content_id: z.string().uuid(),
  aspect_ratio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  caption_style: z.enum(['tiktok-bold', 'minimal', 'neon', 'white-bar']).default('tiktok-bold'),
  hook_text: z.string().max(120).optional().or(z.literal('')),
  music_url: z.string().url().optional().or(z.literal('')),
})

export type StudioRenderState =
  | { ok?: undefined }
  | { ok: true; renderId: string; renderRowId: string | null }
  | { ok: false; error: string }

export async function studioRenderAction(
  _prev: StudioRenderState,
  formData: FormData,
): Promise<StudioRenderState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const parsed = studioRenderSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    content_id: formData.get('content_id'),
    aspect_ratio: formData.get('aspect_ratio') ?? '9:16',
    caption_style: formData.get('caption_style') ?? 'tiktok-bold',
    hook_text: formData.get('hook_text') || '',
    music_url: formData.get('music_url') || '',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const gate = await checkRenderQuota(parsed.data.workspace_id, 'video_render')
  if (!gate.ok) return { ok: false, error: gate.message ?? 'Render quota reached — upgrade your plan.' }

  // Short-window rate limit on top of the monthly plan quota — prevents
  // a user from burning their whole monthly render allowance in 30 seconds
  // due to a stuck loop or abuse.
  const rl = await checkWorkspaceRateLimit(parsed.data.workspace_id, 'videoRender')
  if (!rl.ok) return { ok: false, error: rl.error }

  const result = await makeVideoPipeline({
    workspaceId: parsed.data.workspace_id,
    contentId: parsed.data.content_id,
    aspectRatio: parsed.data.aspect_ratio,
    captionStyle: parsed.data.caption_style as CaptionStyle,
    hookText: parsed.data.hook_text || null,
    musicUrl: parsed.data.music_url || null,
  })

  return result
}

// ── Style Clone ───────────────────────────────────────────────────────────────

const styleCloneSchema = z.object({
  workspace_id: z.string().uuid(),
  competitor_url: z.string().url(),
})

export interface StyleAnalysis {
  captionStyle: CaptionStyle
  captionStyleLabel: string
  hookType: string
  pacing: string
  vibe: string
  hookExample: string
  aspectRatio: '9:16' | '1:1' | '16:9'
  reasoning: string
}

export type StyleCloneState =
  | { ok?: undefined }
  | { ok: true; analysis: StyleAnalysis }
  | { ok: false; error: string }

export async function analyzeStyleAction(
  _prev: StyleCloneState,
  formData: FormData,
): Promise<StyleCloneState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const parsed = styleCloneSchema.safeParse({
    workspace_id: formData.get('workspace_id'),
    competitor_url: formData.get('competitor_url'),
  })
  if (!parsed.success) {
    return { ok: false, error: 'Enter a valid URL (TikTok, Instagram, YouTube).' }
  }

  const url = parsed.data.competitor_url

  // Detect platform
  const isTikTok = url.includes('tiktok.com')
  const isInstagram = url.includes('instagram.com')
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const platform = isTikTok ? 'TikTok' : isInstagram ? 'Instagram Reels' : isYouTube ? 'YouTube Shorts' : 'short-form video'

  const prompt = `You are a viral content strategist. Analyze the style of this ${platform} video URL and return a JSON object.

URL: ${url}

Based on the platform (${platform}) and URL patterns, infer the likely visual style, caption style, hook type, and pacing. Use your knowledge of current ${platform} trends.

Return ONLY valid JSON with this exact shape:
{
  "captionStyle": "tiktok-bold" | "minimal" | "neon" | "white-bar",
  "captionStyleLabel": "string describing the caption look",
  "hookType": "string (e.g. 'Controversial statement', 'Question hook', 'Story hook')",
  "pacing": "string (e.g. 'Fast — 8-12 cuts/min', 'Medium — 4-6 cuts/min')",
  "vibe": "string (e.g. 'High energy, motivational', 'Calm, educational')",
  "hookExample": "string — write a viral hook in this style for the creator to use",
  "aspectRatio": "9:16" | "1:1" | "16:9",
  "reasoning": "1-2 sentences explaining the style choices"
}

For ${platform}, typical styles are:
- TikTok: tiktok-bold captions, fast pacing, controversial or question hooks
- Instagram Reels: white-bar or minimal captions, medium pacing, aesthetic hooks
- YouTube Shorts: tiktok-bold or minimal, educational or entertainment hooks`

  const providerResult = await pickGenerationProvider(parsed.data.workspace_id)
  if (!providerResult.ok) {
    return { ok: false, error: 'No LLM key connected — add one in Settings → AI Keys.' }
  }

  try {
    const raw = await generateRaw({
      provider: providerResult.provider,
      apiKey: providerResult.apiKey,
      model: DEFAULT_MODELS[providerResult.provider],
      system: 'You are a viral content strategist. Return only valid JSON, no markdown.',
      user: prompt,
    })

    if (!raw.ok) return { ok: false, error: 'AI analysis failed. Try again.' }

    // Strip markdown fences if present
    const text = typeof raw.json === 'string' ? raw.json : JSON.stringify(raw.json)
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    const analysis = (typeof raw.json === 'object' ? raw.json : JSON.parse(cleaned)) as StyleAnalysis

    return { ok: true, analysis }
  } catch {
    return { ok: false, error: 'Could not parse style analysis. Try again.' }
  }
}
