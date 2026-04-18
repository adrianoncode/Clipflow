'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { ShieldCheck, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  unenrollTotpAction,
  type UnenrollState,
} from '@/app/(app)/settings/security/actions'
import type { MfaFactor } from '@/lib/auth/mfa'

function UnenrollBtn() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      disabled={pending}
      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={(e) => {
        if (!window.confirm('Remove this 2FA factor? You will stop being asked for a code on login.')) {
          e.preventDefault()
        }
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? 'Removing…' : 'Remove'}
    </Button>
  )
}

export function TotpFactorList({ factors }: { factors: MfaFactor[] }) {
  return (
    <ul className="space-y-2">
      {factors.map((f) => (
        <FactorRow key={f.id} factor={f} />
      ))}
    </ul>
  )
}

function FactorRow({ factor }: { factor: MfaFactor }) {
  const [state, action] = useFormState<UnenrollState, FormData>(unenrollTotpAction, {})

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{factor.friendlyName}</p>
          <p className="text-[11px] text-muted-foreground">
            Authenticator · added {new Date(factor.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <form action={action}>
        <input type="hidden" name="factor_id" value={factor.id} />
        <UnenrollBtn />
        {state.ok === false && (
          <p className="mt-1 text-xs text-destructive">{state.error}</p>
        )}
      </form>
    </li>
  )
}
