import type { Metadata } from 'next'

import { AlternativePageBody } from '@/components/landing/alternative-page'

export const metadata: Metadata = {
  title: 'Descript alternative for repurposing — Clipflow',
  description:
    'Looking for a Descript alternative focused on repurposing, not editing? Clipflow starts where Descript ends: one long recording in, 50+ platform-native posts out with Brand Voice, scheduler, and client-review workflow.',
  alternates: { canonical: 'https://clipflow.to/descript-alternative' },
  openGraph: {
    title: 'Descript alternative — Clipflow',
    description:
      'Clipflow is the Descript alternative for creators and agencies who need repurposing, not a full editor. Zero learning curve, output in minutes.',
    url: 'https://clipflow.to/descript-alternative',
    type: 'website',
  },
}

export default function DescriptAlternativePage() {
  return (
    <AlternativePageBody
      competitor="descript"
      painPoints={[
        'Steep learning curve — transcript-editor UI is powerful but overkill for repurposing.',
        'No scheduler or auto-publish to social platforms, so you still need a second tool.',
        'Agency workflow is weak: no client review links, no white-label, no per-client workspace.',
      ]}
    />
  )
}
