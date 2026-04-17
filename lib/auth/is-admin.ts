import 'server-only'
import { cache } from 'react'

import { getUser } from '@/lib/auth/get-user'

/**
 * Admin allowlist driven by the `ADMIN_EMAILS` env var — a comma-separated
 * list of lowercased email addresses that should have access to `/admin`.
 *
 * We deliberately don't store an `is_admin` column in the DB: losing
 * DB access shouldn't grant admin, and any Supabase dashboard user who
 * can write to a profiles column would otherwise be able to promote
 * themselves. Env vars are only writable by whoever controls the deploy.
 *
 * Returns `false` when the env var is unset — no implicit admins.
 */
function parseAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

export const isAdmin = cache(async (): Promise<boolean> => {
  const user = await getUser()
  if (!user?.email) return false
  const allowlist = parseAllowlist()
  return allowlist.has(user.email.toLowerCase())
})
