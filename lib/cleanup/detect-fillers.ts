/**
 * Filler-word detection — pure, side-effect-free, framework-agnostic.
 *
 * Takes a word-level transcript (the same shape Whisper / Deepgram
 * return) plus a language code and emits an index list of words that
 * are fillers and an aggregated time saving estimate.
 *
 * Two reasons this is its own module:
 *
 *   1. We want server actions AND the browser editor to use the SAME
 *      detector so what the user toggles in the UI matches the cuts
 *      submitted to the renderer. Putting it next to either layer
 *      would make the other one import boundary-cross.
 *
 *   2. The dictionaries grow over time as we onboard new languages.
 *      Centralising them lets a contributor add a language by editing
 *      one map and pushing a PR — no tracing through render code.
 *
 * Detection rules
 *
 *   - Single-word fillers (e.g. "um") match by a normalised lowercase
 *     comparison so the source's casing/punctuation doesn't matter.
 *   - Multi-word fillers (e.g. "you know", "ich mein") match a sliding
 *     window of N consecutive words. When matched, ALL words in the
 *     phrase get marked.
 *   - The detector returns INDICES not modified words; the editor
 *     then picks which to keep / cut. This keeps the data model
 *     append-only — undo works for free.
 */

export type FillerLanguage = 'en' | 'de' | 'es' | 'auto'

export interface FillerWord {
  word: string
  start: number
  end: number
}

export interface FillerHit {
  /** Index into the input words array. */
  index: number
  /** Normalised filler that matched (e.g. "um", "you know"). */
  match: string
  /** True when this index is the start of a multi-word phrase. */
  phraseStart: boolean
  /** Number of words covered by the phrase (1 for single-word). */
  phraseLength: number
}

export interface DetectionResult {
  hits: FillerHit[]
  /** Total seconds the audio would shrink by if all hits were cut. */
  totalSavingsSeconds: number
  /** Per-filler counts ("um": 8, "ja also": 3). */
  byMatch: Record<string, number>
  /** The language we actually used (resolved from 'auto'). */
  resolvedLanguage: Exclude<FillerLanguage, 'auto'>
}

// ─── Dictionaries ──────────────────────────────────────────────────────
//
// Per-language entries split into single-word and multi-word lists. The
// distinction matters because multi-word phrases need a sliding-window
// match against the original word sequence — single words can be a
// straight Set lookup.
//
// All entries are stored lowercase, no punctuation. The detector
// normalises input the same way before comparing.

interface FillerDict {
  /** Set of single-word fillers, lowercase. */
  singles: ReadonlySet<string>
  /** Multi-word fillers as arrays of normalised tokens. */
  multis: readonly string[][]
}

