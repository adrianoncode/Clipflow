'use client'

import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AiKeyForm, type AiKeyFormState } from '@/components/ai-keys/ai-key-form'
import { saveAiKeySettingsAction } from '@/app/(app)/settings/ai-keys/actions'

interface AddAiKeyDialogProps {
  workspaceId: string
}

/**
 * Wraps the shared AiKeyForm in a modal dialog. On successful save the
 * action returns `{ ok: true }`, the form fires onSuccess, and we close
 * the dialog. revalidatePath in the action triggers the parent RSC to
 * re-render the list with the new key included.
 */
export function AddAiKeyDialog({ workspaceId }: AddAiKeyDialogProps) {
  const [open, setOpen] = useState(false)

  const onSuccess = useCallback(() => {
    setOpen(false)
  }, [])

  // Bind the workspace id into the action by wrapping it. The form's
  // hidden input carries the value into formData.
  const action = useCallback(
    async (prev: AiKeyFormState, formData: FormData): Promise<AiKeyFormState> => {
      formData.set('workspace_id', workspaceId)
      return saveAiKeySettingsAction(prev, formData)
    },
    [workspaceId],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new AI key</DialogTitle>
          <DialogDescription>
            Paste the key once — we&apos;ll validate it with the provider and store it
            encrypted.
          </DialogDescription>
        </DialogHeader>
        <AiKeyForm action={action} onSuccess={onSuccess} submitLabel="Save key" />
      </DialogContent>
    </Dialog>
  )
}
