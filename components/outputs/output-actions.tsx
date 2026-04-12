'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { EditOutputDialog } from '@/components/outputs/edit-output-dialog'
import { HookVariantsDialog } from '@/components/outputs/hook-variants-dialog'
import {
  regenerateOutputAction,
  starOutputAction,
  type RegenerateOutputState,
  type StarOutputState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { OutputRow } from '@/lib/content/get-outputs'

interface OutputActionsProps {
  output: OutputRow
  contentId: string
}

const initialRegenerateState: RegenerateOutputState = {}
const initialStarState: StarOutputState = {}

function RegenerateSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? 'Regenerating…' : 'Regenerate'}
    </Button>
  )
}

export function OutputActions({ output, contentId }: OutputActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [starred, setStarred] = useState((output as OutputRow & { is_starred?: boolean }).is_starred ?? false)
  const [regenState, regenFormAction] = useFormState(regenerateOutputAction, initialRegenerateState)
  const [, starFormAction] = useFormState(starOutputAction, initialStarState)

  function handleCopy() {
    if (!output.body) return
    navigator.clipboard.writeText(output.body).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleExport() {
    if (!output.body) return
    const blob = new Blob([output.body], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${output.platform}-output.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {/* Star button — optimistic toggle */}
        <form
          action={starFormAction}
          onSubmit={() => setStarred((s) => !s)}
        >
          <input type="hidden" name="output_id" value={output.id} />
          <input type="hidden" name="workspace_id" value={output.workspace_id} />
          <input type="hidden" name="starred" value={String(!starred)} />
          <Button type="submit" variant="ghost" size="sm" title={starred ? 'Unstar' : 'Mark as strong'}>
            {starred ? '⭐ Starred' : '☆ Star'}
          </Button>
        </form>

        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
          Edit
        </Button>

        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>

        <Button variant="ghost" size="sm" onClick={handleExport}>
          Export .md
        </Button>

        <form
          action={regenFormAction}
          onSubmit={(e) => {
            if (!window.confirm('Regenerate this platform? The current draft will be replaced.')) {
              e.preventDefault()
            }
          }}
        >
          <input type="hidden" name="workspace_id" value={output.workspace_id} />
          <input type="hidden" name="content_id" value={contentId} />
          <input type="hidden" name="output_id" value={output.id} />
          <input type="hidden" name="platform" value={output.platform} />
          <RegenerateSubmitButton />
        </form>
      </div>

      {regenState.ok === false && (
        <FormMessage variant="error" className="text-xs">
          {regenState.error}
        </FormMessage>
      )}

      <EditOutputDialog output={output} open={editOpen} onOpenChange={setEditOpen} />

      <HookVariantsDialog
        outputId={output.id}
        workspaceId={output.workspace_id}
        contentId={contentId}
        platform={output.platform}
      />
    </div>
  )
}
