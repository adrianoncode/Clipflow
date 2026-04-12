import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchWorkspace } from '@/lib/search/search-workspace'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const workspaceId = req.nextUrl.searchParams.get('workspaceId') ?? ''
  if (!q || !workspaceId) return NextResponse.json([])

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results = await searchWorkspace(workspaceId, q)
  return NextResponse.json(results)
}
