import { ShieldCheck } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { PageHeading } from '@/components/workspace/page-heading'
import {
  SettingsFootnote,
  SettingsRow,
  SettingsSection,
} from '@/components/settings/section'
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

  return (
    <div className="space-y-10">
      {/* Hero — gives the page an actual identity. */}
      <PageHeading
        eyebrow="Settings · Profile"
        title="Your account."
        body="Identity, sign-in, and the GDPR controls — everything tied to your personal account."
      />

      {/* ── Identity ───────────────────────────────────────────── */}
      <SettingsSection
        title="Identity"
        hint="How you show up across the product."
      >
        <SettingsRow
          label="Email"
          description={
            <span className="font-mono text-[12.5px] text-foreground">{email}</span>
          }
          control={
            <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
              Managed
            </span>
          }
        />
        <SettingsRow
          label="Display name"
          description="Shows on shared review links and team workspaces."
          control={<DisplayNameRow initialFullName={fullName} />}
          align="top"
        />
        <SettingsRow
          label="Password"
          description={
            <>
              Reset link sent to{' '}
              <span className="font-mono font-semibold text-foreground">{email}</span>{' '}
              · expires in 1 hour.
            </>
          }
          control={<PasswordResetButton />}
        />
      </SettingsSection>

      {/* ── Data & privacy ────────────────────────────────────── */}
      <SettingsSection
        title="Data & privacy"
        hint="Take everything with you, or wipe it forever."
      >
        <SettingsRow
          label="Export account data"
          description="JSON of profile, workspaces, content, drafts, render history, and subscription state."
          control={<ExportButton />}
        />
        <SettingsRow
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
