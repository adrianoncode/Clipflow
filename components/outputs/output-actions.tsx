'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { EditOutputDialog } from '@/components/outputs/edit-output-dialog'
import {
  regenerateOutputAction,
  type RegenerateOutputState,
} from '@/app/(app)/workspace/[id]/content/[contentId]/outputs/actions'
import type { OutputRow } from '@/lib/content/get-outputs'

interface OutputActionsProps {
  output: OutputRow
  contentId: string
}

const initialRegenerateState: RegenerateOutputState = {}

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
  const [regenState, regenFormAction] = useFormState(regenerateOutputAction, initialRegenerateState)

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
    </div>
  )
}
