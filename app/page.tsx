import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Clipflow</h1>
      <p className="max-w-xl text-balance text-muted-foreground">
        One source of content, every platform handled. Upload a video or paste a script — get
        platform-specific drafts for TikTok, Reels, Shorts, and LinkedIn.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/signup"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-md border border-input bg-background px-5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Sign in
        </Link>
      </div>
    </main>
  )
}
