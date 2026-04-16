'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { useState } from 'react'
import { ArrowRight, FileText, Globe, Layers, Rss, Video, Youtube } from 'lucide-react'
import { batchGenerateAction, type BatchGenerateState } from '@/app/(app)/workspace/[id]/batch/actions'

const initialState: BatchGenerateState = {}

const KIND_ICON = {
  video: Video,
  youtube: Youtube,
  url: Globe,
  rss: Rss,
  text: FileText,
} as const

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return iso
  }
}

interface BatchItem {
  id: string
  title: string | null
  kind: string
  created_at: string
  hasOutputs: boolean
}

interface BatchGeneratorProps {
  items: BatchItem[]
  workspaceId: string
}

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || count === 0}
      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? 'Generating…' : `Generate outputs for ${count} item${count !== 1 ? 's' : ''}`}
    </button>
  )
}

export function BatchGenerator({ items, workspaceId }: BatchGeneratorProps) {
  const [state, formAction] = useFormState(batchGenerateAction, initialState)
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.filter((i) => !i.hasOutputs).map((i) => i.id))
  )

  const MAX = 10

  const toggleAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      const next = items.slice(0, MAX).map((i) => i.id)
      setSelected(new Set(next))
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (next.size < MAX) {
          next.add(id)
        }
      }
      return next
    })
  }

  if (state && state.ok === true) {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <p className="text-sm font-medium text-green-800">
            Batch generation complete
          </p>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Content</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Generated</th>
                <th className="px-4 py-2 text-center font-medium text-muted-foreground">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {state.results.map((r) => (
                <tr key={r.contentId}>
                  <td className="px-4 py-2 truncate max-w-xs">{r.title}</td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-green-700 font-medium">{r.generated}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {r.failed > 0 ? (
                      <span className="text-amber-700 font-medium">{r.failed}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/workspace/${workspaceId}/pipeline`}
            className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Layers className="h-4 w-4" />
            Open Pipeline
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Run another batch
          </button>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="contentIds" value={JSON.stringify(Array.from(selected))} />

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {selected.size === items.length ? 'Deselect all' : 'Select all'}
          </button>
          <span className="text-xs text-muted-foreground">
            {selected.size} item{selected.size !== 1 ? 's' : ''} selected
            {selected.size === MAX && (
              <span className="ml-1 text-amber-600">(max)</span>
            )}
          </span>
        </div>
        <SubmitButton count={selected.size} />
      </div>

      {/* Error */}
      {state && state.ok === false && (
        <p className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ready content items found.</p>
      ) : (
        <div className="rounded-lg border bg-card divide-y overflow-hidden">
          {items.map((item) => {
            const Icon = KIND_ICON[item.kind as keyof typeof KIND_ICON] ?? FileText
            const isSelected = selected.has(item.id)
            const isDisabled = !isSelected && selected.size >= MAX

            return (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggle(item.id)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 truncate text-sm">{item.title ?? 'Untitled'}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                {item.hasOutputs ? (
                  <span className="shrink-0 text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                    Has outputs
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-amber-700 px-2 py-0.5 rounded-full bg-amber-50">
                    No outputs yet
                  </span>
                )}
              </label>
            )
          })}
        </div>
      )}
    </form>
  )
}
