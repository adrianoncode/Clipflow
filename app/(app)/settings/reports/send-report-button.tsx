'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { sendReportEmailAction, type SendReportEmailState } from './actions'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Sending…' : 'Send to email'}
    </Button>
  )
}

interface SendReportButtonProps {
  workspaceId: string
  period: 'week' | 'month'
  userEmail: string
}

export function SendReportButton({ workspaceId, period, userEmail }: SendReportButtonProps) {
  const initial: SendReportEmailState = {}
  const [state, action] = useFormState(sendReportEmailAction, initial)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="period" value={period} />
      <input type="hidden" name="user_email" value={userEmail} />
      <SubmitButton />
      {state && 'ok' in state && state.ok === true && (
        <span className="text-xs text-green-600">Sent!</span>
      )}
      {state && 'ok' in state && state.ok === false && (
        <span className="text-xs text-destructive">{state.error}</span>
      )}
    </form>
  )
}
