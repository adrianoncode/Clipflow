'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generate } from '@/lib/ai/generate/generate'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { fetchGoogleTrends } from '@/lib/trends/fetch-google-trends'

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
