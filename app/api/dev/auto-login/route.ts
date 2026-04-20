// DEV-ONLY: creates (or reuses) a dev Supabase user, signs them in, and
// redirects to /dashboard. Gated by NODE_ENV=development AND the explicit
// DEV_BYPASS_AUTH=1 env flag. Delete this file once the dashboard UI pass
// is done.

import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DEV_EMAIL = 'dev-bypass@clipflow.local'

export async function GET() {
  if (process.env.NODE_ENV !== 'development' || process.env.DEV_BYPASS_AUTH !== '1') {
    return new NextResponse('Not found', { status: 404 })
  }

  const password = `dev-bypass-${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').slice(-10) || 'local'}`
  const admin = createAdminClient()

  // Create the user if it doesn't exist. Ignore "already registered" errors.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: DEV_EMAIL,
    password,
    email_confirm: true,
  })

  if (createErr && !/already (registered|exists)/i.test(createErr.message)) {
    return new NextResponse(`createUser failed: ${createErr.message}`, { status: 500 })
  }

  let userId = created?.user?.id
  if (!userId) {
    // User already existed — look it up by email.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers()
    if (listErr) return new NextResponse(`listUsers failed: ${listErr.message}`, { status: 500 })
    userId = list.users.find((u) => u.email === DEV_EMAIL)?.id
  }
  if (!userId) {
    return new NextResponse('could not resolve dev user id', { status: 500 })
  }

  // Mark profile onboarded so the app layout doesn't kick us to /onboarding.
  await admin
    .from('profiles')
    .update({ onboarded_at: new Date().toISOString() })
    .eq('id', userId)

  // Ensure the personal workspace exists; the signup DB trigger should have
  // created it, but fall through if not.
  const { data: ws } = await admin
    .from('workspaces')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
  if (!ws || ws.length === 0) {
    await admin.from('workspaces').insert({
      owner_id: userId,
      name: 'Dev Workspace',
      type: 'personal',
    })
  }

  // Sign in through the SSR client so the auth cookies are set on the
  // response for this request.
  const supabase = createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password,
  })
  if (signInErr) {
    return new NextResponse(`signIn failed: ${signInErr.message}`, { status: 500 })
  }

  return NextResponse.redirect(
    new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  )
}
