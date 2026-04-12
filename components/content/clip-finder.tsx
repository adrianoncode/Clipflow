'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { findBestClipsAction } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { BestClip, FindBestClipsState } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

interface ClipFinderProps {
  workspaceId: string
  contentId: string
  initialClips: BestClip[] | null
}

const TYPE_BADGE: Record<BestClip['type'], string> = {
  hook: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  insight: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  story: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  controversial: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  funny: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

const ENERGY_BADGE: Record<BestClip['energy'], string> = {
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
    >
      ✂️ {pending ? 'Analyzing…' : 'Find best clips'}
    </button>
  )
}

function ClipCard({ clip }: { clip: BestClip }) {
  function copyToClipboard() {
    navigator.clipboard.writeText(clip.quote).catch(() => {})
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <blockquote className="border-l-4 border-primary pl-3 text-sm italic text-foreground">
        &ldquo;{clip.quote}&rdquo;
      </blockquote>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_BADGE[clip.type]}`}
        >
          {clip.type}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${ENERGY_BADGE[clip.energy]}`}
        >
          {clip.energy} energy
        </span>
        <span className="text-xs text-muted-foreground">{clip.estimated_duration}</span>
      </div>

      <p className="text-xs text-muted-foreground">{clip.reason}</p>

      {/* Position bar */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Position in content</p>
        <div className="relative h-2 w-full rounded-full bg-muted">
          <div
            className="absolute top-0 h-2 w-2 rounded-full bg-primary -translate-x-1/2"
            style={{ left: `${clip.position_pct}%` }}
          />
          <div
            className="h-2 rounded-full bg-primary/30"
            style={{ width: `${clip.position_pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{clip.position_pct}% through content</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={copyToClipboard}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Use as hook →
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
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Best Clips</h3>
          <p className="text-xs text-muted-foreground">
            AI finds the most clip-worthy moments from your transcript
          </p>
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <SubmitButton />
      </form>

      {state.ok === false && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      {clips && clips.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} found
          </p>
          {clips.map((clip, i) => (
            <ClipCard key={i} clip={clip} />
          ))}
        </div>
      )}
    </div>
  )
}
