'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { magicLinkAction, type MagicLinkState } from '@/app/(auth)/magic-link/actions'

const initialState: MagicLinkState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Sending link…' : 'Send magic link'}
    </Button>
  )
}

export function MagicLinkForm() {
  const [state, formAction] = useFormState(magicLinkAction, initialState)
  const hasError = Boolean(state.error)

  // After a successful send the form is replaced with a confirmation
  // panel — keeping the form mounted alongside the success message
  // invites the user to send the same magic-link N times.
  if (state.success) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <FormMessage variant="success">
          Check your inbox — we&rsquo;ve sent you a sign-in link.
        </FormMessage>
        <p className="text-xs text-muted-foreground">
          Didn&rsquo;t get it?{' '}
          <a
            href="/magic-link"
            className="text-foreground underline-offset-2 hover:underline"
          >
            Try a different address
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
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
          aria-describedby={hasError ? 'magic-link-error' : undefined}
          placeholder="you@example.com"
        />
      </div>
      {state.error ? (
        <div id="magic-link-error">
          <FormMessage variant="error">{state.error}</FormMessage>
        </div>
      ) : null}
      <SubmitButton />
    </form>
  )
}
