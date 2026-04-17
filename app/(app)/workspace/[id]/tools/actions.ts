'use server'

import { redirect } from 'next/navigation'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { getContentItem } from '@/lib/content/get-content-item'
import { createClient } from '@/lib/supabase/server'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'

import { buildContentDnaPrompt } from '@/lib/ai/prompts/content-dna'
import { buildViralHooksPrompt } from '@/lib/ai/prompts/viral-hooks'
import { buildThumbnailPrompt } from '@/lib/ai/prompts/thumbnail-generator'
import { buildEngagementRepliesPrompt } from '@/lib/ai/prompts/engagement-replies'
import { buildHashtagResearchPrompt } from '@/lib/ai/prompts/hashtag-research'
import { buildContentRecyclerPrompt } from '@/lib/ai/prompts/content-recycler'
import { buildVisualStoryboardPrompt } from '@/lib/ai/prompts/visual-storyboard'
import { buildCollabFinderPrompt } from '@/lib/ai/prompts/collab-finder'

type ActionResult = { ok?: undefined } | { ok: true; data: unknown } | { ok: false; error: string }

/** Shared helper: validate workspace + rate limit + get AI provider. */
async function setup(workspaceId: string) {
  const user = await getUser()
  if (!user) redirect('/login')
  // All 8 tools in this file are AI-tool generations — share the
  // `generation` preset (20/min per workspace) so a user can chain
  // tools without hitting the limit in normal use, but a stuck retry
  // loop gets clamped.
  const rl = await checkWorkspaceRateLimit(workspaceId, 'generation')
  if (!rl.ok) return { ok: false as const, error: rl.error }
  const provider = await pickGenerationProvider(workspaceId)
  if (!provider.ok) return { ok: false as const, error: provider.message }
  return { ok: true as const, user, provider }
}

/** Shared helper: run a raw AI generation */
async function runAi(
  provider: { provider: 'openai' | 'anthropic' | 'google'; apiKey: string },
  prompt: { system: string; user: string },
) {
  return generateRaw({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: DEFAULT_MODELS[provider.provider],
    system: prompt.system,
    user: prompt.user,
  })
}

/* ═══ 1. Content DNA Analyzer ═══════════════════════════════════ */

export async function analyzeContentDnaAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  if (!workspaceId) return { ok: false, error: 'Missing workspace.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  // Fetch the last 5 content items with transcripts
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('content_items')
    .select('id, title, transcript')
    .eq('workspace_id', workspaceId)
    .eq('status', 'ready')
    .not('transcript', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const withTranscript = (items ?? []).filter((i) => i.transcript && i.transcript.length > 100)

  if (withTranscript.length < 2) {
    return { ok: false, error: 'Need at least 2 content items with transcripts to analyze your Content DNA.' }
  }

  const prompt = buildContentDnaPrompt({
    contentSamples: withTranscript.map((i) => ({
      title: i.title ?? 'Untitled',
      transcript: i.transcript ?? '',
    })),
  })

  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}

/* ═══ 2. One-Click Full Repurpose ═══════════════════════════════ */

export async function fullRepurposeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''
  if (!workspaceId || !contentId) return { ok: false, error: 'Missing data.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const item = await getContentItem(contentId, workspaceId)
  if (!item?.transcript) return { ok: false, error: 'No transcript.' }

  const transcript = item.transcript
  const title = item.title ?? 'Untitled'

  // Run all formats in parallel
  const [newsletter, carousel, chapters, storyboard] = await Promise.all([
    runAi(ctx.provider, {
      system: `Transform this transcript into a Beehiiv/Substack newsletter. Respond with JSON: {subject, preheader, intro, sections: [{heading, body}], keyTakeaways: [], cta, signoff}`,
      user: `Title: ${title}\n\n${transcript.slice(0, 8000)}`,
    }),
    runAi(ctx.provider, {
      system: `Split this content into an 8-slide Instagram carousel. Respond with JSON: {coverSlide: {title, subtitle}, slides: [{slideNumber, headline, body}], closingSlide: {cta}}`,
      user: transcript.slice(0, 6000),
    }),
    runAi(ctx.provider, {
      system: `Generate YouTube chapters from this transcript. Respond with JSON: {chapters: [{timestamp: "MM:SS", title: string}]}. First chapter must be 00:00.`,
      user: transcript.slice(0, 12000),
    }),
    runAi(ctx.provider, {
      system: `Create a blog post from this transcript. Respond with JSON: {title, metaDescription, sections: [{heading, body}], tags: []}`,
      user: `Title: ${title}\n\n${transcript.slice(0, 10000)}`,
    }),
  ])

  return {
    ok: true,
    data: {
      newsletter: newsletter.ok ? newsletter.json : null,
      carousel: carousel.ok ? carousel.json : null,
      chapters: chapters.ok ? chapters.json : null,
      blogPost: storyboard.ok ? storyboard.json : null,
    },
  }
}

/* ═══ 3. Viral Hook Database ════════════════════════════════════ */

export async function generateViralHooksAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const niche = formData.get('niche')?.toString() ?? ''
  const platform = formData.get('platform')?.toString()
  const emotion = formData.get('emotion')?.toString()

  if (!workspaceId || !niche) return { ok: false, error: 'Missing niche.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const prompt = buildViralHooksPrompt({ niche, platform, emotion, count: 25 })
  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}

/* ═══ 4. AI Thumbnail Generator ═════════════════════════════════ */

export async function generateThumbnailsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const title = formData.get('title')?.toString() ?? ''
  const hook = formData.get('hook')?.toString() ?? ''

  if (!workspaceId || !title) return { ok: false, error: 'Missing title.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const prompt = buildThumbnailPrompt({ title, hook: hook || title })
  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }

  // If OpenAI DALL-E key available, generate actual images
  const thumbnailData = gen.json as { thumbnails?: Array<{ dallePrompt?: string; style?: string; textOverlay?: string }> }
  const results: Array<{ style: string; imageUrl: string | null; textOverlay: string; dallePrompt: string }> = []

  for (const thumb of thumbnailData?.thumbnails ?? []) {
    let imageUrl: string | null = null

    // Try to generate with DALL-E if the provider is OpenAI
    if (ctx.provider.provider === 'openai' && thumb?.dallePrompt) {
      try {
        const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${ctx.provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: thumb.dallePrompt,
            n: 1,
            size: '1792x1024',
            quality: 'standard',
          }),
          signal: AbortSignal.timeout(30000),
        })

        if (dalleRes.ok) {
          const dalleData = await dalleRes.json() as { data?: Array<{ url?: string }> }
          imageUrl = dalleData.data?.[0]?.url ?? null
        }
      } catch {
        // DALL-E generation failed — return prompt only
      }
    }

    results.push({
      style: thumb?.style ?? '',
      imageUrl,
      textOverlay: thumb?.textOverlay ?? '',
      dallePrompt: thumb?.dallePrompt ?? '',
    })
  }

  return { ok: true, data: { thumbnails: results } }
}

