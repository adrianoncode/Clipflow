'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginAction, type LoginState } from '@/app/(auth)/login/actions'

const initialState: LoginState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  )
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  // Auth errors from Supabase are intentionally generic ("Incorrect email
  // or password") so we can't pin invalid-state to a specific field.
  // Mark BOTH inputs invalid when any error is present — screen-readers
  // get the right signal, and the visual aria-invalid styling matches
  // the per-field error red without needing per-field state.
  const hasError = Boolean(state.error)

  return (
    <form action={formAction} className="space-y-4" aria-describedby={hasError ? 'login-error' : undefined}>
      <input type="hidden" name="next" value={next} />
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
          aria-describedby={hasError ? 'login-error' : undefined}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/magic-link"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-required="true"
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? 'login-error' : undefined}
        />
      </div>
      {state.error ? (
        <div id="login-error">
          <FormMessage variant="error">{state.error}</FormMessage>
        </div>
      ) : null}
      <SubmitButton />
    </form>
  )
}
