import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/health
 *
 * General health check for monitoring and Vercel health checks.
 * Verifies Supabase connectivity and required env vars.
 */
export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {}

  // ── Supabase connectivity ──
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.supabase = error ? 'fail' : 'ok'
  } catch {
    checks.supabase = 'fail'
  }

  // ── Required env vars ──
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ENCRYPTION_KEY',
    'NEXT_PUBLIC_APP_URL',
  ]
  const missingVars = requiredVars.filter((v) => !process.env[v])
  checks.env = missingVars.length === 0 ? 'ok' : 'fail'

  const healthy = Object.values(checks).every((v) => v === 'ok')

  // Previously echoed the names of missing env vars in the public
  // response — that leaked internal config structure to anyone who
  // could curl the endpoint. Now the names only appear in server logs;
  // external callers just see `{ env: 'fail' }`.
  if (missingVars.length > 0) {
    console.warn(
      '[health] missing env vars: ' + missingVars.join(', '),
    )
  }

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  )
}
