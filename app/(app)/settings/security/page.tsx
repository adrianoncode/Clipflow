import { redirect } from 'next/navigation'
import { Info, KeyRound, LifeBuoy, ShieldCheck } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { listFactors } from '@/lib/auth/mfa'
import { countUnusedCodes } from '@/lib/auth/recovery-codes'
import { TotpEnrollForm } from '@/components/settings/totp-enroll-form'
import { TotpFactorList } from '@/components/settings/totp-factor-list'
import { RecoveryCodesPanel } from '@/components/settings/recovery-codes-panel'
import {
  SettingsFootnote,
  SettingsSection,
} from '@/components/settings/section'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Security — Clipflow' }

export default async function SecurityPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const [factors, unusedCodes] = await Promise.all([
    listFactors(),
    countUnusedCodes(user.id),
  ])
  const verified = factors.filter((f) => f.status === 'verified')
  const pending = factors.filter((f) => f.status !== 'verified')
  const hasVerifiedFactor = verified.length > 0

  return (
    <div className="space-y-7">
      {/* ── 01 · Two-factor auth ────────────────────────────────── */}
      <SettingsSection
        index="01"
        title="Two-factor authentication"
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
        hint={hasVerifiedFactor ? 'enabled · code required at every login' : 'not enabled'}
      >
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          {hasVerifiedFactor ? (
            <div className="space-y-3">
              <TotpFactorList factors={verified} />
              <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-[11.5px] text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  You&apos;ll be asked for a code on every new login. Lost your
                  authenticator? Use a recovery code below — that also removes
                  this factor so you can enroll a fresh device.
                </p>
              </div>
            </div>
          ) : (
            <TotpEnrollForm />
          )}
        </div>
      </SettingsSection>

      {/* ── 02 · Recovery codes (only when 2FA active) ─────────── */}
      {hasVerifiedFactor ? (
        <SettingsSection
          index="02"
          title="Recovery codes"
          icon={<LifeBuoy className="h-3.5 w-3.5" />}
          hint={`${unusedCodes} unused · single-use, get a new batch when low`}
        >
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <RecoveryCodesPanel unusedCount={unusedCodes} />
          </div>
        </SettingsSection>
      ) : null}

      {/* ── 03 · Pending factors cleanup ────────────────────────── */}
      {pending.length > 0 ? (
        <SettingsSection
          index="03"
          title="Pending factors"
          icon={<KeyRound className="h-3.5 w-3.5" />}
          hint="started but never verified · safe to remove"
        >
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            <TotpFactorList factors={pending} />
          </div>
        </SettingsSection>
      ) : null}

      <SettingsFootnote>
        Bcrypt-hashed passwords · httpOnly sessions · TOTP via your authenticator app, never SMS.
      </SettingsFootnote>
    </div>
  )
}
