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

type SubtitleStyle = 'classic' | 'bold-yellow' | 'minimal'

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

const STYLE_CLASSES: Record<SubtitleStyle, string> = {
  'classic':
    'text-white text-[1.1rem] font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]',
  'bold-yellow':
    'text-yellow-300 text-[1.1rem] font-extrabold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,1)] [text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]',
  'minimal':
    'text-white/90 text-sm font-normal',
}

const STYLE_BG: Record<SubtitleStyle, string> = {
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
  wordTimestamps: _wordTimestamps,
}: SubtitlesClientProps) {
  const [cues, setCues] = useState<SubtitleCue[] | null>(initialCues)
  const [srt, setSrt] = useState<string | null>(initialSrt)
  const [vtt, setVtt] = useState<string | null>(initialVtt)
  const [error, setError] = useState<string | null>(null)
  const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null)
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('classic')
  const [showCueList, setShowCueList] = useState(false)
  const [isEstimated, setIsEstimated] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPending, startTransition] = useTransition()

  // Sync subtitle overlay with video playback
  useEffect(() => {
    const video = videoRef.current
    if (!video || !cues) return

    function onTimeUpdate() {
      const t = video!.currentTime
      const active = cues!.find((c) => t >= c.start && t <= c.end) ?? null
      setCurrentCue(active)
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
            <p className="text-xs text-amber-600 dark:text-amber-400">
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
            {/* Style selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Style:</span>
              {(['classic', 'bold-yellow', 'minimal'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSubtitleStyle(s)}
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                    subtitleStyle === s
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {s === 'classic' ? 'Classic' : s === 'bold-yellow' ? 'Bold Yellow' : 'Minimal'}
                </button>
              ))}
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
              {/* Subtitle overlay */}
              {currentCue && (
                <div
                  className="pointer-events-none absolute bottom-[12%] left-0 right-0 flex justify-center px-4"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span className={`${STYLE_BG[subtitleStyle]} ${STYLE_CLASSES[subtitleStyle]} text-center`}>
                    {currentCue.text}
                  </span>
                </div>
              )}
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
