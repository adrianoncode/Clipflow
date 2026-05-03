import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Film,
  Link2,
  Rss,
  Sparkles,
  Youtube,
} from 'lucide-react'

import { AgentSuggestionPills } from '@/components/agent/agent-suggestion-pills'
import { SeoPanel } from '@/components/outputs/seo-panel'
import { ThumbnailStudio } from '@/components/outputs/thumbnail-studio'
import { getBrandKit } from '@/lib/brand-kit/get-brand-kit'
import { createAdminClient } from '@/lib/supabase/admin'
import { ExportAllButton } from '@/components/outputs/export-all-button'
import { GenerateOutputsForm } from '@/components/outputs/generate-outputs-form'
import { StudioContextRail } from '@/components/studio/studio-context-rail'
import { OutputsGrid } from '@/components/outputs/outputs-grid'
import { RegenerateButton } from '@/components/outputs/regenerate-button'
import { getContentItem } from '@/lib/content/get-content-item'
import { getOutputs } from '@/lib/content/get-outputs'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { getAiKeys } from '@/lib/ai/get-ai-keys'
import { getWorkspaceTemplates } from '@/lib/templates/get-templates'
import { getOutputsSuggestions } from '@/lib/agent/suggestions'
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

  // Slice 5 page-detox: source-context fetches (renders / review links /
  // editor-export source URL) moved up to /content/[id]/page.tsx, where
  // they feed the per-video Tools tab. This page now only loads what the
  // OutputsGrid + SEO + Thumbnail sections actually use.
  const [outputs, plan, aiKeys, brandKit, customTemplates] = await Promise.all([
    getOutputs(params.contentId, params.id),
    getWorkspacePlan(params.id),
    getAiKeys(params.id),
    getBrandKit(params.id),
    getWorkspaceTemplates(params.id),
  ])
  // Publish-ready = ANY connected destination, not just Upload-Post.
  // Composio channels (LinkedIn/YouTube/IG/FB) and BYO X keys also count.
  let hasPublishKey = aiKeys.some((k) => k.provider === 'upload-post')
  if (!hasPublishKey) {
    try {
      const supabase = createAdminClient()
      const { data: ws } = await supabase
        .from('workspaces')
        .select('branding')
        .eq('id', params.id)
        .single()
      const branding = (ws?.branding ?? {}) as Record<string, unknown>
      const channels = (branding.channels ?? {}) as Record<string, unknown>
      hasPublishKey = Object.keys(channels).length > 0
    } catch { /* ignore */ }
  }
  const title = item.title ?? 'Untitled'
  const kindCfg = KIND_CONFIG[item.kind] ?? KIND_CONFIG.text

  // Layout (../layout.tsx) renders the Stepper + Per-Video header + tab
  // nav. This page is the body of the "Drafts" tab — pure content, no
  // chassis duplication.
  return (
    <div className="space-y-6">
      {/* Header actions (Export-all / Regenerate) — only when there's
          drafts to act on. Title + kind already render in the layout. */}
      {outputs.length > 0 ? (
        <div className="flex justify-end">
          <div className="flex flex-wrap gap-2">
            <ExportAllButton outputs={outputs} contentTitle={title} />
            <RegenerateButton workspaceId={params.id} contentId={params.contentId} />
          </div>
        </div>
      ) : null}

      {outputs.length === 0 ? (
        /* ── Empty state: Studio context + Generate form ── */
        <>
          <StudioContextRail workspaceId={params.id} />
          <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="p-6 sm:p-8">
              <GenerateOutputsForm
                workspaceId={params.id}
                contentId={params.contentId}
                submitLabel="Generate 4 drafts"
                customTemplates={customTemplates}
              />
            </div>
          </div>
        </>
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
                Review and edit your drafts below, then approve and schedule them.
              </p>
            </div>
          </div>

          <OutputsGrid outputs={outputs} contentId={params.contentId} workspaceId={params.id} hasPublishKey={hasPublishKey} />

          {/* ── Review drafts CTA ── */}
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
                  Next: Review your drafts
                </p>
                <p className="text-xs text-violet-700">
                  Approve the best ones and schedule them to publish
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-hover:translate-x-1 group-hover:text-violet-600" />
          </Link>

          {/* Per-output addons — kept on the Drafts page because they
              attach to specific platform outputs (SEO metadata for blog/
              YouTube cards, thumbnails for the visual platforms). The
              "AI Tools & Advanced"-Drawer that buried these is gone:
              they were hidden behind a click-to-expand and felt like
              scratch features. Surfaced as honest sections instead.

              Slice 5 follow-up moved Source-context tools (Render history,
              Editor export) and Collaboration (Review link, Comments) to
              the per-video Tools tab. */}
          <SeoPanel
            workspaceId={params.id}
            contentId={params.contentId}
            initialSeo={
              ((outputs[0]?.metadata as Record<string, unknown> | null)?.seo as null | { primary_keyword: string; secondary_keywords: string[]; seo_title: string; meta_description: string; hashtag_strategy: string }) ?? null
            }
          />
          <ThumbnailStudio
            defaultTitle={item.title ?? 'Your headline goes here'}
            defaultSub={`${kindCfg.label.toUpperCase()}${item.title ? '' : ' · Draft'}`}
            brandAccent={brandKit?.accentColor}
            brandName={brandKit?.introText ?? 'Clipflow'}
          />

          <AgentSuggestionPills
            suggestions={getOutputsSuggestions(
              params.contentId,
              title,
              outputs.length,
            )}
          />

          {/* ── Next Steps — bridge to Pipeline & Schedule ── */}
          <div className="rounded-2xl border border-border/50 bg-card">
            <div className="border-b border-border/40 px-5 py-3">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-primary/85">
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
                    Pick your favorites and approve them
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
