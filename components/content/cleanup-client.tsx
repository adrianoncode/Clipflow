'use client'

import { useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Eraser, Loader2, Wand2 } from 'lucide-react'

import {
  analyzeFillersAction,
  submitCleanupRenderAction,
  type AnalyzeFillersState,
  type CleanupRenderState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/cleanup/actions'
import type { FillerLanguage } from '@/lib/cleanup/detect-fillers'

interface Word {
  word: string
  start: number
  end: number
}

interface InitialDetection {
  hits: Array<{
    index: number
    match: string
    phraseStart: boolean
    phraseLength: number
  }>
  totalSavingsSeconds: number
  byMatch: Record<string, number>
  resolvedLanguage: Exclude<FillerLanguage, 'auto'>
}

interface CleanupClientProps {
  workspaceId: string
  contentId: string
  words: Word[]
  initial: InitialDetection | null
  savedCutIndices: number[]
  savedLanguage: string | null
}

const LANGUAGES: Array<{ value: FillerLanguage; label: string }> = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
]

/**
 * Audio-cleanup editor.
 *
 * Three things on the page:
 *
 *   1. Language selector + "Re-analyze" — kicks the server detector
 *      with the chosen language and replaces the hit list. Uses
 *      useFormState so we keep React's progressive-enhancement story.
 *
 *   2. Filler list with toggle-per-hit + bulk action. Each hit
 *      surfaces its match label, its position in the transcript, and
 *      a "remove" toggle. Inline counter shows total cuts + savings.
 *
 *   3. Transcript view — every word as a chip, fillers highlighted in
 *      amber, kept-fillers (toggled off) shown crossed out. Reading
 *      the editor as a transcript is the design — it's how the user
 *      builds confidence the cuts won't break sentences.
 *
 *   4. Render submit — sends the chosen cut indices to the server
 *      action which builds the keep-ranges and submits a Shotstack
 *      render. The server persists the choice on the content_items
 *      row so reload restores state.
 */
