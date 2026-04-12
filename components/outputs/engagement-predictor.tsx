'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { BarChart2, RefreshCw, Clock, Users, Zap } from 'lucide-react'

import {
  predictEngagementAction,
  type PredictEngagementState,
  type EngagementPrediction,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import { Button } from '@/components/ui/button'

interface EngagementPredictorProps {
  outputId: string
  workspaceId: string
  initialPrediction?: EngagementPrediction | null
}

function PredictButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending} className="gap-1.5">
      <BarChart2 className="h-3.5 w-3.5" />
      {pending ? 'Predicting…' : label}
    </Button>
  )
}

function ViralMeter({ value }: { value: number }) {
  const color =
    value >= 70 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-red-500'
  const label =
    value >= 70 ? 'High' : value >= 40 ? 'Medium' : 'Low'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Viral probability</span>
        <span className={`font-bold ${value >= 70 ? 'text-emerald-600 dark:text-emerald-400' : value >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
          {value}% — {label}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-md border bg-muted/30 px-3 py-2 min-w-0">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

function PredictionCard({ prediction, outputId, workspaceId, formAction }: {
  prediction: EngagementPrediction
  outputId: string
  workspaceId: string
  formAction: (payload: FormData) => void
}) {
  return (
    <div className="space-y-3">
      {/* Views + re-score row */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Estimated views</p>
          <p className="text-2xl font-bold tracking-tight">{prediction.estimated_views}</p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="output_id" value={outputId} />
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <button
            type="submit"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Re-predict"
          >
            <RefreshCw className="h-3 w-3" />
            Re-predict
          </button>
        </form>
      </div>

      {/* Viral meter */}
      <ViralMeter value={prediction.viral_probability} />

      {/* Rate stats */}
      <div className="flex gap-2 flex-wrap">
        <StatPill label="Likes" value={`${prediction.estimated_likes_pct}%`} />
        <StatPill label="Comments" value={`${prediction.estimated_comments_pct}%`} />
        <StatPill label="Shares" value={`${prediction.estimated_shares_pct}%`} />
      </div>

      {/* Best time */}
      <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-2">
        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Best time:</span>
        <span className="text-xs font-semibold">{prediction.best_posting_time}</span>
      </div>

      {/* Audience fit */}
      {prediction.audience_fit && (
        <div className="flex items-start gap-1.5 rounded-md border bg-muted/30 px-3 py-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Audience fit</p>
            <p className="text-xs">{prediction.audience_fit}</p>
          </div>
        </div>
      )}

      {/* Algorithm notes */}
      {prediction.algorithm_notes && (
        <div className="flex items-start gap-1.5 rounded-md border bg-muted/30 px-3 py-2">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Algorithm</p>
            <p className="text-xs">{prediction.algorithm_notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function EngagementPredictor({ outputId, workspaceId, initialPrediction }: EngagementPredictorProps) {
  const [state, formAction] = useFormState<PredictEngagementState, FormData>(
    predictEngagementAction,
    {},
  )

  const prediction: EngagementPrediction | null =
    state.ok === true ? state.prediction : (initialPrediction ?? null)

  return (
    <div className="border-t pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Engagement Predictor
        </span>
        {!prediction && (
          <form action={formAction}>
            <input type="hidden" name="output_id" value={outputId} />
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <PredictButton label="Predict engagement" />
          </form>
        )}
      </div>

      {state.ok === false && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      {prediction && (
        <PredictionCard
          prediction={prediction}
          outputId={outputId}
          workspaceId={workspaceId}
          formAction={formAction}
        />
      )}
    </div>
  )
}
