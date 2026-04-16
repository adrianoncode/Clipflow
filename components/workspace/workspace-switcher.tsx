'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import type { WorkspaceSummary } from '@/lib/auth/get-workspaces'

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceSummary[]
  currentWorkspaceId: string
}

const CURRENT_WORKSPACE_COOKIE = 'clipflow.current_workspace'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

export function WorkspaceSwitcher({ workspaces, currentWorkspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (workspaces.length <= 1) {
    const only = workspaces[0]
    return (
      <span className="rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 text-sm font-medium">
        {only?.name ?? 'No workspace'}
      </span>
    )
  }

  return (
    <select
      value={currentWorkspaceId}
      disabled={isPending}
      onChange={(event) => {
        const next = event.target.value
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
    </select>
  )
}
