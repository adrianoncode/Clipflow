import { NextResponse, type NextRequest } from 'next/server'

import { buildAgentContext } from '@/lib/agent/context'
import { runChatTurn } from '@/lib/agent/run'
import { createConversation } from '@/lib/agent/state'
import {
  loadConversationMessages,
  persistAgentMessage,
  persistNewTurns,
} from '@/lib/agent/messages'
import { formatSseFrame, type AgentEvent } from '@/lib/agent/events'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { log } from '@/lib/log'

/**
 * POST /api/agent/chat
 *
 * SSE streaming chat endpoint. Body shape:
 *
 *   {
 *     workspaceId: string,
 *     message: string,
 *     conversationId?: string,   // omit to start a new conversation
 *     title?: string             // optional, only used on new convos
 *   }
 *
 * Response: text/event-stream of named events (see lib/agent/events.ts).
 * The first non-control frame is `run_start` which includes the
 * runId + conversationId — clients persist conversationId to thread
 * follow-up messages.
 *
 * On any pre-stream failure (auth, rate-limit, JSON parse) we return a
 * normal JSON error response with a 4xx status. Once the stream opens,
 * errors are emitted as `error` events and the stream closes cleanly.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  // ── Parse body ───────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 })
  }
  const {
    workspaceId,
    message,
    conversationId: existingConversationId,
    title,
  } = body as {
    workspaceId?: string
    message?: string
    conversationId?: string
    title?: string
  }
  if (!workspaceId || typeof workspaceId !== 'string') {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json(
      { error: 'message required (non-empty string)' },
      { status: 400 },
    )
  }
  if (message.length > 10_000) {
    return NextResponse.json(
      { error: 'message exceeds 10,000 character limit' },
      { status: 400 },
    )
  }

  // ── Auth + workspace check ──────────────────────────────────────
  const ctxResult = await buildAgentContext({ workspaceId, runKind: 'chat' })
  if (!ctxResult.ok) {
    return NextResponse.json(
      { error: ctxResult.message },
      { status: ctxResult.status },
    )
  }
  const ctx = ctxResult.ctx

  // ── Rate limit (chat is per-workspace, more permissive than autopilot) ──
  const rl = await checkRateLimit(
    `agent:chat:${ctx.workspaceId}`,
    RATE_LIMITS.agentChat.limit,
    RATE_LIMITS.agentChat.windowMs,
  )
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: 'Too many chat requests. Wait a moment and try again.',
        resetAt: rl.resetAt,
      },
      { status: 429 },
    )
  }

  // ── Resolve / create conversation ───────────────────────────────
  let conversationId = existingConversationId
  let priorMessages: Awaited<ReturnType<typeof loadConversationMessages>> = []
  if (conversationId) {
    // Existing conversation — load history. The conversation row was
    // created on a previous turn so all RLS still applies.
    priorMessages = await loadConversationMessages(conversationId)
  } else {
    conversationId = await createConversation({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      title:
        typeof title === 'string' && title.trim().length > 0
          ? title.trim().slice(0, 200)
          : message.trim().slice(0, 60),
    })
  }

  // ── Persist user message before the run starts so it's visible
  //    even if the model crashes mid-stream. ───────────────────────
  await persistAgentMessage({
    conversationId,
    runId: null, // runId not yet known — populated by persistNewTurns when it writes assistant turns
    role: 'user',
    content: { blocks: [{ type: 'text', text: message }] },
  })

  // ── Open the SSE stream and run the loop ────────────────────────
  const encoder = new TextEncoder()
  const priorLengthAtStart = priorMessages.length

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: AgentEvent) => {
        try {
          controller.enqueue(encoder.encode(formatSseFrame(event)))
        } catch {
          // Stream already closed by the client. We silently drop —
          // the agent loop continues to completion to avoid leaving
          // the run row in 'running' forever.
        }
      }

      // Heartbeat every 20s so proxies (Vercel edge, nginx) don't drop
      // an idle SSE connection during long tool calls. SSE comments
      // (lines starting with ":") are ignored by the EventSource API.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          /* closed */
        }
      }, 20_000)

      try {
        // Append the freshly typed user message to priorMessages so
        // runChatTurn doesn't double-count it (runChatTurn appends
        // its own user block from `userMessage`, then we slice from
        // priorLengthAtStart for persistence).
        const result = await runChatTurn({
          ctx,
          conversationId: conversationId!,
          priorMessages,
          userMessage: message,
          onEvent: enqueue,
        })

        if (result.ok) {
          // Persist the new assistant + tool_result turns.
          // runChatTurn returns `messages` = [...priorMessages, userMsg, ...newTurns]
          // The userMsg at index priorLengthAtStart was already persisted above,
          // so we only persist [priorLengthAtStart + 1:].
          await persistNewTurns({
            conversationId: conversationId!,
            runId: result.runId,
            allMessages: result.messages,
            priorLength: priorLengthAtStart + 1,
          }).catch((err) => {
            log.error('persistNewTurns failed', err, {
              conversationId,
              runId: result.runId,
            })
          })
        }
        // Final close — events were already emitted by the loop.
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        log.error('agent.chat stream crashed', err instanceof Error ? err : new Error(msg), {
          workspaceId: ctx.workspaceId,
          conversationId,
        })
        enqueue({ type: 'error', code: 'unexpected', message: msg })
      } finally {
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      // Client disconnected. No state to clean up — the agent loop in
      // start() finishes its work to keep DB telemetry consistent;
      // future events just no-op via the swallowed enqueue.
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      // Vercel edge/middleware buffer SSE by default unless this is set.
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
