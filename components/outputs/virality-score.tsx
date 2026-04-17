'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Flame, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

import { getViralityScoreAction } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/ai-actions'
import type { GetViralityScoreState, ViralityResult } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/ai-actions'
import { Button } from '@/components/ui/button'

interface ViralityScoreProps {
  outputId: string
  workspaceId: string
  initialVirality?: ViralityResult | null
}

function ScoreButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <Flame className="mr-1.5 h-3.5 w-3.5" />
      {pending ? 'Scoring…' : label}
    </Button>
  )
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const color =
    value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function OverallCircle({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-emerald-600'
      : score >= 50
        ? 'text-amber-600'
        : 'text-red-600'
  const borderColor =
    score >= 70
      ? 'border-emerald-500'
      : score >= 50
        ? 'border-amber-500'
        : 'border-red-500'

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 ${borderColor}`}
    >
      <span className={`text-lg font-bold leading-none ${color}`}>{score}</span>
    </div>
  )
}

export function ViralityScore({ outputId, workspaceId, initialVirality }: ViralityScoreProps) {
  const [showTips, setShowTips] = useState(false)

  const [state, formAction] = useFormState<GetViralityScoreState, FormData>(
    getViralityScoreAction,
    {},
  )

  const virality: ViralityResult | null | undefined =
    state.ok === true ? state.virality : initialVirality

  if (!virality) {
    return (
      <div className="border-t pt-3">
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="output_id" value={outputId} />
          <ScoreButton label="Score virality" />
          {state.ok === false && (
            <p className="mt-1 text-xs text-destructive">{state.error}</p>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="border-t pt-3 space-y-3">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <OverallCircle score={virality.overall} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{virality.verdict}</p>
          <p className="text-xs text-muted-foreground">Virality score</p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="output_id" value={outputId} />
          <button
            type="submit"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Re-score"
          >
            <RefreshCw className="h-3 w-3" />
            Re-score
          </button>
        </form>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2">
        <ScoreBar value={virality.hook_strength} label="Hook Strength" />
        <ScoreBar value={virality.scroll_stop_power} label="Scroll-Stop Power" />
        <ScoreBar value={virality.shareability} label="Shareability" />
        <ScoreBar value={virality.engagement_bait} label="Engagement" />
      </div>

      {/* Tips collapsible */}
      {Array.isArray(virality.tips) && virality.tips.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowTips((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showTips ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Improve →
          </button>
          {showTips && (
            <ul className="mt-2 space-y-1 pl-3">
              {virality.tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground list-disc">
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state.ok === false && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </div>
  )
}