/* ═══ 5. Engagement Reply Generator ═════════════════════════════ */

export async function generateRepliesAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const commentsRaw = formData.get('comments')?.toString() ?? ''

  if (!workspaceId || !commentsRaw) return { ok: false, error: 'Paste some comments.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  // Parse comments from text (one per line)
  const comments = commentsRaw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => ({ text, author: 'user', likeCount: 0 }))

  const prompt = buildEngagementRepliesPrompt({ comments })
  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}

/* ═══ 6. Smart Hashtag Research ═════════════════════════════════ */

export async function researchHashtagsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const topic = formData.get('topic')?.toString() ?? ''
  const platform = formData.get('platform')?.toString() ?? 'tiktok'

  if (!workspaceId || !topic) return { ok: false, error: 'Enter a topic.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const prompt = buildHashtagResearchPrompt({ topic, platform })
  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}

/* ═══ 7. Content Recycling Engine ═══════════════════════════════ */

export async function recycleContentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const contentId = formData.get('content_id')?.toString() ?? ''

  if (!workspaceId || !contentId) return { ok: false, error: 'Missing data.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const item = await getContentItem(contentId, workspaceId)
  if (!item?.transcript) return { ok: false, error: 'No transcript.' }

  const prompt = buildContentRecyclerPrompt({
    originalContent: {
      title: item.title ?? 'Untitled',
      transcript: item.transcript,
      createdAt: item.created_at,
    },
  })

  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}

/* ═══ 8. Visual Storyboard ══════════════════════════════════════ */

export async function generateVisualStoryboardAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const script = formData.get('script')?.toString() ?? ''

  if (!workspaceId || !script) return { ok: false, error: 'Enter a script.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const prompt = buildVisualStoryboardPrompt({ script })
  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}

/* ═══ 9. Collab Finder ══════════════════════════════════════════ */

export async function findCollabsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const workspaceId = formData.get('workspace_id')?.toString() ?? ''
  const niche = formData.get('niche')?.toString() ?? ''
  const topics = formData.get('topics')?.toString() ?? ''
  const audienceSize = formData.get('audience_size')?.toString()
  const goals = formData.get('goals')?.toString()

  if (!workspaceId || !niche) return { ok: false, error: 'Enter your niche.' }

  const ctx = await setup(workspaceId)
  if (!ctx.ok) return { ok: false, error: ctx.error }

  const prompt = buildCollabFinderPrompt({
    creatorNiche: niche,
    contentTopics: topics.split(',').map((t) => t.trim()).filter(Boolean),
    audienceSize,
    goals,
  })

  const gen = await runAi(ctx.provider, prompt)
  if (!gen.ok) return { ok: false, error: gen.message }
  return { ok: true, data: gen.json }
}
