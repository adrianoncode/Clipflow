import Link from 'next/link'

const FEATURES = [
  {
    icon: '🎬',
    title: 'Upload once',
    description:
      'Drop a video, paste a YouTube URL, or type a script. Clipflow handles the transcription automatically.',
  },
  {
    icon: '✍️',
    title: 'Four drafts instantly',
    description:
      'Get platform-specific content for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn — all at once.',
  },
  {
    icon: '🎙️',
    title: 'Your voice, always',
    description:
      'Set your tone, keywords to avoid, and an example hook. Every draft sounds like you.',
  },
  {
    icon: '🌍',
    title: 'Any language',
    description:
      'Input in any language and output in 20+ languages. Built for global creators and agencies.',
  },
  {
    icon: '👥',
    title: 'Client review links',
    description:
      'Share a review link. Clients leave comments on individual outputs — no account needed.',
  },
  {
    icon: '📅',
    title: 'Publishing schedule',
    description:
      'Assign dates to approved outputs and see your full posting calendar at a glance.',
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
            platform-native drafts for TikTok, Reels, Shorts, and LinkedIn — in seconds.
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
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">
              Everything you need
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Clipflow
      </footer>
    </div>
  )
}
