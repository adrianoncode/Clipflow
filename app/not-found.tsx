import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{
        background: '#FAF7F2',
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(120,90,40,.05) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: -160,
          right: -100,
          width: 440,
          height: 440,
          background: '#D6FF3E',
          borderRadius: '50%',
          filter: 'blur(60px)',
          opacity: 0.5,
          mixBlendMode: 'multiply',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          bottom: -160,
          left: -100,
          width: 360,
          height: 360,
          background: '#EFE9F5',
          borderRadius: '50%',
          filter: 'blur(70px)',
          opacity: 0.8,
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.25em]"
          style={{ color: '#7c7468', fontFamily: 'var(--font-jetbrains-mono), monospace' }}
        >
          Error · 404
        </p>
        <h1
          className="text-[72px] leading-[0.95] sm:text-[96px]"
          style={{
            fontFamily: 'var(--font-instrument-serif), serif',
            letterSpacing: '-.015em',
            color: '#0F0F0F',
          }}
        >
          Lost the thread.
        </h1>
        <p className="max-w-sm text-[15px]" style={{ color: '#7c7468' }}>
          The page you&apos;re looking for doesn&apos;t exist or was moved. Pick a direction.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] px-5 text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{
              background: '#0F0F0F',
              color: '#D6FF3E',
              boxShadow: 'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35)',
            }}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border px-5 text-sm font-semibold transition-colors"
            style={{
              borderColor: '#E5DDCE',
              color: '#3a342c',
              background: 'transparent',
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
