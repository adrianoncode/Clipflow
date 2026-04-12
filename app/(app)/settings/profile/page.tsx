import { getUser } from '@/lib/auth/get-user'
import { ProfileForm } from '@/components/settings/profile-form'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  const user = await getUser()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account details.</p>
      </div>
      <ProfileForm
        email={user?.email ?? ''}
        initialFullName={user?.user_metadata?.full_name ?? ''}
      />
    </div>
  )
}
