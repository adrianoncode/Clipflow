'use client'

import { useFormState, useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { createRssContentAction, type RssFormState } from '@/app/(app)/workspace/[id]/content/new/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Fetching episode…' : 'Import latest episode'}
    </Button>
  )
}

const initial: RssFormState = {}

export function RssInputForm({ workspaceId }: { workspaceId: string }) {
  const [state, action] = useFormState(createRssContentAction, initial)

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />

      <div className="space-y-1">
        <label htmlFor="rss-url" className="text-sm font-medium">
          Podcast RSS feed URL
        </label>
        <input
          id="rss-url"
          name="url"
          type="url"
          required
          placeholder="https://feeds.simplecast.com/your-podcast"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Imports the latest episode description. Find the RSS URL in your podcast host settings.
        </p>
      </div>

      {/* Auto-poll opt-in — when checked, the daily poll-rss cron
          imports new episodes as they drop. Unchecked keeps the old
          behavior of a one-shot import. */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/30">
        <input
          type="checkbox"
          name="watch_feed"
          value="on"
          defaultChecked
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-xs leading-relaxed">
          <span className="font-semibold text-foreground">
            Auto-import new episodes
          </span>
          <br />
          <span className="text-muted-foreground">
            Clipflow checks this feed once a day and imports new episodes
            automatically. Uncheck for a one-shot import.
          </span>
        </span>
      </label>

      {state.error ? <FormMessage variant="error">{state.error}</FormMessage> : null}

      <SubmitButton />
    </form>
  )
}
