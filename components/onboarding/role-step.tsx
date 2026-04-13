'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { User, Users, Building2 } from 'lucide-react'

import { FormMessage } from '@/components/ui/form-message'
import { cn } from '@/lib/utils'
import {
  selectRoleAction,
  type RoleState,
} from '@/app/(onboarding)/onboarding/role/actions'

const initialState: RoleState = {}

const OPTIONS = [
  {
    role: 'solo' as const,
    icon: User,
    color: 'group-hover:border-violet-500/50 group-hover:bg-violet-500/5',
    activeColor: 'border-violet-500 bg-violet-500/10',
    iconColor: 'text-violet-400',
    title: 'Solo Creator',
    description: 'I create and publish my own content',
    features: ['Personal workspace', 'All AI tools', 'Brand voice'],
  },
  {
    role: 'team' as const,
    icon: Users,
    color: 'group-hover:border-blue-500/50 group-hover:bg-blue-500/5',
    activeColor: 'border-blue-500 bg-blue-500/10',
    iconColor: 'text-blue-400',
    title: 'Content Team',
    description: 'We publish together as a brand',
    features: ['Shared workspace', 'Team members', 'Review links'],
  },
  {
    role: 'agency' as const,
    icon: Building2,
    color: 'group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5',
    activeColor: 'border-emerald-500 bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    title: 'Agency',
    description: 'I manage content for multiple clients',
    features: ['Multi-client dashboard', 'White-label portals', 'Unlimited workspaces'],
  },
]

function RoleCard({ role, icon: Icon, color, iconColor, title, description, features }: typeof OPTIONS[number]) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="role"
      value={role}
      disabled={pending}
      className={cn(
        'group flex w-full flex-col gap-3 rounded-xl border-2 border-border/50 bg-card p-5 text-left transition-all duration-200',
        color,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted', iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="text-sm font-semibold">{title}</span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {features.map((f) => (
          <span key={f} className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {f}
          </span>
        ))}
      </div>
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
