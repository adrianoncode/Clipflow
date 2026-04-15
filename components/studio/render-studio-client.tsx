'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  AlertCircle,
  RefreshCw,
  Link2,
  Video,
  Clapperboard,
  ArrowRight,
  Key,
  Play,
  Smartphone,
  Monitor,
  Square,
  Clock,
  Youtube,
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

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    value: '9:16' as const,
    label: 'TikTok',
    emoji: '🎵',
    desc: 'Vertical',
    icon: Smartphone,
    // aspect ratio visual: width:height in small units
    w: 14, h: 24,
  },
  {
    value: '9:16' as const,
    label: 'Reels',
    emoji: '📸',
    desc: 'Vertical',
    icon: Smartphone,
    w: 14, h: 24,
  },
  {
    value: '9:16' as const,
    label: 'Shorts',
    emoji: '▶️',
    desc: 'Vertical',
    icon: Smartphone,
    w: 14, h: 24,
  },
  {
    value: '1:1' as const,
    label: 'LinkedIn',
    emoji: '💼',
    desc: 'Square',
    icon: Square,
    w: 18, h: 18,
  },
  {
    value: '16:9' as const,
    label: 'Landscape',
    emoji: '🖥️',
    desc: 'Wide',
    icon: Monitor,
    w: 28, h: 16,
  },
] as const

