'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { FormMessage } from '@/components/ui/form-message'
import { cn } from '@/lib/utils'
import {
  selectRoleAction,
  type RoleState,
} from '@/app/(onboarding)/onboarding/role/actions'

const initialState: RoleState = {}

interface RoleOption {
  role: 'solo' | 'team' | 'agency'
  title: string
  description: string
}

const OPTIONS: RoleOption[] = [
  {
    role: 'solo',
    title: 'Solo creator',
    description:
      'I publish my own content. I just need my personal workspace set up.',
  },
  {
    role: 'team',
    title: 'Content team',
    description:
      'We publish together as a brand. I want a shared team workspace.',
  },
  {
    role: 'agency',
    title: 'Agency',
    description:
      'I run content for multiple clients. I want a team workspace plus room to add client workspaces later.',
  },
]

function RoleCard({ role, title, description }: RoleOption) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="role"
      value={role}
      disabled={pending}
      className={cn(
        'group flex w-full flex-col gap-1 rounded-lg border border-input bg-background p-4 text-left shadow-sm transition-colors',
        'hover:border-primary hover:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <span className="text-base font-semibold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </button>
  )
}

export function RoleStep() {
  const [state, formAction] = useFormState(selectRoleAction, initialState)

  return (
    <form action={formAction} className="space-y-3">
      {OPTIONS.map((option) => (
        <RoleCard key={option.role} {...option} />
      ))}
      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}
    </form>
  )
}
