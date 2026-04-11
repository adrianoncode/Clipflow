import { notFound, redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { NewContentTabs } from '@/components/content/new-content-tabs'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaces } from '@/lib/auth/get-workspaces'

export const metadata = {
  title: 'New content',
}

/**
 * Whisper transcription can take up to ~3 minutes on a 25MB file. Ask
 * Vercel for 300s headroom so the platform doesn't cut off the Server
 * Action mid-request. Vercel Hobby is capped at 60s — upgrade to Pro for
 * the full window. Locally there's no ceiling.
 */
export const maxDuration = 300

interface NewContentPageProps {
  params: { id: string }
}

export default async function NewContentPage({ params }: NewContentPageProps) {
  const workspaces = await getWorkspaces()
  const workspace = workspaces.find((w) => w.id === params.id)

  if (!workspace) {
    notFound()
  }

  // Editors and owners can create content. Viewers and clients can't.
  if (workspace.role === 'viewer' || workspace.role === 'client') {
    redirect(`/workspace/${params.id}`)
  }

  // Editors can't see ai_keys under M1's policy even after M3's relax (the
  // settings UI still gates this to owners). For owners we can check live;
  // for editors we trust-the-action and assume there might be a key.
  let hasOpenAiKey = true
  if (workspace.role === 'owner') {
    const keys = await getAiKeys(params.id)
    hasOpenAiKey = keys.some((k) => k.provider === 'openai')
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New content</CardTitle>
          <CardDescription>
            Upload a video or paste a script — we&apos;ll store it in{' '}
            <span className="font-medium">{workspace.name}</span> and get it ready for
            repurposing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewContentTabs workspaceId={params.id} hasOpenAiKey={hasOpenAiKey} />
        </CardContent>
      </Card>
    </div>
  )
}
