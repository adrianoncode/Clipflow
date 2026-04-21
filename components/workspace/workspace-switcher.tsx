'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Plus } from 'lucide-react'

import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365
/** Sentinel "value" that, when picked from the switcher, navigates to
 *  the new-workspace page instead of switching. Using a non-UUID string
 *  guarantees no real workspace id can ever collide with it. */
const NEW_WORKSPACE_SENTINEL = '__new_workspace__'

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Single-workspace users: show the name as a static chip next to a
  // discrete "+ New" link so they can still spin up a second workspace
  // without having to dig into settings.
  if (workspaces.length <= 1) {
    const only = workspaces[0]
    return (
      <div className="flex items-center gap-1.5">
        <span className="rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 text-sm font-medium">
          {only?.name ?? 'No workspace'}
        </span>
        <Link
          href="/workspace/new"
          title="Create a new workspace"
          aria-label="New workspace"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <select
      value={currentWorkspaceId}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value
        if (next === NEW_WORKSPACE_SENTINEL) {
          // Reset the select visually so the "+ New workspace" item
          // doesn't appear selected after the user returns from /new.
          event.target.value = currentWorkspaceId
          router.push('/workspace/new')
          return
        }
        document.cookie = `${CURRENT_WORKSPACE_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`
        startTransition(() => router.refresh())
      }}
      className="h-9 rounded-xl border border-border/60 bg-background px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20 disabled:opacity-60"
    >
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name}
          {workspace.type !== 'personal' ? ` · ${workspace.type}` : ''}
        </option>
      ))}
      {/* Divider — `disabled` renders it unselectable; most browsers
          show it dimmed which reads as a natural separator. */}
      <option disabled>────────────</option>
      <option value={NEW_WORKSPACE_SENTINEL}>+ New workspace</option>
    </select>
  )
}
