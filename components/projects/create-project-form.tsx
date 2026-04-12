'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import {
  createProjectAction,
  type CreateProjectState,
} from '@/app/(app)/workspace/[id]/projects/actions'

interface CreateProjectFormProps {
  workspaceId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Creating…' : 'Create project'}
    </Button>
  )
}

const initial: CreateProjectState = {}

export function CreateProjectForm({ workspaceId }: CreateProjectFormProps) {
  const router = useRouter()
  const [state, action] = useFormState(createProjectAction, initial)

  // Redirect to new project on success
  useEffect(() => {
    if (state.ok === true) {
      router.push(`/workspace/${workspaceId}/projects/${state.projectId}`)
    }
  }, [state, workspaceId, router])

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="workspace_id" value={workspaceId} />

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="project-name">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="project-name"
          name="name"
          type="text"
          required
          placeholder="Q2 Campaign, Client XYZ, Product Launch…"
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium" htmlFor="project-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="project-description"
          name="description"
          type="text"
          placeholder="A short note about this project"
          className="w-full rounded-md border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {state.ok === false && state.error ? (
        <FormMessage variant="error">{state.error}</FormMessage>
      ) : null}

      <SubmitButton />
    </form>
  )
}
