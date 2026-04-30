'use client'

import { useState } from 'react'
import { Check, Flame, RefreshCcw, Scissors } from 'lucide-react'
import { useFormState, useFormStatus } from 'react-dom'

import { findBestClipsAction } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { BestClip, FindBestClipsState } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

interface ClipFinderProps {
  workspaceId: string
  contentId: string
  initialClips: BestClip[] | null
}

const TYPE_BADGE: Record<BestClip['type'], string> = {
  hook: 'bg-red-100 text-red-700',
  insight: 'bg-blue-100 text-blue-700',
  story: 'bg-amber-100 text-amber-700',
  controversial: 'bg-purple-100 text-purple-700',
  funny: 'bg-green-100 text-green-700',
}

const ENERGY_BADGE: Record<BestClip['energy'], string> = {
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-gray-100 text-gray-600',
}

// Three tiers only — too many buckets reads as noise. 80+ is "post this
// right now", 60-79 is "worth posting", <60 is "only if on-topic".
// OK bucket got a visible border in the last polish pass so it stops
// reading as "disabled". FIRE + STRONG don't need one — their fills are
// loud enough. We model `border` as optional to keep callers tidy.
function scoreBucket(score: number): {
  label: string
  bg: string
  fg: string
  ring: string
  border?: string
} {
  if (score >= 80) {
    return {
      label: 'FIRE',
      bg: 'linear-gradient(135deg, #F4D93D, #B8E02E)',
      fg: '#1a2000',
      ring: 'rgba(214,255,62,.55)',
    }
  }
  if (score >= 60) {
    return {
      label: 'STRONG',
      bg: '#0F0F0F',
      fg: '#F4D93D',
      ring: 'rgba(15,15,15,.35)',
    }
  }
  return {
    label: 'OK',
    bg: '#F3EDE3',
    fg: '#0F0F0F',
    ring: 'rgba(15,15,15,.18)',
    border: '#CFC4AF',
  }
}

function ViralityBadge({ clip }: { clip: BestClip }) {
  if (clip.virality_score === undefined) {
    // Legacy clips that pre-date the scoring engine — show a neutral
    // "—" chip so the card layout doesn't shift, and set a tooltip
    // nudging re-run of Find clips to rescore.
    return (
      <div
        className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border text-center"
        style={{ background: '#ECE5D8', borderColor: '#CFC4AF' }}
        title="Re-run Find best clips to generate a virality score"
      >
        <span className="text-xl font-bold" style={{ color: '#7c7468' }}>
          —
        </span>
        <span
          className="font-bold text-[8px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: '#7c7468' }}
        >
          no score
        </span>
      </div>
    )
  }
  const bucket = scoreBucket(clip.virality_score)
  return (
    <div
      className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border text-center"
      style={{
        background: bucket.bg,
        borderColor: bucket.border ?? 'transparent',
        boxShadow: `0 4px 16px -6px ${bucket.ring}`,
      }}
      title={clip.why_viral ?? 'Predicted virality — 0 to 100.'}
      aria-label={`Virality ${bucket.label} — ${clip.virality_score} out of 100. ${clip.why_viral ?? ''}`.trim()}
    >
      <span
        className="lv2-tabular text-[22px] font-bold leading-none"
        style={{ color: bucket.fg, fontVariantNumeric: 'tabular-nums' }}
      >
        {clip.virality_score}
      </span>
      <span
        className="mt-0.5 font-bold text-[8px] font-bold uppercase tracking-[0.15em]"
        style={{ color: bucket.fg }}
      >
        {bucket.label}
      </span>
    </div>
  )
}

