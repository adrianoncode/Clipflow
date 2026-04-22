'use client'

import { useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface ConfirmDialogProps {
  /** Renders the clickable element that opens the dialog. Receives an
   *  `onClick` prop the consumer must forward to an interactive element. */
  trigger: (open: () => void) => ReactNode
  title: string
  /** Supporting copy. Can be a string or a ReactNode for formatted text. */
  description?: ReactNode
  /** Primary action label — defaults to "Delete" for destructive flows. */
  confirmLabel?: string
  cancelLabel?: string
  /** Visual tone — `destructive` paints the confirm button red. */
  tone?: 'default' | 'destructive'
  /** Async handler fired when the user confirms. Dialog stays open and
   *  shows a loading state until it resolves. If it throws, the error
   *  surfaces inline and the dialog stays open for retry. */
  onConfirm: () => Promise<void> | void
}

/**
 * Replacement for `window.confirm()` — platform-styled, accessible,
 * escape/click-outside to dismiss, focus trap built in (via Radix),
 * and an async-aware confirm button that won't let users double-tap.
 *
 * Usage:
 *   <ConfirmDialog
 *     tone="destructive"
 *     title="Delete this draft?"
 *     description="The clip and render credit can't be restored."
 *     confirmLabel="Delete"
 *     onConfirm={async () => { await deleteAction(...) }}
 *     trigger={(open) => (
 *       <button onClick={open}><Trash2 /></button>
 *     )}
 *   />
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Block close-while-pending to avoid orphaning the async op.
          if (pending && !next) return
          setOpen(next)
          if (!next) setError(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {tone === 'destructive' ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                </div>
              ) : null}
              <div className="flex-1 space-y-1.5">
                <DialogTitle>{title}</DialogTitle>
                {description ? (
                  <DialogDescription>{description}</DialogDescription>
                ) : null}
              </div>
            </div>
          </DialogHeader>
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter className="mt-2 gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={tone === 'destructive' ? 'destructive' : 'default'}
              disabled={pending}
              onClick={handleConfirm}
              autoFocus
            >
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
