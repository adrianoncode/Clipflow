import { NextResponse, type NextRequest } from 'next/server'

import { buildAgentContext } from '@/lib/agent/context'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const workspaceId = req.nextUrl.searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  const ctxResult = await buildAgentContext({ workspaceId, runKind: 'chat' })
  if (!ctxResult.ok) {
    return NextResponse.json({ error: ctxResult.message }, { status: ctxResult.status })
  }

  // Verify conversation belongs to this workspace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data: conv } = await admin
    .from('agent_conversations')
    .select('id, workspace_id')
    .eq('id', params.id)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (!conv) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const { data: rows } = await admin
    .from('agent_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  const messages = (rows ?? [])
    .filter((r: Record<string, unknown>) => r.role === 'user' || r.role === 'assistant')
    .map((r: Record<string, unknown>) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      createdAt: r.created_at,
    }))

  return NextResponse.json({ messages })
}
