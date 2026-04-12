import 'server-only'

import { DEFAULT_MODELS } from '@/lib/ai/generate/models'
import { generate } from '@/lib/ai/generate/generate'
import { pickGenerationProvider } from '@/lib/ai/pick-generation-provider'

export async function extractBrollKeywords(
  workspaceId: string,
  transcript: string,
): Promise<string[]> {
  try {
    const providerResult = await pickGenerationProvider(workspaceId)
    if (!providerResult.ok) return extractFallbackKeywords(transcript)

    const gen = await generate({
      provider: providerResult.provider,
      apiKey: providerResult.apiKey,
      model: DEFAULT_MODELS[providerResult.provider],
      system:
        'You are a video editor. Extract visual B-Roll search terms from a transcript. Return a JSON array of 4-6 short search queries (2-4 words each) suitable for stock footage search. Focus on concrete visuals, not abstract concepts. Example: ["person working laptop", "city street walk", "coffee morning routine"]. Return only the JSON array.',
      user: `Extract B-Roll search terms from this transcript:\n\n${transcript.slice(0, 2000)}`,
    })

    if (!gen.ok) return extractFallbackKeywords(transcript)

    // gen.json is typed as PromptOutput but the model returns a raw JSON array.
    // Cast to unknown and extract array from whatever field the adapter surfaced it in.
    const raw = gen.json as unknown

    let keywords: string[] = []

    if (Array.isArray(raw)) {
      keywords = (raw as unknown[]).filter((k): k is string => typeof k === 'string')
    } else if (typeof raw === 'object' && raw !== null) {
      // Model may have nested the array — iterate all values and find the first array
      for (const val of Object.values(raw as Record<string, unknown>)) {
        if (Array.isArray(val)) {
          keywords = (val as unknown[]).filter((k): k is string => typeof k === 'string')
          break
        }
        // Or try to parse a string value that contains JSON
        if (typeof val === 'string') {
          try {
            const match = val.match(/\[[\s\S]*\]/)
            if (match) {
              const parsed = JSON.parse(match[0]) as unknown[]
              if (Array.isArray(parsed)) {
                keywords = parsed.filter((k): k is string => typeof k === 'string')
                break
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }

    if (keywords.length > 0) {
      return keywords.slice(0, 6)
    }

    return extractFallbackKeywords(transcript)
  } catch {
    return extractFallbackKeywords(transcript)
  }
}

function extractFallbackKeywords(transcript: string): string[] {
  // Simple fallback: extract frequent meaningful words
  const words = transcript
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 4)
  const freq: Record<string, number> = {}
  for (const w of words) freq[w] = (freq[w] ?? 0) + 1
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([w]) => w)
}
