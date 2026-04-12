'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Star, ChevronDown, ChevronUp } from 'lucide-react'

import { saveOutputPerformanceAction } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { SaveOutputPerformanceState, PerformanceData } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import { Button } from '@/components/ui/button'

interface PerformanceTrackerProps {
  outputId: string
  workspaceId: string
  initialPerformance: PerformanceData | null
}

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              (hovered || value) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  )
}

export function PerformanceTracker({
  outputId,
  workspaceId,
  initialPerformance,
}: PerformanceTrackerProps) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(initialPerformance?.rating ?? 0)

  const [state, formAction] = useActionState<SaveOutputPerformanceState, FormData>(
    saveOutputPerformanceAction,
    {},
  )

  const currentPerformance: PerformanceData | null =
    state.ok === true ? null : initialPerformance

  // Show summary if we have data and form is not in edit mode
  const hasSaved = state.ok === true

  return (
    <div className="border-t pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Track performance
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Show existing performance summary */}
          {currentPerformance && !hasSaved && (
            <div className="rounded-md bg-muted/50 p-2.5 space-y-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      currentPerformance.rating >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              {currentPerformance.note && (
                <p className="text-xs text-muted-foreground">{currentPerformance.note}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Recorded {new Date(currentPerformance.recorded_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <form action={formAction} className="space-y-2">
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <input type="hidden" name="output_id" value={outputId} />
            <input type="hidden" name="rating" value={rating} />

            <div>
              <p className="text-xs font-medium mb-1.5">Rating</p>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <textarea
              name="note"
              placeholder="How did this perform? Views, engagement, etc."
              defaultValue={currentPerformance?.note ?? ''}
              maxLength={200}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />

            <div className="flex items-center gap-2">
              <SubmitBtn />
              {state.ok === false && (
                <p className="text-xs text-destructive">{state.error}</p>
              )}
              {hasSaved && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Saved!</p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
