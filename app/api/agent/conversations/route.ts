import { NextResponse, type NextRequest } from 'next/server'

import { buildAgentContext } from '@/lib/agent/context'
import { listConversations } from '@/lib/agent/list-conversations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  const ctxResult = await buildAgentContext({ workspaceId, runKind: 'chat' })
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.message }, { status: ctxResult.status })
  }

  const conversations = await listConversations(workspaceId)
  return NextResponse.json({ conversations })
}
