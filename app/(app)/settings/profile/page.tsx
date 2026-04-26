import { ShieldCheck } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
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
    <div className="space-y-7">
      {/* ── 01 · Identity ────────────────────────────────────────── */}
      <SettingsSection
        num="01"
        title="Identity"
        hint="how you show up across the product"
      >
        <SettingsRow
          label="Email"
          description={
            <span className="font-mono text-[12.5px] text-foreground">{email}</span>
          }
          control={
            <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
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
              <span className="font-mono font-bold text-foreground">{email}</span>{' '}
              · expires in 1 hour.
            </>
          }
          control={<PasswordResetButton />}
        />
      </SettingsSection>

      {/* ── 02 · Data & privacy ─────────────────────────────────── */}
      <SettingsSection num="02" title="Data & privacy" hint="export — or delete forever">
        <SettingsRow
          label="Export"
          description="JSON of profile, workspaces, content, drafts, render history, subscription state."
          control={<ExportButton />}
        />
        <SettingsRow
          label="Delete account"
          description={
            <span>
              Permanently removes everything tied to your account. Cancels active subscriptions.{' '}
              <span className="font-bold text-foreground">Cannot be undone.</span>
            </span>
          }
          control={<DeleteAccountButton />}
        />
      </SettingsSection>

      <SettingsFootnote icon={<ShieldCheck className="h-3 w-3" />}>
        Bcrypt-hashed passwords · httpOnly sessions · we never see your password, even on reset.
      </SettingsFootnote>
    </div>
  )
}
