'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  FolderInput,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'

import {
  bulkDeleteContentAction,
  bulkAssignToProjectAction,
} from '@/app/(app)/workspace/[id]/content/bulk-actions'

interface Project {
  id: string
  name: string
}

interface BulkActionBarProps {
  workspaceId: string
  selected: Set<string>
  onClear: () => void
  projects: Project[]
}

type Banner =
  | { kind: 'success'; text: string }
  | { kind: 'error'; text: string }
  | null

export function BulkActionBar({
  workspaceId,
  selected,
  onClear,
  projects,
}: BulkActionBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>(null)
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)

  const count = selected.size
  if (count === 0) return null

  function buildFormData(extra: Record<string, string | null>): FormData {
    const fd = new FormData()
    fd.set('workspace_id', workspaceId)
    fd.set('content_ids', Array.from(selected).join(','))
    for (const [k, v] of Object.entries(extra)) {
      if (v !== null) fd.set(k, v)
    }
    return fd
  }

  function handleDelete() {
    const label = count === 1 ? '1 video' : `${count} videos`
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return

    startTransition(async () => {
      const result = await bulkDeleteContentAction({}, buildFormData({}))
      if (result.ok === true) {
        setBanner({
          kind: 'success',
          text:
            result.failed && result.failed > 0
              ? `Deleted ${result.count} · ${result.failed} failed`
              : `Deleted ${result.count} ${result.count === 1 ? 'video' : 'videos'}`,
        })
        onClear()
        router.refresh()
      } else if (result.ok === false) {
        setBanner({ kind: 'error', text: result.error })
      }
      setTimeout(() => setBanner(null), 3000)
    })
  }

  function handleAssign(projectId: string | null) {
    setProjectMenuOpen(false)

    startTransition(async () => {
      const result = await bulkAssignToProjectAction(
        {},
        buildFormData({ project_id: projectId ?? '' }),
      )
      if (result.ok === true) {
        const target = projectId
          ? projects.find((p) => p.id === projectId)?.name ?? 'project'
          : 'no project'
        setBanner({
          kind: 'success',
          text: `Moved ${result.count} ${result.count === 1 ? 'video' : 'videos'} → ${target}`,
        })
        onClear()
        router.refresh()
      } else if (result.ok === false) {
        setBanner({ kind: 'error', text: result.error })
      }
      setTimeout(() => setBanner(null), 3000)
    })
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/70 bg-background/95 p-1.5 shadow-xl shadow-black/[0.12] backdrop-blur-md"
        role="toolbar"
        aria-label="Bulk actions"
      >
        {/* Count + clear */}
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
        >
          <X className="h-3 w-3" />
          {count} selected
        </button>

        <span aria-hidden className="mx-0.5 h-5 w-px bg-border/60" />

        {/* Move to project */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProjectMenuOpen((v) => !v)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            <FolderInput className="h-3.5 w-3.5" />
            Move to project
          </button>

          {projectMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-xl border border-border/60 bg-popover shadow-xl shadow-black/[0.1]">
              <div className="max-h-64 overflow-y-auto py-1">
                {projects.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    No projects yet. Create one first.
                  </p>
                ) : (
                  <>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAssign(p.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-primary/8"
                      >
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                    <div className="my-1 h-px bg-border/40" />
                    <button
                      type="button"
                      onClick={() => handleAssign(null)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                    >
                      Remove from project
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Delete
        </button>

        {/* Status banner — slides in next to the bar */}
        {banner && (
          <div
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
              banner.kind === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {banner.kind === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {banner.text}
          </div>
        )}
      </div>
    </div>
  )
}
