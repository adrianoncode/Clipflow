import { AtSign, Download, Fingerprint, KeyRound, ShieldCheck, Trash2, UserSquare } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import {
  SettingsFootnote,
  SettingsRow,
  SettingsSection,
} from '@/components/settings/section'
import { SettingsHero } from '@/components/settings/settings-hero'
import {
  DeleteAccountButton,
  DisplayNameRow,
  ExportButton,
  PasswordResetButton,
} from '@/components/settings/profile-rows'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Profile' }

export default async function ProfileSettingsPage() {
  const user = await getUser()
  const email = user?.email ?? ''
  const fullName = user?.user_metadata?.full_name ?? ''

  // Initials prefer the display name, fall back to the email local-part —
  // anything to avoid a bare "?" in the monogram.
  const monogramSource = fullName.trim() || email.split('@')[0] || 'You'
  const initials = monogramSource
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p: string) => p[0])
    .join('')

  return (
    <div className="space-y-9">
      <SettingsHero
        monogram={initials || 'YO'}
        eyebrow="Account · Profile"
        title={fullName || 'Your account.'}
        body="Identity, sign-in, and the GDPR controls — everything tied to your personal account."
        meta={
          email ? (
            <>
              <AtSign className="h-3 w-3 text-muted-foreground/60" />
              {email}
            </>
          ) : null
        }
      />

      {/* ── 01 · Identity ───────────────────────────────────────── */}
      <SettingsSection
        index="01"
        title="Identity"
        icon={<Fingerprint className="h-3.5 w-3.5" />}
        hint="How you show up across the product."
      >
        <SettingsRow
          icon={<AtSign className="h-3.5 w-3.5" />}
          label="Email"
          description={
            <span className="font-mono text-[12.5px] text-foreground">{email}</span>
          }
          control={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-0.5 text-[10.5px] font-semibold text-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
              Managed by sign-in
            </span>
          }
        />
        <SettingsRow
          icon={<UserSquare className="h-3.5 w-3.5" />}
          label="Display name"
          description="Shows on shared review links and team workspaces."
          control={<DisplayNameRow initialFullName={fullName} />}
          align="top"
        />
        <SettingsRow
          icon={<KeyRound className="h-3.5 w-3.5" />}
          label="Password"
          description={
            <>
              We send a one-hour reset link to{' '}
              <span className="font-mono font-semibold text-foreground">{email}</span>
              . Your current password keeps working until you click it.
            </>
          }
          control={<PasswordResetButton />}
        />
      </SettingsSection>

      {/* ── 02 · Data & privacy ─────────────────────────────────── */}
      <SettingsSection
        index="02"
        title="Data & privacy"
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
        hint="Take everything with you, or wipe it forever."
      >
        <SettingsRow
          icon={<Download className="h-3.5 w-3.5" />}
          label="Export account data"
          description="A single JSON of profile, workspaces, content, drafts, render history, and subscription state — everything we hold."
          control={<ExportButton />}
        />
        <SettingsRow
          icon={<Trash2 className="h-3.5 w-3.5" />}
          label="Delete account"
          description={
            <span>
              Permanently removes everything tied to your account. Cancels
              active subscriptions.{' '}
              <span className="font-semibold text-destructive">
                Cannot be undone.
              </span>
            </span>
          }
          control={<DeleteAccountButton />}
        />
      </SettingsSection>

      <SettingsFootnote icon={<ShieldCheck className="h-3.5 w-3.5" />}>
        Bcrypt-hashed passwords · httpOnly sessions · we never see your
        password, even on reset.
      </SettingsFootnote>
    </div>
  )
}
