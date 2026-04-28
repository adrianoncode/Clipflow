'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import {
  AlertCircle,
  Clapperboard,
  Download,
  Loader2,
  Pencil,
  Send,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react'

import {
  deleteHighlightAction,
  publishHighlightAction,
  renderAllHighlightsAction,
  renderHighlightAction,
  type PublishHighlightState,
  type RenderAllState,
  type RenderHighlightState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/highlights/actions'
import { ClipPreviewEditor } from '@/components/highlights/clip-preview-editor'
import type { WordTiming } from '@/lib/highlights/caption-chunks'
import type { HighlightRow } from '@/lib/highlights/list-highlights'

interface HighlightsListProps {
  workspaceId: string
  contentId: string
  items: HighlightRow[]
  canEdit: boolean
  /** Signed source URL — needed by the preview editor to play the
   *  original video. Null when there's no source (text/audio only). */
  sourceVideoUrl: string | null
  /** Word-level transcript — powers the caption chunk editor. Null
   *  when the content was imported as text or subtitles haven't been
   *  generated yet. The editor falls back to single-line override. */
  wordTimings: WordTiming[] | null
}

export function HighlightsList({
  workspaceId,
  contentId,
  items,
  canEdit,
  sourceVideoUrl,
  wordTimings,
}: HighlightsListProps) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = items.find((h) => h.id === editingId) ?? null

  // Poll while any card is in `rendering`. We key the effect on a
  // boolean-signature instead of the full `items` array so a parent
  // re-render (unrelated prop churn) can't tear down and rebuild the
  // 8s interval mid-cycle, skewing the poll cadence indefinitely.
  const hasPending = items.some((i) => i.status === 'rendering')
  useEffect(() => {
    if (!hasPending) return
    const interval = setInterval(() => router.refresh(), 8_000)
    return () => clearInterval(interval)
  }, [hasPending, router])

  const draftCount = items.filter(
    (h) => h.status === 'draft' || h.status === 'failed',
  ).length

  if (items.length === 0) {
    return <HighlightsEmptyPreview />
  }

  return (
    <>
      {/* Batch render bar — only show when there's work to batch */}
      {canEdit && draftCount >= 2 ? (
        <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-foreground">
              {draftCount} clip{draftCount === 1 ? '' : 's'} ready to render
            </p>
          </div>
          <RenderAllButton workspaceId={workspaceId} contentId={contentId} />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((h) => (
          <HighlightCard
            key={h.id}
            workspaceId={workspaceId}
            contentId={contentId}
            highlight={h}
            canEdit={canEdit}
            canPreview={Boolean(sourceVideoUrl)}
            onPreview={() => setEditingId(h.id)}
          />
        ))}
      </div>

      {editing && sourceVideoUrl ? (
        <ClipPreviewEditor
          key={editing.id}
          workspaceId={workspaceId}
          highlight={editing}
          sourceVideoUrl={sourceVideoUrl}
          wordTimings={wordTimings}
          onClose={() => {
            setEditingId(null)
            router.refresh()
          }}
        />
      ) : null}
    </>
  )
}

// ---------------------------------------------------------------------------

function HighlightCard({
  workspaceId,
  highlight: h,
  canEdit,
  canPreview,
  onPreview,
}: {
  workspaceId: string
  contentId: string
  highlight: HighlightRow
  canEdit: boolean
  canPreview: boolean
  onPreview: () => void
}) {
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
        <div className="font-bold text-[10.5px] uppercase tracking-[0.1em] text-primary/85">
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
      <MediaSlot h={h} />

      {/* Actions */}
      {canEdit ? (
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {/* Ready: download + publish */}
          {h.status === 'ready' && h.video_url ? (
            <>
              <PublishButton workspaceId={workspaceId} highlight={h} />
              <a
                href={h.video_url}
                download
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
                aria-label="Download clip"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </>
          ) : (
            <>
              {canPreview && h.status !== 'rendering' ? (
                <button
                  type="button"
                  onClick={onPreview}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Preview &amp; adjust
                </button>
              ) : null}
              <RenderButton
                workspaceId={workspaceId}
                highlightId={h.id}
                isRendering={h.status === 'rendering'}
                label={h.status === 'failed' ? 'Retry render' : 'Render'}
              />
            </>
          )}
          <DeleteButton workspaceId={workspaceId} highlightId={h.id} />
        </div>
      ) : null}
    </article>
  )
}

function MediaSlot({ h }: { h: HighlightRow }) {
  if (h.status === 'ready' && h.video_url) {
    return (
      <div className="overflow-hidden rounded-xl bg-black">
        <video
          src={h.video_url}
          poster={h.thumbnail_url ?? undefined}
          controls
          className="aspect-[9/16] w-full"
          preload="metadata"
        />
      </div>
    )
  }

  if (h.status === 'rendering') {
    return (
      <div className="flex aspect-[9/16] max-h-60 items-center justify-center rounded-xl border border-border/50 bg-muted/20">
        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Rendering clip…</span>
          <span className="text-[10px] opacity-60">Usually 30–90s</span>
        </div>
      </div>
    )
  }

  if (h.status === 'failed') {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-red-200/60 bg-red-50/40 p-3 text-xs text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{h.render_error ?? 'Render failed. Retry?'}</span>
      </div>
    )
  }

  // Draft state — show a faux-phone silhouette so the card has visual weight.
  return (
    <div className="flex aspect-[9/16] max-h-60 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/[0.08]">
      <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
        <Clapperboard className="h-5 w-5 opacity-40" />
        <span className="text-[10.5px] font-medium opacity-70">Draft · not rendered</span>
      </div>
    </div>
  )
}

