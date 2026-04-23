'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Check, Loader2, RotateCcw, X } from 'lucide-react'

import {
  adjustHighlightAction,
  type AdjustHighlightState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/highlights/actions'
import {
  chunkWordsForCaptions,
  type CaptionChunk,
  type WordTiming,
} from '@/lib/highlights/caption-chunks'
import type { HighlightRow } from '@/lib/highlights/list-highlights'

interface ClipPreviewEditorProps {
  workspaceId: string
  highlight: HighlightRow
  sourceVideoUrl: string
  /** Whisper word-level timings for the parent content item. Lets
   *  the caption chunk editor show the AI's default chunks so the
   *  user can correct them line-by-line. Null when unavailable —
   *  the caption editor hides and only the single-line override
   *  (Phase A1) is offered. */
  wordTimings: WordTiming[] | null
  onClose: () => void
}

/**
 * Fullscreen modal-style editor that plays the SOURCE video (not the
 * rendered clip — we haven't rendered yet) and lets the user:
 *   1. Drag the start/end handles on a timeline to tune bounds
 *   2. Drag a vertical crop-guide to reposition the 9:16 framing
 *   3. Edit the hook text
 *   4. Pick a caption style
 * Saves via adjustHighlightAction — renders happen from the card.
 */
export function ClipPreviewEditor({
  workspaceId,
  highlight,
  sourceVideoUrl,
  wordTimings,
  onClose,
}: ClipPreviewEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Local state mirrors the row and gets submitted on save.
  const [start, setStart] = useState(highlight.start_seconds)
  const [end, setEnd] = useState(highlight.end_seconds)
  const [cropX, setCropX] = useState<number | null>(highlight.crop_x ?? 0)
  const [hookText, setHookText] = useState(highlight.hook_text ?? '')
  const [captionStyle, setCaptionStyle] = useState(highlight.caption_style)
  const [duration, setDuration] = useState<number | null>(null)

  // Phase A1 edits — these live on highlight.metadata.edits jsonb.
  // Populate from existing row if the user has tuned this clip before.
  const initialEdits = readEdits(highlight)
  const [customCaption, setCustomCaption] = useState<string>(
    initialEdits.customCaptionText ?? '',
  )
  const [audioGainDb, setAudioGainDb] = useState<number>(
    initialEdits.audioGainDb ?? 0,
  )
  const [thumbSeconds, setThumbSeconds] = useState<number>(
    initialEdits.thumbnailSeconds ?? 1.5,
  )

  // Phase A2 — caption chunks (editable list of the AI's karaoke
  // lines). Default to whatever already persists on the row; fall
  // back to the auto-chunked lines from wordTimings. When the user
  // hasn't tweaked anything, captionChunks stays at the computed
  // default and we DON'T send it on save (null = keep auto).
  const autoChunks = useMemo<CaptionChunk[]>(() => {
    if (!wordTimings) return []
    return chunkWordsForCaptions(
      wordTimings,
      highlight.start_seconds,
      highlight.end_seconds,
    )
  }, [wordTimings, highlight.start_seconds, highlight.end_seconds])

  const [captionChunks, setCaptionChunks] = useState<CaptionChunk[]>(
    initialEdits.captionChunks ?? autoChunks,
  )
  const [captionsEdited, setCaptionsEdited] = useState<boolean>(
    Boolean(initialEdits.captionChunks),
  )

  // The source clip's total duration — we need it to scale the
  // timeline scrubber. Comes from the video element once metadata
  // loads. Fallback to clip end × 1.5 so the slider is usable before
  // metadata arrives.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onMeta = () => setDuration(v.duration || null)
    v.addEventListener('loadedmetadata', onMeta)
    return () => v.removeEventListener('loadedmetadata', onMeta)
  }, [])

  // When the user tweaks start, seek to show them the new first frame.
  function previewStart() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = start
    v.play().catch(() => {})
    // Stop at end so the preview doesn't run past the clip.
    const stopAt = () => {
      if (v.currentTime >= end) {
        v.pause()
        v.removeEventListener('timeupdate', stopAt)
      }
    }
    v.addEventListener('timeupdate', stopAt)
  }

  const [state, formAction] = useFormState<AdjustHighlightState, FormData>(
    adjustHighlightAction,
    {},
  )

  useEffect(() => {
    if (state?.ok === true) onClose()
  }, [state, onClose])

  const sourceDuration = duration ?? Math.max(end * 1.5, 60)
  const clipLength = Math.max(end - start, 0.1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex w-full max-w-3xl flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 px-5 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Preview &amp; adjust
            </p>
            <h2 className="text-lg font-bold">{highlight.hook_text ?? 'Untitled clip'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Video preview with 9:16 crop overlay */}
        <div className="relative mx-5 overflow-hidden rounded-xl bg-black">
          <video
            ref={videoRef}
            src={sourceVideoUrl}
            controls
            preload="metadata"
            className="block max-h-[50vh] w-full"
          />
          {/* Crop guide — a 9:16 window drawn over the 16:9 video. Only
              visible for 9:16 output. The user drags the whole window
              horizontally; cropX is -0.5..0.5 relative to the source. */}
          {highlight.aspect_ratio === '9:16' ? (
            <CropGuide cropX={cropX ?? 0} onChange={setCropX} />
          ) : null}
        </div>

        {/* Timeline — start/end range handles */}
        <div className="space-y-3 px-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Clip bounds
              </p>
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {formatTime(start)} – {formatTime(end)} · {clipLength.toFixed(1)}s
              </p>
            </div>
            <div className="relative h-8 rounded-lg bg-muted/40">
              {/* Selected range */}
              <div
                className="absolute top-0 h-full rounded-lg bg-primary/20 ring-1 ring-primary/30"
                style={{
                  left: `${(start / sourceDuration) * 100}%`,
                  width: `${((end - start) / sourceDuration) * 100}%`,
                }}
              />
              {/* Start handle */}
              <input
                type="range"
                min={0}
                max={Math.max(end - 5, 1)}
                step={0.1}
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                onMouseUp={previewStart}
                onTouchEnd={previewStart}
                className="absolute inset-0 w-full opacity-0"
                aria-label="Clip start"
              />
              {/* End handle */}
              <input
                type="range"
                min={start + 5}
                max={sourceDuration}
                step={0.1}
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0"
                aria-label="Clip end"
              />
            </div>
            {/* Accessible number inputs — the range inputs above are
                visual drags; these let keyboard users set exact times. */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                Start
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={Math.max(end - 5, 0)}
                  value={start.toFixed(1)}
                  onChange={(e) => setStart(Number(e.target.value))}
                  className="h-7 w-20 rounded-md border border-border/60 bg-background px-2 font-mono text-[11px] tabular-nums"
                />
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                End
                <input
                  type="number"
                  step={0.1}
                  min={start + 5}
                  max={sourceDuration}
                  value={end.toFixed(1)}
                  onChange={(e) => setEnd(Number(e.target.value))}
                  className="h-7 w-20 rounded-md border border-border/60 bg-background px-2 font-mono text-[11px] tabular-nums"
                />
              </label>
              <p className="ml-auto text-[10.5px] text-muted-foreground/60">
                5s minimum · 180s maximum
              </p>
            </div>
          </div>

          {/* Hook text */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Hook overlay (first 2.5s)
            </label>
            <input
              type="text"
              maxLength={120}
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="3–7 word teaser"
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* ── Phase A1 — advanced tuning below ── */}

          {/* Custom caption override */}
          <div className="space-y-1 pt-2">
            <div className="flex items-baseline justify-between">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Custom caption (override)
              </label>
              <span className="text-[10.5px] text-muted-foreground/60">
                Leave empty to use the word-level lines below
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={500}
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Type one caption that shows across the full clip…"
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Caption Chunk Editor (Phase A2) — only when we have word
              timings AND the user hasn't switched to single-line mode
              (non-empty custom caption would override these anyway). */}
          {wordTimings && wordTimings.length > 0 && !customCaption.trim() ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                  Caption lines ({captionChunks.length})
                </label>
                {captionsEdited ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCaptionChunks(autoChunks)
                      setCaptionsEdited(false)
                    }}
                    className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    Reset to AI
                  </button>
                ) : (
                  <span className="text-[10.5px] text-muted-foreground/60">
                    Fix typos or rewrite what Whisper heard wrong
                  </span>
                )}
              </div>
              <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-1.5">
                {captionChunks.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md bg-background px-2 py-1"
                  >
                    <span className="w-12 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/60">
                      {chunk.startSeconds.toFixed(1)}s
                    </span>
                    <input
                      type="text"
                      maxLength={120}
                      value={chunk.text}
                      onChange={(e) => {
                        const next = [...captionChunks]
                        next[idx] = { ...chunk, text: e.target.value }
                        setCaptionChunks(next)
                        setCaptionsEdited(true)
                      }}
                      className="flex-1 bg-transparent text-[12.5px] focus:outline-none"
                      aria-label={`Caption line ${idx + 1}`}
                    />
                    <span className="shrink-0 font-mono text-[9.5px] tabular-nums text-muted-foreground/50">
                      {chunk.lengthSeconds.toFixed(1)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Audio gain */}
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Audio level
              </label>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {audioGainDb === 0
                  ? '0 dB · original'
                  : `${audioGainDb > 0 ? '+' : ''}${audioGainDb.toFixed(1)} dB`}
              </span>
            </div>
            <input
              type="range"
              min={-20}
              max={10}
              step={0.5}
              value={audioGainDb}
              onChange={(e) => setAudioGainDb(Number(e.target.value))}
              className="block w-full accent-[var(--lv2-primary,#2A1A3D)]"
              aria-label="Audio gain in decibels"
            />
            <div className="flex justify-between font-mono text-[9.5px] text-muted-foreground/60">
              <span>-20 dB · quiet</span>
              <span>0 · original</span>
              <span>+10 dB · loud</span>
            </div>
          </div>

          {/* Thumbnail timestamp picker */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                Thumbnail frame
              </label>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                at {thumbSeconds.toFixed(1)}s into the clip
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(clipLength - 0.1, 0.1)}
              step={0.1}
              value={Math.min(thumbSeconds, Math.max(clipLength - 0.1, 0.1))}
              onChange={(e) => {
                const next = Number(e.target.value)
                setThumbSeconds(next)
                // Jump the preview video to that timestamp so the
                // user sees the frame they're picking.
                const v = videoRef.current
                if (v) {
                  v.currentTime = start + next
                  v.pause()
                }
              }}
              className="block w-full accent-[var(--lv2-primary,#2A1A3D)]"
              aria-label="Thumbnail capture time"
            />
            <p className="text-[10.5px] text-muted-foreground/70">
              Scrub to pick the frame Shotstack uses as the poster on
              platforms that support it (YouTube, LinkedIn, email).
            </p>
          </div>
        </div>

        {/* Submit bar */}
        <form action={formAction} className="flex items-center justify-between gap-3 border-t border-border/50 bg-muted/20 px-5 py-3">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="highlight_id" value={highlight.id} />
          <input type="hidden" name="start_seconds" value={start} />
          <input type="hidden" name="end_seconds" value={end} />
          <input type="hidden" name="crop_x" value={cropX ?? ''} />
          <input type="hidden" name="hook_text" value={hookText} />
          <input type="hidden" name="caption_style" value={captionStyle} />
          {/* Phase A1 edits */}
          <input
            type="hidden"
            name="custom_caption_text"
            value={customCaption.trim()}
          />
          <input type="hidden" name="audio_gain_db" value={audioGainDb} />
          <input
            type="hidden"
            name="thumbnail_seconds"
            value={Math.min(thumbSeconds, Math.max(clipLength - 0.1, 0.1))}
          />
          {/* Phase A2 edits.
              - caption_chunks: JSON only when user actually edited
                a line; otherwise empty string = keep auto.
              - broll_overlays: same pattern. */}
          <input
            type="hidden"
            name="caption_chunks"
            value={captionsEdited ? JSON.stringify(captionChunks) : ''}
          />

          <CaptionStylePicker value={captionStyle} onChange={setCaptionStyle} />
          <div className="flex items-center gap-2">
            {state?.ok === false && state.error ? (
              <span className="text-[11px] text-destructive">{state.error}</span>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <SaveSubmit />
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function CropGuide({
  cropX,
  onChange,
}: {
  cropX: number
  onChange: (x: number) => void
}) {
  // The 9:16 window inside a 16:9 video is 9/16 of the width = 56.25%.
  // cropX -0.5 = far-left, 0 = center, +0.5 = far-right. We map that
  // to a left-offset percentage.
  const windowWidthPct = (9 / 16) * (9 / 16) * 100 // 31.64% — 9:16 on 16:9
  // Actually for 16:9 source → 9:16 output, visible fraction is
  // (9/16) / (16/9) = 81/256 ≈ 31.6% of horizontal width.
  const windowWidth = windowWidthPct // already in %
  // Center of window: 50% + cropX*(100% - windowWidth)
  const maxShift = 100 - windowWidth
  const leftPct = Math.max(
    0,
    Math.min(100 - windowWidth, 50 - windowWidth / 2 + cropX * maxShift),
  )

  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return
    function onMove(e: MouseEvent | TouchEvent) {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const clientX =
        'touches' in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX
      const pct = ((clientX - rect.left) / rect.width) * 100
      const newLeft = Math.max(0, Math.min(100 - windowWidth, pct - windowWidth / 2))
      // Invert the leftPct → cropX calculation.
      const newCropX = (newLeft - (50 - windowWidth / 2)) / maxShift
      onChange(Math.max(-0.5, Math.min(0.5, newCropX)))
    }
    function onUp() {
      setDragging(false)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging, maxShift, windowWidth, onChange])

  return (
    <div ref={trackRef} className="pointer-events-none absolute inset-0">
      {/* Darkened zones outside the crop window */}
      <div
        className="absolute inset-y-0 left-0 bg-black/60"
        style={{ width: `${leftPct}%` }}
      />
      <div
        className="absolute inset-y-0 right-0 bg-black/60"
        style={{ width: `${100 - leftPct - windowWidth}%` }}
      />
      {/* The crop window */}
      <div
        className="pointer-events-auto absolute inset-y-0 cursor-grab border-2 border-[#D6FF3E]/80 ring-1 ring-black/10 active:cursor-grabbing"
        style={{
          left: `${leftPct}%`,
          width: `${windowWidth}%`,
        }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[10px] text-[#D6FF3E]">
          9:16 crop
        </span>
      </div>
    </div>
  )
}

function CaptionStylePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const styles = [
    { id: 'tiktok-bold', label: 'TikTok Bold' },
    { id: 'minimal', label: 'Minimal' },
    { id: 'neon', label: 'Neon' },
    { id: 'white-bar', label: 'White Bar' },
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {styles.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-all ${
            value === s.id
              ? 'bg-primary text-primary-foreground ring-2 ring-primary/20'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

function SaveSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" /> Save edits
        </>
      )}
    </button>
  )
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/**
 * Pull Phase A1 edits out of highlight.metadata.edits, safely. The
 * metadata column is Json | null so every access needs shape-checks.
 */
function readEdits(highlight: HighlightRow): {
  customCaptionText: string | null
  audioGainDb: number | null
  thumbnailSeconds: number | null
  captionChunks: CaptionChunk[] | null
  brollOverlays: BRollOverlay[] | null
} {
  const empty = {
    customCaptionText: null,
    audioGainDb: null,
    thumbnailSeconds: null,
    captionChunks: null,
    brollOverlays: null,
  }
  const meta = (highlight as unknown as { metadata?: unknown }).metadata
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return empty
  const edits = (meta as Record<string, unknown>).edits
  if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return empty
  const e = edits as Record<string, unknown>

  let chunks: CaptionChunk[] | null = null
  if (Array.isArray(e.captionChunks)) {
    chunks = (e.captionChunks as unknown[])
      .filter(
        (c): c is CaptionChunk =>
          typeof c === 'object' &&
          c !== null &&
          typeof (c as { text?: unknown }).text === 'string' &&
          typeof (c as { startSeconds?: unknown }).startSeconds === 'number' &&
          typeof (c as { lengthSeconds?: unknown }).lengthSeconds === 'number',
      )
      .map((c) => ({
        text: c.text,
        startSeconds: c.startSeconds,
        lengthSeconds: c.lengthSeconds,
      }))
    if (chunks.length === 0) chunks = null
  }

  let overlays: BRollOverlay[] | null = null
  if (Array.isArray(e.brollOverlays)) {
    overlays = (e.brollOverlays as unknown[])
      .filter(
        (o): o is BRollOverlay =>
          typeof o === 'object' &&
          o !== null &&
          typeof (o as { videoUrl?: unknown }).videoUrl === 'string' &&
          typeof (o as { startSeconds?: unknown }).startSeconds === 'number' &&
          typeof (o as { lengthSeconds?: unknown }).lengthSeconds === 'number' &&
          typeof (o as { opacity?: unknown }).opacity === 'number',
      )
      .map((o) => ({
        videoUrl: o.videoUrl,
        thumbnailUrl: (o as { thumbnailUrl?: string }).thumbnailUrl,
        startSeconds: o.startSeconds,
        lengthSeconds: o.lengthSeconds,
        opacity: o.opacity,
        kind:
          (o as { kind?: string }).kind === 'image' ? ('image' as const) : ('video' as const),
      }))
    if (overlays.length === 0) overlays = null
  }

  return {
    customCaptionText:
      typeof e.customCaptionText === 'string' ? e.customCaptionText : null,
    audioGainDb: typeof e.audioGainDb === 'number' ? e.audioGainDb : null,
    thumbnailSeconds:
      typeof e.thumbnailSeconds === 'number' ? e.thumbnailSeconds : null,
    captionChunks: chunks,
    brollOverlays: overlays,
  }
}

/** Matches the shape persisted in metadata.edits.brollOverlays. */
export interface BRollOverlay {
  videoUrl: string
  thumbnailUrl?: string
  startSeconds: number
  lengthSeconds: number
  opacity: number
  kind: 'video' | 'image'
}
