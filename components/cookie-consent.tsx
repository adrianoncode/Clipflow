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
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div
        className="rounded-2xl p-5 shadow-2xl backdrop-blur-xl"
        style={{
          background: '#FFFDF8',
          border: '1px solid #E5DDCE',
          boxShadow: '0 1px 0 rgba(24,21,17,.04), 0 30px 60px -20px rgba(15,15,15,.28)',
        }}
      >
        <p className="text-sm" style={{ color: '#7c7468' }}>
          We use essential cookies for authentication only. No tracking, no ads.{' '}
          <Link
            href="/privacy"
            className="underline-offset-4 hover:underline"
            style={{ color: '#0F0F0F', fontWeight: 600 }}
          >
            Privacy Policy
          </Link>
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={accept}
            className="inline-flex h-9 items-center rounded-lg px-5 text-sm font-bold transition-transform hover:-translate-y-0.5"
            style={{
              background: '#0F0F0F',
              color: '#D6FF3E',
              boxShadow: 'inset 0 0 0 1px rgba(214,255,62,.15), 0 4px 14px -4px rgba(15,15,15,.35)',
            }}
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="inline-flex h-9 items-center rounded-lg px-5 text-sm font-semibold transition-colors"
            style={{
              color: '#3a342c',
              border: '1px solid #E5DDCE',
              background: 'transparent',
            }}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
