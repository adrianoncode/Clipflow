'use client'

import { useRef, useState } from 'react'
import { useFormState } from 'react-dom'
import { KeyRound, RefreshCw } from 'lucide-react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  regenerateRecoveryCodesAction,
  type RegenerateCodesState,
} from '@/app/(app)/settings/security/actions'
import { RecoveryCodesDisplay } from './recovery-codes-display'

/**
 * Panel on /settings/security showing the count of unused recovery
 * codes plus a "Regenerate" button. When the user regenerates, the
 * new codes display inline (same one-time-view pattern as enrollment).
 */
export function RecoveryCodesPanel({ unusedCount }: { unusedCount: number }) {
  const [state, action] = useFormState<RegenerateCodesState, FormData>(
    regenerateRecoveryCodesAction,
    {},
  )
  const [dismissed, setDismissed] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (state.ok === true && !dismissed) {
    return (
      <RecoveryCodesDisplay
        codes={state.recoveryCodes}
        onAcknowledge={() => setDismissed(true)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <KeyRound className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Recovery codes</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {unusedCount > 0
              ? `${unusedCount} of 10 single-use codes remaining.`
              : 'No recovery codes. Generate some so you can log in without your authenticator.'}
            {unusedCount > 0 && unusedCount <= 3 && (
              <span className="ml-1 font-medium text-amber-700">
                Running low — regenerate before you need them.
              </span>
            )}
          </p>
        </div>
      </div>

      <div>
        <form ref={formRef} action={action} />
        <ConfirmDialog
          tone="destructive"
          title="Regenerate recovery codes?"
          description="Your existing recovery codes stop working the moment new ones are issued. Print or save the new set somewhere safe."
          confirmLabel="Regenerate codes"
          onConfirm={() => formRef.current?.requestSubmit()}
          trigger={(open) => (
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate codes
            </button>
          )}
        />
        {state.ok === false && (
          <p className="mt-1 text-xs text-destructive">{state.error}</p>
        )}
      </div>
    </div>
  )
}
