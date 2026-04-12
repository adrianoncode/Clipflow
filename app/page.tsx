import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, X, ChevronDown, Zap, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clipflow — Turn One Video into TikTok, Reels, Shorts & LinkedIn Posts',
  description:
    'AI-powered content repurposing. Upload a video, paste a script, or drop a YouTube link — get platform-native drafts for TikTok, Instagram Reels, YouTube Shorts, and LinkedIn in seconds.',
  alternates: { canonical: 'https://clipflow.to' },
}

const COMPARISON = [
  { feature: 'All 4 platform drafts at once', c: true, o: false, k: false },
  { feature: 'Brand voice settings', c: true, o: false, k: false },
  { feature: 'A/B hook testing', c: true, o: false, k: false },
  { feature: 'Virality scoring', c: true, o: true, k: false },
  { feature: 'Social scheduler', c: true, o: false, k: false },
  { feature: 'Animated subtitles', c: true, o: true, k: true },
  { feature: 'AI B-Roll (Pexels)', c: true, o: false, k: false },
  { feature: 'AI Avatar video', c: true, o: false, k: false },
  { feature: 'Auto-dubbing (15+ langs)', c: true, o: false, k: false },
  { feature: 'Client review links', c: true, o: false, k: false },
  { feature: 'BYOK — zero AI markup', c: true, o: false, k: false },
  { feature: 'Zapier / Make webhooks', c: true, o: false, k: false },
]

const FAQS = [
  { q: 'What does BYOK mean?', a: 'Bring Your Own Key. You connect your own OpenAI, Anthropic, or Google AI key. All AI calls go through your key — we never charge a markup on AI usage.' },
  { q: 'How long does generation take?', a: 'Typically 15–30 seconds for all four platform drafts. Transcribing a 10-minute video takes ~45 seconds via Whisper.' },
  { q: 'Is there a free plan?', a: 'Yes — 3 content items and 10 outputs per month, forever. No credit card required.' },
  { q: 'Can I use it for client work?', a: 'Absolutely. Team and Agency plans include multi-client dashboards and shareable review links (clients don\'t need an account).' },
  { q: 'What input formats are supported?', a: 'MP4, MOV, WebM, AVI. Plus YouTube URLs, web article links, and direct text/script input.' },
]

