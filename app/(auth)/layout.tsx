import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white">
      {/* Same soft violet wash + dot-grid as the landing hero, so auth
          feels like it belongs to the same product. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-dots-subtle opacity-60"
        style={{
          maskImage:
            'radial-gradient(ellipse 90% 60% at 50% 0%, #000 30%, transparent 100%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 60% at 50% 0%, #000 30%, transparent 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(50% 40% at 50% 0%, rgba(124, 58, 237, 0.08), transparent 70%)',
        }}
      />

      <header className="relative flex items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-primary">
          Clipflow
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to home
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative flex items-center justify-center gap-2 py-5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
        <span className="h-1 w-1 rounded-full bg-emerald-400" />
        secure · aes-256 encrypted
      </footer>
    </div>
  )
}
