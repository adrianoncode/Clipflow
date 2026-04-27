import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import { clientEnv } from '@/lib/env'

const DEV_USER_EMAIL = 'dev-bypass@clipflow.local'

/**
 * Dev-only bypass: signs in the local dev user without a password.
 *
 * Uses the admin API to generate a magic-link token, then immediately
 * verifies it on the server client so the session cookies are issued.
 * Hard-blocked outside development. Delete this file when done.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return new NextResponse('SUPABASE_SERVICE_ROLE_KEY missing', { status: 500 })
  }

  const admin = createAdminClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    { auth: { persistSession: false } },
  )

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: DEV_USER_EMAIL,
  })
  if (linkError || !linkData?.properties?.hashed_token) {
    return new NextResponse(`generateLink failed: ${linkError?.message ?? 'no token'}`, {
      status: 500,
    })
  }

  const supabase = createClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: linkData.properties.hashed_token,
  })
  if (verifyError) {
    return new NextResponse(`verifyOtp failed: ${verifyError.message}`, { status: 500 })
  }

  const url = new URL(request.url)
  const next = url.searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(new URL(next, url.origin))
}
