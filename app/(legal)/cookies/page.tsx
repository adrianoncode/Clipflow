import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — Clipflow',
  description: 'How Clipflow uses cookies and similar tracking technologies.',
}

export default function CookiePolicyPage() {
  const updated = 'April 17, 2026'

  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-6 py-16 prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-primary prose-li:text-muted-foreground">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground no-underline hover:text-foreground"
      >
        &larr; Back to home
      </Link>
      <h1>Cookie Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {updated}</p>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They let a site remember you across pages and between
        sessions. Clipflow uses cookies and similar local-storage mechanisms
        only where necessary to run the service.
      </p>

      <h2>2. Cookies we use</h2>

      <h3>2.1 Strictly necessary</h3>
      <ul>
        <li>
          <strong>Authentication session</strong> — Supabase sets a secure,
          HTTP-only cookie after you sign in so the app knows you&apos;re
          logged in. Without this you cannot access the workspace.
        </li>
        <li>
          <strong>Current workspace</strong> — a small cookie
          (<code>clipflow.current_workspace</code>) remembers which workspace
          you last used, so navigating to the dashboard lands on the right one.
        </li>
        <li>
          <strong>CSRF protection</strong> — Next.js sets a token cookie to
          prevent cross-site request forgery on server actions.
        </li>
      </ul>
      <p>
        These are exempt from consent under GDPR Art. 5(3) and the ePrivacy
        Directive because the service cannot function without them.
      </p>

      <h3>2.2 Functional (opt-in)</h3>
      <ul>
        <li>
          <strong>UI preferences</strong> — theme, sidebar state, keyboard-shortcut
          dismiss flags — stored in your browser&apos;s localStorage, never sent
          to our servers. Clearing site data removes them.
        </li>
      </ul>

      <h3>2.3 Analytics</h3>
      <p>
        We do not use third-party analytics cookies (no Google Analytics, no
        Facebook Pixel, no Hotjar). Server-side event logging uses only the
        authenticated session — no cross-site tracking.
      </p>

      <h3>2.4 Advertising</h3>
      <p>We do not run ads and set no advertising cookies.</p>

      <h2>3. Third-party services</h2>
      <p>
        Some features load third-party scripts that may set their own cookies
        when you actively use them:
      </p>
      <ul>
        <li>
          <strong>Stripe Checkout</strong> — when you click &ldquo;Subscribe&rdquo;,
          Stripe&apos;s checkout page (not ours) sets cookies required for
          fraud prevention. Covered by{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stripe&apos;s privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Error tracking (Sentry)</strong> — when enabled in
          production, Sentry may set a session cookie to correlate errors
          across pages. No PII is captured.
        </li>
      </ul>

      <h2>4. Your choices</h2>
      <ul>
        <li>
          You can block all cookies in your browser settings — but then the
          service cannot keep you logged in and will not work.
        </li>
        <li>
          Clearing your browser&apos;s local storage removes all functional
          preferences (you&apos;ll see the first-run tips again).
        </li>
        <li>
          You can delete your account from{' '}
          <Link href="/settings/profile">Settings → Profile</Link> — this
          removes all server-side data along with the cookies it sets.
        </li>
      </ul>

      <h2>5. Changes to this policy</h2>
      <p>
        We&apos;ll update this page when our cookie usage changes and list
        the change in our{' '}
        <Link href="/changelog">changelog</Link>. Material changes (new
        trackers, new third parties) will prompt an in-app notice on your
        next login.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about cookies? Email{' '}
        <a href="mailto:privacy@clipflow.to">privacy@clipflow.to</a>.
      </p>

      <p className="mt-12 text-xs text-muted-foreground/60">
        This policy is provided as plain-language summary, not legal advice.
        See our <Link href="/privacy">Privacy Policy</Link> and{' '}
        <Link href="/terms">Terms of Service</Link> for the full legal basis.
      </p>
    </article>
  )
}
