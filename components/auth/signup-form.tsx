'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signupAction, type SignupState } from '@/app/(auth)/signup/actions'

const initialState: SignupState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </Button>
  )
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, initialState)
  const hasError = Boolean(state.error)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          aria-required="true"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'signup-error' : undefined}
          placeholder="Ada Lovelace"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-required="true"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'signup-error' : undefined}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-required="true"
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError ? 'signup-error signup-password-hint' : 'signup-password-hint'
          }
        />
        <p id="signup-password-hint" className="text-xs text-muted-foreground">
          Minimum 8 characters.
        </p>
      </div>
      {state.error ? (
        <div id="signup-error">
          <FormMessage variant="error">{state.error}</FormMessage>
        </div>
      ) : null}
      <SubmitButton />
    </form>
  )
}