export default function HomePage() {
  return (
    <>
      <style>{`
        :root { color-scheme: dark; }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        @keyframes gradient-x {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-fade-up { animation: fade-up 0.6s ease both; }
        .animate-fade-up-d1 { animation: fade-up 0.6s 0.1s ease both; }
        .animate-fade-up-d2 { animation: fade-up 0.6s 0.2s ease both; }
        .animate-fade-up-d3 { animation: fade-up 0.6s 0.35s ease both; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }

        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fb923c 100%);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-x 6s ease infinite;
        }

        .dot-grid {
          background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        .glass-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
        }

        .pill-btn-white {
          display: inline-flex; align-items: center; gap: 8px;
          height: 44px; padding: 0 28px; border-radius: 999px;
          background: #fff; color: #000;
          font-size: 14px; font-weight: 600; text-decoration: none;
          transition: opacity 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 40px rgba(139,92,246,0.25);
        }
        .pill-btn-white:hover {
          opacity: 0.92;
          box-shadow: 0 0 70px rgba(139,92,246,0.45);
        }
        .pill-btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          height: 44px; padding: 0 24px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.55);
          font-size: 14px; font-weight: 500; text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }
        .pill-btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: #fff; }

        .section-label {
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #a78bfa; margin-bottom: 14px;
        }
        .section-h2 {
          font-size: clamp(32px, 4.5vw, 54px);
          font-weight: 800; line-height: 1.05; letter-spacing: -0.03em;
          color: #fff;
        }
        .section-sub {
          font-size: 16px; line-height: 1.65;
          color: rgba(255,255,255,0.42); max-width: 520px;
        }

        .nav-link {
          font-size: 13px; color: rgba(255,255,255,0.42);
          text-decoration: none; transition: color 0.15s;
        }
        .nav-link:hover { color: #fff; }

        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] .faq-chevron { transform: rotate(180deg); }
        .faq-chevron { transition: transform 0.25s; }
      `}</style>

      <div style={{ background: '#050506', color: '#f0f0f2', fontFamily: 'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: '100vh' }}>

        {/* ══ NAV ══════════════════════════════════════════════════════ */}
        <header style={{
          position: 'fixed', inset: '0 0 auto 0', zIndex: 100, height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(5,5,6,0.8)', backdropFilter: 'blur(20px)',
        }}>
          <span style={{
            fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Clipflow
          </span>

          <nav style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 28 }} className="hidden-mobile">
            {[['#features','Features'],['#compare','Compare'],['#pricing','Pricing'],['#faq','FAQ']].map(([h,l]) => (
              <a key={h} href={h} className="nav-link">{l}</a>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/login" className="nav-link" style={{ display: 'none' }}>Sign in</Link>
            <Link href="/login" className="nav-link">Sign in</Link>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', height: 34,
              padding: '0 16px', borderRadius: 999, background: '#fff',
              color: '#000', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}>
              Get started
            </Link>
          </div>
        </header>

        {/* ══ HERO ═════════════════════════════════════════════════════ */}
        <section className="dot-grid" style={{
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 140, paddingBottom: 0, textAlign: 'center',
        }}>
          {/* Purple radial glow */}
          <div className="animate-pulse-glow" style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 900, height: 700, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.22) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />
          {/* Fade out dots at bottom */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent 60%, #050506 100%)',
          }} />

          {/* Badge */}
          <div className="animate-fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 999, marginBottom: 32,
            border: '1px solid rgba(167,139,250,0.25)',
            background: 'rgba(124,58,237,0.08)',
            fontSize: 13, color: 'rgba(167,139,250,0.9)',
            position: 'relative',
          }}>
            <Zap style={{ width: 13, height: 13, color: '#a78bfa' }} />
            BYOK — use your own AI key, zero markup
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-d1" style={{
            fontSize: 'clamp(52px, 9vw, 96px)',
            fontWeight: 800, lineHeight: 1.01, letterSpacing: '-0.04em',
            maxWidth: 900, padding: '0 24px',
          }}>
            One video.<br />
            <span className="gradient-text">Every platform.</span>
          </h1>

          {/* Sub */}
          <p className="animate-fade-up-d2" style={{
            fontSize: 18, lineHeight: 1.65, color: 'rgba(255,255,255,0.42)',
            maxWidth: 560, margin: '24px auto 0', padding: '0 24px',
          }}>
            Upload a clip, paste a YouTube link, or drop a script.
            Clipflow generates platform-native drafts for TikTok, Reels,
            Shorts, and LinkedIn — with AI subtitles, virality scoring, and scheduling.
            All in under a minute.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-d3" style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
            marginTop: 36,
          }}>
            <Link href="/signup" className="pill-btn-white">
              Start for free <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/login" className="pill-btn-ghost">
              Sign in
            </Link>
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            No credit card required · Free forever plan
          </p>

          {/* Platform pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 36 }}>
            {[
              { l: 'TikTok', bg: 'rgba(236,72,153,0.1)', c: '#f9a8d4', b: 'rgba(236,72,153,0.25)' },
              { l: 'Instagram Reels', bg: 'rgba(168,85,247,0.1)', c: '#d8b4fe', b: 'rgba(168,85,247,0.25)' },
              { l: 'YouTube Shorts', bg: 'rgba(239,68,68,0.1)', c: '#fca5a5', b: 'rgba(239,68,68,0.25)' },
              { l: 'LinkedIn', bg: 'rgba(59,130,246,0.1)', c: '#93c5fd', b: 'rgba(59,130,246,0.25)' },
            ].map((p) => (
              <span key={p.l} style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                background: p.bg, color: p.c, border: `1px solid ${p.b}`,
              }}>{p.l}</span>
            ))}
          </div>

          {/* ── Mockup ── */}
          <div className="animate-float" style={{
            position: 'relative', marginTop: 64, width: '100%', maxWidth: 1060,
            padding: '0 24px',
          }}>
            {/* Glow below mockup */}
            <div style={{
              position: 'absolute', bottom: -60, left: '50%', transform: 'translateX(-50%)',
              width: '80%', height: 200,
              background: 'radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.35) 0%, transparent 70%)',
              filter: 'blur(20px)', pointerEvents: 'none',
            }} />

            {/* Window */}
            <div style={{
              background: '#0d0d10', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            }}>
              {/* Chrome bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['rgba(255,96,96,0.6)','rgba(255,189,68,0.6)','rgba(78,205,78,0.6)'].map((c,i) => (
                  <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
                ))}
                <div style={{
                  flex: 1, margin: '0 12px', height: 24, borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'rgba(255,255,255,0.2)',
                }}>
                  clipflow.to/workspace/my-workspace/content/demo/outputs
                </div>
              </div>

              {/* App UI */}
              <div style={{ padding: '20px 20px 24px' }}>
                {/* Page header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>Product Demo Script.mp4</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>4 of 4 drafts generated · 24 seconds</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: 'rgba(52,211,153,0.12)', color: 'rgba(52,211,153,0.9)', border: '1px solid rgba(52,211,153,0.2)' }}>
                      ✓ All ready
                    </span>
                    <span style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                      Regenerate all
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {[
                    { p: 'TikTok', score: 94, sc: '#34d399', bg: 'rgba(236,72,153,0.08)', bb: 'rgba(236,72,153,0.18)', bc: '#f9a8d4', hook: '"POV: You\'re spending 8 hours editing one video 😭"', tags: ['Hook','Script','Caption'] },
                    { p: 'Instagram Reels', score: 89, sc: '#34d399', bg: 'rgba(168,85,247,0.08)', bb: 'rgba(168,85,247,0.18)', bc: '#d8b4fe', hook: '"The workflow saving creators 6+ hours a week ✨"', tags: ['Hook','Caption','Hashtags'] },
                    { p: 'YouTube Shorts', score: 85, sc: '#fbbf24', bg: 'rgba(239,68,68,0.08)', bb: 'rgba(239,68,68,0.18)', bc: '#fca5a5', hook: '"I automated my entire content pipeline — here\'s how"', tags: ['Title','Script','Desc'] },
                    { p: 'LinkedIn', score: 81, sc: '#fbbf24', bg: 'rgba(59,130,246,0.08)', bb: 'rgba(59,130,246,0.18)', bc: '#93c5fd', hook: '"Most creators waste 80% of their time on distribution. Here\'s what changed:"', tags: ['Post','Hashtags'] },
                  ].map((c) => (
                    <div key={c.p} style={{
                      background: c.bg, border: `1px solid ${c.bb}`,
                      borderRadius: 12, padding: '14px 14px 12px', textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c.bc, background: `${c.bb}`, padding: '3px 8px', borderRadius: 999 }}>{c.p}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.sc, fontVariantNumeric: 'tabular-nums' }}>
                          {c.score}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>/100</span>
                        </span>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.6)', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.hook}
                      </p>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {c.tags.map((t) => (
                          <span key={t} style={{ fontSize: 10, padding: '3px 7px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom page fade */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
              background: 'linear-gradient(to top, #050506, transparent)',
              pointerEvents: 'none',
            }} />
          </div>
        </section>

        {/* ══ STATS ════════════════════════════════════════════════════ */}
        <section style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.015)',
          padding: '40px 24px',
        }}>
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              { n: '16', label: 'AI-powered tools' },
              { n: '4', label: 'Platforms at once' },
              { n: '<30s', label: 'To generate drafts' },
              { n: '$0', label: 'AI markup, ever' },
            ].map((s, i) => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '8px 0',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}>
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>{s.n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══ SOCIAL PROOF ═════════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 40 }}>
              Trusted by creators & agencies worldwide
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { quote: '"Clipflow cut my production time from 6 hours to 20 minutes. It\'s genuinely insane how good the output quality is."', name: 'Sarah K.', role: 'Creator · 280k followers' },
                { quote: '"Finally a tool that writes LinkedIn posts that don\'t sound like AI slop. The brand voice feature is a game changer."', name: 'Marcus T.', role: 'B2B Agency Owner' },
                { quote: '"The BYOK model alone sold me. We\'re a team of 12 and the AI cost savings are hundreds of dollars a month."', name: 'Priya M.', role: 'Head of Content · Series A startup' },
              ].map((t) => (
                <div key={t.name} className="glass-card" style={{ borderRadius: 20, padding: '28px 28px 24px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} style={{ width: 13, height: 13, color: '#fbbf24', fill: '#fbbf24' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)' }}>{t.quote}</p>
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ═════════════════════════════════════════════ */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '100px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p className="section-label">How it works</p>
            <h2 className="section-h2">Raw content to published — in minutes</h2>
          </div>
          <div style={{
            maxWidth: 960, margin: '64px auto 0',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden',
          }}>
            {[
              { n: '01', t: 'Add your content', b: 'Upload a video, paste a YouTube URL, drop a web article link, or type a script. Whisper AI transcribes automatically.' },
              { n: '02', t: 'Generate all four drafts', b: 'Click generate. TikTok, Reels, Shorts, and LinkedIn — each with a hook, script, caption, and hashtags — in under 30 seconds.' },
              { n: '03', t: 'Review, approve & publish', b: 'Edit inline, share a client review link, approve, schedule, and export. Your entire workflow, in one place.' },
            ].map((s, i) => (
              <div key={s.n} style={{
                padding: '36px 32px',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                background: 'rgba(255,255,255,0.015)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)' }}>{s.n}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', margin: '12px 0 10px', color: '#fff' }}>{s.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.38)' }}>{s.b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ FEATURES ═════════════════════════════════════════════════ */}
        <section id="features" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '100px 24px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p className="section-label">Features</p>
            <h2 className="section-h2">Everything short-form content needs</h2>
            <p className="section-sub" style={{ margin: '16px auto 0' }}>16 AI-powered tools. One platform. Zero AI markup.</p>
          </div>

          {/* Big 3 spotlight features */}
          <div style={{ maxWidth: 1000, margin: '72px auto 0', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              {
                label: 'Core', tag: '#1 feature',
                title: 'Four platform drafts. One click.',
                desc: 'TikTok, Instagram Reels, YouTube Shorts, LinkedIn — all four generated simultaneously, each perfectly formatted for its platform. Hook, script, caption, hashtags — under 30 seconds.',
                icon: '⚡',
                stats: [{ n: '4', l: 'Platforms' }, { n: '<30s', l: 'Generation' }, { n: '100%', l: 'Platform-native' }],
                color: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.15)',
              },
              {
                label: 'AI', tag: 'Intelligent',
                title: 'Brand voice that sounds like you.',
                desc: 'Set your tone, define keywords to avoid, and paste in example hooks. Every single AI draft matches your unique voice — not a generic template that could be from anyone.',
                icon: '🎙️',
                stats: [{ n: '∞', l: 'Variations' }, { n: 'Your', l: 'Exact tone' }, { n: '0', l: 'Generic output' }],
                color: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.12)',
              },
              {
                label: 'Monetize', tag: 'Agency-ready',
                title: 'Client review links. No login needed.',
                desc: 'Share a review link with clients — they can leave comments on each output without creating an account. Multi-client dashboard for agencies managing multiple brands.',
                icon: '👥',
                stats: [{ n: 'Zero', l: 'Client friction' }, { n: 'Multi', l: 'Client dashboard' }, { n: '1', l: 'Link per review' }],
                color: 'rgba(52,211,153,0.07)', border: 'rgba(52,211,153,0.12)',
              },
            ].map((f) => (
              <div key={f.title} style={{
                display: 'flex', alignItems: 'center', gap: 48,
                padding: '40px 40px',
                background: f.color, border: `1px solid ${f.border}`,
                borderRadius: 20,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 24 }}>{f.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>{f.label}</span>
                  </div>
                  <h3 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: 12 }}>{f.title}</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.42)', maxWidth: 460 }}>{f.desc}</p>
                </div>
                <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                  {f.stats.map((s) => (
                    <div key={s.l} style={{ textAlign: 'center', minWidth: 64 }}>
                      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#fff' }}>{s.n}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, whiteSpace: 'nowrap' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 4-col grid for remaining */}
          <div style={{
            maxWidth: 1000, margin: '3px auto 0',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3,
          }}>
            {[
              { icon: '🎬', t: 'Animated subtitles', d: 'Word-level captions via Whisper. 3 animation styles. Export SRT/VTT.' },
              { icon: '🎥', t: 'AI B-Roll (Pexels)', d: 'AI finds matching stock footage from your script keywords. One click.' },
              { icon: '🔥', t: 'Virality score', d: 'AI scores hook strength, scroll-stop power, and shareability before you post.' },
              { icon: '✂️', t: 'Auto clip finder', d: 'AI finds the 3–5 most viral moments in your transcript. No scrubbing.' },
              { icon: '📅', t: 'Social scheduler', d: 'Schedule to TikTok, Instagram, LinkedIn. Color-coded content calendar.' },
              { icon: '🌍', t: 'Auto-dubbing (15+ langs)', d: 'Translate & dub via ElevenLabs. Spanish, French, German, Japanese, and more.' },
              { icon: '🎯', t: 'A/B hook testing', d: '3 hook variants per output. Different psychological triggers. Track what wins.' },
              { icon: '🔑', t: 'BYOK — zero markup', d: 'Your own OpenAI, Anthropic, or Google key. Pay your provider at cost.' },
            ].map((f) => (
              <div key={f.t} className="glass-card" style={{ padding: '28px 24px', transition: 'all 0.2s', cursor: 'default' }}>
                <span style={{ fontSize: 22, display: 'block', marginBottom: 14 }}>{f.icon}</span>
                <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: '#fff', marginBottom: 8 }}>{f.t}</p>
                <p style={{ fontSize: 12.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.36)' }}>{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ COMPARE ══════════════════════════════════════════════════ */}
        <section id="compare" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '100px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p className="section-label">Compare</p>
              <h2 className="section-h2">More features. Less cost.</h2>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Feature</th>
                    <th style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Clipflow
                      </span>
                    </th>
                    <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>OpusClip</th>
                    <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Klap</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((r, i) => (
                    <tr key={r.feature} style={{ borderBottom: i < COMPARISON.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                      <td style={{ padding: '13px 24px', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{r.feature}</td>
                      <td style={{ padding: '13px 24px', textAlign: 'center' }}>
                        {r.c ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(139,92,246,0.15)' }}><Check style={{ width: 12, height: 12, color: '#a78bfa' }} /></span> : <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.12)', margin: '0 auto', display: 'block' }} />}
                      </td>
                      <td style={{ padding: '13px 24px', textAlign: 'center' }}>
                        {r.o ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.12)' }}><Check style={{ width: 12, height: 12, color: '#34d399' }} /></span> : <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.12)', margin: '0 auto', display: 'block' }} />}
                      </td>
                      <td style={{ padding: '13px 24px', textAlign: 'center' }}>
                        {r.k ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(52,211,153,0.12)' }}><Check style={{ width: 12, height: 12, color: '#34d399' }} /></span> : <X style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.12)', margin: '0 auto', display: 'block' }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ PRICING ══════════════════════════════════════════════════ */}
        <section id="pricing" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '100px 24px' }}>
          <div style={{ maxWidth: 1020, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <p className="section-label">Pricing</p>
              <h2 className="section-h2">Simple, transparent pricing</h2>
              <p className="section-sub" style={{ margin: '16px auto 0', textAlign: 'center' }}>
                Bring your own AI key — you pay your provider at cost. Zero markup, ever.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { name: 'Free', price: '$0', period: '/forever', desc: 'Try it out.', features: ['3 content items / mo', '10 outputs / mo', '1 workspace', 'All 4 platforms'], cta: 'Get started', highlight: false },
                { name: 'Solo', price: '$19', period: '/month', desc: 'For individual creators.', features: ['20 content items / mo', '100 outputs / mo', '1 workspace', 'Brand voice', 'Client review links'], cta: 'Start free trial', highlight: true },
                { name: 'Team', price: '$49', period: '/month', desc: 'For content teams.', features: ['100 content items / mo', '500 outputs / mo', '5 workspaces', 'Team members', 'Everything in Solo'], cta: 'Start free trial', highlight: false },
                { name: 'Agency', price: '$99', period: '/month', desc: 'Unlimited everything.', features: ['Unlimited content', 'Unlimited outputs', 'Unlimited workspaces', 'Priority support', 'Everything in Team'], cta: 'Contact us', highlight: false },
              ].map((plan) => (
                <div key={plan.name} style={{
                  position: 'relative', display: 'flex', flexDirection: 'column',
                  padding: '28px 24px', borderRadius: 20,
                  background: plan.highlight ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)',
                  border: plan.highlight ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: plan.highlight ? '0 0 60px rgba(124,58,237,0.15)' : 'none',
                }}>
                  {plan.highlight && (
                    <div style={{
                      position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
                      color: '#fff', fontSize: 11, fontWeight: 600,
                      padding: '4px 14px', borderRadius: '0 0 10px 10px',
                      whiteSpace: 'nowrap',
                    }}>Most popular</div>
                  )}
                  <div style={{ marginTop: plan.highlight ? 16 : 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700 }}>{plan.name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>{plan.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '20px 0' }}>
                    <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.04em' }}>{plan.price}</span>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{plan.period}</span>
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                        <Check style={{ width: 13, height: 13, color: '#34d399', marginTop: 2, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 40, borderRadius: 999, marginTop: 24,
                    fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s',
                    background: plan.highlight ? 'linear-gradient(135deg, #7c3aed, #c026d3)' : 'rgba(255,255,255,0.06)',
                    color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.6)',
                    border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.09)',
                  }}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══════════════════════════════════════════════════════ */}
        <section id="faq" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '100px 24px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p className="section-label">FAQ</p>
              <h2 className="section-h2">Common questions</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FAQS.map((f) => (
                <details key={f.q} style={{
                  borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.02)', overflow: 'hidden',
                }}>
                  <summary style={{
                    padding: '20px 24px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 15, fontWeight: 500, userSelect: 'none',
                  }}>
                    {f.q}
                    <ChevronDown className="faq-chevron" style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  </summary>
                  <div style={{ padding: '0 24px 20px', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.42)' }}>
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ════════════════════════════════════════════════ */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '120px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.18) 0%, transparent 60%)',
          }} />
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.02 }}>
              Stop copy-pasting.{' '}
              <span className="gradient-text">Start publishing.</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '20px auto 0' }}>
              Free to start. Bring your own API key — pay your AI provider directly. Zero markup.
            </p>
            <div style={{ marginTop: 40, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" className="pill-btn-white" style={{ fontSize: 15, height: 48, padding: '0 32px' }}>
                Create free account <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
            <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
              No credit card required · 3 content items free forever
            </p>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════ */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '56px 24px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Clipflow
                </span>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 8, maxWidth: 280, lineHeight: 1.6 }}>
                  AI-powered content repurposing for creators & agencies. One video — every platform.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Product</p>
                  {[['#features','Features'],['#pricing','Pricing'],['#compare','Compare'],['#faq','FAQ']].map(([h,l]) => (
                    <a key={h} href={h} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }} className="nav-link">{l}</a>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Account</p>
                  <Link href="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }} className="nav-link">Sign in</Link>
                  <Link href="/signup" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }} className="nav-link">Sign up free</Link>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
              © {new Date().getFullYear()} Clipflow. All rights reserved.
            </div>
          </div>
        </footer>

      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Clipflow', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
        url: 'https://clipflow.to',
        description: 'AI-powered content repurposing. One video → TikTok, Reels, Shorts & LinkedIn in seconds.',
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
          { '@type': 'Offer', price: '19', priceCurrency: 'USD', name: 'Solo' },
          { '@type': 'Offer', price: '49', priceCurrency: 'USD', name: 'Team' },
          { '@type': 'Offer', price: '99', priceCurrency: 'USD', name: 'Agency' },
        ],
      })}} />
    </>
  )
}
