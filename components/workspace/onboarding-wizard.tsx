'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createInviteAction,
  type CreateInviteState,
} from '@/app/(app)/workspace/[id]/members/actions'

interface OnboardingWizardProps {
  workspaceId: string
  workspaceName: string
}

/**
 * Three-step client onboarding wizard. Editorial typography (mono
 * kicker + serif H1) so it matches the rest of the app — the prior
 * version used generic `h1.text-2xl font-semibold` and felt like a
 * different product. Step indicator now visually distinguishes
 * `done` (filled), `current` (filled + ring), and `upcoming` (muted),
 * which the dead-ternary version did not.
 */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        return (
          <div
            key={i}
            className={
              state === 'current'
                ? 'h-2 w-10 rounded-full bg-primary ring-2 ring-primary/30 ring-offset-1 transition-all'
                : state === 'done'
                  ? 'h-2 w-8 rounded-full bg-primary transition-colors'
                  : 'h-2 w-8 rounded-full bg-muted transition-colors'
            }
          />
        )
      })}
    </div>
  )
}

function StepHeader({
  index,
  title,
  body,
}: {
  index: string
  title: string
  body: string
}) {
  return (
    <header className="space-y-2">
      <p
        className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/75"
        style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
      >
        <span className="inline-block h-px w-5 bg-primary/40" />
        {index}
        <span className="text-primary/30">·</span>
        <span className="text-muted-foreground/70">onboarding</span>
      </p>
      <h1
        className="m-0 font-display text-3xl font-semibold tracking-tight"
        style={{ letterSpacing: '-0.012em' }}
      >
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{body}</p>
    </header>
  )
}

function InviteSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending invite…' : 'Send invite'}
    </Button>
  )
}

export function OnboardingWizard({ workspaceId, workspaceName }: OnboardingWizardProps) {
  const [step, setStep] = useState(0)
  const initialInviteState: CreateInviteState = {}
  const [inviteState, inviteAction] = useFormState(createInviteAction, initialInviteState)

  return (
    <div className="mx-auto w-full max-w-lg space-y-8 p-6">
      <StepIndicator current={step} total={3} />

      {/* Step 1: Confirm workspace name */}
      {step === 0 && (
        <div className="space-y-6">
          <StepHeader
            index="01"
            title="Name your client workspace"
            body="This is how you'll identify this client in Clipflow."
          />
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Workspace name
            </p>
            <p className="mt-1 text-lg font-medium">{workspaceName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            You can rename it anytime in{' '}
            <Link
              href="/settings/workspace"
              className="text-foreground underline underline-offset-4"
            >
              Settings
            </Link>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setStep(1)} className="flex-1">
              Looks good
            </Button>
            <Link
              href={`/workspace/${workspaceId}`}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Skip onboarding
            </Link>
          </div>
        </div>
      )}

      {/* Step 2: Invite client */}
      {step === 1 && (
        <div className="space-y-6">
          <StepHeader
            index="02"
            title="Invite your client"
            body="Send an invite link so your client can access their workspace."
          />

          {inviteState && 'ok' in inviteState && inviteState.ok === true ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">Invite sent!</p>
                {inviteState.token && (
                  <p className="mt-1 break-all text-xs text-green-700">
                    Share this link:{' '}
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/invite/${inviteState.token}`
                      : `/invite/${inviteState.token}`}
                  </p>
                )}
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Continue
              </Button>
            </div>
          ) : (
            <form action={inviteAction} className="space-y-4">
              <input type="hidden" name="workspace_id" value={workspaceId} />
              <input type="hidden" name="role" value="client" />
              <div className="space-y-2">
                <Label htmlFor="invite-email">Client email (optional)</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  placeholder="client@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to generate a shareable invite link.
                </p>
              </div>
              {inviteState && 'ok' in inviteState && inviteState.ok === false && (
                <p className="text-sm text-destructive">{inviteState.error}</p>
              )}
              <div className="flex gap-3">
                <InviteSubmitButton />
                <Button type="button" variant="ghost" onClick={() => setStep(2)}>
                  Skip
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Step 3: Add content */}
      {step === 2 && (
        <div className="space-y-6">
          <StepHeader
            index="03"
            title="Add your first content"
            body="Upload or paste content to start generating outputs for this client."
          />
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={`/workspace/${workspaceId}/content/new`}>
                Add first content
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href={`/workspace/${workspaceId}`}>Skip for now</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