export function CleanupClient({
  workspaceId,
  contentId,
  words,
  initial,
  savedCutIndices,
  savedLanguage,
}: CleanupClientProps) {
  // ─ Detection state ─
  const [analyzeState, analyzeAction] = useFormState<
    AnalyzeFillersState,
    FormData
  >(analyzeFillersAction, {})

  const detection = analyzeState.ok
    ? {
        hits: analyzeState.hits,
        totalSavingsSeconds: analyzeState.totalSavingsSeconds,
        byMatch: analyzeState.byMatch,
        resolvedLanguage: analyzeState.language,
      }
    : initial

  // Map index → hit for fast lookups during render.
  type Hit = NonNullable<typeof detection>['hits'][number]
  const hitByIndex = useMemo(() => {
    const map = new Map<number, Hit>()
    if (!detection) return map
    for (const h of detection.hits) map.set(h.index, h)
    return map
  }, [detection])

  // ─ Cut state ─
  // The Set is the source of truth for what gets sent to the renderer.
  // Default: every detected filler is "cut on" — the user's job is to
  // un-toggle anything that should stay (e.g. "actually" used as
  // emphasis, not filler).
  const [cutSet, setCutSet] = useState<Set<number>>(() => {
    if (savedCutIndices.length > 0) return new Set(savedCutIndices)
    return new Set(detection?.hits.map((h) => h.index) ?? [])
  })

  function toggleHit(index: number) {
    const hit = hitByIndex.get(index)
    if (!hit) return
    setCutSet((prev) => {
      const next = new Set(prev)
      // Toggling a phrase-start toggles the WHOLE phrase. Single-word
      // hits behave the same trivially since phraseLength === 1.
      const startIdx = hit.phraseStart ? index : index - 1
      const length = hit.phraseLength
      const phraseStart = findPhraseStart(detection?.hits ?? [], index)
      const begin = phraseStart ?? startIdx
      const allOn = Array.from({ length }, (_, k) => begin + k).every((j) =>
        next.has(j),
      )
      for (let k = 0; k < length; k++) {
        const i = begin + k
        if (allOn) next.delete(i)
        else next.add(i)
      }
      return next
    })
  }

  function setAllCut(value: boolean) {
    setCutSet(() => {
      if (!value) return new Set()
      return new Set(detection?.hits.map((h) => h.index) ?? [])
    })
  }

  // ─ Derived stats ─
  const cutCount = useMemo(() => {
    if (!detection) return 0
    let n = 0
    for (const h of detection.hits) {
      if (h.phraseStart && cutSet.has(h.index)) n++
    }
    return n
  }, [cutSet, detection])

  const savings = useMemo(() => {
    let total = 0
    for (const i of cutSet) {
      const w = words[i]
      if (!w) continue
      total += w.end - w.start
    }
    return total
  }, [cutSet, words])

  // ─ Render submit ─
  const [renderState, renderAction] = useFormState<CleanupRenderState, FormData>(
    submitCleanupRenderAction,
    {},
  )

  const totalDuration = words[words.length - 1]?.end ?? 0

  return (
    <div className="space-y-6">
      {/* Language + re-analyze */}
      <form
        action={analyzeAction}
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
      >
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <label className="flex items-center gap-2 text-[12px] font-semibold">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Language
          </span>
          <select
            name="language"
            defaultValue={(savedLanguage as FillerLanguage) ?? 'auto'}
            className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-[12px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <AnalyzeButton />
        {detection ? (
          <span className="ml-auto text-[11.5px] text-muted-foreground">
            Detected:{' '}
            <b className="text-foreground">{detection.hits.length}</b> hits ·{' '}
            <b className="text-foreground">
              {formatSeconds(detection.totalSavingsSeconds)}
            </b>{' '}
            savings if all cut · language{' '}
            <b className="text-foreground uppercase">
              {detection.resolvedLanguage}
            </b>
          </span>
        ) : null}
      </form>

      {analyzeState.ok === false ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-[12px] text-destructive">
          {analyzeState.error}
        </p>
      ) : null}

      {/* Counter card */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Cuts armed" value={`${cutCount}`} />
        <Stat
          label="Trimmed"
          value={formatSeconds(savings)}
          tone="lime"
        />
        <Stat
          label="New length"
          value={formatSeconds(Math.max(0, totalDuration - savings))}
          subValue={
            totalDuration > 0
              ? `was ${formatSeconds(totalDuration)}`
              : undefined
          }
        />
      </div>

      {/* By-match chip row + bulk actions */}
      {detection && detection.hits.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Matched
          </span>
          {Object.entries(detection.byMatch)
            .sort((a, b) => b[1] - a[1])
            .map(([match, count]) => (
              <span
                key={match}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  background: 'rgba(214,255,62,0.18)',
                  color: '#1a2000',
                  border: '1px solid rgba(214,255,62,0.35)',
                }}
              >
                <span>{match}</span>
                <span
                  className="rounded-full px-1.5 text-[9.5px] font-bold"
                  style={{ background: '#1a2000', color: '#F4D93D' }}
                >
                  {count}
                </span>
              </span>
            ))}
          <span className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAllCut(true)}
              className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-muted"
            >
              Cut all
            </button>
            <button
              type="button"
              onClick={() => setAllCut(false)}
              className="rounded-md border border-border/60 bg-background px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-muted"
            >
              Keep all
            </button>
          </span>
        </div>
      ) : null}

      {/* Transcript view with togglable fillers */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Transcript · click an amber chip to keep it
        </p>
        <div className="flex flex-wrap gap-x-1 gap-y-1.5 text-[14px] leading-[1.7]">
          {words.map((w, i) => {
            const hit = hitByIndex.get(i)
            if (!hit) {
              return (
                <span key={i} className="text-foreground/85">
                  {w.word.trim()}
                </span>
              )
            }
            const cut = cutSet.has(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleHit(i)}
                title={
                  cut
                    ? `Will be cut · ${hit.match}`
                    : `Kept · ${hit.match}`
                }
                className={`rounded px-1 transition-colors ${
                  cut
                    ? 'text-amber-900 line-through decoration-amber-900/60'
                    : 'text-foreground'
                }`}
                style={{
                  background: cut
                    ? 'rgba(217,119,6,.15)'
                    : 'rgba(214,255,62,.22)',
                  border: cut
                    ? '1px solid rgba(217,119,6,.35)'
                    : '1px solid rgba(214,255,62,.45)',
                }}
              >
                {w.word.trim()}
              </button>
            )
          })}
        </div>
      </div>

      {/* Render submit */}
      <form
        action={renderAction}
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
      >
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <input
          type="hidden"
          name="cut_indices"
          value={Array.from(cutSet).join(',')}
        />
        <input
          type="hidden"
          name="language"
          value={detection?.resolvedLanguage ?? 'auto'}
        />
        <RenderButton disabled={cutSet.size === 0} />
        <span className="text-[11.5px] text-muted-foreground">
          Renders the cleaned video as a new MP4. Original transcript stays
          intact — no destructive edits to your source.
        </span>
        {renderState.ok === true ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Render submitted · {renderState.rangeCount} ranges
          </span>
        ) : null}
        {renderState.ok === false ? (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
            {renderState.error}
          </span>
        ) : null}
      </form>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────

function AnalyzeButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12px] disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Wand2 className="h-3 w-3" />
      )}
      Re-analyze
    </button>
  )
}

function RenderButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Eraser className="h-3.5 w-3.5" />
      )}
      Render cleaned MP4
    </button>
  )
}

function Stat({
  label,
  value,
  subValue,
  tone,
}: {
  label: string
  value: string
  subValue?: string
  tone?: 'lime'
}) {
  const valueColor = tone === 'lime' ? '#1a2000' : '#181511'
  const valueBg = tone === 'lime' ? 'rgba(214,255,62,.18)' : 'transparent'
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card px-4 py-3"
      style={{ background: valueBg }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-1 text-[22px] font-bold leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      {subValue ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{subValue}</p>
      ) : null}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}m ${sec}s`
}

/**
 * Given a list of hits and an index that's part of a phrase, find the
 * phraseStart index. Walks back from the index until it lands on a
 * hit with phraseStart=true. Returns null if nothing found (single-word
 * filler — caller falls back to the index itself).
 */
function findPhraseStart(
  hits: Array<{ index: number; phraseStart: boolean }>,
  index: number,
): number | null {
  // hits are already sorted by index; find the one matching index.
  for (const h of hits) {
    if (h.index === index) {
      if (h.phraseStart) return index
      // non-phrase-start — walk back to the phrase start.
      for (let i = hits.indexOf(h) - 1; i >= 0; i--) {
        const prev = hits[i]!
        if (prev.phraseStart) return prev.index
      }
      return null
    }
  }
  return null
}
