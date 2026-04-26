'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Download, Loader2, Trash2 } from 'lucide-react'

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
  sendPasswordResetAction,
  updateProfileAction,
  type ProfileState,
} from '@/app/(app)/settings/profile/actions'

const initial: ProfileState = {}

// ---------------------------------------------------------------------------
// Display name — inline editable, save sits on the row
// ---------------------------------------------------------------------------
export function DisplayNameRow({ initialFullName }: { initialFullName: string }) {
  const [state, action] = useFormState(updateProfileAction, initial)
  const [value, setValue] = useState(initialFullName)
  const isDirty = value.trim() !== initialFullName.trim()

  return (
    <form action={action} className="flex w-full items-center gap-2">
      <Input
        name="full_name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your name"
        maxLength={80}
        className="h-9 text-[13.5px]"
      />
      <SaveBtn dirty={isDirty} />
      {state.ok === false && state.error ? (
        <span className="ml-2 text-[11px] text-destructive">{state.error}</span>
      ) : null}
    </form>
  )
}

function SaveBtn({ dirty }: { dirty: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      disabled={!dirty || pending}
      className="h-9 shrink-0 px-3 text-[12px] font-bold"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Password — single-button reset that flashes feedback on the row
// ---------------------------------------------------------------------------
export function PasswordResetButton() {
  const [state, action] = useFormState(sendPasswordResetAction, initial)
  const [showSent, setShowSent] = useState(false)

  useEffect(() => {
    if (state.ok === true) {
      setShowSent(true)
      const t = setTimeout(() => setShowSent(false), 4000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <form action={action} className="flex items-center gap-2">
      {showSent ? (
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
          ✓ Sent
        </span>
      ) : null}
      <ResetBtn />
    </form>
  )
}

function ResetBtn() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="sm"
      variant="outline"
      disabled={pending}
      className="h-9 px-3 text-[12px] font-semibold"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send reset link'}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Export — direct GET, no extra UI state needed
// ---------------------------------------------------------------------------
export function ExportButton() {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={() => {
        setBusy(true)
        window.location.href = '/api/account/export'
        setTimeout(() => setBusy(false), 2000)
      }}
      className="h-9 gap-1.5 px-3 text-[12px] font-semibold"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {busy ? 'Preparing…' : 'Download JSON'}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// Delete — destructive, dialog confirms with "DELETE" string match
// ---------------------------------------------------------------------------
export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(deleteAccountAction, initial)

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-9 gap-1.5 border-destructive/30 px-3 text-[12px] font-semibold text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete account
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete your account?</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              This will permanently delete your account, every workspace you
              own, all content, drafts, and integrations. If you have an active
              subscription, it will be cancelled immediately. Cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-4">
            <div className="space-y-1.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Type <span className="text-destructive">DELETE</span> to confirm
              </p>
              <Input
                name="confirmation"
                placeholder="DELETE"
                autoComplete="off"
                className="h-9 font-mono text-[13px]"
              />
            </div>

            {state.ok === false && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
                {state.error}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border/50 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-9 text-[12px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="destructive"
                className="h-9 text-[12px]"
              >
                Permanently delete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