function SubmitButton({ hasExistingClips }: { hasExistingClips: boolean }) {
  const { pending } = useFormStatus()
  const label = pending
    ? 'Analyzing…'
    : hasExistingClips
      ? 'Re-analyze'
      : 'Find best clips'
  const Icon = hasExistingClips ? RefreshCcw : Scissors
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: '#0F0F0F',
        color: '#F4D93D',
        boxShadow: 'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35)',
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function ClipCard({ clip, rank }: { clip: BestClip; rank: number }) {
  const [copied, setCopied] = useState(false)
  function copyToClipboard() {
    navigator.clipboard
      .writeText(clip.quote)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  const isTopFire = clip.virality_score !== undefined && clip.virality_score >= 80

  return (
    <div
      className="relative rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: isTopFire ? 'rgba(214,255,62,.6)' : undefined,
      }}
    >
      {/* Rank indicator — clips come pre-sorted by virality */}
      <div
        className="absolute left-[-8px] top-4 flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold"
        style={{ background: '#0F0F0F', color: '#F4D93D' }}
        aria-hidden
      >
        {rank}
      </div>

      <div className="flex items-start gap-4">
        <ViralityBadge clip={clip} />
        <div className="min-w-0 flex-1 space-y-2">
          <blockquote
            className="border-l-2 pl-3 text-sm italic leading-relaxed"
            style={{ borderColor: '#CFC4AF', color: '#181511' }}
          >
            &ldquo;{clip.quote}&rdquo;
          </blockquote>

          {clip.why_viral ? (
            <p className="flex items-start gap-1.5 text-xs" style={{ color: '#7c7468' }}>
              <Flame className="mt-0.5 h-3 w-3 shrink-0" style={{ color: '#A0530B' }} />
              <span>{clip.why_viral}</span>
            </p>
          ) : (
            <p className="text-xs" style={{ color: '#7c7468' }}>
              {clip.reason}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE[clip.type]}`}
            >
              {clip.type}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ENERGY_BADGE[clip.energy]}`}
            >
              {clip.energy} energy
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: '#7c7468', letterSpacing: '.05em' }}
            >
              {clip.estimated_duration}
            </span>
          </div>
        </div>
      </div>

      {/* Position bar + action */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: '#ECE5D8' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${clip.position_pct}%`,
                background: '#0F0F0F',
              }}
            />
          </div>
          <p className="font-bold text-[9px] uppercase tracking-[0.15em]" style={{ color: '#7c7468' }}>
            at {clip.position_pct}% through content
          </p>
        </div>
        <button
          type="button"
          onClick={copyToClipboard}
          aria-live="polite"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors hover:bg-black/[.03]"
          style={{
            borderColor: copied ? '#0F6B4D' : '#E5DDCE',
            color: copied ? '#0F6B4D' : '#3a342c',
            background: copied ? '#E6F4EE' : 'transparent',
          }}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            'Copy quote'
          )}
        </button>
      </div>
    </div>
  )
}

const initialState: FindBestClipsState = { ok: undefined }

export function ClipFinder({ workspaceId, contentId, initialClips }: ClipFinderProps) {
  const [state, formAction] = useFormState(findBestClipsAction, initialState)

  const clips = state.ok === true ? state.clips : initialClips

  return (
    <div
      className="space-y-4 rounded-2xl border p-5"
      style={{ borderColor: '#E5DDCE', background: '#FFFDF8' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="mb-1 font-bold text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: '#7c7468' }}
          >
            AI Clip Finder
          </p>
          <h3 className="text-base font-bold" style={{ color: '#181511' }}>
            Most viral moments
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: '#7c7468' }}>
            AI scans the transcript and ranks the strongest clips by a 0–100 virality score.
          </p>
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <SubmitButton hasExistingClips={Boolean(clips && clips.length > 0)} />
      </form>
      {clips && clips.length > 0 ? (
        <p
          className="font-mono text-[10px]"
          style={{ color: '#7c7468', letterSpacing: '.05em' }}
        >
          Re-analyzing replaces the clips below and uses one AI call.
        </p>
      ) : null}

      {state.ok === false && (
        <p className="text-sm" style={{ color: '#9B2018' }}>
          {state.error}
        </p>
      )}

      {clips && clips.length > 0 && (
        <div className="space-y-3 pt-1">
          <p
            className="font-bold text-[10px] uppercase tracking-[0.2em]"
            style={{ color: '#7c7468' }}
          >
            {clips.length} clip{clips.length !== 1 ? 's' : ''} · sorted by score
          </p>
          {clips.map((clip, i) => (
            <ClipCard key={i} clip={clip} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
