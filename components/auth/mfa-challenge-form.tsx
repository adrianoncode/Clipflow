'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { verifyMfaAction, type MfaChallengeState } from '@/app/(auth)/mfa/actions'

function SubmitBtn({ mode }: { mode: 'totp' | 'recovery' }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending
        ? 'Verifying…'
        : mode === 'totp'
          ? 'Verify'
          : 'Use recovery code'}
    </Button>
  )
}

/**
 * MFA challenge — two modes:
 *   1. TOTP (default): 6-digit numeric input from authenticator app
 *   2. Recovery: 32-char code the user saved when they enrolled
 *
 * Server action accepts either shape and routes accordingly. A recovery
 * code consumption also removes the TOTP factor — the user lands back
 * at AAL1 and can re-enroll a fresh authenticator.
 */
export function MfaChallengeForm({ next }: { next?: string }) {
  const [state, action] = useFormState<MfaChallengeState, FormData>(
    verifyMfaAction,
    {},
  )
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp')

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      {mode === 'totp' ? (
        <div className="space-y-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            Authentication code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="123456"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.5em] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="code" className="text-sm font-medium">
            Recovery code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            autoComplete="off"
            autoFocus
            required
            placeholder="A7K9-MP2X-QWN4-R8Z3"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-center font-mono text-sm tracking-wider focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[11px] text-muted-foreground">
            Using a recovery code removes your current authenticator. You&apos;ll
            need to re-enroll from settings after logging in.
          </p>
        </div>
      )}

      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}

      <SubmitBtn mode={mode} />

      <button
        type="button"
        onClick={() => setMode(mode === 'totp' ? 'recovery' : 'totp')}
        className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        {mode === 'totp'
          ? 'Lost your authenticator? Use a recovery code'
          : '← Use authenticator code instead'}
      </button>
    </form>
  )
}
