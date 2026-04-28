import 'server-only'

import {
  buildAnimatedSubtitlesFromWords,
  submitRender,
  type CaptionStyle as ShotstackCaptionStyle,
  type ShotstackSubtitle,
} from './shotstack-render'

/**
 * UI-style enum used by the Subtitles editor. Mirrors the styles the
 * user sees in the browser preview. We translate to the lower-level
 * Shotstack `CaptionStyle` inside burnCaptions so callers don't have
 * to know about the render-engine names.
 */
export type SubtitleUiStyle =
  | 'classic'
  | 'bold-yellow'
  | 'minimal'
  | 'karaoke'
  | 'tiktok-bold'
  | 'beasty'

const ANIMATED_UI_STYLES: ReadonlySet<SubtitleUiStyle> = new Set([
  'karaoke',
  'beasty',
])

/**
 * Map the editor's UI style names to Shotstack's render-engine style
 * names. The two used to drift; centralising this here so adding a
 * new editor style is a single change.
 */
function uiToRenderStyle(ui: SubtitleUiStyle): ShotstackCaptionStyle {
  switch (ui) {
    case 'classic':
      return 'white-bar'
    case 'bold-yellow':
      return 'neon'
    case 'minimal':
      return 'minimal'
    case 'tiktok-bold':
      return 'tiktok-bold'
    case 'karaoke':
      return 'karaoke'
    case 'beasty':
      return 'beasty'
  }
}

/**
 * Burns captions onto a video using Shotstack.
 *
 * Two input modes:
 *
 *   1. Cue mode (default) — pass `subtitles` (array of {text,start,end}).
 *      Each cue becomes one rendered clip in the chosen UI style.
 *
 *   2. Word-level mode — pass `wordTimings` and an animated UI style
 *      (`karaoke`, `beasty`). Each WORD becomes its own clip, so the
 *      final MP4 reads as word-by-word animation when played back at
 *      video rate. Falls back to cue mode automatically if word
 *      timings are missing.
 */
export async function burnCaptions(params: {
  videoUrl: string
  subtitles: Array<{ text: string; start: number; end: number }>
  wordTimings?: Array<{ word: string; start: number; end: number }>
  uiStyle?: SubtitleUiStyle
  aspectRatio?: '16:9' | '9:16' | '1:1'
}): Promise<{ ok: true; renderId: string } | { ok: false; error: string }> {
  const { videoUrl, subtitles, wordTimings, aspectRatio } = params
  const uiStyle = params.uiStyle ?? 'classic'
  const renderStyle = uiToRenderStyle(uiStyle)

  // Calculate total duration from last subtitle end (or last word for
  // animated mode) — whichever extends further. Floor at 10s so a
  // very short clip still gets a sensible timeline length.
  const lastSub = subtitles.length > 0 ? Math.max(...subtitles.map((s) => s.end)) : 0
  const lastWord =
    wordTimings && wordTimings.length > 0
      ? Math.max(...wordTimings.map((w) => w.end))
      : 0
  const totalDuration = Math.max(lastSub, lastWord, 10)

  // Pick the subtitle clip set: animated styles consume word timings
  // (one clip per word); static styles consume cues (one clip per
  // line). If an animated style was requested but word timings are
  // missing, fall back to cues so the user still gets a render.
  const useAnimated =
    ANIMATED_UI_STYLES.has(uiStyle) && wordTimings && wordTimings.length > 0
  const shotstackSubtitles: ShotstackSubtitle[] = useAnimated
    ? buildAnimatedSubtitlesFromWords(
        wordTimings!,
        uiStyle as 'karaoke' | 'beasty',
      )
    : subtitles.map((sub) => ({
        text: sub.text,
        start: sub.start,
        length: Math.max(sub.end - sub.start, 0.5),
      }))

  return submitRender({
    clips: [
      {
        type: 'video',
        src: videoUrl,
        start: 0,
        length: totalDuration,
        fit: 'cover',
      },
    ],
    subtitles: shotstackSubtitles,
    captionStyle: renderStyle,
    aspectRatio: aspectRatio ?? '9:16',
  })
}
