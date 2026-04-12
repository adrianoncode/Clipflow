'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { generateHookVariantsAction, type HookVariantsState } from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'

const STYLE_LABELS: Record<string, string> = {
  story: '📖 Story',
  contrarian: '🔥 Contrarian',
  result_first: '🏆 Result-first',
  question: '❓ Question',
}

function GenerateButton({ hasVariants }: { hasVariants: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Generating…' : hasVariants ? 'Regenerate' : 'Hook variants'}
    </Button>
  )
}

interface HookVariantsDialogProps {
  outputId: string
  workspaceId: string
  contentId: string
  platform: string
}

const initial: HookVariantsState = {}

export function HookVariantsDialog({ outputId, workspaceId, contentId, platform }: HookVariantsDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(generateHookVariantsAction, initial)
  const [copied, setCopied] = useState<string | null>(null)

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Hook variants
      </Button>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4 mt-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Hook variants</h4>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
          Close
        </button>
      </div>

      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="output_id" value={outputId} />
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <input type="hidden" name="content_id" value={contentId} />
        <input type="hidden" name="platform" value={platform} />
        <GenerateButton hasVariants={state.ok === true} />
        <span className="text-xs text-muted-foreground">Story · Contrarian · Result-first · Question</span>
      </form>

      {state.ok === false && state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      {state.ok === true ? (
        <div className="space-y-2">
          {state.variants.map((v) => (
            <div key={v.style} className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
              <div className="flex-1 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {STYLE_LABELS[v.style] ?? v.style}
                </p>
                <p className="text-sm">{v.hook}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(v.hook)}
                className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              >
                {copied === v.hook ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
