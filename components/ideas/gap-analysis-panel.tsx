'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { analyzeGapsAction, type GapAnalysisState } from '@/app/(app)/workspace/[id]/ideas/gap-actions'
import { cn } from '@/lib/utils'

function SubmitButton({ hasGaps }: { hasGaps: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Analyzing…' : hasGaps ? 'Re-analyze' : 'Analyze my content gaps'}
    </Button>
  )
}

const URGENCY_COLORS = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-muted text-muted-foreground',
}

interface GapAnalysisPanelProps {
  workspaceId: string
}

const initial: GapAnalysisState = {}

export function GapAnalysisPanel({ workspaceId }: GapAnalysisPanelProps) {
  const [state, action] = useFormState(analyzeGapsAction, initial)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Gap Analysis</h2>
        <p className="text-sm text-muted-foreground">
          AI scans your existing content and finds topics your audience wants that you have not covered yet.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <form action={action} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <div className="space-y-1">
            <label htmlFor="gap-niche" className="text-sm font-medium">
              Your niche <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="gap-niche"
              name="niche"
              type="text"
              placeholder="e.g. personal finance for millennials"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-80"
            />
          </div>

          {state.ok === false ? (
            <FormMessage variant="error">{state.error}</FormMessage>
          ) : null}

          {state.ok === true ? (
            <p className="text-xs text-muted-foreground">
              Analyzed {state.analyzedCount} content items.
            </p>
          ) : null}

          <SubmitButton hasGaps={state.ok === true} />
        </form>
      </div>

      {state.ok === true ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.gaps.map((gap, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{gap.topic}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    URGENCY_COLORS[gap.urgency],
                  )}
                >
                  {gap.urgency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{gap.reason}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