const CAPTION_STYLES = [
  {
    value: 'tiktok-bold',
    label: 'TikTok Bold',
    preview: 'BIG TEXT',
    // inline style for the caption preview inside the phone mockup
    captionStyle: {
      fontFamily: "'Arial Black', Arial",
      fontSize: 9,
      fontWeight: 900,
      color: '#FFFFFF',
      WebkitTextStroke: '0.5px #000',
      textAlign: 'center' as const,
      letterSpacing: '-0.3px',
      lineHeight: 1.1,
    },
    captionBg: undefined,
    phoneBg: 'linear-gradient(160deg, #0f0f0f 0%, #1a1a2e 100%)',
    desc: 'Huge white text, black stroke',
    badge: 'Most popular',
    badgeColor: 'bg-violet-600 text-white',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    preview: 'Clean text',
    captionStyle: {
      fontFamily: 'Arial',
      fontSize: 7,
      fontWeight: 500,
      color: 'rgba(255,255,255,0.95)',
      textAlign: 'center' as const,
      letterSpacing: '-0.1px',
    },
    captionBg: undefined,
    phoneBg: 'linear-gradient(160deg, #1a1a1a 0%, #2d2d3d 100%)',
    desc: 'Small, clean — premium / educational',
    badge: null,
    badgeColor: '',
  },
  {
    value: 'neon',
    label: 'Neon',
    preview: 'GLOW',
    captionStyle: {
      fontFamily: "'Arial Black', Arial",
      fontSize: 9,
      fontWeight: 800,
      color: '#FFE600',
      textShadow: '0 0 6px rgba(255,230,0,0.9), 0 0 14px rgba(255,230,0,0.5), 1px 1px 0 #000',
      textAlign: 'center' as const,
    },
    captionBg: undefined,
    phoneBg: 'linear-gradient(160deg, #0a0a0a 0%, #0a0a1a 100%)',
    desc: 'Yellow glow — gaming / high energy',
    badge: null,
    badgeColor: '',
  },
  {
    value: 'white-bar',
    label: 'White Bar',
    preview: 'Bar style',
    captionStyle: {
      fontFamily: 'Arial',
      fontSize: 7,
      fontWeight: 700,
      color: '#FFFFFF',
      textAlign: 'center' as const,
    },
    captionBg: 'rgba(0,0,0,0.72)',
    phoneBg: 'linear-gradient(160deg, #1f2937 0%, #111827 100%)',
    desc: 'Dark pill bar — Instagram Reels style',
    badge: null,
    badgeColor: '',
  },
] as const

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepBadge({ n, done, active }: { n: number; done: boolean; active: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300 ${
        done
          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
          : active
            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
            : 'border-2 border-border bg-background text-muted-foreground'
      }`}
    >
      {done ? <Check className="h-4 w-4" /> : n}
    </span>
  )
}

/** Phone-screen shaped mockup — used for caption style preview */
function PhoneMockup({
  phoneBg,
  captionText,
  captionStyle,
  captionBg,
  selected,
}: {
  phoneBg: string
  captionText: string
  captionStyle: React.CSSProperties
  captionBg?: string
  selected: boolean
}) {
  return (
    <div
      className={`relative mx-auto flex flex-col overflow-hidden rounded-[10px] border-[2px] transition-all duration-200 ${
        selected ? 'border-primary shadow-md shadow-primary/20' : 'border-zinc-700/60'
      }`}
      style={{
        width: 52,
        height: 88,
        background: phoneBg,
      }}
    >
      {/* Notch */}
      <div className="mx-auto mt-1.5 h-1 w-7 rounded-full bg-black/40" />
      {/* Video placeholder lines (simulates a video thumbnail) */}
      <div className="mx-2 mt-2 flex flex-col gap-1 opacity-20">
        <div className="h-1 rounded-full bg-white/60" />
        <div className="h-1 w-3/4 rounded-full bg-white/40" />
      </div>
      {/* Caption at bottom */}
      <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center px-1">
        {captionBg ? (
          <span
            style={{
              ...captionStyle,
              background: captionBg,
              borderRadius: 4,
              padding: '1px 4px',
              display: 'block',
              textAlign: 'center',
            }}
          >
            {captionText}
          </span>
        ) : (
          <span style={captionStyle}>{captionText}</span>
        )}
      </div>
    </div>
  )
}

function RenderBtn({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="group relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:px-12"
    >
      {/* Shine sweep on hover */}
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Submitting render…
        </>
      ) : (
        <>
          <Play className="h-5 w-5 fill-current" />
          Render Video
        </>
      )}
    </button>
  )
}

function AnalyzeBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {pending ? 'Analyzing…' : 'Analyze'}
    </button>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'done')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <Check className="h-3 w-3" />
        Done
      </span>
    )
  if (status === 'failed')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 ring-1 ring-red-200">
        <AlertCircle className="h-3 w-3" />
        Failed
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
      <Loader2 className="h-3 w-3 animate-spin" />
      Rendering
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string
  contentItems: ContentItemListRow[]
  recentRenders: RenderRow[]
  hasShotstackKey: boolean
}

export function RenderStudioClient({
  workspaceId,
  contentItems,
  recentRenders: initialRenders,
  hasShotstackKey,
}: Props) {
  const videoItems = contentItems.filter(
    (c) => c.status === 'ready' && (c.kind === 'video' || c.kind === 'youtube'),
  )

  // Form state
  const [selectedContentId, setSelectedContentId] = useState(videoItems[0]?.id ?? '')
  const [selectedPlatformLabel, setSelectedPlatformLabel] = useState<string>('TikTok')
  const [selectedAspect, setSelectedAspect] = useState<'9:16' | '1:1' | '16:9'>('9:16')
  const [selectedStyle, setSelectedStyle] = useState<string>('tiktok-bold')
  const [hookText, setHookText] = useState('')
  const [clonedStyle, setClonedStyle] = useState<StyleAnalysis | null>(null)

  // Renders (with local refresh)
  const [renders, setRenders] = useState<RenderRow[]>(initialRenders)
  const refreshInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const [renderState, renderAction] = useFormState<StudioRenderState, FormData>(studioRenderAction, {})
  const [cloneState, cloneAction] = useFormState<StyleCloneState, FormData>(analyzeStyleAction, {})

  // Auto-refresh renders while any are still in "rendering" state
  useEffect(() => {
    const hasActive = renders.some((r) => r.status === 'rendering')
    if (!hasActive) {
      if (refreshInterval.current) clearInterval(refreshInterval.current)
      return
    }
    refreshInterval.current = setInterval(() => {
      window.location.reload()
    }, 12_000) // reload every 12 s while rendering
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current)
    }
  }, [renders])

  // When a render succeeds, add the new item to the queue optimistically
  useEffect(() => {
    if (renderState.ok === true) {
      setRenders((prev) => [
        {
          id: renderState.renderRowId ?? renderState.renderId,
          workspace_id: workspaceId,
          content_id: selectedContentId,
          kind: 'branded_video',
          provider: 'shotstack',
          provider_render_id: renderState.renderId,
          status: 'rendering',
          url: null,
          error: null,
          metadata: {
            aspectRatio: selectedAspect,
            captionStyle: selectedStyle,
            pipeline: 'one-click',
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderState])

  const cloneAnalysis =
    (cloneState as StyleCloneState).ok === true
      ? (cloneState as { ok: true; analysis: StyleAnalysis }).analysis
      : clonedStyle

  function applyClonedStyle(a: StyleAnalysis) {
    setSelectedStyle(a.captionStyle)
    setSelectedAspect(a.aspectRatio)
    setHookText(a.hookExample)
    setClonedStyle(a)
    // scroll back to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step completion
  const step1Done = !!selectedContentId
  const step2Done = !!selectedPlatformLabel && !!selectedStyle
  const step3Ready = step1Done && step2Done
  const renderDone = renderState.ok === true

  const selectedVideo = videoItems.find((v) => v.id === selectedContentId)
  const selectedStyleDef = CAPTION_STYLES.find((s) => s.value === selectedStyle)

  return (
    <div className="space-y-8">

      {/* ── Shotstack key banner ── */}
      {!hasShotstackKey && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-100/60 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Key className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">
                Connect your Shotstack key to start rendering
              </p>
              <p className="mt-1 text-sm text-amber-800/80">
                Clipflow renders via Shotstack BYOK — free tier gets you 2&nbsp;min of
                rendered video/month. You pay Shotstack directly (~$0.05/render).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/workspace/${workspaceId}/settings/ai-keys`}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-700"
                >
                  <Key className="h-4 w-4" />
                  Add Shotstack key
                </Link>
                <a
                  href="https://dashboard.shotstack.io/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition-all hover:bg-amber-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Get free key
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="flex items-center">
        {['Pick video', 'Choose style', 'Add hook', 'Render'].map((label, i) => {
          const n = i + 1
          const done =
            (n === 1 && step1Done) ||
            (n === 2 && step2Done) ||
            (n === 3 && !!hookText) ||
            (n === 4 && renderDone)
          const active =
            (n === 1 && !step1Done) ||
            (n === 2 && step1Done && !step2Done) ||
            (n === 3 && step1Done && step2Done && !hookText) ||
            (n === 4 && step3Ready)
          const prevDone =
            n === 1 || (n === 2 && step1Done) || (n === 3 && step2Done) || (n === 4 && step3Ready)

          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <StepBadge n={n} done={done && n < 4} active={active} />
                <span
                  className={`hidden text-[10px] font-semibold sm:block ${
                    active ? 'text-primary' : done ? 'text-emerald-600' : 'text-muted-foreground/60'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 3 && (
                <div className="relative mx-1.5 mb-4 h-px w-10 sm:w-20">
                  <div className="absolute inset-0 rounded-full bg-border" />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400 transition-all duration-500"
                    style={{ width: prevDone ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          RENDER FORM
      ───────────────────────────────────────────────────────────────────── */}
      <form action={renderAction} className="space-y-6">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={selectedContentId} />
        <input type="hidden" name="aspect_ratio" value={selectedAspect} />
        <input type="hidden" name="caption_style" value={selectedStyle} />
        <input type="hidden" name="hook_text" value={hookText} />

        {/* ── STEP 1 — Pick video ── */}
        <div className="rounded-2xl border border-border/60 bg-card">
          {/* Step header */}
          <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
            <StepBadge n={1} done={step1Done} active={!step1Done} />
            <div>
              <h2 className="text-sm font-semibold">Pick your video</h2>
              <p className="text-xs text-muted-foreground">
                Choose which imported video to turn into a short-form clip
              </p>
            </div>
          </div>

          <div className="p-5">
            {videoItems.length === 0 ? (
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Video className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="font-semibold">No videos imported yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Paste a YouTube / TikTok URL, or upload an MP4
                  </p>
                </div>
                <Link
                  href={`/workspace/${workspaceId}/content/new`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                >
                  Import video
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {videoItems.map((item) => {
                  const isSelected = selectedContentId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedContentId(item.id)}
                      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                        isSelected
                          ? 'border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20'
                          : 'border-border/50 hover:border-border hover:bg-accent/30'
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:bg-muted/80'
                        }`}
                      >
                        {item.kind === 'youtube' ? (
                          <Youtube className="h-5 w-5" />
                        ) : (
                          <Video className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-medium ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {item.title ?? 'Untitled video'}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? 'bg-primary'
                            : 'border-2 border-border group-hover:border-primary/30'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 2 — Format & style ── */}
        <div
          className={`rounded-2xl border border-border/60 bg-card transition-opacity duration-300 ${
            !step1Done ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
            <StepBadge n={2} done={step2Done} active={step1Done} />
            <div>
              <h2 className="text-sm font-semibold">Choose format & caption style</h2>
              <p className="text-xs text-muted-foreground">
                Platform determines aspect ratio — caption style defines the visual look
              </p>
            </div>
          </div>

          <div className="space-y-6 p-5">
            {/* Platform */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Platform
              </p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const isSelected = selectedPlatformLabel === p.label
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setSelectedPlatformLabel(p.label)
                        setSelectedAspect(p.value)
                      }}
                      className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                        isSelected
                          ? 'border-primary/40 bg-primary/[0.08] text-primary ring-1 ring-primary/20'
                          : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {/* Aspect ratio visual */}
                      <div className="flex items-center justify-center" style={{ width: 16, height: 16 }}>
                        <div
                          className={`rounded-[2px] border transition-colors ${
                            isSelected ? 'border-primary bg-primary/20' : 'border-muted-foreground/40 bg-muted-foreground/10'
                          }`}
                          style={{
                            width: p.value === '16:9' ? 16 : p.value === '1:1' ? 12 : 8,
                            height: p.value === '9:16' ? 16 : p.value === '1:1' ? 12 : 9,
                          }}
                        />
                      </div>
                      <span>{p.emoji}</span>
                      <span>{p.label}</span>
                      <span className="text-[10px] text-muted-foreground/60">{p.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Caption style — phone mockup grid */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Caption Style
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CAPTION_STYLES.map((s) => {
                  const isSelected = selectedStyle === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSelectedStyle(s.value)}
                      className={`relative flex flex-col items-center gap-3 rounded-2xl border p-4 pb-3.5 text-center transition-all duration-150 ${
                        isSelected
                          ? 'border-primary/40 bg-primary/[0.05] ring-2 ring-primary/20'
                          : 'border-border/50 hover:border-border hover:bg-accent/20'
                      }`}
                    >
                      {s.badge && (
                        <span
                          className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${s.badgeColor}`}
                        >
                          {s.badge}
                        </span>
                      )}

                      {/* Phone mockup */}
                      <PhoneMockup
                        phoneBg={s.phoneBg}
                        captionText={s.preview}
                        captionStyle={s.captionStyle}
                        captionBg={s.captionBg}
                        selected={isSelected}
                      />

                      <div className="w-full">
                        <p className="text-xs font-semibold">{s.label}</p>
                        <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                          {s.desc}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── STEP 3 — Hook text ── */}
        <div
          className={`rounded-2xl border border-border/60 bg-card transition-opacity duration-300 ${
            !step3Ready ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
            <StepBadge n={3} done={!!hookText} active={step3Ready && !hookText} />
            <div>
              <h2 className="text-sm font-semibold">
                Add a hook{' '}
                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  optional
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Shown for the first 2.5 seconds — the single biggest driver of watch time
              </p>
            </div>
          </div>

          <div className="space-y-3 p-5">
            <div className="relative">
              <input
                type="text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value.slice(0, 120))}
                placeholder='e.g. "Nobody talks about this... 👀"'
                className="w-full rounded-xl border border-border/60 bg-muted/30 px-4 py-3 pr-14 text-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground/50">
                {hookText.length}/120
              </span>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                Best hooks are short (under 10 words), specific, and build curiosity or urgency.
                Use{' '}
                <span className="font-semibold text-foreground">Style Clone</span> below to
                steal proven hooks from top creators in your niche.
              </span>
            </div>
          </div>
        </div>

        {/* ── STEP 4 — Render ── */}
        <div
          className={`rounded-2xl border border-border/60 bg-card transition-opacity duration-300 ${
            !step3Ready ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <div className="flex items-center gap-3 border-b border-border/40 px-5 py-4">
            <StepBadge n={4} done={renderDone} active={step3Ready} />
            <div>
              <h2 className="text-sm font-semibold">Render your video</h2>
              <p className="text-xs text-muted-foreground">
                Shotstack builds your MP4 in ~60 seconds — captions, reframe &amp; hook, fully automated
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            {/* Pre-render summary */}
            {step3Ready && !renderDone && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Video className="h-3.5 w-3.5 text-primary" />
                  {selectedVideo?.title ?? 'Video'}
                </span>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  {selectedPlatformLabel} · {selectedAspect}
                </span>
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  {selectedStyleDef?.label ?? selectedStyle} captions
                </span>
                {hookText && (
                  <>
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      Hook text ✓
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Error state */}
            {renderState.ok === false && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Render failed</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{renderState.error}</p>
                </div>
              </div>
            )}

            {/* Success state */}
            {renderDone && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">Render queued!</p>
                  <p className="text-xs text-emerald-700">
                    Usually ready in ~60 seconds. Auto-refreshing the queue below…
                  </p>
                </div>
              </div>
            )}

            <RenderBtn disabled={!step3Ready || !hasShotstackKey} />
          </div>
        </div>
      </form>

      {/* ─────────────────────────────────────────────────────────────────────
          STYLE CLONE
      ───────────────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-primary/[0.06] to-background px-6 py-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-4.5 w-4.5 h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Style Clone</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
                  AI
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Paste any competitor&apos;s video URL. AI extracts their caption style, hook pattern,
                pacing, and vibe — then applies it to your render in one click.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {['TikTok', 'Instagram Reels', 'YouTube Shorts'].map((s) => (
                  <span key={s} className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <form action={cloneAction} className="flex gap-3">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/30" />
              <input
                type="url"
                name="competitor_url"
                placeholder="https://www.tiktok.com/@creator/video/..."
                className="w-full rounded-xl border border-border/60 bg-muted/30 py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <AnalyzeBtn />
          </form>

          {/* Error */}
          {(cloneState as StyleCloneState).ok === false && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {(cloneState as { ok: false; error: string }).error}
            </div>
          )}

          {/* Analysis result */}
          {cloneAnalysis && (
            <div className="space-y-4 rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-200">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-900">Style extracted</p>
                </div>
                <button
                  type="button"
                  onClick={() => applyClonedStyle(cloneAnalysis)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Apply to render
                </button>
              </div>

              {/* Style grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Caption Style', value: cloneAnalysis.captionStyleLabel },
                  { label: 'Hook Type', value: cloneAnalysis.hookType },
                  { label: 'Pacing', value: cloneAnalysis.pacing },
                  { label: 'Vibe', value: cloneAnalysis.vibe },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl bg-white/70 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.label}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">{row.value}</p>
                  </div>
                ))}
              </div>

              {/* Hook example */}
              {cloneAnalysis.hookExample && (
                <div className="rounded-xl bg-white/70 px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Generated Hook — tap to use
                  </p>
                  <button
                    type="button"
                    onClick={() => setHookText(cloneAnalysis.hookExample)}
                    className="text-left text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    &ldquo;{cloneAnalysis.hookExample}&rdquo;
                  </button>
                </div>
              )}

              {/* Reasoning */}
              <p className="text-xs italic text-muted-foreground">{cloneAnalysis.reasoning}</p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          RENDER QUEUE
      ───────────────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold">Render Queue</h2>
            <p className="text-xs text-muted-foreground">
              {renders.some((r) => r.status === 'rendering')
                ? 'Auto-refreshing every 12 s…'
                : 'Your recent video renders'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>

        {renders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60">
              <Clapperboard className="h-7 w-7 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No renders yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                Completed videos will appear here — download as MP4
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {renders.map((render) => (
              <div key={render.id} className="flex items-center gap-4 px-6 py-4">
                {/* Icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    render.status === 'done'
                      ? 'bg-emerald-50 text-emerald-600'
                      : render.status === 'failed'
                        ? 'bg-red-50 text-red-500'
                        : 'bg-amber-50 text-amber-500'
                  }`}
                >
                  {render.status === 'done' ? (
                    <Play className="h-4.5 w-4.5 h-4 w-4 fill-current" />
                  ) : render.status === 'failed' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {render.metadata?.pipeline === 'one-click'
                        ? 'Auto Render'
                        : String(render.kind ?? '').replace(/_/g, ' ')}
                    </p>
                    <StatusPill status={render.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[
                      render.metadata?.aspectRatio as string | undefined,
                      render.metadata?.captionStyle
                        ? String(render.metadata.captionStyle).replace(/-/g, ' ')
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    {' · '}
                    {new Date(render.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
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
                  <p className="shrink-0 text-xs text-muted-foreground">~60s left…</p>
                )}
                {render.status === 'failed' && render.error && (
                  <p className="max-w-[130px] shrink-0 text-right text-xs text-destructive">
                    {render.error.slice(0, 60)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
