import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { serverEnv } from '@/lib/env'
import type { Database } from '@/lib/supabase/types'

/**
 * Service-role Supabase client. BYPASSES row level security — use only in
 * server-side code paths that have already authenticated the caller and
 * explicitly need admin privileges (e.g., reading across workspaces for
 * billing, cleanup jobs, migrations). Never expose to client bundles.
 *
 * The `import 'server-only'` at the top causes Next.js to fail the build if
 * this file is reachable from a Client Component.
 */
export function createAdminClient() {
  const env = serverEnv()
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
