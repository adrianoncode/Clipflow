'use client'

import { useCallback, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { editTranscriptAction, type EditTranscriptState } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

interface TranscriptViewProps {
  text: string
  workspaceId: string
  contentId: string
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  )
}

const initial: EditTranscriptState = {}

export function TranscriptView({ text, workspaceId, contentId }: TranscriptViewProps) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [state, action] = useFormState(editTranscriptAction, initial)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — silently no-op
    }
  }, [text])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Transcript
        </h2>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      {editing ? (
        <form
          action={async (fd) => {
            await action(fd)
            setEditing(false)
          }}
          className="space-y-2"
        >
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <input type="hidden" name="content_id" value={contentId} />
          <textarea
            name="transcript"
            defaultValue={text}
            rows={16}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          {state.ok === false && state.error ? (
            <FormMessage variant="error">{state.error}</FormMessage>
          ) : null}
          <div className="flex gap-2">
            <SaveButton />
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-4 text-sm leading-relaxed">
          {text}
        </div>
      )}
    </div>
  )
}
