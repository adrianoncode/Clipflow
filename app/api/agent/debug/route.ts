import { NextResponse, type NextRequest } from 'next/server'

import { buildAgentContext } from '@/lib/agent/context'
import { runChatTurn, runAutopilotRun } from '@/lib/agent/run'

/**
 * Dev-only smoke-test endpoint for the agent loop.
 *
 * POST { workspaceId, message?, autopilotInstruction? }
 *
 * - With `message` → runs a single chat turn (kind=chat).
 * - With `autopilotInstruction` → runs an autopilot run (kind=autopilot).
 *
 * Returns the full result envelope (final text, message history, cost).
 * No streaming yet — Phase 2 will add SSE for the chat UI.
 *
 * Hard-blocked in production. Delete this file once Phase 2 ships
 * the real /api/agent/chat endpoint.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 })
  }
  const { workspaceId, message, autopilotInstruction } = body as {
    workspaceId?: string
    message?: string
    autopilotInstruction?: string
  }
  if (!workspaceId || typeof workspaceId !== 'string') {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }
  if (!message && !autopilotInstruction) {
    return NextResponse.json(
      { error: 'Either message or autopilotInstruction required' },
      { status: 400 },
    )
  }

  const isAutopilot = !!autopilotInstruction

  const ctxResult = await buildAgentContext({
    workspaceId,
    runKind: isAutopilot ? 'autopilot' : 'chat',
  })
  if (!ctxResult.ok) {
    return NextResponse.json(
      { error: ctxResult.message },
      { status: ctxResult.status },
    )
  }

  const result = isAutopilot
    ? await runAutopilotRun({
        ctx: ctxResult.ctx,
        trigger: {
          name: 'debug',
          instruction: autopilotInstruction!,
        },
      })
    : await runChatTurn({
        ctx: ctxResult.ctx,
        // Debug route fakes a conversation id per call. Real chat
        // route will persist + reuse one across turns.
        conversationId: crypto.randomUUID(),
        priorMessages: [],
        userMessage: message!,
      })

  return NextResponse.json(serializeResult(result))
}

// Convert bigint cost values to strings so JSON.stringify doesn't throw.
function serializeResult(result: unknown): unknown {
  return JSON.parse(
    JSON.stringify(result, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v,
    ),
  )
}
