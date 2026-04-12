import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clipflow — Turn One Video into TikTok, Reels, Shorts & LinkedIn Posts',
  description:
    'AI-powered content repurposing platform. Upload a video, paste a script, or drop a YouTube link — get platform-native drafts for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn in seconds. Auto-subtitles, B-Roll, virality scoring, social scheduling. Free to start.',
  alternates: {
    canonical: 'https://clipflow.to',
  },
}

const FEATURES = [
  {
    icon: '🎬',
    title: 'Upload once, publish everywhere',
    description:
      'Drop a video, paste a YouTube URL, or type a script. AI transcription turns any content into platform-ready drafts.',
  },
  {
    icon: '✍️',
    title: 'Four platform drafts in seconds',
    description:
      'Get TikTok scripts, Instagram Reels captions, YouTube Shorts hooks, and LinkedIn posts — all generated simultaneously.',
  },
  {
    icon: '🎙️',
    title: 'Brand voice consistency',
    description:
      'Set your tone, keywords to avoid, and example hooks. Every AI-generated draft matches your unique voice.',
  },
  {
    icon: '💬',
    title: 'Animated subtitles & auto-captions',
    description:
      'Generate word-level subtitles with 3 styles. Download SRT/VTT files or preview with live animated overlay.',
  },
  {
    icon: '🎬',
    title: 'AI B-Roll from Pexels',
    description:
      'AI extracts visual keywords from your script, finds matching stock footage from Pexels. One click to find perfect B-Roll.',
  },
  {
    icon: '🔥',
    title: 'Virality score & engagement predictor',
    description:
      'AI scores every output on hook strength, scroll-stop power, shareability. Predicts views and best posting time.',
  },
  {
    icon: '✂️',
    title: 'Auto clip finder',
    description:
      'AI identifies the 3-5 most viral moments in your transcript. Find the best clips without watching the entire video.',
  },
  {
    icon: '↕️',
    title: 'Auto-reframing (9:16)',
    description:
      'Automatically crop landscape video to vertical 9:16, 1:1, or 4:5 format via Replicate AI. Ready for TikTok and Reels.',
  },
  {
    icon: '📅',
    title: 'Social scheduler & content calendar',
    description:
      'Schedule posts to TikTok, Instagram, and LinkedIn. View your publishing calendar with color-coded platform badges.',
  },
  {
    icon: '🎯',
    title: 'A/B hook testing',
    description:
      'Generate 3 hook variants using different psychological triggers. Track which hook performs best.',
  },
  {
    icon: '📊',
    title: 'Analytics & performance tracking',
    description:
      'Track output performance with 5-star ratings, engagement notes, ROI dashboard, and weekly email reports.',
  },
  {
    icon: '👥',
    title: 'Client review & team collaboration',
    description:
      'Share review links — clients leave comments without an account. Multi-client dashboard for agencies.',
  },
  {
    icon: '🌍',
    title: 'Auto-dubbing in 15+ languages',
    description:
      'Translate and dub your content into Spanish, German, French, Japanese, and 12 more languages via ElevenLabs.',
  },
  {
    icon: '🎭',
    title: 'AI avatar video generation',
    description:
      'Enter a script, get a talking head video. AI avatar reads your content — perfect for faceless channels.',
  },
  {
    icon: '⚡',
    title: 'Zapier & Make webhooks',
    description:
      'Connect Clipflow to 5000+ apps. Trigger automations when content is ready, outputs generated, or posts published.',
  },
  {
    icon: '🔑',
    title: 'BYOK — zero AI markup',
    description:
      'Bring your own OpenAI, Anthropic, or Google key. You pay your AI provider directly — we never charge a markup.',
  },
]

