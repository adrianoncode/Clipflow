import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface SourceBreakdownEntry {
  source: string
  pending: number
  confirmed: number
}

/**
 * Groups the current user's referrals by `source` so the Settings page
 * can show "twitter → 3 paid, 2 pending" style attribution. RLS already
 * scopes to referrer OR referee — we additionally narrow to "as referrer".
 */
export async function getReferralSourceBreakdown(
  userId: string,
): Promise<SourceBreakdownEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('referrals')
    .select('source, status')
    .eq('referrer_user_id', userId)

  const rows = (data ?? []) as Array<{ source: string | null; status: string }>

  const byKey = new Map<string, SourceBreakdownEntry>()
  for (const r of rows) {
    // Blocked rows are hidden from attribution — they'd only add noise.
    if (r.status !== 'pending' && r.status !== 'confirmed') continue
    const key = r.source?.trim() || 'direct'
    const existing =
      byKey.get(key) ?? { source: key, pending: 0, confirmed: 0 }
    if (r.status === 'confirmed') existing.confirmed += 1
    else existing.pending += 1
    byKey.set(key, existing)
  }

  return [...byKey.values()].sort((a, b) => {
    // Confirmed-heavy sources first, then pending, then alpha.
    if (b.confirmed !== a.confirmed) return b.confirmed - a.confirmed
    if (b.pending !== a.pending) return b.pending - a.pending
    return a.source.localeCompare(b.source)
  })
}
