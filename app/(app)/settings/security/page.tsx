import { redirect } from 'next/navigation'
import { Shield, Info } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { listFactors } from '@/lib/auth/mfa'
import { countUnusedCodes } from '@/lib/auth/recovery-codes'
import { TotpEnrollForm } from '@/components/settings/totp-enroll-form'
import { TotpFactorList } from '@/components/settings/totp-factor-list'
import { RecoveryCodesPanel } from '@/components/settings/recovery-codes-panel'
import { PageHeading } from '@/components/workspace/page-heading'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Security — Clipflow' }

export default async function SecurityPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const [factors, unusedCodes] = await Promise.all([
    listFactors(),
    countUnusedCodes(user.id),
  ])
  const hasVerifiedFactor = factors.some((f) => f.status === 'verified')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <PageHeading
        eyebrow="Account · Security"
        title="Security."
        body="Two-factor authentication and session management."
      />

      {/* ── Two-factor auth ── */}
      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Two-factor authentication</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Require a 6-digit code from your authenticator app every time you
              sign in. Makes a stolen password useless on its own.
            </p>
          </div>
        </div>

        {hasVerifiedFactor ? (
          <div className="space-y-3">
            <TotpFactorList factors={factors.filter((f) => f.status === 'verified')} />
            <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                You&apos;ll be asked for a code on every new login. Lost your
                authenticator? Use one of your recovery codes below to log back
                in — that will also remove this factor so you can enroll a new
                device.
              </p>
            </div>
          </div>
        ) : (
          <TotpEnrollForm />
        )}
      </section>

      {/* ── Recovery codes — only relevant once 2FA is active ── */}
      {hasVerifiedFactor && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recovery codes
          </h2>
          <RecoveryCodesPanel unusedCount={unusedCodes} />
        </section>
      )}

      {/* ── Pending / unverified factors cleanup ── */}
      {factors.some((f) => f.status !== 'verified') && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Pending factors
          </h3>
          <p className="text-xs text-muted-foreground/70">
            These were started but never verified. Safe to remove.
          </p>
          <TotpFactorList factors={factors.filter((f) => f.status !== 'verified')} />
        </section>
      )}
    </div>
  )
}
