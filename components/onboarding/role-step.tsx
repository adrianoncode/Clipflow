'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { User, Building2, ArrowRight } from 'lucide-react'

import { FormMessage } from '@/components/ui/form-message'
import { cn } from '@/lib/utils'
import {
  selectRoleAction,
  type RoleState,
} from '@/app/(onboarding)/onboarding/role/actions'

const initialState: RoleState = {}

// Two ICPs, two paths. `team` stays in the DB enum as a legacy SKU but
// new sign-ups pick Creator or Studio — that alone decides what the
// dashboard + sidebar show from day one.
const OPTIONS = [
  {
    role: 'solo' as const,
    icon: User,
    title: "I'm a creator",
    description: 'One brand, one voice. Turn my videos into posts.',
    features: ['Schedule + auto-publish', 'A/B hook testing', 'Creator research'],
  },
  {
    role: 'agency' as const,
    icon: Building2,
    title: 'I manage multiple brands',
    description: 'Agency or social-media manager with clients to run.',
    features: [
      'One workspace per client',
      'Team seats + review links',
      'White-label portal',
    ],
  },
]

function RoleCard({
  role,
  icon: Icon,
  title,
  description,
  features,
}: (typeof OPTIONS)[number]) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="role"
      value={role}
      disabled={pending}
      className={cn(
        'group relative flex w-full items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md hover:shadow-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-all group-hover:bg-primary/15 group-hover:ring-primary/25">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {features.map((f) => (
            <span
              key={f}
              className="rounded-full border border-border/60 bg-background px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

export function RoleStep() {
  const [state, formAction] = useFormState(selectRoleAction, initialState)

  return (
    <form action={formAction} className="space-y-2.5">
      {OPTIONS.map((option) => (
        <RoleCard key={option.role} {...option} />
      ))}
      {state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}
    </form>
  )
}
