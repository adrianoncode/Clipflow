import 'server-only'

import { z } from 'zod'

import { log } from '@/lib/log'

/**
 * Word-level timestamp row from Whisper verbose_json. Start/end are
 * seconds relative to the source video.
 */
export interface WordTiming {
  word: string
  start: number
  end: number
}

/**
 * Raw viral-moment candidate as returned by GPT. We snap the bounds
 * to word boundaries downstream so the numbers here are approximate.
 */
export interface ViralMoment {
  start_seconds: number
  end_seconds: number
  hook_text: string
  reason: string
  virality_score: number
}

const momentSchema = z.object({
  start_seconds: z.number().nonnegative(),
  end_seconds: z.number().positive(),
  hook_text: z.string().min(1).max(120),
  reason: z.string().min(1).max(280),
  virality_score: z.number().int().min(0).max(100),
})

const responseSchema = z.object({
  moments: z.array(momentSchema).min(1).max(12),
})

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
// Bumped to gpt-4o for sharper hook detection on long transcripts (Deep
// Research recommendation). Cost is ~10x gpt-4o-mini per scoring run —
// acceptable because keys are BYOK and this fires once per content
// import. Callers can downgrade by passing `model: 'gpt-4o-mini'`.
const DEFAULT_MODEL = 'gpt-4o'
const MAX_TRANSCRIPT_CHARS = 32_000 // fits gpt-4o 128k context with room

const SYSTEM_PROMPT = `You are a short-form video producer who watches long podcasts, livestreams and YouTube videos and pulls out the 3–8 moments most likely to go viral on TikTok, Instagram Reels and YouTube Shorts.

You receive a full transcript with seconds-offsets. Your job is to return the clips that already work on their own — moments with a hook in the first 2 seconds, emotional peaks, counter-intuitive statements, vulnerable admissions, concrete numbers, or quotable one-liners.

Hard rules:
- Each clip must be between 20 and 60 seconds long.
- Clips must NOT overlap each other.
- Prefer moments where the speaker finishes a thought — do not cut mid-sentence.
- The "hook_text" must be a 3-7 word teaser that could be burned into the first frame. Not a summary. A hook.
- The "reason" explains WHY this clip is postable in 1-2 short sentences, in plain English.
- The "virality_score" is 0-100 based on: hook strength (40%), emotional peak (30%), quotability (20%), pacing (10%).

Respond with JSON only, no prose, matching this shape:
{
  "moments": [
    {
      "start_seconds": 143.2,
      "end_seconds": 189.5,
      "hook_text": "Nobody tells you this",
      "reason": "Vulnerable admission about quitting a job, direct eye-line hook, ends on a clean punchline.",
      "virality_score": 84
    }
  ]
}`

/**
 * Asks GPT to pick viral-moment candidates from a transcript.
 *
 * Input can be either:
 *  (a) plain transcript text (no word timings) — we send it as-is and
 *      let the model pick bounds from context. Good for YouTube/RSS
 *      imports that only have a plaintext transcript.
 *  (b) word-level timings from Whisper — we render a compact
 *      `[12.4] word word word [18.1]` representation so the model has
 *      second-precise anchors. Much better clip bounds.
 *
 * The caller should pass option (b) whenever it's available.
 */
