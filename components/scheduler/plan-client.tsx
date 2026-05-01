'use client'

import { useEffect, useMemo, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  Sparkles,
} from 'lucide-react'

import {
  commitPlanSlotAction,
  generateContentPlanAction,
  type GeneratePlanState,
  type SchedulerActionState,
} from '@/app/(app)/workspace/[id]/schedule/scheduler-actions'
import { TimezoneLabel } from '@/components/workspace/timezone-label'
import {
  PLATFORM_DOT_COLORS,
  PLATFORM_LABELS,
  type OutputPlatform,
} from '@/lib/platforms'
import type { PlanSlot } from '@/lib/planner/build-plan'

interface PlanClientProps {
  workspaceId: string
  workspaceTimezone: string
}

export function PlanClient({ workspaceId, workspaceTimezone }: PlanClientProps) {
  const [state, action] = useFormState<GeneratePlanState, FormData>(
    generateContentPlanAction,
    {},
  )

  // Auto-trigger the cached fetch on mount so the user lands on a
  // populated plan when one already exists, but never silently fires
  // a fresh LLM call on first visit. `cache_only=true` makes the
  // server short-circuit when no cache is available — the user has
  // to click "Generate" explicitly to opt into the AI cost.
  const [autoSubmitted, setAutoSubmitted] = useState(false)
  useEffect(() => {
    if (autoSubmitted) return
    setAutoSubmitted(true)
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('cache_only', 'true')
    action(fd)
  }, [autoSubmitted, action, workspaceId])

  const slots: PlanSlot[] = state.slots ?? []
  const grouped = useMemo(() => groupByDate(slots), [slots])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="mb-1 inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.22em]"
            style={{ color: '#5f5850' }}
          >
            <Sparkles
              className="h-3 w-3"
              style={{ color: '#F4D93D' }}
              aria-hidden
            />
            Plan · next 7 days
          </p>
          <h1
            className="text-[34px] leading-[1.04]"
            style={{
              fontFamily: 'var(--font-instrument-serif), serif',
              letterSpacing: '-.015em',
              color: '#0F0F0F',
            }}
          >
            Your week, planned.
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] text-muted-foreground">
            We pulled your approved drafts and matched each one to a high-
            engagement slot. Hit Schedule on the ones you like; everything
            else stays untouched on the Board.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <RegenerateButton workspaceId={workspaceId} action={action} />
          <TimezoneLabel workspaceTimezone={workspaceTimezone} />
        </div>
      </header>

      {state.ok === false && state.error ? (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 px-4 py-3 text-[13px] text-amber-900">
          {state.error}
        </div>
      ) : null}

      {state.aiError ? (
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-2.5 text-[12px] text-muted-foreground">
          AI refinement skipped — fell back to industry defaults. Reason:{' '}
          <span className="text-foreground">{state.aiError}</span>
        </div>
      ) : null}

      {state.cached && state.aiUsed === false ? (
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-2.5 text-[12px] text-muted-foreground">
          Industry-default schedule shown. Connect an AI key in Settings → AI
          Keys to unlock brand-tuned reasons.
        </div>
      ) : null}

      {/* Slots grouped by date */}
      {state.ok === undefined ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-card px-5 py-6 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating your plan…
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-2xl border border-border/50 bg-card px-5 py-12 text-center">
          <p className="text-[14px] font-semibold text-foreground">
            Nothing to plan yet.
          </p>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            Approve a draft on the Board first — the planner picks from your
            approved pool.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((day) => (
            <div key={day.date} className="rounded-2xl border border-border/50 bg-card">
              <div
                className="flex items-baseline gap-3 border-b border-border/40 px-5 py-3"
              >
                <p
                  className="font-mono text-[10.5px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: '#5f5850' }}
                >
                  {day.label}
                </p>
                <span className="h-px flex-1 bg-gradient-to-r from-border/50 via-border/30 to-transparent" />
                <span
                  className="lv2-tabular text-[10.5px]"
                  style={{ color: 'rgba(95,88,80,.7)' }}
                >
                  {day.slots.length} slot{day.slots.length === 1 ? '' : 's'}
                </span>
              </div>
              <ul className="lv2d-divide">
                {day.slots.map((slot) => (
                  <PlanSlotRow
                    key={`${slot.date}-${slot.time}-${slot.platform}`}
                    slot={slot}
                    workspaceId={workspaceId}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Slot row with commit form ────────────────────────────────────────

function PlanSlotRow({
  slot,
  workspaceId,
}: {
  slot: PlanSlot
  workspaceId: string
}) {
  const [state, action] = useFormState<SchedulerActionState, FormData>(
    commitPlanSlotAction,
    {},
  )
  const dotClass = PLATFORM_DOT_COLORS[slot.platform] ?? 'bg-zinc-400'
  const platformLabel = PLATFORM_LABELS[slot.platform] ?? slot.platform
  const committed = state.ok === true

  return (
    <li className="flex flex-wrap items-start gap-3 px-5 py-4">
      <div className="flex min-w-[78px] flex-col">
        <span
          className="lv2-tabular text-[16px] font-bold leading-none"
          style={{ color: '#181511' }}
        >
          {slot.time}
        </span>
        <span
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{
            background: 'rgba(15,15,15,.06)',
            color: '#5f5850',
          }}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {platformLabel}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-foreground">
          {slot.draftTitle ?? '— no matching draft —'}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          {slot.reason}
        </p>
        {slot.fromDefaults ? (
          <p
            className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
            style={{
              background: 'rgba(214,255,62,.18)',
              color: '#1a2000',
              border: '1px solid rgba(214,255,62,.35)',
            }}
          >
            Industry default
          </p>
        ) : null}
      </div>
      <form action={action} className="ml-auto shrink-0">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="output_id" value={slot.draftId ?? ''} />
        <input type="hidden" name="platform" value={slot.platform} />
        <input type="hidden" name="date" value={slot.date} />
        <input type="hidden" name="time" value={slot.time} />
        {committed ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Scheduled
          </span>
        ) : (
          <CommitButton disabled={!slot.draftId} />
        )}
        {state.ok === false && state.error ? (
          <p className="mt-1 text-[10.5px] text-destructive">{state.error}</p>
        ) : null}
      </form>
    </li>
  )
}

function CommitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] disabled:opacity-50"
      title={
        disabled
          ? 'No matching approved draft for this slot — approve one on the Board.'
          : 'Schedule this draft for the suggested slot.'
      }
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <CalendarDays className="h-3 w-3" />
      )}
      Schedule
    </button>
  )
}

function RegenerateButton({
  workspaceId,
  action,
}: {
  workspaceId: string
  action: (fd: FormData) => void
}) {
  return (
    <button
      type="button"
      onClick={() => {
        const fd = new FormData()
        fd.set('workspace_id', workspaceId)
        fd.set('force_refresh', 'true')
        action(fd)
      }}
      className="cf-btn-3d cf-btn-3d-ghost inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px]"
    >
      <RefreshCcw className="h-3 w-3" />
      Re-generate
    </button>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────

interface DayGroup {
  date: string
  label: string
  slots: PlanSlot[]
}

function groupByDate(slots: PlanSlot[]): DayGroup[] {
  const map = new Map<string, PlanSlot[]>()
  for (const s of slots) {
    const arr = map.get(s.date) ?? []
    arr.push(s)
    map.set(s.date, arr)
  }
  const groups: DayGroup[] = []
  const sortedKeys = Array.from(map.keys()).sort()
  for (const date of sortedKeys) {
    const items = map.get(date)!
    items.sort((a, b) => a.time.localeCompare(b.time))
    const dt = new Date(`${date}T00:00:00`)
    groups.push({
      date,
      label: dt.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      slots: items,
    })
  }
  return groups
}
