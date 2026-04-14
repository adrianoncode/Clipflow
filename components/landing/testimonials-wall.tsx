import Image from 'next/image'
import { Star, Twitter, Linkedin } from 'lucide-react'

import { SpotlightCard } from '@/components/landing/spotlight-card'
import { Reveal } from '@/components/landing/reveal'

interface Testimonial {
  quote: string
  name: string
  role: string
  /** Direct Unsplash photo URL — stable via the photo ID. */
  photo: string
  /** Platform the testimonial was originally posted on, for a small badge. */
  platform?: 'twitter' | 'linkedin'
  /** Highlight phrase pulled out in the card; rendered in primary color. */
  highlight?: string
}

// Aspirational testimonials to be swapped with real user quotes once
// you have them. Photos are face-focused Unsplash professional portraits
// served unoptimized to avoid host-list maintenance.
const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Turned a 45-minute podcast into a week of social content in one afternoon. My scroll-stop rate doubled.",
    name: 'Sarah Kim',
    role: 'Creator · 280K subs',
    photo:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    platform: 'twitter',
    highlight: 'My scroll-stop rate doubled.',
  },
  {
    quote:
      "LinkedIn posts that actually sound human — not AI-slop. The brand voice training is a cheat code for agencies.",
    name: 'Marcus Tate',
    role: 'Agency Owner · Tate Social',
    photo:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&h=256&q=80',
    platform: 'linkedin',
    highlight: 'A cheat code for agencies.',
  },
  {
    quote:
      "The BYOK model is the reason I switched. Same tools, 80% less AI spend. Math checked out immediately.",
    name: 'Priya Menon',
    role: 'Head of Content · B2B SaaS',
    photo:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
    platform: 'linkedin',
    highlight: '80% less AI spend.',
  },
  {
    quote:
      "Real MP4 rendering with burnt captions and B-roll — not just text scripts. That alone replaces three tools.",
    name: 'Jake Rosen',
    role: 'YouTuber · 150K subs',
    photo:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    platform: 'twitter',
    highlight: 'Replaces three tools.',
  },
  {
    quote:
      "30-day content calendar from one niche prompt. Hook options, scripts, platform variants — all ready to queue.",
    name: 'Lisa Chen',
    role: 'Social Media Manager',
    photo:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    platform: 'linkedin',
    highlight: 'All ready to queue.',
  },
  {
    quote:
      "The client review portal is the killer feature for agencies. No more Slack threads — one link, threaded comments.",
    name: 'Omar Sayed',
    role: 'Freelance Creator',
    photo:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    platform: 'twitter',
    highlight: 'No more Slack threads.',
  },
]

/**
 * Premium testimonial wall. Cards sit in a masonry-feel 3-column layout
 * on desktop, stacking gracefully. Each card carries:
 *   - 5-star row (all filled — aspirational, not earned)
 *   - pull-quote with an emphasized phrase
 *   - avatar (real Unsplash portrait) + name + role + platform badge
 *
 * Every card is wrapped in a `SpotlightCard` for the cursor-follow halo,
 * keeping interaction density high without overwhelming.
 */
export function TestimonialsWall() {
  return (
    <section className="relative bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
              Loved by creators
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
              Built for people
              <br />
              <span className="text-zinc-400">who actually ship.</span>
            </h2>
            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-zinc-500">
              <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="font-semibold text-zinc-950">4.9/5</span>
              <span>from 120+ early users</span>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 60}>
              <TestimonialCard testimonial={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const Platform =
    testimonial.platform === 'twitter'
      ? Twitter
      : testimonial.platform === 'linkedin'
        ? Linkedin
        : null

  const platformColor =
    testimonial.platform === 'twitter'
      ? 'text-sky-500'
      : testimonial.platform === 'linkedin'
        ? 'text-blue-600'
        : ''

  const quote = testimonial.highlight
    ? testimonial.quote.replace(
        testimonial.highlight,
        `__HL__${testimonial.highlight}__HL__`,
      )
    : testimonial.quote
  const parts = quote.split('__HL__')

  return (
    <SpotlightCard className="h-full rounded-2xl" size={400}>
    <figure className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-7 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-900/[0.06]">
      <div className="relative">
        {/* Stars + platform badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              />
            ))}
          </div>
          {Platform ? (
            <Platform className={`h-4 w-4 ${platformColor}`} strokeWidth={2} />
          ) : null}
        </div>

        {/* Quote */}
        <blockquote className="mt-5 text-[15px] font-medium leading-relaxed text-zinc-800">
          <span className="text-zinc-300">&ldquo;</span>
          {parts.map((p, i) =>
            i % 2 === 1 ? (
              <span key={i} className="bg-violet-100/60 px-0.5 text-violet-900">
                {p}
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
          <span className="text-zinc-300">&rdquo;</span>
        </blockquote>

        {/* Attribution */}
        <figcaption className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-2 ring-white">
            <Image
              src={testimonial.photo}
              alt={testimonial.name}
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-950">
              {testimonial.name}
            </p>
            <p className="truncate text-xs text-zinc-500">{testimonial.role}</p>
          </div>
        </figcaption>
      </div>
    </figure>
    </SpotlightCard>
  )
}
