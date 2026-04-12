'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormMessage } from '@/components/ui/form-message'
import { updateProfileAction, sendPasswordResetAction, type ProfileState } from '@/app/(app)/settings/profile/actions'

interface ProfileFormProps {
  email: string
  initialFullName: string
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
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Sending…' : 'Send password reset email'}
    </Button>
  )
}

const initial: ProfileState = {}

export function ProfileForm({ email, initialFullName }: ProfileFormProps) {
  const [nameState, nameAction] = useFormState(updateProfileAction, initial)
  const [resetState, resetAction] = useFormState(sendPasswordResetAction, initial)

  return (
    <div className="space-y-8">
      {/* Name form */}
      <form action={nameAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} disabled className="bg-muted/40" />
          <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Display name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={initialFullName}
            placeholder="Your name"
            maxLength={80}
          />
        </div>

        {nameState.ok === false && nameState.error ? (
          <FormMessage variant="error">{nameState.error}</FormMessage>
        ) : nameState.ok === true ? (
          <FormMessage variant="success">Name updated.</FormMessage>
        ) : null}

        <SaveButton />
      </form>

      {/* Password reset form */}
      <div className="border-t pt-6 space-y-3">
        <div>
          <p className="text-sm font-medium">Password</p>
          <p className="text-sm text-muted-foreground">
            We&apos;ll send a reset link to <span className="font-medium">{email}</span>.
          </p>
        </div>

        {resetState.ok === false && resetState.error ? (
          <FormMessage variant="error">{resetState.error}</FormMessage>
        ) : resetState.ok === true ? (
          <FormMessage variant="success">Reset email sent — check your inbox.</FormMessage>
        ) : null}

        <form action={resetAction}>
          <ResetButton />
        </form>
      </div>
    </div>
  )
}
