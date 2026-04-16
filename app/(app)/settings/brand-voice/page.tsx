import { redirect } from 'next/navigation'
import { Mic2 } from 'lucide-react'

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

  const workspaceId =
    searchParams.workspace ?? (await getFirstWorkspaceId(user.id))

  if (!workspaceId) redirect('/onboarding')

  const brandVoice = await getActiveBrandVoice(workspaceId)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100">
          <Mic2 className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Brand Voice</h1>
          <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">
            Define your workspace&apos;s tone, style, and example hooks. Clipflow injects
            these guidelines into every AI generation — scripts, captions, hooks, everything.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="max-w-xl rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
        <BrandVoiceForm workspaceId={workspaceId} existing={brandVoice} />
      </div>
    </div>
  )
}
