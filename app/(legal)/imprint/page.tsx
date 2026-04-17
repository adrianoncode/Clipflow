import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Imprint — Clipflow',
  description: 'Legal operator information for Clipflow (Impressum).',
}

/**
 * Imprint / Impressum — required under §5 TMG (Germany) and similar
 * EU transparency rules. The actual operator details need to be filled
 * in by the business owner before go-live; placeholders below are
 * marked with TODO so they don't slip into production unchecked.
 */
export default function ImprintPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-6 py-16 prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-primary prose-li:text-muted-foreground">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground no-underline hover:text-foreground"
      >
        &larr; Back to home
      </Link>
      <h1>Imprint / Impressum</h1>
      <p className="text-sm text-muted-foreground">
        Information in accordance with §5 TMG and Art. 14 ODR Regulation.
      </p>

      <h2>Operator</h2>
      <p>
        {/* TODO before launch: replace with your business name & legal form */}
        <strong>Clipflow</strong>
        <br />
        {/* TODO: legal representative full name */}
        Represented by: <span className="text-muted-foreground/60">[Legal representative]</span>
      </p>

      <h2>Postal Address</h2>
      <p>
        {/* TODO: full street, postal code, city, country */}
        <span className="text-muted-foreground/60">
          [Street address]
          <br />
          [Postal code + city]
          <br />
          [Country]
        </span>
      </p>

      <h2>Contact</h2>
      <p>
        Email:{' '}
        <a href="mailto:hello@clipflow.to">hello@clipflow.to</a>
        <br />
        Legal inquiries:{' '}
        <a href="mailto:legal@clipflow.to">legal@clipflow.to</a>
      </p>

      <h2>Business registration</h2>
      <p className="text-muted-foreground/60">
        {/* TODO: Handelsregister / commercial register entry if applicable */}
        [Register court] — [Register number]
      </p>

      <h2>VAT ID</h2>
      <p className="text-muted-foreground/60">
        {/* TODO: USt-IdNr. under §27a UStG or equivalent */}
        [VAT ID number]
      </p>

      <h2>Responsible for editorial content (§18 MStV)</h2>
      <p className="text-muted-foreground/60">
        {/* TODO: same as legal representative for most solo / small businesses */}
        [Full name + postal address]
      </p>

      <h2>Online dispute resolution</h2>
      <p>
        The European Commission provides a platform for online dispute
        resolution (OS) at{' '}
        <a
          href="https://ec.europa.eu/consumers/odr"
          target="_blank"
          rel="noopener noreferrer"
        >
          ec.europa.eu/consumers/odr
        </a>
        . We are neither obligated nor willing to participate in a dispute
        resolution procedure before a consumer arbitration board.
      </p>

      <h2>Disclaimer</h2>
      <p>
        We carefully check the content of our own pages. However, we cannot
        guarantee the accuracy, completeness, or timeliness of the content
        provided. Liability for content under §7(1) TMG extends only to our
        own content — we are not obligated under §§8–10 TMG to monitor
        transmitted or stored third-party information.
      </p>

      <p className="mt-12 text-xs text-muted-foreground/60">
        Last updated: April 17, 2026
      </p>
    </article>
  )
}
