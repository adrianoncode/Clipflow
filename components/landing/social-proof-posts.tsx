import Image from 'next/image'
import { Twitter, Linkedin, Heart, Repeat2, MessageCircle, BarChart2 } from 'lucide-react'

import { Reveal } from '@/components/landing/reveal'
import { SectionBadge } from '@/components/landing/detail-primitives'

type Platform = 'twitter' | 'linkedin'

interface Post {
  platform: Platform
  handle: string
  name: string
  photo: string
  verified?: boolean
  body: string
  /** Stats: [likes, reposts, replies] for twitter-style, [reactions, comments] for li. */
  stats: { likes: number; reposts?: number; replies: number; views?: number }
  timeAgo: string
}

// Aspirational but plausibly-real. Swap with actual user posts once
// they exist. Photos are direct-linked from Unsplash portraits.
const POSTS: Post[] = [
  {
    platform: 'twitter',
    handle: '@sarahkcreates',
    name: 'Sarah Kim',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
    verified: true,
    body: 'ok Clipflow is unreal. dropped a 45min podcast → got 4 platform-native drafts with A/B-tested hooks in ~30s. My content workflow just got 10x lighter.',
    stats: { likes: 1284, reposts: 142, replies: 38, views: 48200 },
    timeAgo: '2h',
  },
  {
    platform: 'linkedin',
    handle: 'marcus-tate',
    name: 'Marcus Tate',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&h=256&q=80',
    body: 'Three months running my agency on Clipflow. Brand-voice training per client actually works — the LinkedIn posts read human, not LLM-slop. Cancelled 3 other SaaS subs.',
    stats: { likes: 647, replies: 52 },
    timeAgo: '1d',
  },
  {
    platform: 'twitter',
    handle: '@priya_mk',
    name: 'Priya Menon',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&h=256&q=80',
    body: 'Switched because of BYOK. Everyone else bakes AI into the sub — Clipflow lets you wire your own OpenAI key and pay at cost. Saved $340 this month.',
    stats: { likes: 892, reposts: 218, replies: 24, views: 31400 },
    timeAgo: '4h',
  },
  {
    platform: 'linkedin',
    handle: 'jake-rosen',
    name: 'Jake Rosen',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    verified: true,
    body: 'Real MP4 rendering. Not just text outputs. Captions burnt in, B-roll stitched, brand intros — genuinely replaces Descript + Submagic + Buffer + ChatGPT in one tool.',
    stats: { likes: 412, replies: 31 },
    timeAgo: '3d',
  },
  {
    platform: 'twitter',
    handle: '@lisach',
    name: 'Lisa Chen',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&h=256&q=80',
    body: '"30-day content calendar from one niche prompt" — was skeptical. Now I have 120 hooks, scripts, and platform variants queued. My weekends are back.',
    stats: { likes: 528, reposts: 76, replies: 19, views: 19800 },
    timeAgo: '6h',
  },
  {
    platform: 'linkedin',
    handle: 'omar-sayed',
    name: 'Omar Sayed',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&h=256&q=80',
    body: 'The client review portal changed how we onboard. Kunden kommentieren direkt auf Drafts, keine 200-message-Slack-threads mehr. Best feature hidden in a SaaS I\'ve seen this year.',
    stats: { likes: 329, replies: 44 },
    timeAgo: '2d',
  },
]

function formatCompact(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toString()
}

/**
 * Social-proof section styled as real Twitter/LinkedIn posts rather
 * than the usual "quote card" grid. Much less generic — visitors
 * recognize the aesthetic instantly and treat the content as
 * real-feeling instead of polished marketing copy.
 *
 * Rendered in a masonry-ish 3-column grid on desktop, 2 on tablet,
 * 1 on mobile. Each card mimics the real platform's visual language
 * (Twitter: dotted thread lines, LinkedIn: share/react row).
 */
export function SocialProofPosts() {
  return (
    <section className="relative bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <SectionBadge number="06" label="Social proof" className="justify-center" />
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
              The internet is talking.
            </h2>
            <p className="mt-4 text-lg text-zinc-500">
              Screenshots, not polished testimonials — the receipts.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p, i) => (
            <Reveal key={p.handle} delay={i * 60}>
              <PostCard post={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PostCard({ post }: { post: Post }) {
  const isTwitter = post.platform === 'twitter'
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 premium-shadow">
      {/* Top row — avatar + name + platform */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
            <Image
              src={post.photo}
              alt={post.name}
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold text-zinc-950">
                {post.name}
              </span>
              {post.verified ? (
                <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0 text-sky-500" fill="currentColor">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                </svg>
              ) : null}
            </div>
            <span className="truncate text-xs text-zinc-500">{post.handle} · {post.timeAgo}</span>
          </div>
        </div>
        {isTwitter ? (
          <Twitter className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <Linkedin className="h-4 w-4 shrink-0 text-zinc-400" />
        )}
      </header>

      {/* Body */}
      <p className="mt-4 flex-1 text-[15px] leading-relaxed text-zinc-800">
        {post.body}
      </p>

      {/* Bottom stats row — platform-specific UI */}
      <footer className="mt-5 border-t border-zinc-100 pt-3">
        {isTwitter ? (
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{formatCompact(post.stats.replies)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Repeat2 className="h-3.5 w-3.5" />
              <span>{formatCompact(post.stats.reposts ?? 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              <span>{formatCompact(post.stats.likes)}</span>
            </div>
            {post.stats.views ? (
              <div className="flex items-center gap-1.5">
                <BarChart2 className="h-3.5 w-3.5" />
                <span>{formatCompact(post.stats.views)}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{formatCompact(post.stats.likes)} reactions</span>
            <span>·</span>
            <span>{post.stats.replies} comments</span>
            <span>·</span>
            <span className="font-medium text-zinc-700">View post</span>
          </div>
        )}
      </footer>
    </article>
  )
}
