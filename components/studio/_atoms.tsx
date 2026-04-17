'use client'

import { useFormStatus } from 'react-dom'
import { AlertCircle, Check, Loader2, Play, Sparkles } from 'lucide-react'

/**
 * Small UI atoms shared by the render-studio client. Extracted from
 * render-studio-client.tsx to keep the main component focused.
 *
 * No props shared outside this folder — if another part of the app
 * needs these, they should go under components/ui/ first.
 */

export function StepBadge({
  n,
  done,
  active,
}: {
  n: number
  done: boolean
  active: boolean
}) {
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

/** Phone-screen shaped mockup — used for caption style preview. */
export function PhoneMockup({
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

export function RenderBtn({ disabled }: { disabled?: boolean }) {
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

export function AnalyzeBtn() {
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

export function StatusPill({ status }: { status: string }) {
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
