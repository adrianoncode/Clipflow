'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { FormMessage } from '@/components/ui/form-message'
import {
  assignContentToProjectAction,
  type AssignContentState,
} from '@/app/(app)/workspace/[id]/projects/actions'
import type { ProjectRow } from '@/lib/projects/get-projects'

interface AssignToProjectSelectorProps {
  workspaceId: string
  contentId: string
  currentProjectId: string | null
  projects: Pick<ProjectRow, 'id' | 'name'>[]
}

function SubmitOnChange() {
  // This is a helper — real submit is triggered by onChange on the select
  return null
}

const initial: AssignContentState = {}

export function AssignToProjectSelector({
  workspaceId,
  contentId,
  currentProjectId,
  projects,
}: AssignToProjectSelectorProps) {
  const [state, action] = useFormState(assignContentToProjectAction, initial)

  if (projects.length === 0) return null

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="content_id" value={contentId} />

      <label className="text-xs font-medium text-muted-foreground" htmlFor="project-assign">
        Project
      </label>
      <select
        id="project-assign"
        name="project_id"
        defaultValue={currentProjectId ?? ''}
        onChange={(e) => {
          // Auto-submit on change
          const form = e.currentTarget.form
          if (form) form.requestSubmit()
        }}
        className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">None</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {state.ok === true ? (
        <span className="text-xs text-emerald-600">Saved</span>
      ) : null}

      {state.ok === false && state.error ? (
        <FormMessage variant="error" className="text-xs">{state.error}</FormMessage>
      ) : null}
    </form>
  )
}
