'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { BarChart2 } from 'lucide-react'

import { analyzeSentimentAction } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import type { AnalyzeSentimentState, SentimentResult } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'
import { Button } from '@/components/ui/button'
import { SentimentBadge } from '@/components/content/sentiment-badge'

interface SentimentAnalysisButtonProps {
  workspaceId: string
  contentId: string
  initialSentiment: SentimentResult | null
}

function SubmitBtn({ hasSentiment }: { hasSentiment: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} className="gap-1.5">
      <BarChart2 className="h-3.5 w-3.5" />
      {pending ? 'Analyzing…' : hasSentiment ? 'Re-analyze' : 'Analyze sentiment'}
    </Button>
  )
}

export function SentimentAnalysisButton({
  workspaceId,
  contentId,
  initialSentiment,
}: SentimentAnalysisButtonProps) {
  const [state, formAction] = useActionState<AnalyzeSentimentState, FormData>(
    analyzeSentimentAction,
    {},
  )

  const currentSentiment: SentimentResult | null =
    state.ok === true ? state.sentiment : initialSentiment

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <SubmitBtn hasSentiment={currentSentiment !== null} />
        {state.ok === false && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
        {state.ok === true && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Sentiment updated!</p>
        )}
      </form>
      {currentSentiment && <SentimentBadge sentiment={currentSentiment} />}
    </div>
  )
}
