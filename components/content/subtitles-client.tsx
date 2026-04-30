'use client'

import { useRef, useState, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  generateSubtitlesAction,
  type GenerateSubtitlesState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/subtitles/actions'
import type { SubtitleCue } from '@/lib/subtitles/generate-subtitles'
import type { WordTimestamp } from '@/lib/ai/transcription/transcribe-with-timestamps'

type SubtitleStyle =
  | 'classic'
  | 'bold-yellow'
  | 'minimal'
  // Animated, word-level styles. They require wordTimestamps to look
  // right; if timings are missing we fall back to a per-cue render.
  | 'karaoke'
  | 'tiktok-bold'
  | 'beasty'

const ANIMATED_STYLES: ReadonlySet<SubtitleStyle> = new Set([
  'karaoke',
  'tiktok-bold',
  'beasty',
])

const STYLE_LABEL: Record<SubtitleStyle, string> = {
  classic: 'Classic',
  'bold-yellow': 'Bold Yellow',
  minimal: 'Minimal',
  karaoke: 'Karaoke',
  'tiktok-bold': 'TikTok Bold',
  beasty: 'Beasty',
}

interface SubtitlesClientProps {
  workspaceId: string
  contentId: string
  videoUrl: string | null
  initialCues: SubtitleCue[] | null
  initialSrt: string | null
  initialVtt: string | null
  wordTimestamps: WordTimestamp[] | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Static-style class maps. Animated styles use their own renderers
 * (see AnimatedSubtitleOverlay below) so they don't appear here —
 * the static lookup is keyed by a narrowed type.
 */
type StaticSubtitleStyle = Exclude<SubtitleStyle, 'karaoke' | 'tiktok-bold' | 'beasty'>

const STYLE_CLASSES: Record<StaticSubtitleStyle, string> = {
  'classic':
    'text-white text-[1.1rem] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]',
  'bold-yellow':
    'text-yellow-300 text-[1.1rem] font-extrabold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,1)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]',
  'minimal':
    'text-white/90 text-sm font-normal',
}

const STYLE_BG: Record<StaticSubtitleStyle, string> = {
  'classic': 'bg-black/60 px-3 py-1 rounded',
  'bold-yellow': 'bg-black/70 px-3 py-1.5 rounded',
  'minimal': 'bg-black/30 px-2 py-0.5 rounded',
}

export function SubtitlesClient({
  workspaceId,
  contentId,
  videoUrl,
  initialCues,
  initialSrt,
  initialVtt,
  wordTimestamps,
}: SubtitlesClientProps) {
  const [cues, setCues] = useState<SubtitleCue[] | null>(initialCues)
  const [srt, setSrt] = useState<string | null>(initialSrt)
  const [vtt, setVtt] = useState<string | null>(initialVtt)
  const [error, setError] = useState<string | null>(null)
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('classic')
  const [showCueList, setShowCueList] = useState(false)
  const [isEstimated, setIsEstimated] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPending, startTransition] = useTransition()

  const hasWordTimings = !!wordTimestamps && wordTimestamps.length > 0
  const isAnimated = ANIMATED_STYLES.has(subtitleStyle) && hasWordTimings

  // Sync subtitle overlay with video playback. We track currentTime
  // separately because the animated word-level renderers need a fast
  // ticking time, not just cue boundaries.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function onTimeUpdate() {
      const t = video!.currentTime
      setCurrentTime(t)
      if (cues) {
        const active = cues.find((c) => t >= c.start && t <= c.end) ?? null
        setCurrentCue(active)
      }
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    return () => video.removeEventListener('timeupdate', onTimeUpdate)
  }, [cues])

  const handleGenerate = useCallback(() => {
    setError(null)
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('content_id', contentId)

    startTransition(async () => {
      const result = await generateSubtitlesAction({} as GenerateSubtitlesState, fd)
      if (result.ok === true) {
        setCues(result.cues)
        setSrt(result.srt)
        setVtt(result.vtt)
        setIsEstimated(result.estimated)
      } else if (result.ok === false) {
        setError(result.error)
      }
    })
  }, [workspaceId, contentId])

  const hasSubtitles = cues !== null && cues.length > 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-8">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href={`/workspace/${workspaceId}/content/${contentId}`}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to content
        </Link>
        <h1 className="text-2xl font-bold">Animated Subtitles</h1>
        <p className="text-sm text-muted-foreground">
          Generate SRT / VTT subtitle files and preview them synced to your video.
        </p>
      </div>

      {/* Generation card */}
      <Card>
        <CardHeader>
          <CardTitle>{hasSubtitles ? 'Subtitles generated' : 'Generate subtitles'}</CardTitle>
          <CardDescription>
            {hasSubtitles
              ? 'Subtitles are ready. You can regenerate them at any time.'
              : 'Uses OpenAI Whisper with word-level timestamps for uploaded videos, or estimates timing from text for other content types.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending
              ? 'Transcribing with word-level timestamps… This may take a minute'
              : hasSubtitles
              ? 'Regenerate subtitles'
              : 'Generate subtitles'}
          </Button>
          {isEstimated && hasSubtitles && (
            <p className="text-xs text-amber-600">
              Timestamps are estimated — word-level timestamps require an uploaded video file.
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Video preview with subtitle overlay */}
      {hasSubtitles && videoUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Subtitles are overlaid on the video in real time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Style selector — split into static and animated rows
                because they're conceptually different: static styles
                render the full cue text, animated styles light up
                word-by-word using transcription word timings.
                Animated row is disabled until word timings exist. */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Static
                </span>
                {(['classic', 'bold-yellow', 'minimal'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubtitleStyle(s)}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      subtitleStyle === s
                        ? 'border-[#0F0F0F] bg-[#0F0F0F] text-[#F4D93D]'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {STYLE_LABEL[s]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Animated
                </span>
                {(['karaoke', 'tiktok-bold', 'beasty'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubtitleStyle(s)}
                    disabled={!hasWordTimings}
                    title={
                      hasWordTimings
                        ? `${STYLE_LABEL[s]} — word-by-word`
                        : 'Word-level timings not generated yet for this video.'
                    }
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      subtitleStyle === s
                        ? 'border-[#0F0F0F] bg-[#0F0F0F] text-[#F4D93D]'
                        : hasWordTimings
                          ? 'hover:bg-accent'
                          : 'cursor-not-allowed opacity-40'
                    }`}
                  >
                    {STYLE_LABEL[s]}
                  </button>
                ))}
                {!hasWordTimings ? (
                  <span className="ml-1 text-[10px] text-muted-foreground/70">
                    Needs word-level timings
                  </span>
                ) : null}
              </div>
            </div>

            {/* Video + overlay container */}
            <div className="relative w-full overflow-hidden rounded-lg bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full"
                preload="metadata"
              />
              {/* Subtitle overlay — branches on animated vs static.
                  Static styles render the active cue's full text;
                  animated styles render word-by-word using the
                  transcription word timings. */}
              {isAnimated && wordTimestamps ? (
                <AnimatedSubtitleOverlay
                  style={subtitleStyle as 'karaoke' | 'tiktok-bold' | 'beasty'}
                  words={wordTimestamps}
                  time={currentTime}
                />
              ) : currentCue && !ANIMATED_STYLES.has(subtitleStyle) ? (
                <div
                  className="pointer-events-none absolute bottom-[12%] left-0 right-0 flex justify-center px-4"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span
                    className={`${
                      STYLE_BG[subtitleStyle as StaticSubtitleStyle]
                    } ${
                      STYLE_CLASSES[subtitleStyle as StaticSubtitleStyle]
                    } text-center`}
                  >
                    {currentCue.text}
                  </span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : hasSubtitles && !videoUrl ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Video preview not available for this content type. Download the subtitle file to use in
            your video editor.
          </CardContent>
        </Card>
      ) : null}

      {/* Download section */}
      {hasSubtitles && srt && vtt ? (
        <Card>
          <CardHeader>
            <CardTitle>Download</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => downloadFile(srt, `subtitles-${contentId}.srt`, 'text/plain')}
            >
              Download SRT
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadFile(vtt, `subtitles-${contentId}.vtt`, 'text/vtt')}
            >
              Download VTT
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Cue list (collapsible) */}
      {hasSubtitles && cues ? (
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setShowCueList((v) => !v)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span>Subtitle cues ({cues.length})</span>
              <span className="text-xs font-normal text-muted-foreground">
                {showCueList ? 'Hide' : 'Show'}
              </span>
            </CardTitle>
          </CardHeader>
          {showCueList && (
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-1 pr-4 font-medium text-muted-foreground">#</th>
                      <th className="pb-1 pr-4 font-medium text-muted-foreground">Time</th>
                      <th className="pb-1 font-medium text-muted-foreground">Text</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cues.map((cue) => (
                      <tr key={cue.index} className="border-b border-border/40">
                        <td className="py-1 pr-4 text-muted-foreground">{cue.index}</td>
                        <td className="py-1 pr-4 tabular-nums text-muted-foreground">
                          {formatTime(cue.start)}
                        </td>
                        <td className="py-1">{cue.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      ) : null}
    </div>
  )
}

/* ─── Animated subtitle overlay ──────────────────────────────────────
   Three word-level styles, each rendered live in the browser using the
   transcription word timings. We pick a small "phrase window" around
   the current word so users see context, not just one word floating —
   ~6 words back, ~3 words ahead — then highlight the active word per
   style. The window scrolls with playback. Pure presentation, no
   side-effects beyond the time prop. */
function AnimatedSubtitleOverlay({
  style,
  words,
  time,
}: {
  style: 'karaoke' | 'tiktok-bold' | 'beasty'
  words: WordTimestamp[]
  time: number
}) {
  // Find the currently-spoken word (or the next one if we're between).
  let activeIdx = -1
  for (let i = 0; i < words.length; i++) {
    const w = words[i]!
    if (time >= w.start && time <= w.end + 0.05) {
      activeIdx = i
      break
    }
    if (time < w.start) {
      activeIdx = i
      break
    }
  }
  if (activeIdx < 0) return null

  // Phrase window — show a few words of context around the active one.
  const back = style === 'tiktok-bold' ? 1 : 5
  const ahead = style === 'tiktok-bold' ? 0 : 3
  const start = Math.max(0, activeIdx - back)
  const end = Math.min(words.length, activeIdx + ahead + 1)
  const window = words.slice(start, end)
  const localActive = activeIdx - start

  if (style === 'tiktok-bold') {
    // One-or-two-word burst — huge, all-caps, centered. Scales in
    // when the word becomes active; lime drop-shadow under the
    // active word so it pops on busy backgrounds.
    const w = words[activeIdx]!
    return (
      <div
        className="pointer-events-none absolute bottom-[18%] left-0 right-0 flex justify-center px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          key={activeIdx}
          className="cf-anim-tiktok inline-block text-center"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
            color: '#FFFFFF',
            fontWeight: 900,
            fontSize: 'clamp(22px, 4.2vw, 44px)',
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            textShadow:
              '0 0 14px rgba(214,255,62,.55), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
          }}
        >
          {w.word.trim()}
        </span>
        <style jsx>{`
          @keyframes cf-anim-tiktok-pop {
            from {
              transform: translateY(8px) scale(0.85);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          .cf-anim-tiktok {
            animation: cf-anim-tiktok-pop 0.18s
              cubic-bezier(0.22, 0.61, 0.36, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .cf-anim-tiktok {
              animation: none;
            }
          }
        `}</style>
      </div>
    )
  }

  if (style === 'beasty') {
    // Word colors rotate — fixed palette so the same word always
    // shows the same color across replays. Active word scales up
    // and gains a stronger shadow for emphasis.
    const palette = ['#F4D93D', '#FFFFFF', '#FF6B6B', '#7DDBFF', '#FFE66D']
    return (
      <div
        className="pointer-events-none absolute bottom-[14%] left-0 right-0 flex justify-center px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className="inline-flex flex-wrap items-end justify-center gap-1.5 text-center"
          style={{
            fontFamily:
              'var(--font-inter-tight), var(--font-inter), sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(18px, 3.4vw, 32px)',
            textTransform: 'uppercase',
            letterSpacing: '-0.005em',
          }}
        >
          {window.map((w, i) => {
            const isActive = i === localActive
            const color = palette[(start + i) % palette.length]
            return (
              <span
                key={start + i}
                className="cf-anim-beasty inline-block transition-transform"
                style={{
                  color,
                  transform: isActive ? 'scale(1.18)' : 'scale(1)',
                  textShadow: isActive
                    ? '0 0 16px rgba(214,255,62,.45), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000'
                    : '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000',
                  opacity: isActive ? 1 : 0.85,
                }}
              >
                {w.word.trim()}
              </span>
            )
          })}
        </span>
      </div>
    )
  }

  // Karaoke — classic block of words, active one gets a lime fill.
  // Words already spoken stay white; future words muted. Reads as
  // "ball bouncing along" without a literal ball.
  return (
    <div
      className="pointer-events-none absolute bottom-[12%] left-0 right-0 flex justify-center px-4"
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        className="inline-flex flex-wrap items-baseline justify-center gap-1 rounded-lg px-3 py-1.5 text-center"
        style={{
          background: 'rgba(0,0,0,.65)',
          backdropFilter: 'blur(2px)',
          fontFamily: 'var(--font-inter-tight), var(--font-inter), sans-serif',
          fontWeight: 800,
          fontSize: 'clamp(15px, 2.8vw, 26px)',
          letterSpacing: '-0.005em',
        }}
      >
        {window.map((w, i) => {
          const isActive = i === localActive
          const isPast = i < localActive
          const color = isActive
            ? '#1a2000'
            : isPast
              ? '#FFFFFF'
              : 'rgba(255,255,255,.55)'
          const background = isActive ? '#F4D93D' : 'transparent'
          return (
            <span
              key={start + i}
              className="rounded px-1 transition-colors duration-100"
              style={{
                color,
                background,
                boxShadow: isActive
                  ? '0 0 12px rgba(214,255,62,.45)'
                  : 'none',
              }}
            >
              {w.word.trim()}
            </span>
          )
        })}
      </span>
    </div>
  )
}
