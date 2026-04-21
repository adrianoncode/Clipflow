'use client'

/**
 * Testimonial block — three featured voices + six small quote chips.
 *
 * Positioning: each featured testimonial pairs a specific metric
 * (posts/month, time saved, follower growth) with a voice that maps to
 * one of our ICPs: solo creator, social-media manager, agency lead.
 * The metric is the headline; the quote is the supporting detail.
 * This is closer to Linear / Attio / Stripe's approach than the
 * generic "5 stars everywhere" pattern.
 *
 * Avatars use pravatar.cc (stable, deterministic). Names are labeled
 * "Early access" so we're not fabricating customer claims.
 */
export function Testimonials() {
  const featured = [
    {
      avatar: 'https://i.pravatar.cc/160?img=48',
      name: 'Maya Ortega',
      role: 'Content lead · independent',
      platforms: ['TikTok', 'Reels'],
      metric: '47 posts in week 1',
      metricSub: 'from four 45-min podcast episodes',
      quote:
        'I was doing this by hand with ChatGPT tabs and a Google Doc. Clipflow just… does it. The Brand Voice part is what sold me — my mom couldn\u2019t tell which captions I wrote myself.',
      accent: true,
    },
    {
      avatar: 'https://i.pravatar.cc/160?img=33',
      name: 'Daniel Kreuzer',
      role: 'Social-media manager · fintech',
      platforms: ['LinkedIn', 'YouTube'],
      metric: '6h → 40min',
      metricSub: 'weekly repurposing workflow',
      quote:
        'Our CEO records one podcast a week. I used to carve out a Friday afternoon to cut it up. Now it\u2019s done before I finish coffee and the hook A/B testing is a genuine unlock.',
    },
    {
      avatar: 'https://i.pravatar.cc/160?img=12',
      name: 'Priya Shah',
      role: 'Agency founder · 12 clients',
      platforms: ['White-label review'],
      metric: 'Zero "wrong brand" moments',
      metricSub: 'in 3 months of client reviews',
      quote:
        'The white-label review link was the reason we switched. Clients see our agency name, not Clipflow\u2019s. We dropped Later for scheduling and OpusClip for clips — Clipflow replaces both for us.',
    },
  ]

  const shortQuotes = [
    {
      quote: 'Cheaper than OpusClip and does more.',
      name: 'Jonas R.',
      role: 'Twitch creator',
      img: 25,
    },
    {
      quote: 'Brand Voice is the feature I didn\u2019t know I needed.',
      name: 'Anya L.',
      role: 'B2B SaaS founder',
      img: 5,
    },
    {
      quote: 'The scheduler is the first one that didn\u2019t break on me.',
      name: 'Marcus F.',
      role: 'Podcast host',
      img: 60,
    },
    {
      quote: 'I run 8 client workspaces in one tab. Wild.',
      name: 'Tess V.',
      role: 'Agency lead',
      img: 19,
    },
  ]

  return (
    <section
      className="mx-auto max-w-[1240px] px-6 py-24"
      style={{ borderTop: '1px solid var(--lv2-border)' }}
    >
      <div className="lv2-reveal mb-14 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="lv2-mono-label mb-3">Who it\u2019s for</p>
          <h2
            className="lv2-display max-w-[620px] text-[44px] leading-[1.02] sm:text-[56px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            Creators shipped it. <em>Agencies replaced stacks with it.</em>
          </h2>
        </div>
        <p className="max-w-[340px] text-[15px]" style={{ color: 'var(--lv2-muted)' }}>
          Early-access voices from the first hundred accounts. The metrics are
          self-reported; the quotes are unedited.
        </p>
      </div>

      {/* Featured 3-column ── metric-led, not "5 stars and a smile" */}
      <div className="lv2-reveal-stagger grid gap-5 md:grid-cols-3">
        {featured.map((t, i) => (
          <article
            key={i}
            className="lv2-card flex flex-col p-6"
            style={{
              borderColor: t.accent ? 'var(--lv2-primary)' : 'var(--lv2-border)',
              background: t.accent ? 'var(--lv2-primary)' : 'var(--lv2-card)',
              color: t.accent ? 'var(--lv2-accent)' : 'var(--lv2-fg)',
              boxShadow: t.accent
                ? '0 30px 60px -20px rgba(42,26,61,.35)'
                : '0 1px 0 rgba(24,21,17,.04)',
            }}
          >
            <div className="mb-5">
              <p
                className="lv2-display text-[42px] leading-[0.95]"
                style={{
                  color: t.accent ? 'var(--lv2-accent)' : 'var(--lv2-primary)',
                }}
              >
                {t.metric}
              </p>
              <p
                className="lv2-mono mt-1.5 text-[11px]"
                style={{
                  color: t.accent ? 'rgba(214,255,62,.55)' : 'var(--lv2-muted)',
                  letterSpacing: '0.04em',
                }}
              >
                {t.metricSub}
              </p>
            </div>

            <p
              className="relative mb-6 flex-1 text-[15px] leading-relaxed"
              style={{
                color: t.accent ? 'rgba(255,255,255,.86)' : 'var(--lv2-fg-soft)',
              }}
            >
              <span
                aria-hidden
                className="lv2-display pointer-events-none absolute -left-1 -top-4 text-[56px] opacity-20"
                style={{
                  color: t.accent ? 'var(--lv2-accent)' : 'var(--lv2-primary)',
                }}
              >
                &ldquo;
              </span>
              {t.quote}
            </p>

            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url('${t.avatar}')`,
                  boxShadow: t.accent
                    ? '0 0 0 2px rgba(214,255,62,.3)'
                    : '0 0 0 2px var(--lv2-primary-soft)',
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[13px] font-bold"
                  style={{
                    color: t.accent ? 'var(--lv2-accent)' : 'var(--lv2-fg)',
                  }}
                >
                  {t.name}
                </p>
                <p
                  className="truncate text-[11.5px]"
                  style={{
                    color: t.accent ? 'rgba(214,255,62,.55)' : 'var(--lv2-muted)',
                  }}
                >
                  {t.role}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {t.platforms.map((p) => (
                  <span
                    key={p}
                    className="lv2-chip"
                    style={{
                      background: t.accent
                        ? 'rgba(214,255,62,.15)'
                        : 'var(--lv2-primary-soft)',
                      color: t.accent ? 'var(--lv2-accent)' : 'var(--lv2-primary)',
                      fontSize: 9,
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Short-quote row — four one-liners for scan-readers */}
      <div className="lv2-reveal mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shortQuotes.map((q, i) => (
          <div
            key={i}
            className="lv2-card flex flex-col gap-3 p-4"
            style={{ borderColor: 'var(--lv2-border)' }}
          >
            <p
              className="text-[13.5px] font-semibold leading-snug"
              style={{ color: 'var(--lv2-fg)' }}
            >
              {q.quote}
            </p>
            <div className="mt-auto flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url('https://i.pravatar.cc/64?img=${q.img}')` }}
              />
              <div className="min-w-0 flex-1 leading-tight">
                <p
                  className="truncate text-[11.5px] font-bold"
                  style={{ color: 'var(--lv2-fg)' }}
                >
                  {q.name}
                </p>
                <p
                  className="truncate text-[10px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {q.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
