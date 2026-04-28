import { notFound } from 'next/navigation'
import { Clock } from 'lucide-react'

import { getReviewPageData } from '@/lib/review/get-review-page-data'
import { ReviewCommentForm } from '@/components/review/review-comment-form'
import { ReviewOutputCard } from '@/components/review/review-output-card'
import { PLATFORM_LONG_LABELS as PLATFORM_LABELS } from '@/lib/platforms'

export const dynamic = 'force-dynamic'

interface ReviewPageProps {
  params: { token: string }
}

export async function generateMetadata({ params }: ReviewPageProps) {
  // White-label the browser tab too — agencies don't want "Clipflow" in
  // the title bar of a link they sent their client.
  const data = await getReviewPageData(params.token)
  if (!data) return { title: 'Review' }
  const owner = data.workspaceName ?? 'Review'
  return {
    title: data.contentTitle ? `${data.contentTitle} · ${owner}` : `${owner} · Review`,
  }
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
  // White-label fallback when no logo is uploaded — derive initials from
  // the workspace name so the public page shows a mark that belongs to
  // the client, not a Clipflow-shaped dot. Falls through to "C" only
  // when workspaceName itself is missing.
  const initials = (workspaceName ?? 'C')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-[13px] font-bold tracking-tight"
                style={{ background: accent, color: '#FFFFFF' }}
              >
                {initials}
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
            className="relative overflow-hidden rounded-2xl border p-10 sm:p-14"
            style={{
              borderColor: '#CFC4AF',
              background:
                'linear-gradient(180deg, rgba(214,255,62,.04) 0%, #FFFDF8 40%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,.7) inset, 0 1px 2px rgba(42,26,61,.04), 0 22px 44px -28px rgba(42,26,61,.22)',
            }}
          >
            {/* Hairline + lime corner glow — same vocabulary as the
                rest of the empty-state previews. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(42,26,61,.32), transparent)',
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(214,255,62,.22) 0%, rgba(214,255,62,0) 60%)',
              }}
            />
            <div className="relative flex flex-col items-center gap-4 text-center">
              {/* Plum monogram chip — matches the dashboard hero */}
              <span
                className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{
                  background:
                    'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
                  boxShadow:
                    '0 1px 0 rgba(255,255,255,.18) inset, 0 10px 24px -12px rgba(42,26,61,.55)',
                }}
                aria-hidden
              >
                <span
                  className="pointer-events-none absolute inset-1 rounded-[14px]"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 45%)',
                  }}
                />
                <Clock className="relative h-6 w-6" strokeWidth={1.7} />
              </span>
              <h2
                className="text-[26px] leading-[1.06] tracking-tight sm:text-[30px]"
                style={{
                  fontFamily: 'var(--font-instrument-serif), serif',
                  letterSpacing: '-.015em',
                  color: accent,
                }}
              >
                Drafts are on the way.
              </h2>
              <p
                className="max-w-md text-[14px] leading-relaxed"
                style={{ color: '#5f5850' }}
              >
                The team is putting the final touches on this batch. As soon as the
                first draft is ready, it&rsquo;ll show up right here for you to
                approve or send back with notes — no login, no install, just this link.
              </p>
              <p
                className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em]"
                style={{
                  background: 'rgba(214,255,62,.12)',
                  color: '#1a2000',
                  fontFamily: 'var(--font-jetbrains-mono), monospace',
                  border: '1px solid rgba(214,255,62,.35)',
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: '#D6FF3E',
                    boxShadow: '0 0 8px rgba(214,255,62,.7)',
                    animation: 'cf-review-empty-pulse 2.4s ease-in-out infinite',
                  }}
                />
                Bookmark this link
              </p>
            </div>
            <style>{`
              @keyframes cf-review-empty-pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: .35; }
              }
              @media (prefers-reduced-motion: reduce) {
                [style*="cf-review-empty-pulse"] { animation: none !important; }
              }
            `}</style>
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
