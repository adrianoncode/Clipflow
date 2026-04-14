import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface ReferralStats {
  pending: number
  confirmed: number
}

/**
 * Counts how many signups the logged-in user has referred, and how many
 * of them have converted into paying customers. RLS already restricts
 * referrals to rows where the user is referrer OR referee — we further
 * narrow to "as referrer" here.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = createClient()
  const { data } = await supabase
    .from('referrals')
    .select('status')
    .eq('referrer_user_id', userId)

  const rows = (data ?? []) as Array<{ status: 'pending' | 'confirmed' }>
  return {
    pending: rows.filter((r) => r.status === 'pending').length,
    confirmed: rows.filter((r) => r.status === 'confirmed').length,
  }
}
