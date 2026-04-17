'use client'

import { useFormState, useFormStatus } from 'react-dom'

import {
  generateAbHookVariantsAction,
  setHookWinnerAction,
  type GenerateAbHookVariantsState,
  type AbHookVariant,
  type SetHookWinnerState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/ai-actions'
import { Button } from '@/components/ui/button'

interface HookAbTestProps {
  outputId: string
  workspaceId: string
  initialVariants?: AbHookVariant[] | null
}

const TRIGGER_COLORS: Record<string, string> = {
  'Curiosity gap': 'bg-blue-100 text-blue-700',
  'Bold claim/controversy': 'bg-red-100 text-red-700',
  'Personal story/vulnerability': 'bg-purple-100 text-purple-700',
}

function triggerColor(trigger: string): string {
  for (const key of Object.keys(TRIGGER_COLORS)) {
    if (trigger.toLowerCase().includes(key.toLowerCase().split('/')[0]!)) {
      return TRIGGER_COLORS[key]!
    }
  }
  return 'bg-muted text-muted-foreground'
}

function GenerateButton({ hasVariants }: { hasVariants: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending} className="gap-1.5">
      {pending ? 'Generating…' : hasVariants ? 'Re-generate' : 'Generate hook variants'}
    </Button>
  )
}

function WinnerButton({ index, outputId, workspaceId, isWinner }: {
  index: number
  outputId: string
  workspaceId: string
  isWinner: boolean
}) {
  const [, formAction] = useFormState<SetHookWinnerState, FormData>(setHookWinnerAction, {})
  const { pending } = useFormStatus()

  if (isWinner) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        Winner
      </span>
    )
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="output_id" value={outputId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="winner_index" value={index} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Mark as winner'}
      </button>
    </form>
  )
}

function VariantCard({ variant, index, outputId, workspaceId }: {
  variant: AbHookVariant
  index: number
  outputId: string
  workspaceId: string
}) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 transition-colors ${
        variant.winner ? 'border-emerald-500 bg-emerald-50/50' : 'bg-muted/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${triggerColor(variant.trigger)}`}
        >
          {variant.trigger}
        </span>
        <WinnerButton
          index={index}
          outputId={outputId}
          workspaceId={workspaceId}
          isWinner={variant.winner}
        />
      </div>
      <p className="text-sm font-medium leading-snug">{variant.hook}</p>
      {variant.explanation && (
        <p className="text-xs text-muted-foreground">{variant.explanation}</p>
      )}
    </div>
  )
}

export function HookAbTest({ outputId, workspaceId, initialVariants }: HookAbTestProps) {
  const [state, formAction] = useFormState<GenerateAbHookVariantsState, FormData>(
    generateAbHookVariantsAction,
    {},
  )

  const variants: AbHookVariant[] | null =
    state.ok === true ? state.variants : (initialVariants ?? null)

  return (
    <div className="border-t pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          A/B Hook Testing
        </span>
        <form action={formAction}>
          <input type="hidden" name="output_id" value={outputId} />
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <GenerateButton hasVariants={!!variants && variants.length > 0} />
        </form>
      </div>

      {state.ok === false && state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}

      {variants && variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <VariantCard
              key={i}
              variant={v}
              index={i}
              outputId={outputId}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
