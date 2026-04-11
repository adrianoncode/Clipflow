import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { GenerateOutputsForm } from '@/components/outputs/generate-outputs-form'
import { OutputsGrid } from '@/components/outputs/outputs-grid'
import { RegenerateButton } from '@/components/outputs/regenerate-button'
import { getContentItem } from '@/lib/content/get-content-item'
import { getOutputs } from '@/lib/content/get-outputs'

/**
 * `force-dynamic` so we never cache the generated outputs — the route
 * re-renders on every visit, which is what we want when M5 adds
 * state-transition buttons.
 */
export const dynamic = 'force-dynamic'

/**
 * Generation is synchronous and parallel across four platforms. Give
 * Vercel 300s of headroom so the action doesn't get cut off when the
 * slowest provider takes 60s. Server Actions inherit this from the
 * page segment — it cannot live on the 'use server' module.
 */
export const maxDuration = 300

interface OutputsPageProps {
  params: { id: string; contentId: string }
}

export async function generateMetadata({ params }: OutputsPageProps) {
  const item = await getContentItem(params.contentId, params.id)
  return { title: item ? `Outputs — ${item.title ?? 'Untitled'}` : 'Outputs' }
}

export default async function OutputsPage({ params }: OutputsPageProps) {
  const item = await getContentItem(params.contentId, params.id)
  if (!item) notFound()

  // Guard: without a transcript there's nothing to generate from.
  if (item.status !== 'ready' || !item.transcript || item.transcript.length === 0) {
    redirect(`/workspace/${params.id}/content/${params.contentId}`)
  }

  const outputs = await getOutputs(params.contentId, params.id)
  const title = item.title ?? 'Untitled'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href={`/workspace/${params.id}/content/${params.contentId}`}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            ← Back to content
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Outputs — {title}</h1>
          <p className="text-xs text-muted-foreground">
            Platform-specific drafts generated from your transcript.
          </p>
        </div>
        {outputs.length > 0 ? (
          <RegenerateButton workspaceId={params.id} contentId={params.contentId} />
        ) : null}
      </div>

      {outputs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Generate platform drafts</CardTitle>
            <CardDescription>
              Clipflow will produce a TikTok, Reels, Shorts, and LinkedIn draft from your
              transcript.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GenerateOutputsForm
              workspaceId={params.id}
              contentId={params.contentId}
              submitLabel="Generate outputs"
            />
          </CardContent>
        </Card>
      ) : (
        <OutputsGrid outputs={outputs} />
      )}
    </div>
  )
}
