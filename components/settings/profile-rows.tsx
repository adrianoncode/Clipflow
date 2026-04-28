'use client'

import { useEffect, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Check, Download, Loader2, Trash2 } from 'lucide-react'

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
// Display name — inline editable + animated sticky save bar when dirty
// ---------------------------------------------------------------------------

/**
 * Designer-detail: when the user changes the field, a small floating
 * "Unsaved changes" bar appears at the viewport bottom with a Save +
 * Discard pair. Same pattern as Linear / Stripe — guarantees the user
 * never loses an edit by clicking away.
 */
export function DisplayNameRow({ initialFullName }: { initialFullName: string }) {
  const [state, action] = useFormState(updateProfileAction, initial)
  const [value, setValue] = useState(initialFullName)
  const isDirty = value.trim() !== initialFullName.trim()

  return (
    <form action={action} className="w-full">
      <div className="flex w-full items-center gap-2">
        <SettingsInput
          name="full_name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          maxLength={80}
        />
        {/* Inline ghost save — visible only when not dirty (placeholder
            so the row layout doesn't jump). */}
        {!isDirty ? (
          <span
            className="hidden h-9 items-center px-1 text-[11px] text-muted-foreground/60 sm:inline-flex"
            aria-hidden
          >
            Saved
          </span>
        ) : null}
      </div>

      {state.ok === false && state.error ? (
        <p className="mt-1.5 text-[11px] text-destructive">{state.error}</p>
      ) : null}

      {isDirty ? <UnsavedBar onDiscard={() => setValue(initialFullName)} /> : null}
    </form>
  )
}

function UnsavedBar({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-5 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-border/70 bg-card/95 px-3 py-2 shadow-2xl shadow-primary/10 backdrop-blur-sm"
        style={{
          boxShadow:
            '0 18px 48px -12px rgba(42,26,61,0.32), 0 4px 12px -4px rgba(42,26,61,0.18)',
        }}
      >
        <span className="ml-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400"
            aria-hidden
          />
          Unsaved changes
        </span>
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Discard
        </button>
        <SaveBtn floating />
      </div>
    </div>
  )
}

function SaveBtn({ floating = false }: { floating?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        floating
          ? 'cf-btn-3d cf-btn-3d-primary inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] disabled:opacity-60'
          : 'cf-btn-3d cf-btn-3d-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] disabled:opacity-60'
      }
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
          Save changes
        </>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Password — ghost button (low-key, no card-stealing)
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
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
          <Check className="h-3 w-3" strokeWidth={3} />
          Sent
        </span>
      ) : null}
      <ResetBtn />
    </form>
  )
}

function ResetBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 text-[12.5px] font-semibold text-foreground transition-all hover:-translate-y-px hover:border-border hover:shadow-sm disabled:opacity-60 disabled:translate-y-0"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Send reset link'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Export — subtle primary so it reads as "intentional action"
// ---------------------------------------------------------------------------
export function ExportButton() {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true)
        window.location.href = '/api/account/export'
        setTimeout(() => setBusy(false), 2000)
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary/[0.08] px-3 text-[12.5px] font-semibold text-primary transition-all hover:-translate-y-px hover:bg-primary/[0.12] hover:shadow-sm disabled:opacity-60 disabled:translate-y-0"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {busy ? 'Preparing…' : 'Download JSON'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Delete — destructive, prominent
// ---------------------------------------------------------------------------
export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [state, action] = useFormState(deleteAccountAction, initial)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 text-[12.5px] font-bold text-destructive transition-all hover:-translate-y-px hover:border-destructive/50 hover:bg-destructive/[0.1]"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete account
      </button>

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
              <p className="text-[12px] font-semibold text-foreground">
                Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
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

// ---------------------------------------------------------------------------
// SettingsInput — designer-grade input chrome shared across settings rows
// ---------------------------------------------------------------------------

function SettingsInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-[13px] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition-all placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${
        props.className ?? ''
      }`}
    />
  )
}