function RenderButton({
  workspaceId,
  highlightId,
  isRendering,
  label,
}: {
  workspaceId: string
  highlightId: string
  isRendering: boolean
  label: string
}) {
  const [state, formAction] = useFormState<RenderHighlightState, FormData>(
    renderHighlightAction,
    {},
  )
  return (
    <form action={formAction} className="flex-1 min-w-[120px]">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="highlight_id" value={highlightId} />
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
      className="cf-btn-3d cf-btn-3d-primary inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs disabled:cursor-wait disabled:opacity-70"
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

function RenderAllButton({
  workspaceId,
  contentId,
}: {
  workspaceId: string
  contentId: string
}) {
  const [state, formAction] = useFormState<RenderAllState, FormData>(
    renderAllHighlightsAction,
    {},
  )
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />
      {state?.ok === true ? (
        <span className="text-[11px] font-semibold text-emerald-600">
          Submitted {state.submitted}
          {state.failed ? ` · ${state.failed} failed` : ''}
        </span>
      ) : state?.ok === false ? (
        <span className="text-[11px] text-destructive">{state.error}</span>
      ) : null}
      <RenderAllSubmit />
    </form>
  )
}

function RenderAllSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting all…
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5" /> Render all
        </>
      )}
    </button>
  )
}

