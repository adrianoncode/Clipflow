import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f6ff]">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-primary">
          Clipflow
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground/50">
        Secure login · AES-256 encrypted
      </footer>
    </div>
  )
}
