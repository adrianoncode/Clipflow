'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { deleteAiKeyAction } from '@/app/(app)/settings/ai-keys/actions'

interface DeleteAiKeyButtonProps {
  keyId: string
  workspaceId: string
  label: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}

export function DeleteAiKeyButton({ keyId, workspaceId, label }: DeleteAiKeyButtonProps) {
  return (
    <form
      action={deleteAiKeyAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete the key "${label}"? This cannot be undone.`)) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="key_id" value={keyId} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <SubmitButton />
    </form>
  )
}
