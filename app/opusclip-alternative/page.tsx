import type { Metadata } from 'next'

import { AlternativePageBody } from '@/components/landing/alternative-page'

export const metadata: Metadata = {
  title: 'OpusClip alternative — Clipflow (Brand Voice, Scheduler, White-label)',
  description:
    'Looking for an OpusClip alternative? Clipflow adds Brand Voice captions, Brand Kit on every render, A/B hook testing, white-label client review links, unlimited client workspaces, and BYOK pricing — on top of the same clip-finder quality.',
  alternates: { canonical: 'https://clipflow.to/opusclip-alternative' },
  openGraph: {
    title: 'OpusClip alternative — Clipflow',
    description:
      'Clipflow is the OpusClip alternative for agencies and creators who need Brand Voice, a scheduler, and client-review workflow in one tool.',
    url: 'https://clipflow.to/opusclip-alternative',
    type: 'website',
  },
}

export default function OpusClipAlternativePage() {
  return (
    <AlternativePageBody
      competitor="opusclip"
      painPoints={[
        'Captions read generic — they don\u2019t sound like your actual writing or hooks.',
        'No real Brand Kit on render: logo and colors have to be set up per-clip.',
        'Team seats cost extra and there\u2019s no client-review portal for agencies.',
      ]}
    />
  )
}
