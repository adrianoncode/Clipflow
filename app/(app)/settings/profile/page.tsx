import { ShieldCheck, UserRound } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { PageHeading } from '@/components/workspace/page-heading'
import { ProfileForm } from '@/components/settings/profile-form'
import { DeleteAccountSection } from '@/components/settings/delete-account'

export const dynamic = 'force-dynamic'

/**
 * Profile settings — three stacked cards instead of one giant scroll:
 *   1. Identity   (name, email, change password)
 *   2. Account    (export data, delete account — GDPR territory)
 *   3. Security   (passive footnote about how creds are stored)
 *
 * Each card is self-contained and visually distinct so the eye can
 * jump to the right section instead of squinting through one wall.
 */
export default async function ProfileSettingsPage() {
  const user = await getUser()
  const email = user?.email ?? ''
  const fullName = user?.user_metadata?.full_name ?? ''

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#EDE6F5' }}
        >
          <UserRound className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <PageHeading
          eyebrow="Settings · Profile"
          title="Your account."
          body="Identity, sign-in, and the GDPR controls — all on one page so you don’t hunt for them."
        />
      </div>

      {/* ── 1. Identity ── */}
      <SectionCard
        eyebrow="Identity"
        title="How you show up"
        description="Email is your sign-in. Display name shows on shared review links and team workspaces."
      >
        <ProfileForm email={email} initialFullName={fullName} />
      </SectionCard>

      {/* ── 2. Account (export + delete) ── */}
      <SectionCard
        eyebrow="Account"
        title="Export or delete"
        description="One-click JSON of everything we store about you — and a permanent delete button if you want out."
      >
        <DeleteAccountSection />
      </SectionCard>

      {/* ── 3. Security footnote — passive but reassuring ── */}
      <div
        className="flex max-w-2xl items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-4"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Passwords are hashed with bcrypt and never stored in plain text.
          Sessions use httpOnly cookies. We don’t see your password — even on
          reset, the new one only ever exists between your browser and our
          auth provider.
        </p>
      </div>
    </div>
  )
}

function SectionCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card shadow-sm">
      <header className="border-b border-border/60 px-6 py-5">
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[18px] font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  )
}
