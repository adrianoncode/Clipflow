'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { generate } from '@/lib/ai/generate/generate'
import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'
import { getUser } from '@/lib/auth/get-user'
import { fetchUrlText } from '@/lib/content/fetch-url-text'
import { checkWorkspaceRateLimit } from '@/lib/rate-limit-helper'

const analyzeCompetitorSchema = z.object({
  workspaceId: z.string().min(1),
  competitorUrl: z.string().url('Please enter a valid URL'),
  yourNiche: z.string().max(200).optional(),
})

export async function analyzeCompetitorAction(
  _prevState: unknown,
  formData: FormData,
) {
  const parsed = analyzeCompetitorSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    competitorUrl: formData.get('competitorUrl'),
    yourNiche: formData.get('yourNiche') || undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  }

  const { workspaceId, competitorUrl, yourNiche } = parsed.data

  const user = await getUser()
  if (!user) redirect('/login')

  const rl = await checkWorkspaceRateLimit(workspaceId, 'research')
  if (!rl.ok) return { ok: false, error: rl.error }

  const fetched = await fetchUrlText(competitorUrl)
  if (!fetched.ok) {
    return {
      ok: false,
      error: `Failed to fetch URL — ${fetched.error}`,
    }
  }

  const pick = await pickGenerationProvider(workspaceId)
  if (!pick.ok) {
    return { ok: false, error: pick.message }
  }

  const systemPrompt = `You are a competitive content analyst. Analyze the provided webpage content and return a JSON object with:
{
  "tone": string (describe the overall tone in 3-5 words),
  "contentPillars": string[] (3-5 main topics/themes they consistently cover),
  "writingStyle": string (1-2 sentences describing their writing style),
  "strengths": string[] (2-3 things they do really well),
  "gaps": string[] (2-3 topics/angles they miss or undercover — opportunities),
  "targetAudience": string (who they seem to be writing for),
  "postingApproach": string (how they structure their content),
  "differentiatorSuggestions": string[] (3 specific ways you could stand out vs this competitor)
}`

  const userPrompt = `Analyze this competitor's content:\n\nURL: ${competitorUrl}\n\n${yourNiche ? 'My niche: ' + yourNiche + '\n\n' : ''}Content:\n${fetched.text.slice(0, 5000)}`

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
    tone?: string
    contentPillars?: string[]
    writingStyle?: string
    strengths?: string[]
    gaps?: string[]
    targetAudience?: string
    postingApproach?: string
    differentiatorSuggestions?: string[]
  }
  let aiResult: AiResult | null = null

  const raw = gen.json as unknown

  if (typeof raw === 'object' && raw !== null && 'tone' in raw) {
    aiResult = raw as AiResult
  } else if (typeof raw === 'string') {
    try {
      aiResult = JSON.parse(raw)
    } catch {
      // fall through
    }
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    for (const val of Object.values(obj)) {
      if (typeof val === 'string') {
        try {
          const inner = JSON.parse(val)
          if (typeof inner === 'object' && inner !== null && 'tone' in inner) {
            aiResult = inner as AiResult
            break
          }
        } catch {
          // continue
        }
      }
    }
  }

  if (!aiResult?.tone) {
    return { ok: false, error: 'Failed to parse AI response. Please try again.' }
  }

  return {
    ok: true,
    analysis: {
      url: competitorUrl,
      title: fetched.title,
      tone: aiResult.tone ?? '',
      contentPillars: aiResult.contentPillars ?? [],
      writingStyle: aiResult.writingStyle ?? '',
      strengths: aiResult.strengths ?? [],
      gaps: aiResult.gaps ?? [],
      targetAudience: aiResult.targetAudience ?? '',
      postingApproach: aiResult.postingApproach ?? '',
      differentiatorSuggestions: aiResult.differentiatorSuggestions ?? [],
      analyzedAt: new Date().toISOString(),
    },
  }
}