const DICTIONARIES: Record<Exclude<FillerLanguage, 'auto'>, FillerDict> = {
  en: {
    singles: new Set([
      'um',
      'umm',
      'uh',
      'uhh',
      'uhm',
      'er',
      'ah',
      'eh',
      'hmm',
      'mhm',
      'like',
      'basically',
      'literally',
      'actually',
      'kinda',
      'sorta',
      'honestly',
      'right',
    ]),
    multis: [
      ['you', 'know'],
      ['i', 'mean'],
      ['kind', 'of'],
      ['sort', 'of'],
      ['or', 'something'],
      ['you', 'know', 'what', 'i', 'mean'],
    ],
  },
  de: {
    singles: new Set([
      'äh',
      'ähm',
      'ähh',
      'em',
      'eh',
      'hm',
      'halt',
      'also',
      'sozusagen',
      'eigentlich',
      'irgendwie',
      'quasi',
      'genau',
      'nun',
    ]),
    multis: [
      ['ja', 'also'],
      ['na', 'ja'],
      ['ich', 'mein'],
      ['ich', 'meine'],
      ['weisst', 'du'],
      ['weißt', 'du'],
      // "ja, also" is a very common talking-head opener; both
      // orderings are real in transcripts.
      ['also', 'ja'],
    ],
  },
  es: {
    singles: new Set([
      'eh',
      'ehh',
      'este',
      'esto',
      'pues',
      'bueno',
      'entonces',
      'digamos',
      'osea',
    ]),
    multis: [
      ['o', 'sea'],
      ['es', 'decir'],
      ['por', 'así', 'decirlo'],
      ['más', 'o', 'menos'],
      ['no', 'sé'],
    ],
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────

/**
 * Normalise a single token for comparison. Strips punctuation around
 * the edges and lowercases. We keep accented letters intact so German
 * "ä/ö/ü" and Spanish "í/é" still match.
 */
function normalize(token: string): string {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase()
}

/**
 * Try to detect the language from the input words. Looks at how many
 * tokens in the first ~80 words appear in each dictionary's single
 * set. Whichever dictionary scores highest wins. Falls back to 'en'
 * if everything ties at zero.
 */
function detectLanguage(
  words: FillerWord[],
): Exclude<FillerLanguage, 'auto'> {
  const sample = words.slice(0, 80).map((w) => normalize(w.word))
  const scores: Record<Exclude<FillerLanguage, 'auto'>, number> = {
    en: 0,
    de: 0,
    es: 0,
  }
  for (const t of sample) {
    if (DICTIONARIES.en.singles.has(t)) scores.en++
    if (DICTIONARIES.de.singles.has(t)) scores.de++
    if (DICTIONARIES.es.singles.has(t)) scores.es++
  }
  let best: Exclude<FillerLanguage, 'auto'> = 'en'
  let bestScore = -1
  for (const [lang, score] of Object.entries(scores) as Array<
    [Exclude<FillerLanguage, 'auto'>, number]
  >) {
    if (score > bestScore) {
      best = lang
      bestScore = score
    }
  }
  return best
}

// ─── Main entry ────────────────────────────────────────────────────────

/**
 * Detect filler words and phrases in a word-level transcript.
 *
 * @param words   Word timings from Whisper or compatible.
 * @param language ISO code (or 'auto' to detect from the transcript).
 * @returns A list of indices to consider cutting plus aggregate stats.
 */
export function detectFillers(
  words: FillerWord[],
  language: FillerLanguage = 'auto',
): DetectionResult {
  if (words.length === 0) {
    return {
      hits: [],
      totalSavingsSeconds: 0,
      byMatch: {},
      resolvedLanguage: language === 'auto' ? 'en' : language,
    }
  }

  const resolved =
    language === 'auto' ? detectLanguage(words) : language
  const dict = DICTIONARIES[resolved]
  const normalised = words.map((w) => normalize(w.word))

  const taken = new Set<number>()
  const hits: FillerHit[] = []
  const byMatch: Record<string, number> = {}
  let totalSavings = 0

  // Pass 1 — multi-word phrases. We test longest first so e.g.
  // "you know what i mean" beats the bare "you know".
  const multis = [...dict.multis].sort((a, b) => b.length - a.length)
  for (const phrase of multis) {
    if (phrase.length === 0) continue
    for (let i = 0; i + phrase.length <= normalised.length; i++) {
      let match = true
      for (let k = 0; k < phrase.length; k++) {
        if (normalised[i + k] !== phrase[k]) {
          match = false
          break
        }
      }
      if (!match) continue
      // Skip if any word in the window is already claimed.
      let conflict = false
      for (let k = 0; k < phrase.length; k++) {
        if (taken.has(i + k)) {
          conflict = true
          break
        }
      }
      if (conflict) continue
      const matchKey = phrase.join(' ')
      byMatch[matchKey] = (byMatch[matchKey] ?? 0) + 1
      const last = words[i + phrase.length - 1]!
      const first = words[i]!
      totalSavings += last.end - first.start
      for (let k = 0; k < phrase.length; k++) {
        taken.add(i + k)
        hits.push({
          index: i + k,
          match: matchKey,
          phraseStart: k === 0,
          phraseLength: phrase.length,
        })
      }
    }
  }

  // Pass 2 — single-word fillers. Skip indices already absorbed by
  // a phrase match.
  for (let i = 0; i < normalised.length; i++) {
    if (taken.has(i)) continue
    const t = normalised[i]!
    if (!dict.singles.has(t)) continue
    const w = words[i]!
    byMatch[t] = (byMatch[t] ?? 0) + 1
    totalSavings += w.end - w.start
    taken.add(i)
    hits.push({
      index: i,
      match: t,
      phraseStart: true,
      phraseLength: 1,
    })
  }

  // Sort hits by index so callers can iterate in transcript order.
  hits.sort((a, b) => a.index - b.index)

  return {
    hits,
    totalSavingsSeconds: totalSavings,
    byMatch,
    resolvedLanguage: resolved,
  }
}

/**
 * Convert hits + a "kept indices" set into a list of merged time ranges
 * to KEEP — the inverse of what to cut. Adjacent kept words are merged
 * with a small slack window so the cut points don't introduce an audio
 * pop on every cut. Used by the renderer to build a Shotstack edit
 * timeline.
 */
export interface KeepRange {
  start: number
  end: number
}

export function buildKeepRanges(
  words: FillerWord[],
  cutIndices: ReadonlySet<number>,
  /**
   * Slack in seconds added on each side of a cut. Whisper's word
   * boundaries are tight; without slack we get audible clicks when a
   * fricative gets clipped. 30ms is a good default.
   */
  slack: number = 0.03,
): KeepRange[] {
  if (words.length === 0) return []
  const ranges: KeepRange[] = []
  let openStart: number | null = null
  for (let i = 0; i < words.length; i++) {
    const cut = cutIndices.has(i)
    const w = words[i]!
    if (!cut) {
      if (openStart === null) openStart = Math.max(0, w.start - slack)
      // extend to current word's end
    } else if (openStart !== null) {
      // close range at the previous word's end
      const prev = words[i - 1]!
      ranges.push({ start: openStart, end: prev.end + slack })
      openStart = null
    }
  }
  if (openStart !== null) {
    const last = words[words.length - 1]!
    ranges.push({ start: openStart, end: last.end + slack })
  }
  return ranges
}
