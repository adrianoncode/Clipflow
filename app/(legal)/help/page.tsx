import Link from 'next/link'
import { ArrowRight, Book, HelpCircle, Mail, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Help & docs',
  description:
    'Guides, FAQs, and troubleshooting for Clipflow — the fastest way to turn one video into TikTok, Reels, Shorts, and LinkedIn posts.',
}

/**
 * A small, honest help center. Fifteen short articles are better than
 * a promise of "extensive documentation" that isn't real. We group
 * them by the stage of the workflow so users browsing by "where I am
 * stuck" find the right page fast.
 *
 * If a topic isn't covered, the footer drops a direct mailto to
 * support so the user can ask and we learn which article to add next.
 */
const SECTIONS = [
  {
    title: 'Getting started',
    items: [
      { slug: 'getting-started', title: 'What Clipflow does in 30 seconds' },
      { slug: 'connect-ai-keys', title: 'Connect your first AI provider (OpenAI / Anthropic / Google)' },
      { slug: 'import-a-video', title: 'Import your first video — YouTube, MP4, or paste' },
      { slug: 'generate-posts', title: 'Generate platform-specific drafts' },
    ],
  },
  {
    title: 'Workflow',
    items: [
      { slug: 'approve-drafts', title: 'Review and approve drafts' },
      { slug: 'ab-hook-testing', title: 'A/B test hooks before you publish' },
      { slug: 'schedule-posts', title: 'Schedule posts to go live automatically' },
      { slug: 'brand-voice', title: 'Train the AI on your voice' },
    ],
  },
  {
    title: 'Studio plan',
    items: [
      { slug: 'add-client-workspace', title: 'Add a client workspace' },
      { slug: 'invite-team', title: 'Invite team members + set roles' },
      { slug: 'client-review-links', title: 'Share a review link with a client' },
    ],
  },
  {
    title: 'Billing & account',
    items: [
      { slug: 'plans-explained', title: 'Creator vs. Studio: what changes' },
      { slug: 'cancel-subscription', title: 'Cancel or pause your subscription' },
      { slug: 'export-your-data', title: 'Export all your data (GDPR)' },
      { slug: 'delete-account', title: 'Delete your account' },
    ],
  },
]

export default function HelpCenterPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 p-6 sm:p-10">
      {/* ── Header ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Help &amp; docs
          </h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          Short answers, no fluff. Pick the stage of the workflow where you&apos;re
          stuck, or scroll to the contact box at the bottom if we haven&apos;t
          written the right article yet.
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <Book className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                {section.title}
              </h2>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/help/${item.slug}`}
                    className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary/[0.04] hover:text-foreground"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ── Contact fallback ── */}
      <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-muted/30 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Still stuck?</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Reply to any Clipflow email or drop a line to{' '}
            <a
              href="mailto:support@clipflow.to"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <Mail className="h-3 w-3" />
              support@clipflow.to
            </a>
            . We read every message and usually reply within a business day.
          </p>
        </div>
      </div>
    </div>
  )
}
