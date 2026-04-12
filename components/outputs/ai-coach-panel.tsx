'use client'

import { useFormState } from 'react-dom'
import { useFormStatus } from 'react-dom'
import { Sparkles } from 'lucide-react'

import { getAiCoachFeedbackAction } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { AiCoachFeedbackState } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AiCoachPanelProps {
  workspaceId: string
  /** Plain-text body of each output, concatenated or as list items */
  outputBodies: string
}

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="gap-1.5">
      <Sparkles className="h-3.5 w-3.5" />
      {pending ? 'Analyzing…' : 'Get AI feedback'}
    </Button>
  )
}

export function AiCoachPanel({ workspaceId, outputBodies }: AiCoachPanelProps) {
  const [state, formAction] = useFormState(
    getAiCoachFeedbackAction,
    {},
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI Content Coach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Get AI-powered feedback on your drafts — specific, actionable improvements to make your
          content perform better.
        </p>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="output_bodies" value={outputBodies} />
          <SubmitBtn />
        </form>

        {state.ok === false && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {state.error}
          </p>
        )}

        {state.ok === true && state.feedback && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Feedback
            </p>
            <div className="space-y-1 whitespace-pre-wrap text-sm leading-relaxed">
              {state.feedback}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
