'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createInviteAction, type CreateInviteState } from '@/app/(app)/workspace/[id]/members/actions'

interface OnboardingWizardProps {
  workspaceId: string
  workspaceName: string
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-8 rounded-full transition-colors ${
            i < current ? 'bg-primary' : i === current ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
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
      <div className="space-y-2">
        <StepIndicator current={step} total={3} />
        <p className="text-xs text-muted-foreground">Step {step + 1} of 3</p>
      </div>

      {/* Step 1: Confirm workspace name */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Name your client workspace</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This is how you&apos;ll identify this client in Clipflow.
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Workspace name</p>
            <p className="mt-1 text-lg font-medium">{workspaceName}</p>
          </div>
          <p className="text-sm text-muted-foreground">
            You can rename it anytime in{' '}
            <Link href="/settings/workspace" className="underline underline-offset-4">
              Settings
            </Link>
            .
          </p>
          <Button onClick={() => setStep(1)} className="w-full">
            Looks good!
          </Button>
        </div>
      )}

      {/* Step 2: Invite client */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Invite your client</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Send an invite link so your client can access their workspace.
            </p>
          </div>

          {inviteState && 'ok' in inviteState && inviteState.ok === true ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Invite sent!
                </p>
                {inviteState.token && (
                  <p className="mt-1 break-all text-xs text-green-700 dark:text-green-300">
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
          <div>
            <h1 className="text-2xl font-semibold">Add your first content</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload or paste content to start generating outputs for this client.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={`/workspace/${workspaceId}/content/new`}>Add first content</Link>
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
