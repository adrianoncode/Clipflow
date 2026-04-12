'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { IdeasList } from '@/components/ideas/ideas-list'
import { generateIdeasAction, type GenerateIdeasState } from '@/app/(app)/workspace/[id]/ideas/actions'

const PLATFORMS = [
  { value: 'TikTok', label: 'TikTok' },
  { value: 'Instagram Reels', label: 'Instagram Reels' },
  { value: 'YouTube Shorts', label: 'YouTube Shorts' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Twitter / X', label: 'Twitter / X' },
  { value: 'YouTube (long-form)', label: 'YouTube (long-form)' },
  { value: 'Podcast', label: 'Podcast' },
  { value: 'Blog', label: 'Blog' },
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Generating…' : 'Generate 15 ideas'}
    </Button>
  )
}

interface IdeasPanelProps {
  workspaceId: string
}

const initial: GenerateIdeasState = {}

export function IdeasPanel({ workspaceId }: IdeasPanelProps) {
  const [state, action] = useFormState(generateIdeasAction, initial)

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <form action={action} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="niche" className="text-sm font-medium">
                Your niche
              </label>
              <input
                id="niche"
                name="niche"
                type="text"
                required
                placeholder="e.g. personal finance for millennials"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="audience" className="text-sm font-medium">
                Target audience
              </label>
              <input
                id="audience"
                name="audience"
                type="text"
                required
                placeholder="e.g. 25-35 year olds paying off student debt"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="platform" className="text-sm font-medium">
              Platform
            </label>
            <select
              id="platform"
              name="platform"
              required
              defaultValue=""
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
            >
              <option value="" disabled>
                Select a platform
              </option>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {state.ok === false ? (
            <FormMessage variant="error">{state.error}</FormMessage>
          ) : null}

          <SubmitButton />
        </form>
      </div>

      {state.ok === true ? <IdeasList ideas={state.ideas} /> : null}
    </div>
  )
}
