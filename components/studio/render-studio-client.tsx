'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import Link from 'next/link'
import {
  Clapperboard,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  Check,
  RefreshCw,
  Link2,
  AlertCircle,
} from 'lucide-react'

import {
  studioRenderAction,
  analyzeStyleAction,
  type StudioRenderState,
  type StyleCloneState,
  type StyleAnalysis,
} from '@/app/(app)/workspace/[id]/studio/actions'
import type { RenderRow } from '@/lib/video/renders/types'
import type { ContentItemListRow } from '@/lib/content/get-content-items'

// ── Sub-components ────────────────────────────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clapperboard className="h-4 w-4" />}
      {pending ? 'Rendering…' : label}
    </button>
  )
}

function AnalyzeButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {pending ? 'Analyzing…' : 'Analyze Style'}
    </button>
  )
}

// ── Format presets ────────────────────────────────────────────────────────────

const FORMATS = [
  { value: '9:16', label: 'TikTok', sub: '9:16 vertical' },
  { value: '9:16', label: 'Reels', sub: '9:16 vertical' },
  { value: '9:16', label: 'Shorts', sub: '9:16 vertical' },
  { value: '1:1', label: 'LinkedIn', sub: '1:1 square' },
  { value: '16:9', label: 'Landscape', sub: '16:9 wide' },
] as const

const CAPTION_STYLES = [
  {
    value: 'tiktok-bold',
    label: 'TikTok Bold',
    preview: 'BIG WHITE TEXT',
    previewStyle: 'font-black text-white',
    bg: 'bg-black',
    desc: 'Huge white text with black stroke',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    preview: 'Clean text',
    previewStyle: 'font-medium text-white/90',
    bg: 'bg-zinc-800',
    desc: 'Small clean white text',
  },
  {
    value: 'neon',
    label: 'Neon',
    preview: 'GLOW TEXT',
    previewStyle: 'font-black text-yellow-300',
    bg: 'bg-black',
    desc: 'Yellow glow effect',
  },
  {
    value: 'white-bar',
    label: 'White Bar',
    preview: 'Bar style',
    previewStyle: 'font-bold text-white',
    bg: 'bg-zinc-700/80',
    desc: 'Text on dark pill bar',
  },
] as const

// ── Render status badge ───────────────────────────────────────────────────────

function RenderStatusBadge({ status }: { status: string }) {
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <Check className="h-3 w-3" /> Done
      </span>
    )
  if (status === 'failed')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
        <AlertCircle className="h-3 w-3" /> Failed
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      <Loader2 className="h-3 w-3 animate-spin" /> Rendering
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string
  contentItems: ContentItemListRow[]
  recentRenders: RenderRow[]
  hasShotstackKey: boolean
}

