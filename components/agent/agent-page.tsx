'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Bot,
  Clock,
  FileText,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

import { readSseStream } from '@/lib/agent/sse-client'
import { ToolCallCard, type ToolCall } from '@/components/agent/tool-call-card'
import type { ConversationSummary } from '@/lib/agent/list-conversations'
import type { PendingWorkItem } from '@/lib/agent/get-pending-work'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolCalls: ToolCall[]
}

interface AgentPageProps {
  workspaceId: string
  conversations: ConversationSummary[]
  pendingWork: PendingWorkItem[]
  recentRuns: Array<Record<string, unknown>>
  hasRunningRun: boolean
}

// recentRuns reserved for Phase 5 activity timeline

const WORK_TYPE_CONFIG = {
  process: { label: 'Process', icon: Zap, color: 'text-blue-600 bg-blue-50' },
  highlights: { label: 'Find moments', icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
  drafts: { label: 'Generate drafts', icon: FileText, color: 'text-violet-600 bg-violet-50' },
  schedule: { label: 'Schedule', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
} as const

export function AgentPage({
  workspaceId,
  conversations: initialConversations,
  pendingWork,
  recentRuns: _recentRuns,
  hasRunningRun,
}: AgentPageProps) {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingMessage, setPendingMessage] = useState(searchParams.get('prefill') ?? '')
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costMicro, setCostMicro] = useState(0)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    if (searchParams.get('prefill')) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [searchParams])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const loadConversation = useCallback(async (convId: string) => {
    setActiveConversationId(convId)
    setMessages([])
    setError(null)
    setCostMicro(0)
    setLoadingHistory(true)

    try {
      const res = await fetch(
        `/api/agent/conversations/${convId}/messages?workspaceId=${workspaceId}`,
      )
      if (!res.ok) throw new Error('Failed to load messages')
      const { messages: rawMessages } = await res.json()

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
              ? (content as Record<string, unknown>).blocks as unknown[]
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

        loaded.push({
          id: m.id as string,
          role,
          text,
          toolCalls,
        })
      }

      setMessages(loaded)
    } catch {
      setError('Could not load conversation history')
    } finally {
      setLoadingHistory(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [workspaceId])

  const startNewConversation = () => {
    if (sending) return
    setActiveConversationId(null)
    setMessages([])
    setCostMicro(0)
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

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
          conversationId: activeConversationId ?? undefined,
        }),
        signal: ac.signal,
      })

      if (!res.ok || !res.body) {
        let errorBody = ''
        try { errorBody = (await res.json()).error } catch { /* */ }
        throw new Error(errorBody || `HTTP ${res.status}`)
      }

      for await (const frame of readSseStream(res.body, ac.signal)) {
        let parsed: unknown
        try { parsed = JSON.parse(frame.data) } catch { continue }
        applyEvent(frame.event, parsed)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg !== 'The operation was aborted' && msg !== 'AbortError') {
        setError(msg)
      }
    } finally {
      setSending(false)
      abortRef.current = null
    }

    function applyEvent(event: string, payload: unknown) {
      if (typeof payload !== 'object' || payload === null) return
      const p = payload as Record<string, unknown>

      switch (event) {
        case 'run_start': {
          const cid = p.conversationId
          if (typeof cid === 'string') {
            setActiveConversationId(cid)
            const title = trimmed.slice(0, 60)
            setConversations((prev) => {
              if (prev.some((c) => c.id === cid)) return prev
              return [
                { id: cid, title, lastMessageAt: new Date().toISOString(), createdAt: new Date().toISOString() },
                ...prev,
              ]
            })
          }
          break
        }
        case 'assistant_text': {
          const text = typeof p.text === 'string' ? p.text : ''
          setMessages((prev) =>
            prev.map((m) => m.id === assistantMsg.id ? { ...m, text } : m),
          )
          break
        }
        case 'tool_use': {
          const id = typeof p.id === 'string' ? p.id : null
          const name = typeof p.name === 'string' ? p.name : null
          if (!id || !name) break
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, toolCalls: [...m.toolCalls, { id, name, input: p.input, status: 'running' as const }] }
                : m,
            ),
          )
          break
        }
        case 'tool_result': {
          const toolUseId = typeof p.toolUseId === 'string' ? p.toolUseId : null
          if (!toolUseId) break
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantMsg.id) return m
              return {
                ...m,
                toolCalls: m.toolCalls.map((c) =>
                  c.id === toolUseId
                    ? { ...c, status: (p.isError ? 'error' : 'done') as ToolCall['status'], output: p.output, isError: (p.isError as boolean) ?? false }
                    : c,
                ),
              }
            }),
          )
          break
        }
        case 'cost_update': {
          if (typeof p.costMicroUsd === 'string') setCostMicro(Number(p.costMicroUsd))
          break
        }
        case 'error': {
          setError(typeof p.message === 'string' ? p.message : 'Unknown error')
          break
        }
      }
    }
  }, [pendingMessage, sending, workspaceId, activeConversationId])

  const prefillAndFocus = (message: string) => {
    setPendingMessage(message)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Left: Conversation list ── */}
      <div className="hidden w-[260px] shrink-0 flex-col border-r border-[#0F0F0F]/10 bg-[#FAFAF7] lg:flex">
        <div className="flex items-center justify-between border-b border-[#0F0F0F]/10 px-4 py-3">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#0F0F0F]/60">
            Conversations
          </span>
          <button
            type="button"
            onClick={startNewConversation}
            className="rounded-md p-1 text-[#0F0F0F]/50 transition hover:bg-[#0F0F0F]/5 hover:text-[#0F0F0F]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-[#0F0F0F]/40">
              No conversations yet
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => loadConversation(c.id)}
                className={[
                  'flex w-full flex-col gap-0.5 border-b border-[#0F0F0F]/5 px-4 py-3 text-left transition',
                  activeConversationId === c.id
                    ? 'bg-[#0F0F0F]/[0.06]'
                    : 'hover:bg-[#0F0F0F]/[0.03]',
                ].join(' ')}
              >
                <span className="truncate text-sm font-medium text-[#0F0F0F]/90">
                  {c.title}
                </span>
                <span className="text-[10px] text-[#0F0F0F]/40">
                  {formatRelativeTime(c.lastMessageAt)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: Main area ── */}
      <div className="flex flex-1 flex-col">
        {/* Pending work + header */}
        {messages.length === 0 && !activeConversationId && (
          <div className="border-b border-[#0F0F0F]/10 bg-white px-6 py-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F0F0F] text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-[#0F0F0F]">Clipflow Agent</h1>
                <p className="text-[11px] text-[#0F0F0F]/50">
                  Chat, automate pipeline steps, or let auto-pilot handle it
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {hasRunningRun && (
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                    Running
                  </span>
                )}
                <Link
                  href="/settings/agent"
                  className="rounded-md p-1.5 text-[#0F0F0F]/40 transition hover:bg-[#0F0F0F]/5 hover:text-[#0F0F0F]/70"
                  title="Auto-pilot settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {pendingWork.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-[#0F0F0F]/50">
                  Pending work
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {pendingWork.slice(0, 6).map((item) => {
                    const cfg = WORK_TYPE_CONFIG[item.type]
                    const Icon = cfg.icon
                    return (
                      <button
                        key={`${item.type}-${item.contentId}`}
                        type="button"
                        onClick={() => prefillAndFocus(item.message)}
                        className="group flex items-start gap-3 rounded-xl border border-[#0F0F0F]/8 bg-white p-3 text-left transition hover:border-[#0F0F0F]/15 hover:shadow-sm"
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-[#0F0F0F]/70">{cfg.label}</p>
                          <p className="truncate text-[11px] text-[#0F0F0F]/45">{item.title}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {pendingWork.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#0F0F0F]/15 bg-[#FAFAF7] px-4 py-5 text-center">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-[#FFD33D]" />
                <p className="text-sm font-medium text-[#0F0F0F]/80">All caught up</p>
                <p className="mt-0.5 text-xs text-[#0F0F0F]/45">
                  Pipeline is clear. Type below to start a new task.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-[#FAFAF7] px-6 py-4">
          {loadingHistory && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#0F0F0F]/30" />
            </div>
          )}

          {!loadingHistory && messages.length === 0 && !activeConversationId && (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="mb-3 h-8 w-8 text-[#0F0F0F]/20" />
              <p className="text-sm font-medium text-[#0F0F0F]/60">
                Tell Clipflow what to do
              </p>
              <p className="mb-4 mt-1 max-w-sm text-center text-xs text-[#0F0F0F]/40">
                Start a conversation or pick a suggestion below.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'Find highlights', message: 'Find the best highlights in my latest content' },
                  { label: 'Draft LinkedIn posts', message: 'Generate 3 LinkedIn posts from my latest content' },
                  { label: 'Repurpose a YouTube video', message: 'Import and process this YouTube video: ' },
                  { label: 'Schedule my drafts', message: 'Schedule all approved drafts for this week with optimal timing' },
                  { label: 'What can you do?', message: 'What tasks can you help me with?' },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setPendingMessage(s.message)
                      setTimeout(() => inputRef.current?.focus(), 50)
                    }}
                    className="rounded-full border border-[#0F0F0F]/12 bg-white px-3.5 py-2 text-[12px] font-medium text-[#0F0F0F]/70 shadow-sm transition hover:border-[#0F0F0F]/25 hover:bg-[#0F0F0F]/5 hover:text-[#0F0F0F]"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loadingHistory && messages.map((m) => (
            <div key={m.id} className="mb-3">
              {m.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[70%] rounded-2xl rounded-br-md bg-[#0F0F0F] px-4 py-2.5 text-sm text-white">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {m.text ? (
                    <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-[#0F0F0F]/10 bg-white px-4 py-2.5 text-sm text-[#0F0F0F]">
                      <SimpleMarkdown text={m.text} />
                    </div>
                  ) : null}
                  {m.toolCalls.length > 0 && (
                    <div className="space-y-1.5 pl-1">
                      {m.toolCalls.map((c) => (
                        <ToolCallCard key={c.id} call={c} />
                      ))}
                    </div>
                  )}
                  {!m.text && m.toolCalls.length === 0 && (
                    <div className="flex items-center gap-2 px-1 text-xs text-[#0F0F0F]/50">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>thinking…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {error && (
            <div className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#0F0F0F]/10 bg-white px-6 py-3">
          {costMicro > 0 && (
            <div className="mb-2 text-right text-[10px] text-[#0F0F0F]/40">
              ${(costMicro / 1_000_000).toFixed(4)} this conversation
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); void send() }}
            className="flex items-end gap-3"
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
              placeholder="Process my latest content, find highlights, draft LinkedIn posts…"
              className="min-h-[44px] max-h-[200px] flex-1 resize-none rounded-xl border border-[#0F0F0F]/15 bg-white px-4 py-2.5 text-sm leading-snug outline-none transition focus:border-[#0F0F0F]/40 focus:ring-1 focus:ring-[#0F0F0F]/10"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || pendingMessage.trim().length === 0}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F0F0F] text-white transition hover:bg-[#0F0F0F]/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
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
      <ul key={`ul-${elements.length}`} className="my-1 list-disc space-y-0.5 pl-4">
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

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
