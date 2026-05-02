/**
 * Pure scoring helper — given a clip's hook text + transcript snippet,
 * matches it against the active niche's trending keywords and returns
 * the matched keywords plus a bonus to layer on top of `virality_score`.
 *
 * Kept side-effect-free so it can be unit-tested without touching
 * Supabase or YouTube. The DB / API plumbing lives in
 * `fetch-trending-keywords.ts` and the find-viral-moments action.
 */

export interface TrendMatchInput {
  /** Clip hook (3-7 word teaser) — case-insensitive search target. */
  hookText: string | null | undefined
  /** Optional first ~3 sentences of the clip transcript for broader
   *  matching. Pass empty string to skip. */
  transcriptSnippet?: string | null
  /** Trending keywords for the workspace's active niche (lowercase). */
  trendingKeywords: readonly string[]
}

export interface TrendMatchResult {
  /** Distinct keywords that matched (lowercase, original spelling). */
  matched: string[]
  /** 0..30 bonus. +5 per match in hook, +3 per match in snippet. Capped. */
  bonus: number
}

const HOOK_WEIGHT = 5
const SNIPPET_WEIGHT = 3
const BONUS_CAP = 30

/**
 * Returns matched keywords + bonus. A keyword counts at most once
 * across both sources — preventing a keyword that appears in both
 * hook and snippet from doubling.
 */
export function matchTrending(input: TrendMatchInput): TrendMatchResult {
  const { hookText, transcriptSnippet, trendingKeywords } = input

  if (!trendingKeywords.length) return { matched: [], bonus: 0 }

  const hook = (hookText ?? '').toLowerCase()
  const snippet = (transcriptSnippet ?? '').toLowerCase()

  const matched: string[] = []
  let bonus = 0

  for (const keywordRaw of trendingKeywords) {
    const keyword = keywordRaw.toLowerCase()
    if (!keyword) continue

    if (containsWord(hook, keyword)) {
      matched.push(keywordRaw)
      bonus += HOOK_WEIGHT
      continue
    }

    if (snippet && containsWord(snippet, keyword)) {
      matched.push(keywordRaw)
      bonus += SNIPPET_WEIGHT
    }
  }

  return { matched, bonus: Math.min(bonus, BONUS_CAP) }
}

/**
 * Word-boundary match — guards against substring noise like "creator"
 * matching inside "creators" being fine but inside "decorator" being
 * wrong. Uses simple boundary regex; trending keywords are normalized
 * to alphanumeric upstream so dynamic regex injection isn't a concern.
 */
function containsWord(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false
  // Escape anything not [a-z0-9] in needle for safety even though the
  // tokenizer keeps inputs clean.
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i')
  return re.test(haystack)
}

/**
 * Pulls the first three sentence-ish chunks of a transcript. Used
 * as the snippet input for matching, so we don't burn time scanning
 * 30-minute transcripts per clip.
 */
export function transcriptSnippetFor(
  fullTranscript: string,
  startSeconds: number,
  endSeconds: number,
  totalDurationSeconds: number | null,
): string {
  if (!fullTranscript) return ''
  if (!totalDurationSeconds || totalDurationSeconds <= 0) {
    // Without duration we just take the leading 1.5kb — better than
    // nothing for plaintext-only YouTube imports.
    return fullTranscript.slice(0, 1500)
  }

  // Estimate the byte range that corresponds to the clip window.
  const ratioStart = Math.max(0, startSeconds / totalDurationSeconds)
  const ratioEnd = Math.min(1, endSeconds / totalDurationSeconds)
  const len = fullTranscript.length
  const sliceStart = Math.floor(ratioStart * len)
  const sliceEnd = Math.min(len, Math.ceil(ratioEnd * len))
  return fullTranscript.slice(sliceStart, sliceEnd).slice(0, 1500)
}
