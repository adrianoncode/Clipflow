import type { Metadata } from 'next'

import { AlternativePageBody } from '@/components/landing/alternative-page'

export const metadata: Metadata = {
  title: 'Klap alternative — Clipflow (Scheduler, Brand Voice, Team seats)',
  description:
    'Looking for a Klap alternative that handles more than just clip extraction? Clipflow adds a scheduler, Brand Voice, Brand Kit, team seats, and BYOK AI pricing — and you keep Klap\u2019s cost advantage.',
  alternates: { canonical: 'https://clipflow.to/klap-alternative' },
  openGraph: {
    title: 'Klap alternative — Clipflow',
    description:
      'Clipflow is the Klap alternative that replaces a whole stack: clip finder, captions, scheduler, and client workflow — one tool, BYOK pricing.',
    url: 'https://clipflow.to/klap-alternative',
    type: 'website',
  },
}

export default function KlapAlternativePage() {
  return (
    <AlternativePageBody
      competitor="klap"
      painPoints={[
        'No scheduler — you still have to publish manually on every platform.',
        'No Brand Voice: every caption reads like it came from the same template bank.',
        'No team or client workspaces, so agency use cases fall apart at >1 creator.',
      ]}
    />
  )
}
