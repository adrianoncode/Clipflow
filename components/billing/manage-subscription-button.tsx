'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { createPortalSessionAction } from '@/app/(app)/billing/actions'

function PortalButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Redirecting…' : 'Manage subscription'}
    </Button>
  )
}

interface ManageSubscriptionButtonProps {
  workspaceId: string
}

export function ManageSubscriptionButton({ workspaceId }: ManageSubscriptionButtonProps) {
  const [state, action] = useFormState(createPortalSessionAction, undefined)

  return (
    <form action={action}>
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <PortalButton />
      {state?.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  )
}
