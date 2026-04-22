'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import {
  AlertCircle,
  Clapperboard,
  Download,
  Loader2,
  Trash2,
  Wand2,
} from 'lucide-react'

import {
  deleteHighlightAction,
  renderHighlightAction,
  type RenderHighlightState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/highlights/actions'
import type { HighlightRow } from '@/lib/highlights/list-highlights'

const CAPTION_STYLES = [
  { id: 'tiktok-bold', label: 'TikTok Bold', swatch: 'bg-black text-white' },
  { id: 'minimal', label: 'Minimal', swatch: 'bg-white text-black border border-black/20' },
  { id: 'neon', label: 'Neon Yellow', swatch: 'bg-black text-[#FFE600]' },
  { id: 'white-bar', label: 'White Bar', swatch: 'bg-black/80 text-white' },
] as const

interface HighlightsListProps {
  workspaceId: string
  contentId: string
  items: HighlightRow[]
  canEdit: boolean
}

export function HighlightsList({
  workspaceId,
  contentId,
  items,
  canEdit,
}: HighlightsListProps) {
  const router = useRouter()

  // Poll for any items in the `rendering` state — the Shotstack
  // webhook flips them to ready/failed but a user staring at the page
  // won't see it unless we refresh. 8s keeps it cheap; most renders
  // finish in 30-120s so 3-15 polls on average.
  useEffect(() => {
    const hasPending = items.some((i) => i.status === 'rendering')
    if (!hasPending) return
    const interval = setInterval(() => router.refresh(), 8_000)
    return () => clearInterval(interval)
  }, [items, router])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/[0.06] py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
          <Wand2 className="h-6 w-6" aria-hidden />
        </div>
        <div className="max-w-md space-y-2 px-4">
          <p className="text-lg font-bold">No viral moments yet</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Click <span className="font-semibold">Find viral moments</span> and Clipflow will
            scan the transcript for 20–60s segments with hooks, emotional peaks, and
            quotable one-liners.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((h) => (
        <HighlightCard
          key={h.id}
          workspaceId={workspaceId}
          contentId={contentId}
          highlight={h}
          canEdit={canEdit}
        />
      ))}
    </div>
  )
}

function HighlightCard({
  workspaceId,
  highlight: h,
  canEdit,
}: {
  workspaceId: string
  contentId: string
  highlight: HighlightRow
  canEdit: boolean
}) {
  const [captionStyle, setCaptionStyle] = useState<string>(h.caption_style)

  const duration = Math.max(h.end_seconds - h.start_seconds, 0)
  const score = h.virality_score ?? 0
  const scoreColor =
    score >= 80
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200/60'
      : score >= 60
        ? 'text-amber-700 bg-amber-50 border-amber-200/60'
        : 'text-muted-foreground bg-muted border-border/60'

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header: score + timing */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums ${scoreColor}`}
        >
          <span>{score}</span>
          <span className="opacity-60">/100</span>
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
          {formatSeconds(h.start_seconds)} – {formatSeconds(h.end_seconds)} ·{' '}
          {Math.round(duration)}s
        </div>
      </div>

      {/* Hook */}
      {h.hook_text ? (
        <h3 className="text-lg font-bold leading-tight text-foreground">{h.hook_text}</h3>
      ) : null}

      {/* Reason */}
      {h.reason ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{h.reason}</p>
      ) : null}

      {/* Video / rendering state */}
      {h.status === 'ready' && h.video_url ? (
        <div className="overflow-hidden rounded-xl bg-black">
          <video
            src={h.video_url}
            controls
            className="aspect-[9/16] w-full"
            preload="metadata"
          />
        </div>
      ) : h.status === 'rendering' ? (
        <div className="flex aspect-[9/16] max-h-60 items-center justify-center rounded-xl border border-border/50 bg-muted/20">
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Rendering clip…</span>
            <span className="text-[10px] opacity-60">Usually 30–90s</span>
          </div>
        </div>
      ) : h.status === 'failed' ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200/60 bg-red-50/40 p-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{h.render_error ?? 'Render failed. Retry?'}</span>
        </div>
      ) : null}

      {/* Caption-style picker — only visible when we can still render */}
      {canEdit && h.status !== 'ready' && h.status !== 'rendering' ? (
        <div className="flex flex-wrap gap-1.5">
          {CAPTION_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCaptionStyle(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-all ${
                captionStyle === s.id
                  ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                  : 'bg-muted/40 text-muted-foreground hover:bg-muted'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${s.swatch}`} aria-hidden />
              {s.label}
            </button>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      {canEdit ? (
        <div className="mt-auto flex items-center gap-2 pt-1">
          {h.status === 'ready' && h.video_url ? (
            <a
              href={h.video_url}
              download
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          ) : (
            <RenderButton
              workspaceId={workspaceId}
              highlightId={h.id}
              captionStyle={captionStyle}
              isRendering={h.status === 'rendering'}
              label={h.status === 'failed' ? 'Retry render' : 'Render clip'}
            />
          )}
          <DeleteButton workspaceId={workspaceId} highlightId={h.id} />
        </div>
      ) : null}
    </article>
  )
}

function RenderButton({
  workspaceId,
  highlightId,
  captionStyle,
  isRendering,
  label,
}: {
  workspaceId: string
  highlightId: string
  captionStyle: string
  isRendering: boolean
  label: string
}) {
  const [state, formAction] = useFormState<RenderHighlightState, FormData>(
    renderHighlightAction,
    {},
  )

  return (
    <form action={formAction} className="flex-1">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="highlight_id" value={highlightId} />
      <input type="hidden" name="caption_style" value={captionStyle} />
      <RenderSubmit isRendering={isRendering} label={label} />
      {state?.ok === false && state.error ? (
        <p className="mt-1 text-[10.5px] text-destructive">{state.error}</p>
      ) : null}
    </form>
  )
}

function RenderSubmit({ isRendering, label }: { isRendering: boolean; label: string }) {
  const { pending } = useFormStatus()
  const busy = pending || isRendering
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:-translate-y-px hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {busy ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {isRendering ? 'Rendering…' : 'Submitting…'}
        </>
      ) : (
        <>
          <Clapperboard className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  )
}

function DeleteButton({
  workspaceId,
  highlightId,
}: {
  workspaceId: string
  highlightId: string
}) {
  const [, formAction] = useFormState(deleteHighlightAction, {})
  return (
    <form action={formAction}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="highlight_id" value={highlightId} />
      <button
        type="submit"
        aria-label="Delete highlight"
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50/50 hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
