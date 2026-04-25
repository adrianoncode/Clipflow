'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Mail, KeyRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import {
  updateProfileAction,
  sendPasswordResetAction,
  type ProfileState,
} from '@/app/(app)/settings/profile/actions'

interface ProfileFormProps {
  email: string
  initialFullName: string
}

const initial: ProfileState = {}

/**
 * Lives inside a SectionCard, so it owns no header chrome of its own —
 * just the two stacked sub-flows: name update + password reset. The
 * sub-flows are visually separated by a hairline rule, not a heading,
 * since the parent card already names what's inside.
 */
export function ProfileForm({ email, initialFullName }: ProfileFormProps) {
  const [nameState, nameAction] = useFormState(updateProfileAction, initial)
  const [resetState, resetAction] = useFormState(sendPasswordResetAction, initial)

  return (
    <div className="space-y-7">
      {/* ── Name + email ── */}
      <form action={nameAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="email"
            label="Email"
            hint="Your sign-in. Change requires support — keeps the audit trail clean."
            icon={<Mail className="h-3.5 w-3.5" />}
          >
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted/40"
            />
          </Field>

          <Field id="full_name" label="Display name">
            <Input
              id="full_name"
              name="full_name"
              defaultValue={initialFullName}
              placeholder="Your name"
              maxLength={80}
            />
          </Field>
        </div>

        {nameState.ok === false && nameState.error ? (
          <FormMessage variant="error">{nameState.error}</FormMessage>
        ) : nameState.ok === true ? (
          <FormMessage variant="success">Name updated.</FormMessage>
        ) : null}

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>

      {/* ── Hairline separator + password row ── */}
      <div className="border-t border-border/60" />

      <form action={resetAction} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-foreground">Password</p>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              We send a one-time reset link to{' '}
              <span className="font-semibold text-foreground">{email}</span>. The
              link expires in an hour.
            </p>
            {resetState.ok === false && resetState.error ? (
              <FormMessage variant="error">{resetState.error}</FormMessage>
            ) : resetState.ok === true ? (
              <FormMessage variant="success">
                Reset email sent — check your inbox.
              </FormMessage>
            ) : null}
          </div>
        </div>
        <ResetButton />
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function Field({
  id,
  label,
  hint,
  icon,
  children,
}: {
  id: string
  label: string
  hint?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground"
      >
        {icon ? (
          <span className="text-muted-foreground/70">{icon}</span>
        ) : null}
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  )
}

function ResetButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="shrink-0"
    >
      {pending ? 'Sending…' : 'Send reset link'}
    </Button>
  )
}
