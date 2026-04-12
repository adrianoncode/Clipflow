'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { acceptInviteAction, type AcceptInviteState } from '@/app/invite/[token]/actions'

interface AcceptInviteFormProps {
  token: string
  userEmail: string
}

function AcceptButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Joining…' : 'Accept invite'}
    </Button>
  )
}

const initial: AcceptInviteState = {}

export function AcceptInviteForm({ token, userEmail }: AcceptInviteFormProps) {
  const [state, action] = useFormState(acceptInviteAction, initial)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-center text-sm text-muted-foreground">
        Logged in as <span className="font-medium">{userEmail}</span>
      </p>

      {state.ok === false && state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      <AcceptButton />
    </form>
  )
}
