import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Film,
  FileText,
  Link2,
  Rss,
  Sparkles,
  Youtube,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
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
import { EditorExportPanel } from '@/components/content/editor-export-panel'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import type { ContentKind } from '@/lib/supabase/types'

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

const KIND_CONFIG: Record<ContentKind, { label: string; icon: typeof Film }> = {
  video: { label: 'Video', icon: Film },
  text: { label: 'Text', icon: FileText },
  youtube: { label: 'YouTube', icon: Youtube },
  url: { label: 'URL', icon: Link2 },
  rss: { label: 'RSS', icon: Rss },
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

  const [outputs, reviewLinks, reviewComments, renders, plan, aiKeys] = await Promise.all([
    getOutputs(params.contentId, params.id),
    getReviewLinksForContent(params.contentId, params.id),
    getReviewCommentsForContent(params.contentId, params.id),
    listRenders({ workspaceId: params.id, contentId: params.contentId, limit: 12 }),
    getWorkspacePlan(params.id),
    getAiKeys(params.id),
  ])
  const planFeatures = getPlanFeatures(plan)
  const hasPublishKey = aiKeys.some((k) => k.provider === 'upload-post')
  const title = item.title ?? 'Untitled'
  const kindCfg = KIND_CONFIG[item.kind] ?? KIND_CONFIG.text
  const KindIcon = kindCfg.icon

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link
          href={`/workspace/${params.id}/content`}
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          Content
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/workspace/${params.id}/content/${params.contentId}`}
          className="max-w-[180px] truncate underline-offset-4 hover:text-foreground hover:underline"
        >
          {title}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">Outputs</span>
      </nav>

      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Outputs for: {title}
            </h1>
            <Badge
              variant="secondary"
              className="gap-1 text-[11px] font-medium"
            >
              <KindIcon className="h-3 w-3" />
              {kindCfg.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
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
        /* ── Empty state: Generate form ── */
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="p-6 sm:p-8">
            <GenerateOutputsForm
              workspaceId={params.id}
              contentId={params.contentId}
              submitLabel="Generate 4 outputs"
            />
          </div>
        </div>
      ) : (
        <>
          {/* ── Success banner ── */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emerald-900">
                {outputs.length} output{outputs.length !== 1 ? 's' : ''} generated!
              </p>
              <p className="text-xs text-emerald-700">
                Review and edit your drafts below, then move them to the pipeline.
              </p>
            </div>
          </div>

          <OutputsGrid outputs={outputs} contentId={params.contentId} workspaceId={params.id} hasPublishKey={hasPublishKey} />

          {/* ── Pipeline CTA ── */}
          <Link
            href={`/workspace/${params.id}/pipeline`}
            className="group flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50/60 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200">
                <ArrowRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-900">
                  Next: Open Pipeline
                </p>
                <p className="text-xs text-violet-700">
                  Review, approve, and schedule your {outputs.length} drafts
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-hover:translate-x-1 group-hover:text-violet-600" />
          </Link>

          {/* ── AI Tools & Advanced panels (collapsible) ── */}
          <details className="group rounded-2xl border border-border/50 bg-card" open={false}>
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <span className="transition-transform group-open:rotate-90">▶</span>
                AI Tools & Advanced
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {6 + (renders.length > 0 ? 1 : 0) + (reviewComments.length > 0 ? 1 : 0)}
                </span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Video Studio, AI Coach, SEO, Reviews & more
              </span>
            </summary>
            <div className="space-y-4 border-t border-border/40 p-4">
              {/* Video Studio — prominent reminder */}
              <VideoStudioPanel
                workspaceId={params.id}
                contentId={params.contentId}
                isVideo={item.kind === 'video'}
                renderCount={renders.length}
                trendingSoundsEnabled={planFeatures.trendingSounds}
              />

              {/* Render history */}
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

              {/* Editor Export — CapCut, Premiere etc. */}
              <EditorExportPanel
                contentId={params.contentId}
                contentTitle={title}
                transcript={item.transcript ?? ''}
                srt={((item.metadata as Record<string, unknown> | null)?.srt as string) ?? null}
                vtt={((item.metadata as Record<string, unknown> | null)?.vtt as string) ?? null}
                clips={((item.metadata as Record<string, unknown> | null)?.best_clips as Array<{
                  quote: string
                  reason: string
                  position_pct: number
                  type: string
                  estimated_duration: string
                }>) ?? null}
                estimatedDurationSec={((item.metadata as Record<string, unknown> | null)?.duration_seconds as number) ?? null}
              />
            </div>
          </details>

          {/* ── Next Steps — bridge to Pipeline & Schedule ── */}
          <div className="rounded-2xl border border-border/50 bg-card">
            <div className="border-b border-border/40 px-5 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Next steps
              </p>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              <Link
                href={`/workspace/${params.id}/pipeline`}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Review &amp; approve</p>
                  <p className="text-[11px] text-muted-foreground">
                    Move drafts through the pipeline
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
              <Link
                href={`/workspace/${params.id}/schedule`}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Schedule publishing</p>
                  <p className="text-[11px] text-muted-foreground">
                    {hasPublishKey ? 'Auto-publish via Upload-Post' : 'Connect Upload-Post to publish'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
