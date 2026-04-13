'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('clipflow_cookie_consent')
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem('clipflow_cookie_consent', 'accepted')
    setShow(false)
  }

  function decline() {
    localStorage.setItem('clipflow_cookie_consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-2xl backdrop-blur-xl">
        <p className="text-sm text-muted-foreground">
          We use essential cookies for authentication only. No tracking, no ads.{' '}
          <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={accept}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="inline-flex h-9 items-center rounded-lg border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
