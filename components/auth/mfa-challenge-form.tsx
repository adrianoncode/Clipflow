'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { verifyMfaAction, type MfaChallengeState } from '@/app/(auth)/mfa/actions'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Verifying…' : 'Verify'}
    </Button>
  )
}

export function MfaChallengeForm({ next }: { next?: string }) {
  const [state, action] = useFormState<MfaChallengeState, FormData>(
    verifyMfaAction,
    {},
  )

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
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
      {state.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <SubmitBtn />
    </form>
  )
}