function PublishButton({
  workspaceId,
  highlight,
}: {
  workspaceId: string
  highlight: HighlightRow
}) {
  const [open, setOpen] = useState(false)
  const [caption, setCaption] = useState(highlight.hook_text ?? '')
  const [platforms, setPlatforms] = useState<string[]>([
    'tiktok',
    'instagram',
    'youtube',
  ])
  const [state, formAction] = useFormState<PublishHighlightState, FormData>(
    publishHighlightAction,
    {},
  )

  function togglePlatform(p: string) {
    setPlatforms((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cf-btn-3d cf-btn-3d-primary inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
      >
        <Send className="h-3.5 w-3.5" /> Post
      </button>
    )
  }

  return (
    <div className="w-full rounded-xl border border-border/60 bg-muted/20 p-3">
      <form action={formAction} className="space-y-2.5">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="highlight_id" value={highlight.id} />
        <input type="hidden" name="platforms" value={platforms.join(',')} />
        <div>
          <label className="font-bold text-[10px] uppercase tracking-[0.15em] text-primary/85">
            Caption
          </label>
          <textarea
            name="caption"
            rows={2}
            maxLength={2200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1 w-full resize-none rounded-md border border-border/60 bg-background p-2 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['tiktok', 'instagram', 'youtube', 'linkedin'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => togglePlatform(p)}
              className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase transition-colors ${
                platforms.includes(p)
                  ? 'bg-[#2A1A3D] text-[#D6FF3E]'
                  : 'bg-muted text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {state?.ok === false && state.error ? (
          <p className="text-[10.5px] text-destructive">{state.error}</p>
        ) : state?.ok === true ? (
          <p className="text-[10.5px] font-semibold text-emerald-600">
            Posted to {Object.keys(state.postIds).join(', ')}.
          </p>
        ) : null}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground hover:bg-muted/50"
          >
            Cancel
          </button>
          <PublishSubmit />
        </div>
      </form>
    </div>
  )
}

function PublishSubmit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" /> Posting…
        </>
      ) : (
        <>
          <Send className="h-3 w-3" /> Post now
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

/**
 * Empty state for the Highlights tab. Hero copy on the left, two
 * ghost clip cards on the right showing what AI-found moments look
 * like (timestamp range, score chip, transcript preview, render
 * button). The first card pulses subtly to suggest "this is what
 * lands here when you click Find viral moments".
 */
function HighlightsEmptyPreview() {
  const ghosts = [
    {
      range: '02:14 → 02:48',
      score: 92,
      title: '"The 3 metrics that actually matter for retention"',
      transcript:
        'So the move that doubled our retention wasn\'t fancy onboarding — it was figuring out which three numbers …',
      pulse: true,
    },
    {
      range: '08:51 → 09:22',
      score: 78,
      title: 'Pricing change story — the 2× moment',
      transcript:
        'We were terrified to raise prices. The day we did, conversion went up 19% — turns out the cheaper plan was actually …',
      pulse: false,
    },
  ]
  return (
    <div className="space-y-5">
      <div
        className="relative overflow-hidden rounded-3xl border border-border/60 bg-card"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(42,26,61,.04), 0 22px 44px -28px rgba(42,26,61,.22)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(42,26,61,.16) 0%, rgba(42,26,61,0) 60%)',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(214,255,62,.18) 0%, rgba(214,255,62,0) 60%)',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(42,26,61,.32), transparent)',
          }}
        />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
          <div className="flex flex-col">
            <span
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{
                background:
                  'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,.18) inset, 0 10px 24px -12px rgba(42,26,61,.55)',
              }}
              aria-hidden
            >
              <span
                className="pointer-events-none absolute inset-1 rounded-[14px]"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 45%)',
                }}
              />
              <Wand2 className="relative h-5 w-5" strokeWidth={1.7} />
            </span>
            <h2
              className="mt-5 text-[26px] leading-[1.06] tracking-tight sm:text-[30px]"
              style={{
                fontFamily: 'var(--font-instrument-serif), serif',
                letterSpacing: '-.015em',
                color: '#2A1A3D',
              }}
            >
              The best 30 seconds of your video, found.
            </h2>
            <p className="mt-2.5 max-w-[460px] text-[14px] leading-relaxed text-muted-foreground">
              Click <b style={{ color: '#2A1A3D' }}>Find viral moments</b> and Clipflow scans the
              transcript for hooks, emotional peaks, and quotable one-liners. Three to eight
              clip-ready segments, scored top-down.
            </p>
            <ol className="mt-6 space-y-3">
              {[
                {
                  t: 'AI scores the transcript',
                  b: 'Hook strength · pacing · sentiment · quotability — every 20–60s window gets a score.',
                },
                {
                  t: 'You preview, edit, render',
                  b: 'Trim the in/out, tweak the caption, pick a subtitle style. One click renders the MP4.',
                },
              ].map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold text-white"
                    style={{
                      background:
                        'linear-gradient(140deg, #2A1A3D 0%, #120920 100%)',
                      fontFamily:
                        'var(--font-inter-tight), var(--font-inter), sans-serif',
                      boxShadow:
                        '0 1px 0 rgba(255,255,255,.18) inset, 0 4px 10px -4px rgba(42,26,61,.55)',
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className="text-[13.5px] font-bold tracking-tight text-foreground"
                      style={{
                        fontFamily:
                          'var(--font-inter-tight), var(--font-inter), sans-serif',
                      }}
                    >
                      {s.t}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {s.b}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Ghost clip cards on the right */}
          <aside className="cf-highlights-preview relative space-y-3" aria-hidden>
            <p
              className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{
                color: '#5f5850',
                fontFamily: 'var(--font-jetbrains-mono), monospace',
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: '#D6FF3E',
                  boxShadow: '0 0 8px rgba(214,255,62,.7)',
                }}
              />
              What AI returns
            </p>
            {ghosts.map((g, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-2xl border border-border/60 bg-card ${
                  g.pulse ? 'cf-highlights-preview-pulse' : ''
                }`}
                style={{
                  opacity: 1 - i * 0.15,
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(42,26,61,.04)',
                }}
              >
                {/* Faux thumbnail strip with timecode rail */}
                <div
                  className="relative flex h-16 items-end overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
                  }}
                >
                  {/* Audio waveform mock */}
                  <svg
                    className="absolute inset-0"
                    viewBox="0 0 200 64"
                    preserveAspectRatio="none"
                    width="100%"
                    height="100%"
                  >
                    {Array.from({ length: 40 }).map((_, j) => {
                      const h = 6 + Math.abs(Math.sin(j * 0.7 + i)) * 36
                      return (
                        <rect
                          key={j}
                          x={j * 5}
                          y={32 - h / 2}
                          width="3"
                          height={h}
                          rx="1"
                          fill="#D6FF3E"
                          opacity="0.55"
                        />
                      )
                    })}
                  </svg>
                  <div className="relative z-10 flex w-full items-center justify-between px-3 pb-2">
                    <span
                      className="lv2-tabular rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm"
                      style={{
                        color: '#D6FF3E',
                        fontFamily:
                          'var(--font-jetbrains-mono), monospace',
                      }}
                    >
                      {g.range}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background: '#D6FF3E',
                        color: '#1a2000',
                      }}
                    >
                      {g.score}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <p
                    className="line-clamp-2 text-[13px] font-semibold leading-snug"
                    style={{ color: '#181511' }}
                  >
                    {g.title}
                  </p>
                  <p
                    className="line-clamp-2 text-[11px] leading-relaxed"
                    style={{ color: '#5f5850' }}
                  >
                    {g.transcript}
                  </p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
      <style jsx>{`
        @keyframes cf-highlights-pulse {
          0%,
          100% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.6) inset,
              0 1px 2px rgba(42, 26, 61, 0.04);
          }
          50% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.6) inset,
              0 0 0 1px rgba(214, 255, 62, 0.4),
              0 0 16px -2px rgba(214, 255, 62, 0.4);
          }
        }
        .cf-highlights-preview-pulse {
          animation: cf-highlights-pulse 3s
            cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-highlights-preview-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
