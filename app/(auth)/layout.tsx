import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Subtle background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 opacity-50"
        style={{
          width: 500,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)',
        }}
      />

      <header className="relative flex items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-lg font-bold tracking-tight text-transparent transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          Clipflow
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="relative py-4 text-center text-xs text-muted-foreground/50">
        Secure login · AES-256 encrypted
      </footer>
    </div>
  )
}
