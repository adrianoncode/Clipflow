import Link from 'next/link'
import { ArrowRight, Book, Mail, MessageCircle } from 'lucide-react'

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
    <div className="mx-auto w-full max-w-4xl space-y-10 px-6 py-20">
      {/* ── Header ── */}
      <div>
        <p className="lv2L-eyebrow">Support · Docs</p>
        <h1
          className="lv2L-display text-[56px] leading-[1.02]"
          style={{ color: '#2A1A3D' }}
        >
          Help &amp; docs.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px]" style={{ color: '#3a342c' }}>
          Short answers, no fluff. Pick the stage of the workflow where you&apos;re
          stuck, or scroll to the contact box at the bottom if we haven&apos;t
          written the right article yet.
        </p>
      </div>

      {/* ── Sections ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <section key={section.title} className="lv2L-card">
            <div className="mb-3 flex items-center gap-2">
              <Book
                className="h-[14px] w-[14px]"
                style={{ color: '#2A1A3D' }}
              />
              <h2
                className="lv2L-mono text-[10.5px] font-bold uppercase"
                style={{ color: '#7c7468', letterSpacing: '.2em' }}
              >
                {section.title}
              </h2>
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/help/${item.slug}`}
                    className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors"
                    style={{ color: '#3a342c' }}
                  >
                    <ArrowRight
                      className="mt-[3px] h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5"
                      style={{ color: '#CFC4AF' }}
                    />
                    <span>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ── Contact fallback ── */}
      <div
        className="flex items-start gap-4 rounded-2xl p-5"
        style={{ background: '#F3EDE3', border: '1px solid #E5DDCE' }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: '#FFFDF8' }}
        >
          <MessageCircle className="h-4 w-4" style={{ color: '#2A1A3D' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: '#181511' }}>
            Still stuck?
          </p>
          {/* #7c7468 on #F3EDE3 = 3.95:1, fails WCAG AA (needs 4.5:1).
              #5f5850 brings it to 5.3:1 while staying in the same warm
              muted family. Only darkened here — general muted token
              keeps its original value for pages with lighter bg. */}
          <p className="mt-0.5 text-[12.5px] leading-relaxed" style={{ color: '#5f5850' }}>
            Reply to any Clipflow email or drop a line to{' '}
            <a
              href="mailto:support@clipflow.to"
              className="inline-flex items-center gap-1 font-semibold hover:underline"
              style={{ color: '#2A1A3D' }}
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
