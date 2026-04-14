import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, X, ChevronDown, Play, Star, Zap, Video, PenTool, BarChart3, Globe, Calendar, Mic, Hash, Users, Gift } from 'lucide-react'

import { normalizeReferralCode } from '@/lib/referrals/normalize-code'
import { lookupReferrerUserId } from '@/lib/referrals/lookup-referrer'
import { REFERRAL_DISCOUNT_PERCENT } from '@/lib/referrals/constants'

export const metadata: Metadata = {
  title: 'Clipflow — AI Video Repurposing · TikTok, Reels, Shorts & LinkedIn',
  description: 'Turn one video into platform-native content. AI subtitles, B-Roll, virality scoring, video clipping. BYOK — zero AI markup.',
  alternates: { canonical: 'https://clipflow.to' },
}

interface HomePageProps {
  searchParams: { ref?: string; source?: string }
}

const COMP = [
  { f:'All 4 platform drafts at once', c:true, o:false, k:false },
  { f:'Burn captions onto video', c:true, o:true, k:true },
  { f:'Brand voice + AI persona', c:true, o:false, k:false },
  { f:'Virality scoring', c:true, o:true, k:false },
  { f:'AI B-Roll assembly', c:true, o:'Beta', k:false },
  { f:'Content DNA analyzer', c:true, o:false, k:false },
  { f:'30-day content calendar', c:true, o:false, k:false },
  { f:'Creator search (5 platforms)', c:true, o:false, k:false },
  { f:'BYOK — zero AI markup', c:true, o:false, k:false },
]

const FAQ = [
  { q:'What does BYOK mean?', a:'Bring Your Own Key. Connect your OpenAI, Anthropic, or Google key. All AI calls go through your key at cost — we never charge a markup.' },
  { q:'How is this different from OpusClip?', a:'OpusClip focuses on video clipping. Clipflow does that PLUS 30+ AI tools: content strategy, newsletters, carousels, creator research, and full video rendering.' },
  { q:'Can I render real videos?', a:'Yes. We render real MP4s via Shotstack — burn captions, stitch B-Roll with voiceover, add brand intros/outros. All cloud-rendered.' },
  { q:'Is there a free plan?', a:'Yes — 3 content items and 10 outputs per month, forever. No credit card required.' },
  { q:'Can I use it for client work?', a:'Absolutely. Team and Agency plans include multi-client dashboards, white-label review portals, and unlimited workspaces.' },
]

