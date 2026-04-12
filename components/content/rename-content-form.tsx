'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { renameContentAction, type RenameContentState } from '@/app/(app)/workspace/[id]/content/[contentId]/actions'

interface RenameContentFormProps {
  workspaceId: string
  contentId: string
  currentTitle: string
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </Button>
  )
}

const initial: RenameContentState = {}

export function RenameContentForm({ workspaceId, contentId, currentTitle }: RenameContentFormProps) {
  const [editing, setEditing] = useState(false)
  const [state, action] = useFormState(renameContentAction, initial)

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 text-left"
        title="Click to rename"
      >
        <span className="text-2xl font-semibold tracking-tight">{currentTitle}</span>
        <span className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground transition-opacity">
          ✏️
        </span>
      </button>
    )
  }

  return (
    <form
      action={async (fd) => {
        await action(fd)
        setEditing(false)
      }}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />
      <input
        name="title"
        defaultValue={currentTitle}
        autoFocus
        maxLength={200}
        className="text-2xl font-semibold tracking-tight bg-transparent border-b-2 border-primary outline-none w-full min-w-0"
        onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
      />
      <SaveButton />
      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
        Cancel
      </Button>
      {state.ok === false && state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  )
}
