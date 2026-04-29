'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Loader2, RotateCcw } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  rejectOutputAction,
  type RejectOutputState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'

const QUICK_REASONS = [
  'Hook weak',
  'Off-brand',
  'Too long',
  'Wrong angle',
] as const

interface RejectOutputModalProps {
  workspaceId: string
  outputId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful reject — the parent (drawer) uses this
   *  to close itself or move to the next card. */
  onRejected?: () => void
}

const initial: RejectOutputState = {}

/**
 * Reject-with-reason modal — opens from the Pipeline review drawer's
 * "Reject" button. Captures a quick-reason chip + optional free-text,
 * appends a revision_note to the output's metadata, and transitions
 * the output back to `draft` for re-work.
 *
 * Lives at the workspace-pipeline layer so all reviews use the same
 * shape; per-video Drafts page can read the same revision_notes array
 * if it later wants to surface them inline.
 */
export function RejectOutputModal({
  workspaceId,
  outputId,
  open,
  onOpenChange,
  onRejected,
}: RejectOutputModalProps) {
  const [reason, setReason] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [state, action] = useFormState(rejectOutputAction, initial)
  const lastHandledOk = useRef<boolean>(false)

  // After a successful submit, close + reset. The action returns the
  // same `{ ok: true }` object reference until the next dispatch, so
  // we guard with a ref to fire the callback exactly once per success.
  useEffect(() => {
    if (state.ok && !lastHandledOk.current) {
      lastHandledOk.current = true
      setReason('')
      setNotes('')
      onOpenChange(false)
      onRejected?.()
    }
    if (!state.ok) {
      lastHandledOk.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send back for revision</DialogTitle>
          <DialogDescription>
            Pick a reason or write a quick note. The draft moves back to
            the Draft column and the note is saved for the next pass.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="output_id" value={outputId} />
          <input type="hidden" name="reason" value={reason} />

          <div>
            <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Quick reason
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => {
                const isActive = r === reason
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setReason((prev) => (prev === r ? '' : r))}
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold transition-all ${
                      isActive
                        ? 'border-[#2A1A3D] bg-[#2A1A3D] text-[#D6FF3E]'
                        : 'border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                    style={{
                      fontFamily:
                        'var(--font-inter-tight), var(--font-inter), sans-serif',
                    }}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="reject-notes"
              className="mb-1 block text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Notes <span className="font-medium normal-case tracking-normal text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              id="reject-notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hook needs to land in the first 3 seconds…"
              rows={3}
              maxLength={600}
              className="w-full resize-none rounded-lg border border-border/60 bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/55 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
            <p className="mt-1 text-right text-[10.5px] text-muted-foreground/60">
              {notes.length}/600
            </p>
          </div>

          {state.ok === false && state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/[0.06] px-3 py-2 text-[12px] text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 items-center rounded-xl border border-border/60 bg-background px-3 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              Cancel
            </button>
            <SubmitButton hasReason={Boolean(reason || notes.trim())} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SubmitButton({ hasReason }: { hasReason: boolean }) {
  const { pending } = useFormStatus()
  const disabled = pending || !hasReason
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#2A1A3D] px-3.5 text-[12.5px] font-bold tracking-tight text-[#D6FF3E] transition-all hover:-translate-y-px hover:bg-[#1A0F2A] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      style={{
        fontFamily:
          'var(--font-inter-tight), var(--font-inter), sans-serif',
      }}
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Sending back
        </>
      ) : (
        <>
          <RotateCcw className="h-3.5 w-3.5" />
          Send back to draft
        </>
      )}
    </button>
  )
}
