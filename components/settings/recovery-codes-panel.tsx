'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { KeyRound, RefreshCw } from 'lucide-react'

import {
  regenerateRecoveryCodesAction,
  type RegenerateCodesState,
} from '@/app/(app)/settings/security/actions'
import { RecoveryCodesDisplay } from './recovery-codes-display'

function RegenerateBtn() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:border-primary/40 disabled:opacity-60"
      onClick={(e) => {
        if (
          !window.confirm(
            'Regenerate codes? Your existing recovery codes stop working immediately.',
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} />
      {pending ? 'Generating…' : 'Regenerate codes'}
    </button>
  )
}

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

      <form action={action}>
        <RegenerateBtn />
        {state.ok === false && (
          <p className="mt-1 text-xs text-destructive">{state.error}</p>
        )}
      </form>
    </div>
  )
}