export async function detectViralMoments(params: {
  apiKey: string
  transcriptText: string
  wordTimings?: WordTiming[] | null
  /** Defaults to gpt-4o-mini — cheap, fast, good enough. */
  model?: string
}): Promise<{ ok: true; moments: ViralMoment[] } | { ok: false; error: string }> {
  const { apiKey, transcriptText, wordTimings, model = DEFAULT_MODEL } = params

  if (!transcriptText.trim()) {
    return { ok: false, error: 'No transcript to analyze.' }
  }

  const userPrompt = buildUserPrompt({ transcriptText, wordTimings })

  let response: Response
  try {
    response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
        max_tokens: 2_000,
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'AbortError' || name === 'TimeoutError') {
      return { ok: false, error: 'Timed out contacting OpenAI. Try again.' }
    }
    return { ok: false, error: 'Could not reach OpenAI.' }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return {
        ok: false,
        error: 'OpenAI rejected this key. Update it in Settings → AI Keys.',
      }
    }
    if (response.status === 429) {
      return { ok: false, error: 'OpenAI rate-limited us. Try again in a moment.' }
    }
    log.error('detectViralMoments unexpected status', { status: response.status })
    return { ok: false, error: `OpenAI error (${response.status}).` }
  }

  let rawContent: unknown
  try {
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    rawContent = body.choices?.[0]?.message?.content
  } catch {
    return { ok: false, error: 'Could not parse OpenAI envelope.' }
  }

  if (typeof rawContent !== 'string') {
    return { ok: false, error: 'OpenAI returned no text content.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    return { ok: false, error: 'OpenAI returned malformed JSON.' }
  }

  const result = responseSchema.safeParse(parsed)
  if (!result.success) {
    log.error('detectViralMoments schema mismatch', { issues: result.error.issues })
    return { ok: false, error: 'OpenAI returned an unexpected shape.' }
  }

  // Snap bounds to word boundaries if we have word timings.
  // This prevents clipping mid-word — a common failure mode when
  // GPT guesses second values from vibes.
  const snapped = result.data.moments.map((m) =>
    wordTimings ? snapToWordBoundaries(m, wordTimings) : m,
  )

  // Drop clips that ended up <5s after snapping (rare but possible if
  // the model was way off and nearest-word collapsed them).
  const valid = snapped.filter((m) => m.end_seconds - m.start_seconds >= 5)

  if (valid.length === 0) {
    return { ok: false, error: 'AI returned clips but none had valid bounds. Try again.' }
  }

  // Highest-score first — the UI trusts this ordering.
  valid.sort((a, b) => b.virality_score - a.virality_score)

  return { ok: true, moments: valid }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUserPrompt(params: {
  transcriptText: string
  wordTimings?: WordTiming[] | null
}): string {
  const { transcriptText, wordTimings } = params

  if (wordTimings && wordTimings.length > 0) {
    // Compact anchored format. We drop an anchor every ~10 seconds so
    // the prompt stays small but the model still has enough timestamps
    // to lock clip bounds with 1-second precision.
    const anchored = renderAnchoredTranscript(wordTimings)
    const truncated =
      anchored.length > MAX_TRANSCRIPT_CHARS
        ? anchored.slice(0, MAX_TRANSCRIPT_CHARS) + '\n[…transcript truncated for length…]'
        : anchored
    return `Transcript with seconds-offsets — [NN.N] markers anchor the following words.\n\n${truncated}\n\nReturn the 3–8 most clip-worthy moments as described.`
  }

  const truncated =
    transcriptText.length > MAX_TRANSCRIPT_CHARS
      ? transcriptText.slice(0, MAX_TRANSCRIPT_CHARS) + '\n[…transcript truncated for length…]'
      : transcriptText
  return `Transcript (no word-level timing available — estimate seconds from position & speaking pace of ~150 words/min):\n\n${truncated}\n\nReturn the 3–8 most clip-worthy moments as described.`
}

/**
 * Turns [{word, start, end}] into "[12.4] the brown fox [18.1] jumped
 * over the lazy dog [24.2] …". Anchors every ~10 s of transcript.
 */
function renderAnchoredTranscript(words: WordTiming[]): string {
  const parts: string[] = []
  let lastAnchorTime = -Infinity
  for (const w of words) {
    if (w.start - lastAnchorTime >= 10) {
      parts.push(`\n[${w.start.toFixed(1)}]`)
      lastAnchorTime = w.start
    }
    parts.push(w.word)
  }
  return parts.join(' ').trim()
}

/**
 * Snaps start to the nearest word-start AT or after the requested
 * time, and end to the nearest word-end AT or before the requested
 * time. Prevents cutting mid-word. If no suitable boundary is found,
 * leaves the requested time.
 */
function snapToWordBoundaries(
  moment: ViralMoment,
  words: WordTiming[],
): ViralMoment {
  // Start — earliest word whose start >= requested (minus small slop)
  const startSlop = 0.15
  const startIdx = words.findIndex((w) => w.start >= moment.start_seconds - startSlop)
  const snappedStart =
    startIdx >= 0 ? words[startIdx]!.start : moment.start_seconds

  // End — latest word whose end <= requested (plus small slop)
  let snappedEnd = moment.end_seconds
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i]!
    if (w.end <= moment.end_seconds + 0.4) {
      snappedEnd = w.end
      break
    }
  }

  // Clamp length to the 20-60s band the prompt asked for, biased to
  // the shorter end if the model over-extended.
  const length = snappedEnd - snappedStart
  if (length > 60) snappedEnd = snappedStart + 60
  if (length < 20 && snappedEnd < moment.end_seconds) {
    // Extend end slightly to hit the floor, but only if we haven't
    // already snapped to a natural boundary.
    snappedEnd = Math.min(snappedStart + 20, moment.end_seconds)
  }

  return {
    ...moment,
    start_seconds: Math.round(snappedStart * 100) / 100,
    end_seconds: Math.round(snappedEnd * 100) / 100,
  }
}
