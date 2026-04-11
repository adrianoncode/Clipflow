import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  onboarded_at: string | null
  role_type: 'solo' | 'team' | 'agency' | null
}

/**
 * Returns the current user's profile row, or null if unauthenticated or if
 * the row hasn't materialized yet. RLS gates the query via `id = auth.uid()`,
 * so the logged-in user always sees their own row.
 *
 * Wrapped in React `cache` so multiple RSC calls within one request dedupe.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, onboarded_at, role_type')
    .returns<Profile[]>()
    .maybeSingle()

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[getProfile]', error.message)
    return null
  }

  return data
})
