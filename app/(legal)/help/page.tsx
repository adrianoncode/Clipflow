import Link from 'next/link'
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  LifeBuoy,
  Mail,
  MessageCircle,
  Rocket,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export const metadata = {
  title: 'Help & docs',
  description:
    'Guides, FAQs, and troubleshooting for Clipflow — the fastest way to turn one video into TikTok, Reels, Shorts, and LinkedIn posts.',
}

/**
 * A small, honest help center. Fifteen short articles are better than
 * a promise of "extensive documentation" that isn't real. Sections
 * group articles by the stage of the workflow so users browsing by
 * "where I am stuck" find the right page fast.
 *
 * If a topic isn't covered, the footer drops a direct mailto to
 * support so the user can ask and we learn which article to add next.
 */
const SECTIONS: Array<{
  title: string
  icon: LucideIcon
  hint: string
  items: Array<{ slug: string; title: string }>
}> = [
  {
    title: 'Getting started',
    icon: Rocket,
    hint: 'First 30 minutes with Clipflow',
    items: [
      { slug: 'getting-started', title: 'What Clipflow does in 30 seconds' },
      {
        slug: 'connect-ai-keys',
        title: 'Connect your first AI provider (OpenAI / Anthropic / Google)',
      },
      { slug: 'import-a-video', title: 'Import your first video — YouTube, MP4, or paste' },
      { slug: 'generate-posts', title: 'Generate platform-specific drafts' },
    ],
  },
  {
    title: 'Workflow',
    icon: Workflow,
    hint: 'Daily craft — review, test, schedule',
    items: [
      { slug: 'approve-drafts', title: 'Review and approve drafts' },
      { slug: 'ab-hook-testing', title: 'A/B test hooks before you publish' },
      { slug: 'schedule-posts', title: 'Schedule posts to go live automatically' },
      { slug: 'brand-voice', title: 'Train the AI on your voice' },
    ],
  },
  {
    title: 'Studio plan',
    icon: Building2,
    hint: 'Agency tools — clients, team, review links',
    items: [
      { slug: 'add-client-workspace', title: 'Add a client workspace' },
      { slug: 'invite-team', title: 'Invite team members + set roles' },
      { slug: 'client-review-links', title: 'Share a review link with a client' },
    ],
  },
  {
    title: 'Billing & account',
    icon: CreditCard,
    hint: 'Plans, exports, and the GDPR controls',
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
    <div className="mx-auto w-full max-w-4xl space-y-12 px-6 py-20">
      {/* ── Hero ── visual-anchored, same chassis vocabulary as the
          authed surfaces (Settings, Library, Research). Anchors the
          page so the title doesn't float in raw whitespace. */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
        <span
          className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white"
          style={{
            background:
              'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.18) inset, 0 12px 28px -14px rgba(42,26,61,0.55)',
          }}
          aria-hidden
        >
          <span
            className="pointer-events-none absolute inset-1 rounded-[14px]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
            }}
          />
          <LifeBuoy className="relative h-7 w-7" strokeWidth={1.7} />
        </span>

        <div>
          <p className="lv2L-eyebrow">Support · Docs</p>
          <h1
            className="lv2L-display text-[44px] leading-[1.02] sm:text-[52px]"
            style={{ color: '#2A1A3D' }}
          >
            Help &amp; docs.
          </h1>
          <p
            className="mt-3 max-w-2xl text-[14.5px] leading-relaxed"
            style={{ color: '#3a342c' }}
          >
            Short answers, no fluff. Pick the stage of the workflow where
            you&apos;re stuck, or scroll to the contact box at the bottom if we
            haven&apos;t written the right article yet.
          </p>
        </div>
      </header>

      {/* ── Sections ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title} className="lv2L-card">
              <header className="mb-4 flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background:
                      'linear-gradient(140deg, rgba(42,26,61,0.10) 0%, rgba(42,26,61,0.04) 100%)',
                    color: '#2A1A3D',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.55) inset',
                  }}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2
                    className="text-[15px] font-bold tracking-tight"
                    style={{
                      color: '#181511',
                      fontFamily:
                        'var(--font-inter-tight), var(--font-inter), sans-serif',
                    }}
                  >
                    {section.title}
                  </h2>
                  <p
                    className="mt-0.5 text-[12px] leading-snug"
                    style={{ color: '#7c7468' }}
                  >
                    {section.hint}
                  </p>
                </div>
              </header>
              <ul className="space-y-px">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/help/${item.slug}`}
                      className="group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] leading-snug transition-colors"
                      style={{ color: '#3a342c' }}
                    >
                      {/* fade-in primary accent bar on hover — same row
                          treatment as the SettingsRow */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        style={{ background: '#2A1A3D' }}
                      />
                      <span className="flex-1">{item.title}</span>
                      <ArrowUpRight
                        className="h-3.5 w-3.5 shrink-0 opacity-40 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                        style={{ color: '#2A1A3D' }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {/* ── Contact fallback ── premium chassis with a violet-gradient
          message-circle bubble. Reads as "we actually answer" rather
          than a generic FAQ kiss-off. */}
      <section
        className="relative overflow-hidden rounded-2xl p-5 sm:p-6"
        style={{
          background: '#FFFDF8',
          border: '1px solid #E5DDCE',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.55) inset, 0 1px 2px rgba(24,21,17,0.04), 0 14px 32px -22px rgba(42,26,61,0.22)',
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -left-10 -top-12 h-36 w-36 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(42,26,61,0.16) 0%, rgba(42,26,61,0) 60%)',
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              'linear-gradient(to right, transparent, rgba(42,26,61,0.30), transparent)',
          }}
        />

        <div className="relative flex items-start gap-4">
          <span
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{
              background:
                'linear-gradient(140deg, #2A1A3D 0%, #120920 60%, #2A1A3D 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 20px -10px rgba(42,26,61,0.55)',
            }}
            aria-hidden
          >
            <span
              className="pointer-events-none absolute inset-1 rounded-[10px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)',
              }}
            />
            <MessageCircle className="relative h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="flex-1">
            <p
              className="text-[15px] font-bold tracking-tight"
              style={{
                color: '#181511',
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
              }}
            >
              Still stuck?
            </p>
            <p
              className="mt-1 text-[13px] leading-relaxed"
              style={{ color: '#5f5850' }}
            >
              Reply to any Clipflow email or drop a line below. We read every
              message and usually reply within a business day.
            </p>
            <a
              href="mailto:support@clipflow.to"
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-bold tracking-tight transition-all hover:-translate-y-px hover:shadow-md"
              style={{
                background: '#181511',
                color: '#FFFDF8',
                fontFamily:
                  'var(--font-inter-tight), var(--font-inter), sans-serif',
                boxShadow: '0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 14px -8px rgba(24,21,17,0.4)',
              }}
            >
              <Mail className="h-3.5 w-3.5" />
              support@clipflow.to
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
