'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'

import { readSseStream } from '@/lib/agent/sse-client'
import { ToolCallCard, type ToolCall } from '@/components/agent/tool-call-card'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  // Tool calls attached to an assistant turn — we render them inline
  // between the text and the next message bubble.
  toolCalls: ToolCall[]
}

interface AgentChatWidgetProps {
  workspaceId: string
}

/**
 * Floating launcher + slide-in chat panel. Mounts once in the (app)
 * layout. Owns conversation state for the open session — persistence
 * across page loads is via the conversationId we keep in localStorage
 * (per-workspace), so reopening the widget restores the thread.
 */
export function AgentChatWidget({ workspaceId }: AgentChatWidgetProps) {
  const pathname = usePathname()
  const isOnAgentPage = pathname?.includes('/agent')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingMessage, setPendingMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costMicro, setCostMicro] = useState(0)
  const [toolsThisRun, setToolsThisRun] = useState(0)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const panelId = useId()

  // Restore conversationId per workspace from localStorage on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(
      `clipflow.agent.conv.${workspaceId}`,
    )
    if (saved) setConversationId(saved)
  }, [workspaceId])

  // Persist conversationId back into localStorage whenever it changes.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!conversationId) return
    window.localStorage.setItem(
      `clipflow.agent.conv.${workspaceId}`,
      conversationId,
    )
  }, [conversationId, workspaceId])

  // Load conversation history when panel opens with a saved conversationId.
  useEffect(() => {
    if (!open || !conversationId || messages.length > 0 || sending) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/agent/conversations/${conversationId}/messages?workspaceId=${workspaceId}`,
        )
        if (!res.ok || cancelled) return
        const { messages: rawMessages } = await res.json()
        if (cancelled) return

        const loaded: ChatMessage[] = []
        for (const m of rawMessages as Array<Record<string, unknown>>) {
          const role = m.role as 'user' | 'assistant'
          const content = m.content as Record<string, unknown> | unknown[] | string
          let text = ''
          const toolCalls: ToolCall[] = []

          if (typeof content === 'string') {
            text = content
          } else {
            const blocks = Array.isArray(content)
              ? content
              : Array.isArray((content as Record<string, unknown>)?.blocks)
                ? ((content as Record<string, unknown>).blocks as unknown[])
                : []
            for (const b of blocks) {
              if (!b || typeof b !== 'object') continue
              const block = b as Record<string, unknown>
              if (block.type === 'text' && typeof block.text === 'string') {
                text += (text ? '\n' : '') + block.text
              } else if (block.type === 'tool_use') {
                toolCalls.push({
                  id: block.id as string,
                  name: block.name as string,
                  input: block.input,
                  status: 'done',
                })
              }
            }
          }

          loaded.push({ id: m.id as string, role, text, toolCalls })
        }
        if (!cancelled && loaded.length > 0) setMessages(loaded)
      } catch { /* ignore — empty state is fine */ }
    })()
    return () => { cancelled = true }
  }, [open, conversationId, workspaceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Autoscroll to bottom on new messages.
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  // Focus the textarea when the panel opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  // Esc to close.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Listen for prefill events from suggestion pills.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message: string }>).detail
      if (!detail?.message) return
      setOpen(true)
      setPendingMessage(detail.message)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    window.addEventListener('clipflow:agent-prefill', handler)
    return () => window.removeEventListener('clipflow:agent-prefill', handler)
  }, [])

  // Cancel in-flight stream on unmount.
  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  const send = useCallback(async () => {
    const trimmed = pendingMessage.trim()
    if (!trimmed || sending) return

    setError(null)
    setSending(true)

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      text: trimmed,
      toolCalls: [],
    }
    const assistantMsg: ChatMessage = {
      id: `local-asst-${Date.now()}`,
      role: 'assistant',
      text: '',
      toolCalls: [],
    }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setPendingMessage('')

    const ac = new AbortController()
    abortRef.current = ac

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          message: trimmed,
          conversationId: conversationId ?? undefined,
        }),
        signal: ac.signal,
      })

      if (!res.ok || !res.body) {
        let errorBody = ''
        try {
          errorBody = (await res.json()).error
        } catch {
          /* ignore */
        }
        throw new Error(errorBody || `HTTP ${res.status}`)
      }

      for await (const frame of readSseStream(res.body, ac.signal)) {
        let parsed: unknown
        try {
          parsed = JSON.parse(frame.data)
        } catch {
          continue
        }
        applyEvent(frame.event, parsed)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id ? { ...m, text: `Error: ${msg}` } : m,
        ),
      )
    } finally {
      setSending(false)
      abortRef.current = null
    }

    // Local helper that closes over assistantMsg.id and the setters.
    function applyEvent(event: string, payload: unknown) {
      if (typeof payload !== 'object' || payload === null) return
      const p = payload as Record<string, unknown>

      switch (event) {
        case 'run_start': {
          const cid = p.conversationId
          if (typeof cid === 'string') setConversationId(cid)
          break
        }
        case 'assistant_text': {
          const text = typeof p.text === 'string' ? p.text : ''
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id ? { ...m, text } : m,
            ),
          )
          break
        }
        case 'tool_use': {
          const id = typeof p.id === 'string' ? p.id : null
          const name = typeof p.name === 'string' ? p.name : null
          if (!id || !name) break
          const call: ToolCall = {
            id,
            name,
            input: p.input,
            status: 'running',
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, toolCalls: [...m.toolCalls, call] }
                : m,
            ),
          )
          break
        }
        case 'tool_result': {
          const toolUseId =
            typeof p.toolUseId === 'string' ? p.toolUseId : null
          if (!toolUseId) break
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantMsg.id) return m
              return {
                ...m,
                toolCalls: m.toolCalls.map((c) =>
                  c.id === toolUseId
                    ? {
                        ...c,
                        status:
                          (p.isError as boolean | undefined)
                            ? 'error'
                            : (p.output &&
                                  typeof p.output === 'object' &&
                                  (p.output as Record<string, unknown>).status ===
                                    'parked'
                                ? 'parked'
                                : 'done'),
                        output: p.output,
                        isError: (p.isError as boolean | undefined) ?? false,
                        latencyMs:
                          typeof p.latencyMs === 'number'
                            ? p.latencyMs
                            : undefined,
                      }
                    : c,
                ),
              }
            }),
          )
          break
        }
        case 'cost_update': {
          const micro = p.costMicroUsd
          if (typeof micro === 'string') setCostMicro(Number(micro))
          if (typeof p.toolsThisRun === 'number') setToolsThisRun(p.toolsThisRun)
          break
        }
        case 'error': {
          const message = typeof p.message === 'string' ? p.message : 'Unknown error'
          setError(message)
          break
        }
        // 'done' — no-op; loop ends naturally
      }
    }
  }, [pendingMessage, sending, workspaceId, conversationId])

  const startNewConversation = () => {
    if (sending) return
    setMessages([])
    setConversationId(null)
    setCostMicro(0)
    setToolsThisRun(0)
    setError(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(`clipflow.agent.conv.${workspaceId}`)
    }
  }

  if (isOnAgentPage) return null

  return (
    <>
      {/* Launcher button — visible whenever the panel is closed. */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Clipflow agent chat"
          aria-controls={panelId}
          className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-[#0F0F0F] pl-4 pr-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:translate-y-[-1px] hover:shadow-xl"
        >
          <Sparkles className="h-4 w-4 text-[#FFD33D]" aria-hidden />
          <span>Ask Clipflow</span>
        </button>
      ) : null}

      {/* Slide-in panel */}
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Clipflow agent chat"
          className="fixed inset-y-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#0F0F0F]/15 bg-white shadow-2xl shadow-black/20"
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-2 border-b border-[#0F0F0F]/10 bg-[#0F0F0F] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FFD33D]" aria-hidden />
              <div>
                <div className="text-sm font-semibold">Clipflow agent</div>
                <div className="text-[10px] uppercase tracking-wider opacity-60">
                  Chat · pipeline tools
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startNewConversation}
                disabled={sending || messages.length === 0}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                New
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1.5 text-white/80 transition hover:bg-white/10"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div
            ref={scrollerRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#FAFAF7] px-4 py-3"
          >
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-900">
                {error}
              </div>
            ) : null}
          </div>

          {/* Footer / input */}
          <footer className="border-t border-[#0F0F0F]/10 bg-white px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[#0F0F0F]/55">
              <span>{toolsThisRun} tools used</span>
              <span>${formatCost(costMicro)} this conversation</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={pendingMessage}
                onChange={(e) => setPendingMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                rows={1}
                placeholder="Process the latest YouTube link, find highlights, draft 5 LinkedIn posts…"
                className="min-h-[40px] max-h-[200px] flex-1 resize-none rounded-xl border border-[#0F0F0F]/15 bg-white px-3 py-2 text-sm leading-snug outline-none transition focus:border-[#0F0F0F]/40"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || pendingMessage.trim().length === 0}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F0F0F] text-white transition hover:bg-[#0F0F0F]/85 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
              </button>
            </form>
          </footer>
        </div>
      ) : null}
    </>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#0F0F0F] px-3.5 py-2 text-sm text-white">
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {message.text ? (
        <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[#0F0F0F]/10 bg-white px-3.5 py-2 text-sm text-[#0F0F0F]">
          <SimpleMarkdown text={message.text} />
        </div>
      ) : null}
      {message.toolCalls.length > 0 ? (
        <div className="space-y-1.5 pl-1">
          {message.toolCalls.map((c) => (
            <ToolCallCard key={c.id} call={c} />
          ))}
        </div>
      ) : null}
      {!message.text && message.toolCalls.length === 0 ? (
        <div className="flex items-center gap-2 px-1 text-xs text-[#0F0F0F]/55">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          <span>thinking…</span>
        </div>
      ) : null}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[#0F0F0F]/20 bg-white/60 px-4 py-6 text-center">
      <MessageCircle className="mx-auto mb-2 h-5 w-5 text-[#0F0F0F]/40" aria-hidden />
      <div className="mb-1 text-sm font-medium text-[#0F0F0F]">
        Tell Clipflow what to do.
      </div>
      <div className="text-xs text-[#0F0F0F]/55">
        Try: <span className="font-mono">find highlights in my latest content</span>,{' '}
        or paste a YouTube URL.
      </div>
    </div>
  )
}

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length === 0) return
    elements.push(
      <ul key={`ul-${elements.length}`} className="my-1 list-disc pl-4 space-y-0.5">
        {listItems.map((li, i) => (
          <li key={i}>{inlineFormat(li)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const bullet = line.match(/^[-*]\s+(.+)$/)
    if (bullet) {
      listItems.push(bullet[1]!)
      continue
    }
    flushList()
    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />)
    } else {
      elements.push(<p key={`p-${i}`} className="my-0">{inlineFormat(line)}</p>)
    }
  }
  flushList()
  return <div className="space-y-0.5">{elements}</div>
}

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let last = 0
  const rx = /\*\*(.+?)\*\*|`([^`]+)`/g
  let m: RegExpExecArray | null
  while ((m = rx.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1] != null) parts.push(<strong key={m.index}>{m[1]}</strong>)
    else if (m[2] != null) parts.push(<code key={m.index} className="rounded bg-[#0F0F0F]/5 px-1 py-0.5 text-[11px]">{m[2]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function formatCost(micro: number): string {
  // micro = micro-USD. Display as $0.0XXX with at least 4 decimals so
  // a $0.00004 turn isn't rendered as "$0.00".
  const dollars = micro / 1_000_000
  if (dollars >= 0.01) return dollars.toFixed(2)
  return dollars.toFixed(4)
}