const PLATFORMS = [
  { name: 'TikTok', color: 'bg-pink-500/10 text-pink-700 border-pink-500/20' },
  { name: 'Instagram Reels', color: 'bg-purple-500/10 text-purple-700 border-purple-500/20' },
  { name: 'YouTube Shorts', color: 'bg-red-500/10 text-red-700 border-red-500/20' },
  { name: 'LinkedIn', color: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-base font-semibold tracking-tight">Clipflow</span>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            ✦ BYOK — use your own AI key, pay no markup
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            One video.
            <br />
            <span className="text-muted-foreground">Every platform.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
            Upload a clip, paste a script, or drop a YouTube link. Clipflow generates
            platform-native drafts for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn — with
            AI subtitles, B-Roll, virality scoring, and social scheduling. All in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 sm:w-auto"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border px-6 text-sm font-medium shadow-sm transition-colors hover:bg-accent sm:w-auto"
            >
              Sign in
            </Link>
          </div>

          {/* Platform badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {PLATFORMS.map((p) => (
              <span
                key={p.name}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${p.color}`}
              >
                {p.name}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">
              How it works
            </h2>
            <ol className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Add your content',
                  body: 'Upload a video file, paste a YouTube URL, share a webpage, or type a script directly.',
                },
                {
                  step: '2',
                  title: 'Generate drafts',
                  body: 'Click "Generate outputs." Four platform-native drafts — each with a hook, script, caption, and hashtags — are ready in under a minute.',
                },
                {
                  step: '3',
                  title: 'Review & publish',
                  body: 'Edit inline, share a client review link, approve, schedule, and export. Your whole content workflow in one place.',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features grid */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">
              Everything you need to dominate short-form content
            </h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              16 AI-powered tools. One platform. Zero AI markup.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-lg border bg-card p-5 space-y-2"
                >
                  <div className="text-2xl">{f.icon}</div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">Simple pricing</h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              Bring your own AI key — you pay your AI provider directly, zero markup from us.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  name: 'Free',
                  price: '$0',
                  period: 'forever',
                  description: 'Try it out.',
                  features: ['3 content items/mo', '10 outputs/mo', '1 workspace'],
                  cta: 'Get started',
                  highlight: false,
                },
                {
                  name: 'Solo',
                  price: '$19',
                  period: '/mo',
                  description: 'For individual creators.',
                  features: ['20 content items/mo', '100 outputs/mo', '1 workspace', 'Brand voice', 'Client review links'],
                  cta: 'Start free trial',
                  highlight: true,
                },
                {
                  name: 'Team',
                  price: '$49',
                  period: '/mo',
                  description: 'For content teams.',
                  features: ['100 content items/mo', '500 outputs/mo', '5 workspaces', 'Team members', 'Everything in Solo'],
                  cta: 'Start free trial',
                  highlight: false,
                },
                {
                  name: 'Agency',
                  price: '$99',
                  period: '/mo',
                  description: 'Unlimited everything.',
                  features: ['Unlimited content', 'Unlimited outputs', 'Unlimited workspaces', 'Priority support'],
                  cta: 'Start free trial',
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-lg border p-5 space-y-4 ${plan.highlight ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'bg-card'}`}
                >
                  {plan.highlight && (
                    <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-emerald-500">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block w-full rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
                      plan.highlight
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border bg-background hover:bg-accent'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30 py-20">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Stop copy-pasting. Start publishing.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Free to start. Bring your own API key — pay your AI provider directly with zero
              markup.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-11 items-center rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Create free account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="font-medium">Clipflow — AI Content Repurposing Platform</p>
          <p className="mt-2">
            Turn one video into TikTok, Instagram Reels, YouTube Shorts &amp; LinkedIn posts.
            Auto-subtitles, B-Roll, virality scoring, social scheduling, A/B testing, and more.
          </p>
          <p className="mt-4">© {new Date().getFullYear()} Clipflow. All rights reserved.</p>
        </div>
      </footer>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Clipflow',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://clipflow.to',
            description:
              'AI-powered content repurposing platform. Upload a video, get TikTok, Instagram Reels, YouTube Shorts & LinkedIn drafts in seconds.',
            offers: [
              { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
              { '@type': 'Offer', price: '19', priceCurrency: 'USD', name: 'Solo' },
              { '@type': 'Offer', price: '49', priceCurrency: 'USD', name: 'Team' },
              { '@type': 'Offer', price: '99', priceCurrency: 'USD', name: 'Agency' },
            ],
            featureList: [
              'AI content repurposing',
              'TikTok content generation',
              'Instagram Reels generator',
              'YouTube Shorts generator',
              'LinkedIn post generator',
              'Animated subtitles',
              'AI B-Roll from Pexels',
              'Virality scoring',
              'Social media scheduler',
              'A/B hook testing',
              'Auto-reframing 9:16',
              'AI avatar video',
              'Auto-dubbing 15+ languages',
              'Zapier webhooks',
              'Client review links',
              'Brand voice',
              'BYOK AI keys',
            ],
          }),
        }}
      />
    </div>
  )
}