export function RenderStudioClient({
  workspaceId,
  contentItems,
  recentRenders,
  hasShotstackKey,
}: Props) {
  const [selectedContentId, setSelectedContentId] = useState(contentItems[0]?.id ?? '')
  const [selectedFormat, setSelectedFormat] = useState<string>('9:16')
  const [selectedAspect, setSelectedAspect] = useState<'9:16' | '1:1' | '16:9'>('9:16')
  const [selectedStyle, setSelectedStyle] = useState<string>('tiktok-bold')
  const [hookText, setHookText] = useState('')
  const [clonedStyle, setClonedStyle] = useState<StyleAnalysis | null>(null)

  const [renderState, renderAction] = useFormState<StudioRenderState, FormData>(
    studioRenderAction,
    {},
  )
  const [cloneState, cloneAction] = useFormState<StyleCloneState, FormData>(
    analyzeStyleAction,
    {},
  )

  // When style clone succeeds, apply it
  const displayCloneState = cloneState as StyleCloneState
  const cloneAnalysis =
    displayCloneState.ok === true ? displayCloneState.analysis : clonedStyle

  function applyClonedStyle(analysis: StyleAnalysis) {
    setSelectedStyle(analysis.captionStyle)
    setSelectedAspect(analysis.aspectRatio)
    setHookText(analysis.hookExample)
    setClonedStyle(analysis)
  }

  const videoItems = contentItems.filter(
    (c) => c.status === 'ready' && (c.kind === 'video' || c.kind === 'youtube'),
  )

  return (
    <div className="space-y-8">

      {/* ── No Shotstack key warning ── */}
      {!hasShotstackKey && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Shotstack key not connected</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Add your Shotstack API key in{' '}
              <Link href="/settings/ai-keys" className="font-medium underline underline-offset-2">
                Settings → AI Keys
              </Link>{' '}
              to start rendering. Free tier available at{' '}
              <a
                href="https://dashboard.shotstack.io/register"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                shotstack.io
              </a>
              .
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          RENDER FORM
      ══════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/50 px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            One-click render
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pick a video, choose your format and style — AI adds captions and renders in ~60s.
          </p>
        </div>

        <form action={renderAction} className="space-y-6 p-6">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="aspect_ratio" value={selectedAspect} />
          <input type="hidden" name="caption_style" value={selectedStyle} />
          <input type="hidden" name="hook_text" value={hookText} />

          {/* ── Video picker ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Video
            </label>
            {videoItems.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                <Clapperboard className="h-4 w-4 shrink-0" />
                <span>
                  No ready videos yet.{' '}
                  <Link href={`/workspace/${workspaceId}/content/new`} className="font-medium text-primary underline-offset-2 hover:underline">
                    Import one →
                  </Link>
                </span>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {videoItems.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedContentId(item.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                      selectedContentId === item.id
                        ? 'border-primary/40 bg-primary/5 font-medium text-primary'
                        : 'border-border/50 hover:border-border hover:bg-accent/30'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                        selectedContentId === item.id
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {item.kind === 'youtube' ? 'YT' : '📹'}
                    </span>
                    <span className="min-w-0 truncate">{item.title ?? 'Untitled'}</span>
                    {selectedContentId === item.id && (
                      <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
            <input type="hidden" name="content_id" value={selectedContentId} />
          </div>

          {/* ── Format ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Format
            </label>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((fmt) => {
                const isSelected = selectedFormat === fmt.label
                return (
                  <button
                    key={fmt.label}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(fmt.label)
                      setSelectedAspect(fmt.value as '9:16' | '1:1' | '16:9')
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                      isSelected
                        ? 'border-primary/40 bg-primary/10 font-semibold text-primary'
                        : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    {fmt.label}
                    <span className="ml-1.5 text-[10px] opacity-60">{fmt.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Caption style ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Caption Style
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CAPTION_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSelectedStyle(s.value)}
                  className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition-all ${
                    selectedStyle === s.value
                      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  {/* Mini preview */}
                  <div className={`flex h-10 items-center justify-center rounded-lg ${s.bg} px-2`}>
                    <span className={`text-[10px] font-bold ${s.previewStyle}`}>
                      {s.preview}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Hook text ── */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hook Text{' '}
              <span className="ml-1 font-normal normal-case text-muted-foreground/70">
                (optional — shown for first 2.5s)
              </span>
            </label>
            <input
              type="text"
              value={hookText}
              onChange={(e) => setHookText(e.target.value)}
              placeholder="e.g. Nobody talks about this... 👀"
              className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Error / success */}
          {renderState.ok === false && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {renderState.error}
            </div>
          )}
          {renderState.ok === true && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <Check className="h-4 w-4 shrink-0" />
              Render queued! Check the queue below — usually ready in ~60 seconds.
            </div>
          )}

          <div className="flex items-center gap-4">
            <SubmitButton label="Render Video" />
            {!hasShotstackKey && (
              <p className="text-xs text-muted-foreground">
                Requires a Shotstack key
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STYLE CLONE
      ══════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Style Clone
            </p>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Paste a competitor&apos;s TikTok, Reel, or YouTube Short — AI extracts the visual style and applies it to your next render.
          </p>
        </div>

        <div className="p-6">
          <form action={cloneAction} className="flex gap-3">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="url"
                name="competitor_url"
                placeholder="https://www.tiktok.com/@username/video/..."
                className="w-full rounded-xl border border-border/60 bg-muted/30 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <AnalyzeButton />
          </form>

          {/* Clone error */}
          {displayCloneState.ok === false && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {displayCloneState.error}
            </div>
          )}

          {/* Clone result */}
          {cloneAnalysis && (
            <div className="mt-4 space-y-4 rounded-xl border border-primary/20 bg-primary/3 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-primary">Style analyzed ✓</p>
                <button
                  type="button"
                  onClick={() => applyClonedStyle(cloneAnalysis)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Check className="h-3 w-3" />
                  Apply style
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { label: 'Caption Style', value: cloneAnalysis.captionStyleLabel },
                  { label: 'Hook Type', value: cloneAnalysis.hookType },
                  { label: 'Pacing', value: cloneAnalysis.pacing },
                  { label: 'Vibe', value: cloneAnalysis.vibe },
                ].map((row) => (
                  <div key={row.label} className="rounded-lg bg-background/60 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="mt-0.5 text-sm">{row.value}</p>
                  </div>
                ))}
              </div>
              {cloneAnalysis.hookExample && (
                <div className="rounded-lg bg-background/60 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Hook Example (click to use)
                  </p>
                  <button
                    type="button"
                    onClick={() => setHookText(cloneAnalysis.hookExample)}
                    className="mt-0.5 text-left text-sm font-medium text-primary hover:underline"
                  >
                    &ldquo;{cloneAnalysis.hookExample}&rdquo;
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{cloneAnalysis.reasoning}</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          RENDER QUEUE
      ══════════════════════════════════════════════════════════════ */}
      {recentRenders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Render Queue
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>

          <div className="divide-y divide-border/40">
            {recentRenders.map((render) => (
              <div key={render.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {render.metadata?.pipeline === 'one-click'
                        ? 'Auto Render'
                        : String(render.kind).replace(/_/g, ' ')}
                    </p>
                    <RenderStatusBadge status={render.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {render.metadata?.aspectRatio as string ?? ''}
                    {render.metadata?.captionStyle
                      ? ` · ${String(render.metadata.captionStyle).replace(/-/g, ' ')}`
                      : ''}
                    {' · '}
                    {new Date(render.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {render.status === 'done' && render.url && (
                  <div className="flex shrink-0 items-center gap-2">
                    <a
                      href={render.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Preview
                    </a>
                    <a
                      href={render.url}
                      download
                      className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                )}

                {render.status === 'rendering' && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
                )}

                {render.status === 'failed' && (
                  <p className="shrink-0 text-xs text-destructive">{render.error ?? 'Failed'}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
