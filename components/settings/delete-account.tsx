'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  deleteAccountAction,
  type ProfileState,
} from '@/app/(app)/settings/profile/actions'

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(deleteAccountAction, {} as ProfileState)

  return (
    <>
      <div className="max-w-xl space-y-3 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-6">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Delete account</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Permanently delete your account and all your data. This cannot be undone.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
          onClick={() => setOpen(true)}
        >
          Delete my account
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete your account?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, all workspaces, content,
              outputs, and integrations. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
              </p>
              <Input
                name="confirmation"
                placeholder="DELETE"
                autoComplete="off"
                className="h-8 text-xs font-mono"
              />
            </div>

            {state.ok === false && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {state.error}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                className="h-8 text-xs"
              >
                Permanently delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
