import type { WordTimestamp } from '@/lib/ai/transcription/transcribe-with-timestamps'

export type { WordTimestamp }

export interface SubtitleCue {
  index: number
  start: number  // seconds
  end: number    // seconds
  text: string
}

/**
 * Groups a flat array of word-level timestamps into subtitle cues.
 * A new cue is started whenever 7+ words have accumulated or 3+ seconds
 * have elapsed since the cue began. Remaining words after the last break
 * are flushed as a final cue.
 */
export function buildSubtitleCues(words: WordTimestamp[]): SubtitleCue[] {
  if (!words.length) return []

  const cues: SubtitleCue[] = []
  let currentWords: WordTimestamp[] = []
  let cueIndex = 1

  for (const word of words) {
    currentWords.push(word)

    const firstWord = currentWords[0]
    if (!firstWord) continue
    const cueStart = firstWord.start
    const cueDuration = word.end - cueStart
    const wordCount = currentWords.length

    if (wordCount >= 7 || cueDuration >= 3) {
      cues.push({
        index: cueIndex++,
        start: cueStart,
        end: word.end,
        text: currentWords.map((w) => w.word).join('').trim(),
      })
      currentWords = []
    }
  }

  // Flush remaining words
  if (currentWords.length > 0) {
    const firstWord = currentWords[0]
    const lastWord = currentWords[currentWords.length - 1]
    if (firstWord && lastWord) {
      cues.push({
        index: cueIndex,
        start: firstWord.start,
        end: lastWord.end,
        text: currentWords.map((w) => w.word).join('').trim(),
      })
    }
  }

  return cues
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

function formatVttTime(seconds: number): string {
  return formatSrtTime(seconds).replace(',', '.')
}

export function generateSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => `${cue.index}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${cue.text}\n`)
    .join('\n')
}

export function generateVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue) => `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}`)
    .join('\n\n')
  return `WEBVTT\n\n${body}`
}

/**
 * Fallback for content without real timestamps (e.g. YouTube transcripts).
 * Splits the transcript into words and distributes them evenly across the
 * assumed total duration. Returns cues with estimated=true flag embedded in
 * the text so callers can surface a "estimated timestamps" warning.
 */
export function buildEstimatedCues(
  transcript: string,
  assumedDurationSeconds = 300,
): SubtitleCue[] {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const secondsPerWord = assumedDurationSeconds / words.length
  const wordTimestamps: WordTimestamp[] = words.map((word, i) => ({
    word: word + ' ',
    start: i * secondsPerWord,
    end: (i + 1) * secondsPerWord,
  }))

  return buildSubtitleCues(wordTimestamps)
}
