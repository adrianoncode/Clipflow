import { User, Shield } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { ProfileForm } from '@/components/settings/profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  const user = await getUser()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage your account details and security settings.
          </p>
        </div>
      </div>

      {/* Profile form card */}
      <div className="max-w-xl rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <ProfileForm
          email={user?.email ?? ''}
          initialFullName={user?.user_metadata?.full_name ?? ''}
        />
      </div>

      {/* Security info */}
      <div className="flex max-w-xl items-start gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your account is secured with Supabase Auth. Passwords are never stored
          in plain text. Two-factor authentication support is coming soon.
        </p>
      </div>
    </div>
  )
}
