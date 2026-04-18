import { NextRequest, NextResponse } from 'next/server'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { searchWorkspace } from '@/lib/search/search-workspace'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const workspaceId = req.nextUrl.searchParams.get('workspaceId') ?? ''
  if (!q || !workspaceId) return NextResponse.json([])

  // Previously trusted the workspaceId query param after only checking
  // auth. That let any logged-in user search any workspace's content
  // titles, transcripts, and draft bodies by guessing IDs.
  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status })
  }

  const results = await searchWorkspace(workspaceId, q)
  return NextResponse.json(results)
}
