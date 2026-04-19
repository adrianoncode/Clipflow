import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'

import { HELP_ARTICLES } from '@/lib/help/articles'

export function generateStaticParams() {
  return Object.keys(HELP_ARTICLES).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const article = HELP_ARTICLES[params.slug]
  if (!article) return { title: 'Help article not found' }
  return { title: `${article.title} — Clipflow help` }
}

export default function HelpArticlePage({
  params,
}: {
  params: { slug: string }
}) {
  const article = HELP_ARTICLES[params.slug]
  if (!article) notFound()

  return (
    <article className="mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-10">
      <Link
        href="/help"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to help center
      </Link>

      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        {article.summary ? (
          <p className="text-base text-muted-foreground">{article.summary}</p>
        ) : null}
      </header>

      <div
        className="prose prose-zinc max-w-none text-[15px] leading-relaxed"
        // Articles are authored as plain markdown-ish HTML in the
        // source file. We don't render user input here — only our
        // own static strings — so HTML is safe.
        dangerouslySetInnerHTML={{ __html: article.body }}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Did this answer your question?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            If not,{' '}
            <a
              href={`mailto:support@clipflow.to?subject=Help: ${encodeURIComponent(article.title)}`}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              email support
            </a>{' '}
            and we&apos;ll improve this article.
          </p>
        </div>
      </div>
    </article>
  )
}
