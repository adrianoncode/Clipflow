import { notFound } from 'next/navigation'

import { getReviewPageData } from '@/lib/review/get-review-page-data'
import { ReviewCommentForm } from '@/components/review/review-comment-form'
import { ReviewOutputCard } from '@/components/review/review-output-card'
import { PLATFORM_LONG_LABELS as PLATFORM_LABELS } from '@/lib/platforms'

export const dynamic = 'force-dynamic'

interface ReviewPageProps {
  params: { token: string }
}

export async function generateMetadata({ params: _params }: ReviewPageProps) {
  return { title: 'Review Drafts' }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const data = await getReviewPageData(params.token)
  if (!data) notFound()

  const { reviewLinkId, label, contentTitle, outputs, comments, workspaceName, brandKit } =
    data

  // White-label mode kicks in when the workspace has set a logo. Without
  // a logo we still white-label away the giant "Clipflow" header and
  // fall back to the workspace name so the reviewer sees the client's
  // name, not ours. Clipflow attribution moves to a tiny footer link.
  const accent = brandKit?.accentColor ?? '#2A1A3D'
  const showLogo = Boolean(brandKit?.logoUrl)

  // Group comments by output_id
  const commentsByOutput = new Map<string | null, typeof comments>()
  for (const c of comments) {
    const key = c.output_id ?? '__general__'
    if (!commentsByOutput.has(key)) commentsByOutput.set(key, [])
    commentsByOutput.get(key)!.push(c)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#FAF7F2',
        backgroundImage:
          'radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0)',
        backgroundSize: '24px 24px',
        color: '#181511',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      {/* ── Branded header ──────────────────────────────────────────── */}
      <header
        className="border-b"
        style={{ background: '#FFFDF8', borderColor: '#E5DDCE' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-6 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {showLogo ? (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border"
                style={{ background: '#FFFFFF', borderColor: '#E5DDCE' }}
              >
                {/* Workspace logo — sized to fit without cropping. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={brandKit!.logoUrl!}
                  alt={`${workspaceName ?? 'Workspace'} logo`}
                  className="max-h-8 max-w-8 object-contain"
                />
              </span>
            ) : (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: accent }}
              >
                <span
                  className="block h-3.5 w-3.5 rounded"
                  style={{ background: '#D6FF3E' }}
                />
              </span>
            )}
            <div className="min-w-0">
              <p
                className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: '#7c7468' }}
              >
                {workspaceName ?? 'Client'} · Review
              </p>
              {contentTitle ? (
                <h1
                  className="mt-0.5 truncate text-[22px] leading-tight sm:text-[28px]"
                  style={{
                    fontFamily: 'var(--font-instrument-serif), serif',
                    color: accent,
                    letterSpacing: '-.015em',
                  }}
                >
                  {contentTitle}
                </h1>
              ) : (
                <h1
                  className="mt-0.5 text-[22px] leading-tight sm:text-[28px]"
                  style={{
                    fontFamily: 'var(--font-instrument-serif), serif',
                    color: accent,
                    letterSpacing: '-.015em',
                  }}
                >
                  Review drafts
                </h1>
              )}
              {label ? (
                <p className="mt-0.5 text-[12.5px]" style={{ color: '#7c7468' }}>
                  {label}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-8">
        {outputs.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed p-10 text-center"
            style={{ borderColor: '#CFC4AF', background: '#FFFDF8' }}
          >
            <p style={{ color: '#7c7468' }}>
              No drafts yet. The team will share them here once they&rsquo;re ready.
            </p>
          </div>
        ) : (
          <>
            <p
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: '#7c7468' }}
            >
              {outputs.length} draft{outputs.length === 1 ? '' : 's'} for review
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              {outputs.map((output) => (
                <ReviewOutputCard
                  key={output.id}
                  output={output}
                  platformLabel={PLATFORM_LABELS[output.platform] ?? output.platform}
                  comments={commentsByOutput.get(output.id) ?? []}
                  reviewLinkId={reviewLinkId}
                />
              ))}
            </div>
          </>
        )}

        {/* General comment section */}
        <div
          className="space-y-4 rounded-2xl border p-6"
          style={{ borderColor: '#E5DDCE', background: '#FFFDF8' }}
        >
          <h2 className="text-[15px] font-bold" style={{ color: '#181511' }}>
            General feedback
          </h2>
          {(commentsByOutput.get('__general__') ?? []).map((c) => (
            <div
              key={c.id}
              className="space-y-1 rounded-xl border p-3 text-sm"
              style={{ borderColor: '#E5DDCE', background: '#F3EDE3' }}
            >
              <p className="font-semibold" style={{ color: '#181511' }}>
                {c.reviewer_name}
              </p>
              <p className="whitespace-pre-wrap" style={{ color: '#3a342c' }}>
                {c.body}
              </p>
            </div>
          ))}
          <ReviewCommentForm
            reviewLinkId={reviewLinkId}
            outputId={null}
            label="Leave general feedback"
          />
        </div>
      </div>

      {/* Powered-by footer — understated, always present. This is the
          one place Clipflow stays visible in white-label mode: never
          compete with the client's brand, never hide the provider
          entirely. */}
      <footer className="border-t" style={{ borderColor: '#E5DDCE' }}>
        <div
          className="mx-auto flex max-w-5xl items-center justify-center px-4 py-5 font-mono text-[10px] uppercase tracking-[0.18em] sm:px-8"
          style={{ color: '#7c7468' }}
        >
          <a
            href="https://clipflow.to"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[color:#2A1A3D]"
          >
            Powered by Clipflow
          </a>
        </div>
      </footer>
    </div>
  )
}
