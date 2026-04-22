'use client'

import { useRef } from 'react'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteAiKeyAction } from '@/app/(app)/settings/ai-keys/actions'

interface DeleteAiKeyButtonProps {
  keyId: string
  workspaceId: string
  label: string
}

export function DeleteAiKeyButton({ keyId, workspaceId, label }: DeleteAiKeyButtonProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form ref={formRef} action={deleteAiKeyAction}>
        <input type="hidden" name="key_id" value={keyId} />
        <input type="hidden" name="workspace_id" value={workspaceId} />
      </form>
      <ConfirmDialog
        tone="destructive"
        title={`Delete "${label}"?`}
        description="This cannot be undone. Any workflow using this key will start failing until you add a replacement."
        confirmLabel="Delete key"
        onConfirm={() => formRef.current?.requestSubmit()}
        trigger={(open) => (
          <Button type="button" variant="ghost" size="sm" onClick={open}>
            Delete
          </Button>
        )}
      />
    </>
  )
}
