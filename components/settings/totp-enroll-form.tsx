'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { Shield, ShieldCheck, Copy, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  startTotpEnrollmentAction,
  verifyTotpEnrollmentAction,
  type StartEnrollState,
  type VerifyEnrollState,
} from '@/app/(app)/settings/security/actions'

/**
 * Two-step enrollment:
 *   1. User clicks "Enable 2FA" → startTotpEnrollmentAction returns
 *      a QR + secret. We display them.
 *   2. User scans the QR in their authenticator app, enters the code.
 *      verifyTotpEnrollmentAction flips the factor to 'verified'.
 */
function StartButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="gap-1.5">
      <Shield className="h-4 w-4" />
      {pending ? 'Starting…' : 'Enable 2FA'}
    </Button>
  )
}

function VerifyButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Verifying…' : 'Verify & enable'}
    </Button>
  )
}

export function TotpEnrollForm() {
  const [startState, startAction] = useFormState<StartEnrollState, FormData>(
    startTotpEnrollmentAction,
    {},
  )
  const [verifyState, verifyAction] = useFormState<VerifyEnrollState, FormData>(
    verifyTotpEnrollmentAction,
    {},
  )
  const [copied, setCopied] = useState(false)

  // Step 2: show verification form when enrollment returned a QR
  if (startState.ok === true) {
    const { qrCode, secret, factorId } = startState.enroll

    if (verifyState.ok === true) {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Two-factor authentication enabled
            </p>
            <p className="text-xs text-emerald-700">
              You&apos;ll be asked for a code on your next login.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
        <div>
          <h3 className="text-sm font-semibold">
            Step 1: Scan this QR code with your authenticator app
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            We recommend Authy, 1Password, or Google Authenticator.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-border/40 bg-background p-4">
          {/* qrCode is an SVG data-URI */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="TOTP QR code" className="h-40 w-40" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Can&apos;t scan?</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(secret)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-[11px] hover:border-primary/40"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy secret'}
            </button>
          </div>
        </div>

        <form action={verifyAction} className="space-y-2">
          <input type="hidden" name="factor_id" value={factorId} />
          <label htmlFor="code" className="text-sm font-medium">
            Step 2: Enter the 6-digit code from your app
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="123456"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.5em] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {verifyState.ok === false && (
            <FormMessage variant="error">{verifyState.error}</FormMessage>
          )}
          <VerifyButton />
        </form>
      </div>
    )
  }

  // Step 1: the "enable" button
  return (
    <form action={startAction}>
      {startState.ok === false && (
        <FormMessage variant="error">{startState.error}</FormMessage>
      )}
      <StartButton />
    </form>
  )
}
