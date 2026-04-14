import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AiCoachPanel } from '@/components/outputs/ai-coach-panel'
import { SeoPanel } from '@/components/outputs/seo-panel'
import { ExportAllButton } from '@/components/outputs/export-all-button'
import { GenerateOutputsForm } from '@/components/outputs/generate-outputs-form'
import { OutputsGrid } from '@/components/outputs/outputs-grid'
import { RegenerateButton } from '@/components/outputs/regenerate-button'
import { ReviewLinkPanel } from '@/components/outputs/review-link-panel'
import { VideoStudioPanel } from '@/components/outputs/video-studio-panel'
import { RenderHistoryPanel } from '@/components/outputs/render-history-panel'
import { ReviewCommentsPanel } from '@/components/review/review-comments-panel'
import { getContentItem } from '@/lib/content/get-content-item'
import { getOutputs } from '@/lib/content/get-outputs'
import { getReviewLinksForContent } from '@/lib/review/get-review-links-for-content'
import { getReviewCommentsForContent } from '@/lib/review/get-review-comments-for-content'
import { listRenders } from '@/lib/video/renders/list-renders'
import { getPlanFeatures } from '@/lib/billing/plans'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'

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

  const [outputs, reviewLinks, reviewComments, renders, plan] = await Promise.all([
    getOutputs(params.contentId, params.id),
    getReviewLinksForContent(params.contentId, params.id),
    getReviewCommentsForContent(params.contentId, params.id),
    listRenders({ workspaceId: params.id, contentId: params.contentId, limit: 12 }),
    getWorkspacePlan(params.id),
  ])
  const planFeatures = getPlanFeatures(plan)
  const title = item.title ?? 'Untitled'

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
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
          <div className="flex flex-wrap gap-2">
            <ExportAllButton outputs={outputs} contentTitle={title} />
            <RegenerateButton workspaceId={params.id} contentId={params.contentId} />
          </div>
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
        <>
          <OutputsGrid outputs={outputs} contentId={params.contentId} workspaceId={params.id} />

          {/* Video Studio — prominent reminder that rendered MP4s are
              the logical next step after text drafts. Sits directly
              below the drafts so "only scripts come out" is impossible
              to conclude. */}
          <VideoStudioPanel
            workspaceId={params.id}
            contentId={params.contentId}
            isVideo={item.kind === 'video'}
            renderCount={renders.length}
            trendingSoundsEnabled={planFeatures.trendingSounds}
          />

          {/* Persisted render history — only renders when there's at
              least one render. Live-polls in-progress rows. */}
          <RenderHistoryPanel initialRenders={renders} />

          <AiCoachPanel
            workspaceId={params.id}
            outputBodies={outputs
              .map((o) => `[${o.platform}]\n${o.body ?? ''}`)
              .join('\n\n---\n\n')}
          />
          <SeoPanel
            workspaceId={params.id}
            contentId={params.contentId}
            initialSeo={
              ((outputs[0]?.metadata as Record<string, unknown> | null)?.seo as null | { primary_keyword: string; secondary_keywords: string[]; seo_title: string; meta_description: string; hashtag_strategy: string }) ?? null
            }
          />
          <ReviewLinkPanel
            workspaceId={params.id}
            contentId={params.contentId}
            links={reviewLinks}
          />
          <ReviewCommentsPanel comments={reviewComments} />
        </>
      )}
    </div>
  )
}
