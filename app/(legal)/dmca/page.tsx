import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DMCA / Copyright Policy — Clipflow',
  description:
    'How to submit a copyright infringement notice under the DMCA and what Clipflow does about it.',
}

export default function DmcaPage() {
  const updated = 'April 17, 2026'

  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-6 py-16 prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-primary prose-li:text-muted-foreground">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-muted-foreground no-underline hover:text-foreground"
      >
        &larr; Back to home
      </Link>
      <h1>DMCA / Copyright Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {updated}</p>

      <h2>1. Our position</h2>
      <p>
        Clipflow respects intellectual property rights and expects its users
        to do the same. We respond to notices of alleged copyright
        infringement that comply with the Digital Millennium Copyright Act
        (&ldquo;DMCA&rdquo;) and similar laws in the EU.
      </p>

      <h2>2. Important reminder for users</h2>
      <p>
        You are solely responsible for the content you upload, import, or
        generate with Clipflow. Before importing a YouTube video, podcast
        feed, or website you do not own, make sure you have the right to
        repurpose that content. Fair-use analysis is your responsibility —
        not ours. Misuse may result in your account being terminated.
      </p>

      <h2>3. Filing a takedown notice</h2>
      <p>
        If you believe content hosted on Clipflow infringes your copyright,
        send a written notice to{' '}
        <a href="mailto:dmca@clipflow.to">dmca@clipflow.to</a> that includes:
      </p>
      <ol>
        <li>
          Your physical or electronic signature (your typed full name is
          sufficient).
        </li>
        <li>
          Identification of the copyrighted work claimed to have been
          infringed — a link to the original, or a copy.
        </li>
        <li>
          Identification of the material on Clipflow that is claimed to be
          infringing and its location — direct URL(s) to the content item,
          output, or review link.
        </li>
        <li>
          Your contact information — full name, postal address, telephone
          number, and email.
        </li>
        <li>
          A statement that you have a good-faith belief that the disputed use
          is not authorized by the copyright owner, its agent, or the law.
        </li>
        <li>
          A statement, under penalty of perjury, that the information in your
          notice is accurate and that you are the copyright owner or
          authorized to act on the owner&apos;s behalf.
        </li>
      </ol>
      <p>
        Notices that omit any of the above are insufficient under the DMCA
        and may be ignored or returned for correction.
      </p>

      <h2>4. What happens after we receive a valid notice</h2>
      <ol>
        <li>
          We remove or disable access to the allegedly infringing material
          within 48 hours of receipt.
        </li>
        <li>
          We notify the user who uploaded the content of the takedown and
          provide them a copy of the notice (minus your address and phone).
        </li>
        <li>
          Repeat offenders are subject to account termination under Clipflow&apos;s{' '}
          <Link href="/terms">Terms of Service</Link>.
        </li>
      </ol>

      <h2>5. Counter-notice procedure</h2>
      <p>
        If you believe your content was removed by mistake or misidentification,
        send a counter-notice to{' '}
        <a href="mailto:dmca@clipflow.to">dmca@clipflow.to</a> containing:
      </p>
      <ol>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the material that was removed and its former location.</li>
        <li>
          A statement, under penalty of perjury, that you have a good-faith
          belief the material was removed as a result of mistake or
          misidentification.
        </li>
        <li>
          Your full name, postal address, phone number, and a statement
          consenting to the jurisdiction of federal court in your district
          (or, if outside the US, any district where Clipflow&apos;s operator
          may be found), and that you will accept service of process from
          the claimant.
        </li>
      </ol>
      <p>
        If we receive a valid counter-notice, we forward it to the original
        claimant. Unless the claimant files a court action within 10-14
        business days, we may restore the removed content.
      </p>

      <h2>6. Repeat-infringer policy</h2>
      <p>
        Accounts that receive three (3) verified DMCA takedowns within any
        rolling twelve-month period are permanently terminated. Refunds are
        not issued for accounts terminated under this policy.
      </p>

      <h2>7. False claims</h2>
      <p>
        Under 17 U.S.C. § 512(f), any person who knowingly materially
        misrepresents that content is infringing (or was removed in error)
        may be liable for damages. Do not file a takedown notice for content
        you do not own or do not have the right to enforce.
      </p>

      <h2>8. EU notice-and-action</h2>
      <p>
        For EU users and rightsholders covered by the Digital Services Act
        (DSA), the same process applies. Notice of illegal content should be
        sent to{' '}
        <a href="mailto:dmca@clipflow.to">dmca@clipflow.to</a> with equivalent
        information. We follow DSA Article 16 timelines.
      </p>

      <h2>9. Designated agent</h2>
      <p>
        Copyright notices:{' '}
        <a href="mailto:dmca@clipflow.to">dmca@clipflow.to</a>
        <br />
        General legal inquiries:{' '}
        <a href="mailto:legal@clipflow.to">legal@clipflow.to</a>
      </p>

      <p className="mt-12 text-xs text-muted-foreground/60">
        This page is provided as informational summary, not legal advice.
        Consult a lawyer for your specific situation.
      </p>
    </article>
  )
}
