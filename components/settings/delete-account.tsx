'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { Download, Trash2, FileDown } from 'lucide-react'

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

/**
 * GDPR corner of the profile settings page.
 *
 * Two related-but-separate concerns live here:
 *
 *   1. Data export (Article 20) — a one-click JSON download of every
 *      row we store tied to the user. Keyed off a plain GET so the
 *      browser handles the Content-Disposition attachment natively.
 *
 *   2. Account deletion (Article 17) — destructive, requires typing
 *      DELETE, cascades through workspaces + content + subscriptions.
 *      The warning explicitly nudges toward exporting first, because
 *      the deletion CANNOT be undone and Support can't retrieve data
 *      after the cascade runs.
 */
export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [state, action] = useFormState(deleteAccountAction, {} as ProfileState)

  function handleExport() {
    setExporting(true)
    try {
      // Let the browser handle the download via Content-Disposition —
      // simpler than building a blob client-side, and streams for
      // workspaces with a lot of content.
      window.location.href = '/api/account/export'
    } finally {
      // The redirect above drops us into the download, so this reset
      // mostly just matters if the request errors out in-flight.
      setTimeout(() => setExporting(false), 2000)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      {/* Export data — always available, non-destructive */}
      <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card p-5">
        <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold">Export your data</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Download a JSON file of your profile, workspaces, content,
              drafts, render history, and subscription state. Useful as a
              backup or before deleting your account.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={exporting}
            onClick={handleExport}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exporting ? 'Preparing…' : 'Download my data'}
          </Button>
        </div>
      </div>

      {/* Delete account — destructive, separate card with destructive tone */}
      <div className="space-y-3 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-5">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">Delete account</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Permanently delete your account and everything connected to it —
              workspaces, content, drafts, integrations. This cannot be undone
              and support cannot recover the data afterwards.
              {' '}
              <span className="font-medium text-foreground">
                Consider exporting your data first.
              </span>
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
              This will permanently delete your account, every workspace you
              own, all content, drafts, and integrations. If you have an active
              subscription, it will be cancelled immediately. This action cannot
              be undone.
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
    </div>
  )
}