export default async function HomePage({ searchParams }: HomePageProps) {
  // Confirm the ref code resolves to a real user before showing the
  // banner. Typo-in-URL or stale codes silently pass through — no banner.
  const refCode = normalizeReferralCode(searchParams.ref)
  const hasValidRef = refCode ? Boolean(await lookupReferrerUserId(refCode)) : false
  const signupHref = hasValidRef
    ? `/signup?ref=${refCode}${searchParams.source ? `&source=${encodeURIComponent(searchParams.source)}` : ''}`
    : '/signup'

  return (
    <>
      <style>{`
        @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
        .mq { animation:marquee 30s linear infinite }
        details summary { list-style:none } details summary::-webkit-details-marker { display:none }
        details[open] .chv { transform:rotate(180deg) } .chv { transition:transform .2s }

        /* Mobile-first responsive overrides for the inline-styled grids.
           Hitting 768px (tablet) and 480px (phone) collapses multi-column
           grids into stacks, shrinks hero type, and relaxes padding so the
           page is actually usable below the original desktop-only design. */
        @media (max-width: 768px) {
          .lp-grid-3  { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-grid-4  { grid-template-columns: repeat(2, 1fr) !important; }
          .lp-hide-sm { display: none !important; }
          .lp-nav     { padding: 0 16px !important; }
          .lp-hero-h  { font-size: 36px !important; }
          .lp-hero    { padding: 40px 16px 24px !important; }
          .lp-section { padding: 48px 16px !important; }
          .lp-compare-wrap { overflow-x: auto; }
        }
        @media (max-width: 768px) {
          .lp-grid-refer { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
        @media (max-width: 480px) {
          .lp-grid-3  { grid-template-columns: 1fr !important; }
          .lp-grid-4  { grid-template-columns: 1fr !important; }
          .lp-hero-h  { font-size: 30px !important; }
          .lp-hero-p  { font-size: 16px !important; }
          .lp-byok    { flex-direction: column; align-items: flex-start !important; gap: 16px !important; padding: 24px !important; }
          .lp-cta-buttons { flex-direction: column; width: 100%; }
          .lp-cta-buttons > a { width: 100%; justify-content: center; }
        }
      `}</style>

      <div style={{ background:'#fff', color:'#111', minHeight:'100vh', fontFamily:'var(--font-inter),-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

        {/* ══ REFERRAL RIBBON — shown only on valid ?ref= ══════ */}
        {hasValidRef ? (
          <div style={{ background:'linear-gradient(90deg,#10b981,#059669)', color:'#fff', padding:'10px 24px', textAlign:'center', fontSize:14, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
            <Gift style={{ width:16, height:16 }} />
            You were invited — your {REFERRAL_DISCOUNT_PERCENT}% discount applies automatically at checkout.
          </div>
        ) : null}

        {/* ══ NAV ═══════════════════════════════════════════════ */}
        <header className="lp-nav" style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 40px', height:64, borderBottom:'1px solid #eee', background:'rgba(255,255,255,.97)', backdropFilter:'blur(8px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:36 }}>
            <Link href="/" style={{ fontSize:20, fontWeight:800, color:'#7c3aed', textDecoration:'none', letterSpacing:'-.02em' }}>Clipflow</Link>
            <nav className="lp-hide-sm" style={{ display:'flex', gap:28 }}>
              {([
                ['#features','Features'],
                ['#pricing','Pricing'],
                ['#referrals','Refer'],
                ['#compare','Compare'],
                ['#faq','FAQ'],
              ] as [string, string][]).map(([h,l])=>(
                <a key={h} href={h} style={{ fontSize:15, color:'#555', textDecoration:'none', fontWeight:500 }}>{l}</a>
              ))}
            </nav>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Link href="/login" className="lp-hide-sm" style={{ fontSize:14, fontWeight:500, color:'#555', textDecoration:'none', padding:'8px 16px', borderRadius:8, border:'1px solid #e5e5e5' }}>Log in</Link>
            <Link href={signupHref} style={{ fontSize:14, fontWeight:600, color:'#fff', textDecoration:'none', padding:'8px 20px', borderRadius:8, background:'#7c3aed' }}>Try for free</Link>
          </div>
        </header>

        <main>

          {/* ══ HERO ════════════════════════════════════════════ */}
          <section className="lp-hero" style={{ textAlign:'center', padding:'56px 24px 40px', background:'linear-gradient(180deg,#f5f0ff 0%,#fff 100%)' }}>
            <div style={{ maxWidth:700, margin:'0 auto' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 16px', borderRadius:999, background:'#ede9fe', fontSize:14, fontWeight:600, color:'#7c3aed', marginBottom:20 }}>
                <Zap style={{ width:14, height:14 }} /> Now with AI video rendering
              </div>

              <h1 className="lp-hero-h" style={{ fontSize:52, fontWeight:800, lineHeight:1.1, letterSpacing:'-.03em', color:'#111' }}>
                Turn one video into content for <span style={{ color:'#7c3aed' }}>every platform</span>
              </h1>

              <p className="lp-hero-p" style={{ fontSize:18, lineHeight:1.6, color:'#555', maxWidth:520, margin:'16px auto 0' }}>
                Paste a YouTube link. Get TikTok, Reels, Shorts &amp; LinkedIn drafts — with AI subtitles, B-Roll, and virality scoring. Real MP4 rendering included.
              </p>

              <div className="lp-cta-buttons" style={{ display:'flex', gap:12, justifyContent:'center', marginTop:28 }}>
                <Link href={signupHref} style={{ display:'inline-flex', alignItems:'center', gap:8, height:52, padding:'0 32px', borderRadius:12, background:'#7c3aed', color:'#fff', fontSize:17, fontWeight:600, textDecoration:'none', boxShadow:'0 4px 16px rgba(124,58,237,.3)' }}>
                  Start for free <ArrowRight style={{ width:18, height:18 }} />
                </Link>
                <Link href="#features" style={{ display:'inline-flex', alignItems:'center', gap:8, height:52, padding:'0 28px', borderRadius:12, border:'2px solid #e5e5e5', color:'#555', fontSize:17, fontWeight:500, textDecoration:'none' }}>
                  <Play style={{ width:16, height:16 }} /> See features
                </Link>
              </div>
              <p style={{ marginTop:10, fontSize:14, color:'#999' }}>No credit card required · Free forever</p>

              {/* Social proof */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginTop:24 }}>
                <div style={{ display:'flex' }}>
                  {['#7c3aed','#ec4899','#f97316','#10b981','#0ea5e9'].map((c,i)=>(
                    <div key={i} style={{ width:32, height:32, borderRadius:'50%', background:c, border:'3px solid #fff', marginLeft:i>0?-10:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                      {['S','M','P','J','L'][i]}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize:15, color:'#555' }}>Trusted by <strong style={{ color:'#111' }}>2,400+</strong> creators</span>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(i=><Star key={i} style={{ width:16, height:16, fill:'#facc15', color:'#facc15' }} />)}
                </div>
              </div>
            </div>

            {/* Mockup */}
            <div style={{ marginTop:40, maxWidth:880, marginLeft:'auto', marginRight:'auto' }}>
              <div style={{ borderRadius:16, border:'1px solid #e0e0e0', boxShadow:'0 24px 48px rgba(0,0,0,.08)', overflow:'hidden', background:'#0e0e12' }}>
                <div style={{ display:'flex', alignItems:'center', height:38, padding:'0 14px', gap:7, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  {['#ff5f57','#febc2e','#28c840'].map((c,i)=>(<span key={i} style={{ width:11, height:11, borderRadius:'50%', background:c }} />))}
                  <div style={{ flex:1, height:22, borderRadius:6, margin:'0 36px', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'rgba(255,255,255,.2)' }}>clipflow.to</div>
                </div>
                <div style={{ display:'flex', minHeight:280 }}>
                  <div style={{ width:140, flexShrink:0, background:'#111116', borderRight:'1px solid rgba(255,255,255,.06)', padding:'12px 8px' }}>
                    {['Dashboard','Pipeline','Calendar','Ghostwriter','All Tools','Trends'].map((n,i)=>(
                      <div key={n} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 8px', borderRadius:6, marginBottom:1, background:i===4?'rgba(124,58,237,.15)':'transparent' }}>
                        <span style={{ fontSize:11, color:i===4?'#a78bfa':'rgba(255,255,255,.25)' }}>{'◈▤◷✦🔮📈'[i]}</span>
                        <span style={{ fontSize:11.5, color:i===4?'#e8e8e8':'rgba(255,255,255,.35)', fontWeight:i===4?500:400 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex:1, padding:'14px 16px', background:'#0e0e12' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:600, color:'#fff' }}>Product Demo.mp4</p>
                        <p style={{ fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>4 drafts generated · 24 seconds · gpt-4o</p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, padding:'4px 10px', borderRadius:999, background:'rgba(52,211,153,.12)', color:'#34d399', border:'1px solid rgba(52,211,153,.2)' }}>✓ Ready</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { p:'TikTok', s:94, bg:'rgba(236,72,153,.07)', b:'rgba(236,72,153,.15)', c:'#f9a8d4', h:'"POV: You spend 8 hours editing one video 😭"' },
                        { p:'Instagram Reels', s:89, bg:'rgba(168,85,247,.07)', b:'rgba(168,85,247,.15)', c:'#d8b4fe', h:'"The workflow saving creators 6+ hours a week"' },
                        { p:'YouTube Shorts', s:85, bg:'rgba(239,68,68,.07)', b:'rgba(239,68,68,.15)', c:'#fca5a5', h:'"I automated my entire content pipeline"' },
                        { p:'LinkedIn', s:81, bg:'rgba(59,130,246,.07)', b:'rgba(59,130,246,.15)', c:'#93c5fd', h:'"80% of creators waste time on distribution"' },
                      ].map(c=>(
                        <div key={c.p} style={{ padding:'10px 12px', borderRadius:8, background:c.bg, border:`1px solid ${c.b}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:999, background:c.b, color:c.c }}>{c.p}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:c.s>88?'#34d399':'#fbbf24' }}>{c.s}<span style={{ fontSize:9, color:'rgba(255,255,255,.2)', fontWeight:400 }}>/100</span></span>
                          </div>
                          <p style={{ fontSize:11, lineHeight:1.5, color:'rgba(255,255,255,.55)' }}>{c.h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══ LOGOS ═══════════════════════════════════════════ */}
          <section style={{ padding:'28px 24px', borderBottom:'1px solid #f0f0f0' }}>
            <p style={{ textAlign:'center', fontSize:13, fontWeight:600, color:'#bbb', marginBottom:14, textTransform:'uppercase', letterSpacing:'.05em' }}>Powered by</p>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:44, flexWrap:'wrap' }}>
              {['OpenAI','Anthropic','Google Gemini','ElevenLabs','Shotstack','Pexels'].map(n=>(
                <span key={n} style={{ fontSize:15, fontWeight:700, color:'#ccc' }}>{n}</span>
              ))}
            </div>
          </section>

          {/* ══ FEATURES ═══════════════════════════════════════ */}
          <section id="features" className="lp-section" style={{ padding:'72px 24px' }}>
            <div style={{ maxWidth:1000, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:48 }}>
                <p style={{ fontSize:15, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>30+ AI Tools</p>
                <h2 style={{ fontSize:40, fontWeight:800, lineHeight:1.12, letterSpacing:'-.025em', color:'#111' }}>Everything you need to repurpose content</h2>
                <p style={{ fontSize:17, color:'#666', marginTop:10, maxWidth:500, marginLeft:'auto', marginRight:'auto' }}>From strategy to publishing — one platform replaces your entire content workflow.</p>
              </div>

              <div className="lp-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }}>
                {[
                  { icon:Video, color:'#7c3aed', bg:'#f0ebff', title:'Video Rendering', desc:'Burn captions, stitch B-Roll, clip segments, add brand intros. Real MP4 output via Shotstack.' },
                  { icon:Zap, color:'#f59e0b', bg:'#fffbeb', title:'4 Platform Drafts', desc:'TikTok, Reels, Shorts, LinkedIn — all generated simultaneously in under 30 seconds.' },
                  { icon:PenTool, color:'#ec4899', bg:'#fdf2f8', title:'AI Ghostwriter', desc:'Full video scripts from a topic or trend. Brand voice and persona applied automatically.' },
                  { icon:BarChart3, color:'#10b981', bg:'#ecfdf5', title:'Virality Score', desc:'AI scores every output on hook strength, scroll-stop power, and shareability.' },
                  { icon:Mic, color:'#8b5cf6', bg:'#f5f3ff', title:'AI Persona', desc:'Give the AI a name, backstory, expertise, and writing style. Every draft sounds like them.' },
                  { icon:Calendar, color:'#0ea5e9', bg:'#f0f9ff', title:'30-Day Calendar', desc:'Input your niche → AI generates a full month of content with hooks and scripts.' },
                  { icon:Users, color:'#f97316', bg:'#fff7ed', title:'Creator Search', desc:'Find creators on YouTube, TikTok, Instagram, Twitter, LinkedIn. Analyze their stats.' },
                  { icon:Hash, color:'#06b6d4', bg:'#ecfeff', title:'Hashtag Research', desc:'Data-driven analysis with reach estimates, competition levels, and ready-to-use sets.' },
                  { icon:Globe, color:'#6366f1', bg:'#eef2ff', title:'24 Integrations', desc:'Slack, Discord, WordPress, Beehiiv, Notion, Airtable, Zapier, Make, and more.' },
                ].map((f,i)=>(
                  <div key={i} style={{ padding:'28px', borderRadius:16, border:'1px solid #f0f0f0', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.04)', transition:'all .2s' }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                      <f.icon style={{ width:24, height:24, color:f.color }} />
                    </div>
                    <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8, color:'#111' }}>{f.title}</h3>
                    <p style={{ fontSize:15, lineHeight:1.6, color:'#666' }}>{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* BYOK */}
              <div className="lp-byok" style={{ marginTop:20, padding:'32px 40px', borderRadius:16, background:'linear-gradient(135deg,#7c3aed,#6366f1)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:32, boxShadow:'0 8px 24px rgba(124,58,237,.2)' }}>
                <div>
                  <h3 style={{ fontSize:22, fontWeight:800, color:'#fff' }}>BYOK — Bring Your Own Key</h3>
                  <p style={{ fontSize:16, color:'rgba(255,255,255,.85)', marginTop:8, maxWidth:500 }}>Connect your own OpenAI, Anthropic, or Google key. All AI at cost — zero markup. Saves teams $200+/month.</p>
                </div>
                <Link href={signupHref} style={{ display:'inline-flex', alignItems:'center', gap:8, height:48, padding:'0 28px', borderRadius:12, background:'#fff', color:'#7c3aed', fontSize:16, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0, boxShadow:'0 2px 8px rgba(0,0,0,.1)' }}>Try free <ArrowRight style={{ width:16, height:16 }} /></Link>
              </div>
            </div>
          </section>

          {/* ══ TESTIMONIALS ════════════════════════════════════ */}
          <section style={{ padding:'48px 0', background:'#fafafa', borderTop:'1px solid #f0f0f0', borderBottom:'1px solid #f0f0f0', overflow:'hidden' }}>
            <p style={{ textAlign:'center', fontSize:15, fontWeight:700, color:'#999', marginBottom:24 }}>What creators are saying</p>
            <div style={{ display:'flex', width:'max-content' }} className="mq">
              {[...Array(2)].map((_,si)=>(
                <div key={si} style={{ display:'flex', gap:16, paddingRight:16 }}>
                  {[
                    { q:'"Cut my production time by 90%. This thing is insane."', n:'Sarah K.', r:'Creator · 280K followers' },
                    { q:'"LinkedIn posts that actually sound human. Finally."', n:'Marcus T.', r:'B2B Agency Owner' },
                    { q:'"BYOK saves us over $400 per month on AI costs."', n:'Priya M.', r:'Head of Content' },
                    { q:'"The Content DNA feature changed how I plan content."', n:'Jake R.', r:'YouTuber · 150K subs' },
                    { q:'"30 AI tools in one place. No more switching apps."', n:'Omar S.', r:'Freelance Creator' },
                    { q:'"Finally real video rendering, not just text outputs."', n:'Lisa C.', r:'Social Media Manager' },
                  ].map(t=>(
                    <div key={t.n} style={{ minWidth:320, padding:'24px', borderRadius:16, background:'#fff', border:'1px solid #f0f0f0', boxShadow:'0 2px 6px rgba(0,0,0,.03)' }}>
                      <div style={{ display:'flex', gap:2, marginBottom:12 }}>{[1,2,3,4,5].map(i=><Star key={i} style={{ width:14, height:14, fill:'#facc15', color:'#facc15' }} />)}</div>
                      <p style={{ fontSize:16, fontWeight:500, color:'#222', marginBottom:14, lineHeight:1.5 }}>{t.q}</p>
                      <p style={{ fontSize:14, color:'#888' }}><strong style={{ color:'#444' }}>{t.n}</strong> · {t.r}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ══ COMPARE ════════════════════════════════════════ */}
          <section id="compare" className="lp-section" style={{ padding:'72px 24px' }}>
            <div style={{ maxWidth:720, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:40 }}>
                <p style={{ fontSize:15, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>Compare</p>
                <h2 style={{ fontSize:36, fontWeight:800, letterSpacing:'-.02em', color:'#111' }}>More tools. Real video. Zero markup.</h2>
              </div>
              <div className="lp-compare-wrap" style={{ borderRadius:16, border:'1px solid #eee', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #f0f0f0', background:'#fafafa' }}>
                      <th style={{ padding:'14px 20px', textAlign:'left', fontSize:14, fontWeight:600, color:'#888' }}>Feature</th>
                      <th style={{ padding:'14px 20px', textAlign:'center', fontSize:14, fontWeight:800, color:'#7c3aed' }}>Clipflow</th>
                      <th style={{ padding:'14px 20px', textAlign:'center', fontSize:14, fontWeight:600, color:'#888' }}>OpusClip</th>
                      <th style={{ padding:'14px 20px', textAlign:'center', fontSize:14, fontWeight:600, color:'#888' }}>Klap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMP.map((r,i)=>(
                      <tr key={r.f} style={{ borderBottom:i<COMP.length-1?'1px solid #f5f5f5':'none' }}>
                        <td style={{ padding:'12px 20px', fontSize:14, color:'#555' }}>{r.f}</td>
                        {[r.c,r.o,r.k].map((v,j)=>(
                          <td key={j} style={{ padding:'12px 20px', textAlign:'center' }}>
                            {v===true?<Check style={{ width:18, height:18, color:'#7c3aed', margin:'0 auto' }} />:v===false?<X style={{ width:18, height:18, color:'#ddd', margin:'0 auto' }} />:<span style={{ fontSize:12, color:'#999', fontWeight:500 }}>{v}</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ══ PRICING ═══════════════════════════════════════ */}
          <section id="pricing" className="lp-section" style={{ padding:'72px 24px', background:'#fafafa', borderTop:'1px solid #f0f0f0' }}>
            <div style={{ maxWidth:960, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:48 }}>
                <p style={{ fontSize:15, fontWeight:700, color:'#7c3aed', marginBottom:6 }}>Pricing</p>
                <h2 style={{ fontSize:36, fontWeight:800, letterSpacing:'-.02em', color:'#111' }}>Start free. Scale when ready.</h2>
                <p style={{ fontSize:16, color:'#666', marginTop:8 }}>BYOK — pay your AI provider at cost. Zero markup.</p>
              </div>
              <div className="lp-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                {[
                  { n:'Free', p:'$0', per:'/forever', d:'Try it out.', f:['3 content/mo','10 outputs/mo','1 workspace','All AI tools'], cta:'Get started', hl:false },
                  { n:'Solo', p:'$19', per:'/mo', d:'For creators.', f:['20 content/mo','100 outputs/mo','Brand voice + persona','Video rendering','Review links'], cta:'Start trial', hl:true },
                  { n:'Team', p:'$49', per:'/mo', d:'For teams.', f:['100 content/mo','500 outputs/mo','5 workspaces','Team members','Everything in Solo'], cta:'Start trial', hl:false },
                  { n:'Agency', p:'$99', per:'/mo', d:'Unlimited.', f:['Unlimited content','Unlimited outputs','White-label portals','API access','Priority support'], cta:'Contact us', hl:false },
                ].map(plan=>(
                  <div key={plan.n} style={{ position:'relative', display:'flex', flexDirection:'column', padding:'28px 24px', borderRadius:16, background:'#fff', border:plan.hl?'2px solid #7c3aed':'1px solid #eee', boxShadow:plan.hl?'0 8px 32px rgba(124,58,237,.12)':'0 1px 3px rgba(0,0,0,.04)' }}>
                    {plan.hl&&<div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)', background:'#7c3aed', color:'#fff', fontSize:12, fontWeight:700, padding:'4px 16px', borderRadius:'0 0 10px 10px' }}>Most popular</div>}
                    <p style={{ fontSize:18, fontWeight:700, marginTop:plan.hl?14:0, color:'#111' }}>{plan.n}</p>
                    <p style={{ fontSize:14, color:'#888', marginTop:2 }}>{plan.d}</p>
                    <div style={{ display:'flex', alignItems:'baseline', gap:4, margin:'20px 0' }}>
                      <span style={{ fontSize:44, fontWeight:800, letterSpacing:'-.04em', color:'#111' }}>{plan.p}</span>
                      <span style={{ fontSize:15, color:'#888' }}>{plan.per}</span>
                    </div>
                    <ul style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                      {plan.f.map(f=>(
                        <li key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#555' }}>
                          <Check style={{ width:16, height:16, color:'#10b981', flexShrink:0 }} />{f}
                        </li>
                      ))}
                    </ul>
                    <Link href={signupHref} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:44, borderRadius:10, marginTop:24, fontSize:15, fontWeight:600, textDecoration:'none', background:plan.hl?'#7c3aed':'#fff', color:plan.hl?'#fff':'#555', border:plan.hl?'none':'1.5px solid #e5e5e5' }}>{plan.cta}</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ REFERRALS ═════════════════════════════════════ */}
          <section id="referrals" className="lp-section" style={{ padding:'72px 24px' }}>
            <div style={{ maxWidth:860, margin:'0 auto' }}>
              <div style={{ position:'relative', borderRadius:24, background:'linear-gradient(135deg,#10b981 0%,#059669 100%)', padding:'56px 48px', color:'#fff', overflow:'hidden', boxShadow:'0 16px 48px rgba(16,185,129,.2)' }}>
                {/* Decorative blob */}
                <div aria-hidden style={{ position:'absolute', top:-80, right:-80, width:260, height:260, borderRadius:'50%', background:'rgba(255,255,255,.1)', filter:'blur(40px)' }} />
                <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr auto', gap:40, alignItems:'center' }} className="lp-grid-refer">
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background:'rgba(255,255,255,.2)', fontSize:13, fontWeight:700, marginBottom:14 }}>
                      <Gift style={{ width:14, height:14 }} /> Refer &amp; earn
                    </div>
                    <h2 style={{ fontSize:36, fontWeight:800, letterSpacing:'-.02em', lineHeight:1.15 }}>
                      Give {REFERRAL_DISCOUNT_PERCENT}%, get {REFERRAL_DISCOUNT_PERCENT}%.
                      Forever.
                    </h2>
                    <p style={{ fontSize:17, color:'rgba(255,255,255,.9)', marginTop:14, maxWidth:460, lineHeight:1.55 }}>
                      When a friend signs up through your link and picks any paid plan,
                      they get {REFERRAL_DISCOUNT_PERCENT}% off — and so do you, for as
                      long as the subscription runs.
                    </p>
                    <div style={{ display:'flex', gap:20, marginTop:22, fontSize:14, color:'rgba(255,255,255,.85)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Check style={{ width:16, height:16 }} /> No cap on referrals
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Check style={{ width:16, height:16 }} /> Stacks with annual pricing
                      </div>
                    </div>
                  </div>
                  <Link href={signupHref} style={{ display:'inline-flex', alignItems:'center', gap:8, height:52, padding:'0 28px', borderRadius:12, background:'#fff', color:'#059669', fontSize:16, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0, boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
                    Get your link <ArrowRight style={{ width:16, height:16 }} />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ══ FAQ ════════════════════════════════════════════ */}
          <section id="faq" className="lp-section" style={{ padding:'72px 24px' }}>
            <div style={{ maxWidth:620, margin:'0 auto' }}>
              <h2 style={{ textAlign:'center', fontSize:32, fontWeight:800, letterSpacing:'-.02em', marginBottom:36, color:'#111' }}>Frequently asked questions</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {FAQ.map(f=>(
                  <details key={f.q} style={{ borderRadius:12, border:'1px solid #eee', background:'#fff' }}>
                    <summary style={{ padding:'18px 24px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:16, fontWeight:600, color:'#111' }}>{f.q}<ChevronDown className="chv" style={{ width:18, height:18, color:'#bbb', flexShrink:0 }} /></summary>
                    <div style={{ padding:'0 24px 18px', fontSize:15, lineHeight:1.65, color:'#666' }}>{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ══ CTA ═══════════════════════════════════════════ */}
          <section style={{ padding:'72px 24px', background:'linear-gradient(135deg,#7c3aed,#6366f1)', textAlign:'center' }}>
            <div style={{ maxWidth:560, margin:'0 auto' }}>
              <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:'-.03em', lineHeight:1.12, color:'#fff' }}>Ready to stop editing and start publishing?</h2>
              <p style={{ fontSize:17, color:'rgba(255,255,255,.85)', marginTop:14 }}>30+ AI tools. Real video rendering. Zero markup.</p>
              <Link href={signupHref} style={{ display:'inline-flex', alignItems:'center', gap:8, height:52, padding:'0 36px', borderRadius:12, background:'#fff', color:'#7c3aed', fontSize:17, fontWeight:700, textDecoration:'none', marginTop:28, boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>Create free account <ArrowRight style={{ width:18, height:18 }} /></Link>
              <p style={{ marginTop:10, fontSize:14, color:'rgba(255,255,255,.5)' }}>No credit card required</p>
            </div>
          </section>
        </main>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <footer style={{ padding:'48px 40px', borderTop:'1px solid #eee' }}>
          <div style={{ maxWidth:960, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32 }}>
            <div>
              <span style={{ fontSize:20, fontWeight:800, color:'#7c3aed' }}>Clipflow</span>
              <p style={{ fontSize:14, color:'#999', marginTop:8, maxWidth:260, lineHeight:1.5 }}>AI video repurposing with real rendering. One video — every platform.</p>
            </div>
            <div style={{ display:'flex', gap:48 }}>
              {([
                { h:'Product', links:[['#features','Features'],['#pricing','Pricing'],['#compare','Compare'],['/changelog','Changelog']] },
                { h:'Account', links:[['/login','Log in'],['/signup','Sign up']] },
                { h:'Legal', links:[['/privacy','Privacy'],['/terms','Terms']] },
              ] as { h: string; links: [string, string][] }[]).map(col=>(
                <div key={col.h} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <p style={{ fontWeight:700, color:'#222', fontSize:14, marginBottom:4 }}>{col.h}</p>
                  {col.links.map(([h,l])=><Link key={h} href={h} style={{ fontSize:14, color:'#888', textDecoration:'none' }}>{l}</Link>)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ maxWidth:960, margin:'32px auto 0', paddingTop:20, borderTop:'1px solid #f0f0f0', fontSize:13, color:'#ccc' }}>© {new Date().getFullYear()} Clipflow. All rights reserved.</div>
        </footer>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:'Clipflow',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:'https://clipflow.to',offers:[{price:'0',name:'Free'},{price:'19',name:'Solo'},{price:'49',name:'Team'},{price:'99',name:'Agency'}].map(o=>({'@type':'Offer',priceCurrency:'USD',...o}))}) }} />
    </>
  )
}
