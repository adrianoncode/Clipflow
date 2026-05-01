import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Clipflow',
  description:
    'How Clipflow collects, uses, and protects your data. GDPR-compliant, AES-256-encrypted at rest, no tracking cookies.',
  alternates: { canonical: 'https://clipflow.to/privacy' },
  openGraph: {
    title: 'Privacy Policy — Clipflow',
    description:
      'How Clipflow collects, uses, and protects your data. GDPR-compliant, AES-256-encrypted at rest, no tracking cookies.',
    url: 'https://clipflow.to/privacy',
    type: 'article',
  },
}

export default function PrivacyPage() {
  const updated = 'April 13, 2026'

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <p className="lv2L-eyebrow">Policy · Privacy</p>
      <h1>Privacy policy.</h1>
      <p className="mt-3 text-[13px]" style={{ color: '#7c7468' }}>Last updated · {updated}</p>

      <h2>1. Introduction</h2>
      <p>Clipflow (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the clipflow.to website and platform. This policy explains how we collect, use, and protect your personal information.</p>

      <h2>2. Information We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> Name, email address when you sign up.</li>
        <li><strong>Content data:</strong> Videos, scripts, transcripts, and outputs you create within the platform.</li>
        <li><strong>API keys:</strong> Your AI provider keys (OpenAI, Anthropic, Google) — encrypted with AES-256-GCM at rest. We never store them in plaintext.</li>
        <li><strong>Usage data:</strong> Pages visited, features used, generation counts — for product improvement.</li>
        <li><strong>Payment data:</strong> Handled entirely by Stripe. We never store credit card numbers.</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To provide and improve the Clipflow platform.</li>
        <li>To route AI generation requests through your API keys to your chosen provider.</li>
        <li>To send transactional emails (account verification, password resets, review notifications).</li>
        <li>To enforce usage limits based on your subscription plan.</li>
      </ul>

      <h2>4. BYOK (Bring Your Own Key)</h2>
      <p>When you provide an AI provider API key, it is encrypted using AES-256-GCM before storage. API calls are made server-side directly to your chosen provider. We do not log, inspect, or store the content of AI requests or responses beyond what is necessary to display your generated outputs.</p>

      <h2>5. Data Sharing</h2>
      <p>We do not sell your personal data. We share data only with:</p>
      <ul>
        <li><strong>Supabase:</strong> Database and authentication hosting.</li>
        <li><strong>Vercel:</strong> Application hosting.</li>
        <li><strong>Stripe:</strong> Payment processing.</li>
        <li><strong>Resend:</strong> Transactional email delivery.</li>
        <li><strong>Your AI provider:</strong> OpenAI, Anthropic, or Google — only the content you submit for generation.</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>Your content and outputs are retained as long as your account is active. You can delete individual content items at any time. If you delete your account, all associated data is permanently removed within 30 days.</p>

      <h2>7. Security</h2>
      <p>We use industry-standard security measures including HTTPS encryption in transit, AES-256-GCM encryption for API keys at rest, Row Level Security (RLS) in our database, and regular security audits.</p>

      <h2>8. Your Rights (GDPR)</h2>
      <p>If you are in the EU/EEA, you have the right to access, correct, delete, or export your personal data. Contact us at privacy@clipflow.to to exercise these rights.</p>

      <h2>9. Cookies</h2>
      <p>We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies. See our cookie consent banner for more details.</p>

      <h2>10. Changes</h2>
      <p>We may update this policy. Significant changes will be communicated via email or in-app notification.</p>

      <h2>11. Contact</h2>
      <p>Questions? Email us at <a href="mailto:privacy@clipflow.to">privacy@clipflow.to</a>.</p>
    </article>
  )
}
