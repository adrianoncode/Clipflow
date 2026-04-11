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
          placeholder="you@example.com"
        />
      </div>
      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}
      {state.success ? (
        <FormMessage variant="success">
          Check your inbox — we&apos;ve sent you a sign-in link.
        </FormMessage>
      ) : null}
      <SubmitButton />
    </form>
  )
}
