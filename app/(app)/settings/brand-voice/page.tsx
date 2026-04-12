import { redirect } from 'next/navigation'

import { getUser } from '@/lib/auth/get-user'
import { getActiveBrandVoice } from '@/lib/brand-voice/get-active-brand-voice'
import { createClient } from '@/lib/supabase/server'
import { BrandVoiceForm } from '@/components/settings/brand-voice-form'

export const dynamic = 'force-dynamic'

async function getFirstWorkspaceId(userId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  return data?.workspace_id ?? null
}

export default async function BrandVoicePage({
  searchParams,
}: {
  searchParams: { workspace?: string }
}) {
  const user = await getUser()
  if (!user) redirect('/login')

  // Allow explicit workspace_id override via ?workspace=...
  const workspaceId =
    searchParams.workspace ?? (await getFirstWorkspaceId(user.id))

  if (!workspaceId) redirect('/onboarding')

  const brandVoice = await getActiveBrandVoice(workspaceId)

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Brand Voice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define your workspace&apos;s tone, style, and an example hook. Clipflow will inject
          these guidelines into every AI generation run.
        </p>
      </div>

      <BrandVoiceForm workspaceId={workspaceId} existing={brandVoice} />
    </div>
  )
}
