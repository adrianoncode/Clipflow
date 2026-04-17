'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generate } from '@/lib/ai/generate/generate'
import { generateRaw } from '@/lib/ai/generate/generate-raw'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { fetchGoogleTrends } from '@/lib/trends/fetch-google-trends'
import { createClient } from '@/lib/supabase/server'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'

const analyzeTrendsSchema = z.object({
  workspaceId: z.string().min(1),
  niche: z
    .string()
    .min(3, 'Niche must be at least 3 characters')
    .max(200, 'Niche must be under 200 characters'),
  geo: z.string().default('US'),
})

export async function analyzeTrendsAction(
  _prevState: unknown,
  formData: FormData,
) {
  const parsed = analyzeTrendsSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    niche: formData.get('niche'),
    geo: formData.get('geo') ?? 'US',
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, niche, geo } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const rl = await checkWorkspaceRateLimit(workspaceId, 'research')
  if (!rl.ok) return { ok: false, error: rl.error }

  const trends = await fetchGoogleTrends(geo === 'Global' ? 'US' : geo)
  if (trends.length === 0) {
    return { ok: false, error: 'Could not fetch trending topics. Please try again.' }
  }

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) {
    return { ok: false, error: pick.message }
  }

  const systemPrompt = `You are a content strategy expert. Given a list of trending topics and a content creator's niche, identify which trends are relevant and suggest content angles. Return a JSON object with:
{
  "matched": [
    {
      "title": string (trend title),
      "relevanceScore": number 0-100,
      "contentAngle": string (1-2 sentence content idea using this trend),
      "isRelevant": boolean (true if score >= 40)
    }
  ],
  "contentIdeas": string[] (3-5 specific video/post ideas combining the niche with current trends),
  "trendSummary": string (2-3 sentence overview of what's trending in this niche)
}`

  const userPrompt = `Niche/Topic: ${niche}

Current trending topics:
${trends
  .slice(0, 15)
  .map(
    (t, i) =>
      `${i + 1}. ${t.title}${t.description ? ' (' + t.description + ')' : ''}`,
  )
  .join('\n')}

Match these trends to the niche and suggest content angles.`

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

  // Parse the JSON from the generate result
  type AiResult = {
    matched?: Array<{
      title: string
      relevanceScore: number
      contentAngle: string
      isRelevant: boolean
    }>
    contentIdeas?: string[]
    trendSummary?: string
  }
  let aiResult: AiResult | null = null

  const raw = gen.json as unknown

  if (typeof raw === 'object' && raw !== null && 'matched' in raw) {
    aiResult = raw as AiResult
  } else if (typeof raw === 'string') {
    try {
      aiResult = JSON.parse(raw)
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
          if (typeof inner === 'object' && inner !== null && 'matched' in inner) {
            aiResult = inner as AiResult
            break
          }
        } catch {
          // continue
        }
      }
    }
  }

  if (!aiResult?.matched) {
    return { ok: false, error: 'Failed to parse AI response. Please try again.' }
  }

  // Merge AI results with original trend items by title
  const matchedTrends = trends.slice(0, 15).map((trend) => {
    const aiMatch = aiResult!.matched!.find(
      (m) => m.title.toLowerCase() === trend.title.toLowerCase(),
    )
    return {
      trend,
      relevanceScore: aiMatch?.relevanceScore ?? 0,
      contentAngle: aiMatch?.contentAngle ?? '',
      isRelevant: aiMatch?.isRelevant ?? false,
    }
  })

  // Sort by relevance score descending
  matchedTrends.sort((a, b) => b.relevanceScore - a.relevanceScore)

  return {
    ok: true,
    niche,
    trends: matchedTrends,
    contentIdeas: aiResult.contentIdeas ?? [],
    trendSummary: aiResult.trendSummary ?? '',
    geo,
    fetchedAt: new Date().toISOString(),
  }
}

/* ─── Trend → Full Script → Content Item → Redirect to Outputs ─── */

const trendToContentSchema = z.object({
  workspaceId: z.string().min(1),
  trendTitle: z.string().min(1),
  contentAngle: z.string().min(1),
})

export type TrendToContentState =
  | { ok?: undefined }
  | { ok: true; contentId: string; redirectUrl: string }
  | { ok: false; error: string }

/**
 * Takes a trend + content angle, generates a full video script via AI,
 * creates a content item with the script as transcript, and returns
 * a redirect URL to the outputs page.
 */
export async function createContentFromTrendAction(
  _prev: TrendToContentState,
  formData: FormData,
): Promise<TrendToContentState> {
  const parsed = trendToContentSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    trendTitle: formData.get('trendTitle'),
    contentAngle: formData.get('contentAngle'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, trendTitle, contentAngle } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) return { ok: false, error: pick.message }

  // Step 1: Generate a full video script from the trend
  const gen = await generateRaw({
    provider: pick.provider,
    apiKey: pick.apiKey,
    model: DEFAULT_MODELS[pick.provider],
    system: `You are an expert short-form video scriptwriter. Given a trending topic and a content angle, write a complete video script.

Respond with a JSON object:
{
  "title": "<string — catchy title for this content>",
  "script": "<string — complete video script, 150-300 words, with a strong hook in the first line, a clear narrative, and a CTA at the end>"
}

The script should be:
- Written for TikTok/Reels/Shorts (15-60 seconds when spoken)
- Start with a scroll-stopping hook
- Have a clear beginning, middle, and end
- End with a call to action
- Be engaging and conversational`,
    user: `Trending topic: ${trendTitle}\nContent angle: ${contentAngle}\n\nWrite a complete short-form video script.`,
  })

  if (!gen.ok) return { ok: false, error: gen.message }

  const result = gen.json as { title?: string; script?: string }
  const title = result?.title ?? `Trend: ${trendTitle}`
  const script = result?.script ?? contentAngle

  // Step 2: Create content item
  const supabase = await createClient()
  const { data: contentItem, error: insertError } = await supabase
    .from('content_items')
    .insert({
      workspace_id: workspaceId,
      kind: 'text' as const,
      status: 'ready' as const,
      title,
      transcript: script,
      metadata: { source: 'trend', trendTitle, contentAngle },
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError || !contentItem) {
    return { ok: false, error: insertError?.message ?? 'Failed to create content item.' }
  }

  return {
    ok: true,
    contentId: contentItem.id,
    redirectUrl: `/workspace/${workspaceId}/content/${contentItem.id}/outputs`,
  }
}
