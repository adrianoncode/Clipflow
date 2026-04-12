import 'server-only'
import { createClient } from '@/lib/supabase/server'

export interface SocialAccountRow {
  id: string
  platform: string
  platform_username: string | null
  expires_at: string | null
}

export async function getSocialAccounts(workspaceId: string): Promise<SocialAccountRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('social_accounts')
    .select('id, platform, platform_username, expires_at')
    .eq('workspace_id', workspaceId)
  return (data ?? []) as SocialAccountRow[]
}
