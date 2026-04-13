import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, X, ChevronDown, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clipflow — AI Video Repurposing for TikTok, Reels, Shorts & LinkedIn',
  description: 'Turn one video into platform-native content for TikTok, Reels, Shorts & LinkedIn. AI subtitles, B-Roll, virality scoring, video clipping, social scheduling. BYOK — zero AI markup.',
  alternates: { canonical: 'https://clipflow.to' },
}

const COMPARISON = [
  { feature: 'Auto-clip long videos into shorts', c: true, o: true, k: true },
  { feature: 'All 4 platform drafts at once', c: true, o: false, k: false },
  { feature: 'Burn captions onto video', c: true, o: true, k: true },
  { feature: 'Brand voice + AI persona', c: true, o: false, k: false },
  { feature: 'A/B hook testing', c: true, o: false, k: false },
  { feature: 'Virality scoring', c: true, o: true, k: false },
  { feature: 'AI B-Roll assembly', c: true, o: 'Beta', k: false },
  { feature: 'Video brand templates', c: true, o: false, k: false },
  { feature: 'Content DNA analyzer', c: true, o: false, k: false },
  { feature: '30-day AI content calendar', c: true, o: false, k: false },
  { feature: 'AI thumbnails (DALL-E)', c: true, o: false, k: false },
  { feature: 'BYOK — zero AI markup', c: true, o: false, k: false },
]

const FAQS = [
  { q: 'What does BYOK mean?', a: 'Bring Your Own Key. Connect your OpenAI, Anthropic, or Google key. We route AI calls through your key — zero markup on AI usage.' },
  { q: 'How is this different from OpusClip?', a: 'OpusClip focuses on video clipping. Clipflow does that PLUS full content strategy: 4-platform drafts, AI persona, content DNA analysis, newsletters, carousels, viral hooks, hashtag research, and 20+ more AI tools.' },
  { q: 'Can I actually edit videos here?', a: 'Yes. We render real MP4s via Shotstack — burn captions, stitch B-Roll with voiceover, add brand intros/outros, clip segments. All cloud-rendered, no software needed.' },
  { q: 'Is there a free plan?', a: 'Yes — 3 content items and 10 outputs per month, forever. No credit card.' },
  { q: 'Can I use it for client work?', a: 'Yes. Team and Agency plans include multi-client dashboards, white-label review portals, and unlimited workspaces.' },
]

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
        @keyframes shimmer { 0% { background-position:-200% center } 100% { background-position:200% center } }
        @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
        @keyframes pulse-glow { 0%,100% { opacity:.35 } 50% { opacity:.6 } }
        @keyframes gradient-x { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
        @keyframes count-up { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }

        .fade-up { animation: fade-up .7s ease both }
        .fade-up-d1 { animation: fade-up .7s .1s ease both }
        .fade-up-d2 { animation: fade-up .7s .2s ease both }
        .fade-up-d3 { animation: fade-up .7s .35s ease both }
        .fade-up-d4 { animation: fade-up .7s .5s ease both }
        .anim-float { animation: float 6s ease-in-out infinite }
        .anim-glow { animation: pulse-glow 3s ease-in-out infinite }
        .anim-marquee { animation: marquee 30s linear infinite }

        .gradient-text {
          background: linear-gradient(135deg, #a78bfa, #ec4899, #f97316);
          background-size: 200% 200%;
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-x 5s ease infinite;
        }

        .dot-grid {
          background-image: radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .glass { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); backdrop-filter: blur(12px) }
        .glass:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12) }

        .section-label { font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#a78bfa; margin-bottom:14px }
        .section-h2 { font-size:clamp(28px,4.5vw,48px); font-weight:800; line-height:1.08; letter-spacing:-.03em }
        .section-sub { font-size:16px; line-height:1.65; color:rgba(255,255,255,.4); max-width:520px }

        .hero-input {
          width:100%; max-width:540px; height:56px; border-radius:16px; padding:0 16px 0 20px;
          font-size:15px; color:#fff; outline:none; transition: all .2s;
          background: rgba(255,255,255,.05); border: 1.5px solid rgba(255,255,255,.1);
        }
        .hero-input:focus { border-color: rgba(139,92,246,.6); box-shadow: 0 0 0 4px rgba(139,92,246,.15), 0 0 40px rgba(139,92,246,.1) }
        .hero-input::placeholder { color: rgba(255,255,255,.25) }

        .hover-white:hover { color: #fff !important }
        details summary { list-style:none } details summary::-webkit-details-marker { display:none }
        details[open] .faq-chev { transform:rotate(180deg) } .faq-chev { transition:transform .2s }
      `}</style>

      <div style={{ background:'#030304', color:'#f0f0f2', minHeight:'100vh' }}>

        {/* ══ NAV ═══════════════════════════════════════════════ */}
        <header style={{ position:'fixed', inset:'0 0 auto 0', zIndex:100, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(3,3,4,.85)', backdropFilter:'blur(20px)' }}>
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-.02em', background:'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Clipflow</span>
          <nav style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', gap:28, fontSize:13, color:'rgba(255,255,255,.4)' }}>
            {[['#features','Features'],['#video','Video'],['#compare','Compare'],['#pricing','Pricing']].map(([h,l])=>(
              <a key={h} href={h} style={{ textDecoration:'none', color:'rgba(255,255,255,.4)', transition:'color .15s' }} className="hover-white">{l}</a>
            ))}
          </nav>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Sign in</Link>
            <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', height:34, padding:'0 16px', borderRadius:999, background:'#fff', color:'#000', fontSize:13, fontWeight:600, textDecoration:'none' }}>Get started free</Link>
          </div>
        </header>

        <main style={{ paddingTop:56 }}>

          {/* ══ HERO ════════════════════════════════════════════ */}
          <section className="dot-grid" style={{ position:'relative', overflow:'hidden', textAlign:'center', padding:'100px 24px 0' }}>
            {/* Glow */}
            <div className="anim-glow" style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:800, height:600, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(139,92,246,.2) 0%, transparent 65%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 70%, #030304)', pointerEvents:'none' }} />

            <div style={{ position:'relative' }}>
              {/* Badge */}
              <div className="fade-up" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:999, border:'1px solid rgba(167,139,250,.25)', background:'rgba(124,58,237,.08)', fontSize:13, color:'rgba(167,139,250,.9)', marginBottom:28 }}>
                <Zap style={{ width:13, height:13 }} /> Now with AI video rendering
              </div>

              {/* Headline */}
              <h1 className="fade-up-d1" style={{ fontSize:'clamp(44px,8vw,80px)', fontWeight:800, lineHeight:1.02, letterSpacing:'-.04em', maxWidth:800, margin:'0 auto' }}>
                Turn one video into{' '}<span className="gradient-text">every platform.</span>
              </h1>

              {/* Sub */}
              <p className="fade-up-d2" style={{ fontSize:17, lineHeight:1.65, color:'rgba(255,255,255,.42)', maxWidth:540, margin:'22px auto 0' }}>
                Paste a YouTube link. Get TikTok, Reels, Shorts & LinkedIn drafts — with AI subtitles burned in, B-Roll assembled, and clips auto-cut. All rendered as real MP4s.
              </p>

              {/* Interactive input */}
              <div className="fade-up-d3" style={{ display:'flex', justifyContent:'center', marginTop:32 }}>
                <div style={{ position:'relative', width:'100%', maxWidth:540 }}>
                  <input className="hero-input" placeholder="Paste a YouTube link or upload a video..." readOnly />
                  <Link href="/signup" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', display:'flex', alignItems:'center', gap:6, height:40, padding:'0 20px', borderRadius:12, background:'linear-gradient(135deg,#7c3aed,#c026d3)', color:'#fff', fontSize:14, fontWeight:600, textDecoration:'none', boxShadow:'0 0 30px rgba(139,92,246,.3)' }}>
                    Try free <ArrowRight style={{ width:14, height:14 }} />
                  </Link>
                </div>
              </div>
              <p className="fade-up-d4" style={{ marginTop:14, fontSize:12, color:'rgba(255,255,255,.2)' }}>Free forever · No credit card · Your own AI key</p>

              {/* Stats bar */}
              <div className="fade-up-d4" style={{ display:'flex', justifyContent:'center', gap:40, marginTop:48 }}>
                {[['25+','AI Tools'],['4','Platforms'],['<30s','To generate'],['$0','AI markup']].map(([n,l])=>(
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontSize:32, fontWeight:800, letterSpacing:'-.03em' }}>{n}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mockup ── */}
            <div style={{ position:'relative', marginTop:64, maxWidth:1060, marginLeft:'auto', marginRight:'auto', padding:'0 20px' }}>
              <div style={{ position:'absolute', inset:'-40px -60px', pointerEvents:'none' }}>
                <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:600, height:350, background:'radial-gradient(ellipse,rgba(139,92,246,.25) 0%,transparent 65%)', filter:'blur(40px)' }} />
              </div>
              <div className="anim-float" style={{ position:'relative', borderRadius:14, border:'1px solid rgba(255,255,255,.1)', boxShadow:'0 0 0 1px rgba(255,255,255,.04), 0 40px 120px rgba(0,0,0,.7)', overflow:'hidden', background:'#0c0c0f' }}>
                {/* Title bar */}
                <div style={{ display:'flex', alignItems:'center', height:40, padding:'0 14px', gap:8, background:'#111114', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <span style={{ width:12, height:12, borderRadius:'50%', background:'#ff5f57' }} />
                    <span style={{ width:12, height:12, borderRadius:'50%', background:'#febc2e' }} />
                    <span style={{ width:12, height:12, borderRadius:'50%', background:'#28c840' }} />
                  </div>
                  <div style={{ flex:1, height:24, borderRadius:6, margin:'0 48px', background:'rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'rgba(255,255,255,.2)' }}>clipflow.to</div>
                </div>
                {/* App layout */}
                <div style={{ display:'flex', height:380 }}>
                  {/* Sidebar */}
                  <div style={{ width:180, flexShrink:0, background:'#0e0e12', borderRight:'1px solid rgba(255,255,255,.06)', padding:'14px 10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', marginBottom:12, borderRadius:8, background:'rgba(255,255,255,.04)' }}>
                      <span style={{ width:20, height:20, borderRadius:6, background:'linear-gradient(135deg,#7c3aed,#c026d3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>C</span>
                      <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.8)' }}>My Workspace</span>
                    </div>
                    {['Dashboard','Pipeline','Calendar','Scheduler','Ghostwriter','Trends','All Tools'].map((item,i)=>(
                      <div key={item} style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:6, marginBottom:1, background: i===6 ? 'rgba(124,58,237,.15)' : 'transparent', borderLeft: i===6 ? '2px solid rgba(139,92,246,.8)' : '2px solid transparent' }}>
                        <span style={{ fontSize:11, color: i===6 ? '#a78bfa' : 'rgba(255,255,255,.3)' }}>{'◈▤◷⏱✦📈🔮'.split('')[i] ?? '◈'}</span>
                        <span style={{ fontSize:11.5, color: i===6 ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.35)', fontWeight: i===6 ? 500 : 400 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  {/* Main */}
                  <div style={{ flex:1, padding:'16px 16px', background:'#0c0c0f' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                      <div>
                        <p style={{ fontSize:14, fontWeight:600 }}>Product Demo.mp4</p>
                        <p style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:2 }}>4 drafts + video rendered · 28s</p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, padding:'4px 10px', borderRadius:999, background:'rgba(52,211,153,.1)', color:'#34d399', border:'1px solid rgba(52,211,153,.2)', alignSelf:'flex-start' }}>✓ Ready</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { p:'TikTok', s:94, bg:'rgba(236,72,153,.07)', b:'rgba(236,72,153,.15)', c:'#f9a8d4', hook:'POV: You spend 8h editing one video 😭' },
                        { p:'Reels', s:89, bg:'rgba(168,85,247,.07)', b:'rgba(168,85,247,.15)', c:'#d8b4fe', hook:'The workflow saving creators 6+ hours ✨' },
                        { p:'Shorts', s:85, bg:'rgba(239,68,68,.07)', b:'rgba(239,68,68,.15)', c:'#fca5a5', hook:'I automated my entire content pipeline' },
                        { p:'LinkedIn', s:81, bg:'rgba(59,130,246,.07)', b:'rgba(59,130,246,.15)', c:'#93c5fd', hook:'Most creators waste 80% on distribution' },
                      ].map(c=>(
                        <div key={c.p} style={{ padding:'11px 12px', borderRadius:10, background:c.bg, border:`1px solid ${c.b}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:999, background:c.b, color:c.c }}>{c.p}</span>
                            <span style={{ fontSize:12, fontWeight:700, color: c.s>88 ? '#34d399' : '#fbbf24' }}>{c.s}<span style={{ fontSize:9, color:'rgba(255,255,255,.2)', fontWeight:400 }}>/100</span></span>
                          </div>
                          <p style={{ fontSize:11, lineHeight:1.5, color:'rgba(255,255,255,.55)' }}>{c.hook}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:100, background:'linear-gradient(to top,#030304,transparent)', pointerEvents:'none', zIndex:2 }} />
            </div>
          </section>

          {/* ══ MARQUEE SOCIAL PROOF ════════════════════════════ */}
          <section style={{ borderTop:'1px solid rgba(255,255,255,.06)', overflow:'hidden', padding:'32px 0' }}>
            <div style={{ display:'flex', width:'max-content' }} className="anim-marquee">
              {[...Array(2)].map((_,setIdx)=>(
                <div key={setIdx} style={{ display:'flex', gap:24, paddingRight:24 }}>
                  {[
                    '"Cut my production from 6 hours to 20 minutes" — Sarah K.',
                    '"LinkedIn posts that don\'t sound like AI slop" — Marcus T.',
                    '"BYOK saves us hundreds per month" — Priya M.',
                    '"The Content DNA feature is insane" — Jake R.',
                    '"Finally a tool that actually renders videos" — Lisa C.',
                    '"25 AI tools in one place — no more tool-hopping" — Omar S.',
                  ].map((quote)=>(
                    <span key={quote} style={{ whiteSpace:'nowrap', fontSize:13, color:'rgba(255,255,255,.3)', padding:'8px 20px', borderRadius:999, border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>{quote}</span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ══ VIDEO FEATURES ══════════════════════════════════ */}
          <section id="video" style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'100px 24px' }}>
            <div style={{ maxWidth:960, margin:'0 auto' }}>
              <p className="section-label" style={{ textAlign:'center' }}>Video Processing</p>
              <h2 className="section-h2" style={{ textAlign:'center' }}>Real videos. Not just text.</h2>
              <p className="section-sub" style={{ margin:'16px auto 0', textAlign:'center' }}>
                Clipflow renders actual MP4s — captions burned in, B-Roll assembled, clips auto-cut. Powered by Shotstack.
              </p>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:3, marginTop:56 }}>
                {[
                  { icon:'🎬', title:'Burn Captions on Video', desc:'4 caption styles — classic, karaoke, outline, boxed. Word-level timing from Whisper. Rendered directly onto your video.', tag:'Popular' },
                  { icon:'🎥', title:'Auto B-Roll Assembly', desc:'AI picks B-Roll → stitches with your voiceover → adds subtitles → renders MP4. Full faceless video in minutes.', tag:'New' },
                  { icon:'✂️', title:'Smart Video Clipping', desc:'Upload a long video → AI finds the best moments → each clip rendered as a separate MP4. Batch process 15+ clips at once.', tag:'Core' },
                  { icon:'🏷️', title:'Brand Video Templates', desc:'Logo intro, branded outro, accent colors, custom fonts. Every video looks on-brand without manual editing.', tag:'Brand' },
                ].map(f=>(
                  <div key={f.title} className="glass" style={{ padding:'28px 28px', transition:'all .2s', cursor:'default' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                      <span style={{ fontSize:28 }}>{f.icon}</span>
                      <span style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:999, background:'rgba(139,92,246,.1)', color:'#a78bfa' }}>{f.tag}</span>
                    </div>
                    <h3 style={{ fontSize:16, fontWeight:700, letterSpacing:'-.01em', marginBottom:8 }}>{f.title}</h3>
                    <p style={{ fontSize:13, lineHeight:1.7, color:'rgba(255,255,255,.4)' }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ AI TOOLS SHOWCASE ═══════════════════════════════ */}
          <section id="features" style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'100px 24px' }}>
            <div style={{ maxWidth:960, margin:'0 auto' }}>
              <p className="section-label" style={{ textAlign:'center' }}>25+ AI Tools</p>
              <h2 className="section-h2" style={{ textAlign:'center' }}>The only content tool you need</h2>
              <p className="section-sub" style={{ margin:'16px auto 0', textAlign:'center' }}>
                Strategy, creation, optimization, distribution — all in one place.
              </p>

              {/* 3 big spotlights */}
              <div style={{ display:'flex', flexDirection:'column', gap:3, marginTop:56 }}>
                {[
                  { icon:'🧬', label:'Strategy', title:'Content DNA Analyzer', desc:'Upload your best content → AI extracts your winning formula: hook patterns, storytelling structure, tone profile, content formulas. Every future draft is optimized for YOUR style.', color:'rgba(167,139,250,.08)', border:'rgba(167,139,250,.15)' },
                  { icon:'⚡', label:'Creation', title:'One-Click Full Repurpose', desc:'Single button → 4 platform drafts + newsletter + carousel + YouTube chapters + blog post. All generated in parallel in under 30 seconds.', color:'rgba(251,191,36,.06)', border:'rgba(251,191,36,.12)' },
                  { icon:'🔥', label:'Growth', title:'Viral Hook Database', desc:'25+ proven hook templates per niche, categorized by emotion, format, and platform. Each with a virality score and the psychological trigger that makes it work.', color:'rgba(236,72,153,.06)', border:'rgba(236,72,153,.12)' },
                ].map(f=>(
                  <div key={f.title} style={{ display:'flex', alignItems:'center', gap:40, padding:'36px 36px', background:f.color, border:`1px solid ${f.border}`, borderRadius:16 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                        <span style={{ fontSize:24 }}>{f.icon}</span>
                        <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.3)' }}>{f.label}</span>
                      </div>
                      <h3 style={{ fontSize:'clamp(20px,2.5vw,26px)', fontWeight:700, letterSpacing:'-.02em', marginBottom:10 }}>{f.title}</h3>
                      <p style={{ fontSize:14, lineHeight:1.7, color:'rgba(255,255,255,.42)', maxWidth:500 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feature grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:2, marginTop:3 }}>
                {[
                  { icon:'🎙️', t:'AI Persona', d:'Full character: backstory, expertise, writing quirks' },
                  { icon:'📅', t:'30-Day Calendar', d:'AI generates a month of content ideas with scripts' },
                  { icon:'✍️', t:'Script Coach', d:'Real-time AI feedback as you write' },
                  { icon:'📰', t:'Newsletter', d:'Transcript → Beehiiv/Substack edition' },
                  { icon:'📱', t:'Carousel', d:'Auto-split into swipeable slides' },
                  { icon:'💬', t:'Reply Generator', d:'AI drafts engaging comment replies' },
                  { icon:'#️⃣', t:'Hashtag Research', d:'Data-driven analysis with 3 ready sets' },
                  { icon:'♻️', t:'Content Recycler', d:'Remix old content with fresh hooks' },
                  { icon:'🖼️', t:'AI Thumbnails', d:'DALL-E generates 3 thumbnail concepts' },
                  { icon:'🎬', t:'Visual Storyboard', d:'Scene-by-scene with AI image prompts' },
                  { icon:'🤝', t:'Collab Finder', d:'AI suggests ideal creator partners' },
                  { icon:'📊', t:'Performance Predictor', d:'Predicted views + best posting time' },
                ].map(f=>(
                  <div key={f.t} className="glass" style={{ padding:'20px 18px', transition:'all .2s', cursor:'default' }}>
                    <span style={{ fontSize:20, display:'block', marginBottom:10 }}>{f.icon}</span>
                    <p style={{ fontSize:12, fontWeight:600, marginBottom:4 }}>{f.t}</p>
                    <p style={{ fontSize:11.5, lineHeight:1.6, color:'rgba(255,255,255,.35)' }}>{f.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ COMPARE ════════════════════════════════════════ */}
          <section id="compare" style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'100px 24px' }}>
            <div style={{ maxWidth:800, margin:'0 auto' }}>
              <p className="section-label" style={{ textAlign:'center' }}>Compare</p>
              <h2 className="section-h2" style={{ textAlign:'center' }}>More tools. Real video. Zero markup.</h2>
              <div style={{ border:'1px solid rgba(255,255,255,.08)', borderRadius:16, overflow:'hidden', marginTop:48 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.02)' }}>
                      <th style={{ padding:'14px 20px', textAlign:'left', fontSize:12, fontWeight:500, color:'rgba(255,255,255,.3)' }}>Feature</th>
                      <th style={{ padding:'14px 20px', textAlign:'center' }}><span style={{ fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Clipflow</span></th>
                      <th style={{ padding:'14px 20px', textAlign:'center', fontSize:13, fontWeight:500, color:'rgba(255,255,255,.3)' }}>OpusClip</th>
                      <th style={{ padding:'14px 20px', textAlign:'center', fontSize:13, fontWeight:500, color:'rgba(255,255,255,.3)' }}>Klap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((r,i)=>(
                      <tr key={r.feature} style={{ borderBottom: i<COMPARISON.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none', background: i%2===1 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                        <td style={{ padding:'12px 20px', fontSize:13, color:'rgba(255,255,255,.55)' }}>{r.feature}</td>
                        {[r.c, r.o, r.k].map((v,j)=>(
                          <td key={j} style={{ padding:'12px 20px', textAlign:'center' }}>
                            {v===true ? <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:22, height:22, borderRadius:'50%', background:'rgba(139,92,246,.15)' }}><Check style={{ width:12, height:12, color:'#a78bfa' }} /></span> : v===false ? <X style={{ width:14, height:14, color:'rgba(255,255,255,.12)', display:'block', margin:'0 auto' }} /> : <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>{v}</span>}
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
          <section id="pricing" style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'100px 24px' }}>
            <div style={{ maxWidth:1000, margin:'0 auto' }}>
              <p className="section-label" style={{ textAlign:'center' }}>Pricing</p>
              <h2 className="section-h2" style={{ textAlign:'center' }}>Start free. Scale when ready.</h2>
              <p className="section-sub" style={{ margin:'16px auto 0', textAlign:'center' }}>BYOK — you pay your AI provider at cost. We never charge a markup.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:56 }}>
                {[
                  { name:'Free', price:'$0', period:'/forever', desc:'Try it out.', features:['3 content items/mo','10 outputs/mo','1 workspace','Video rendering (watermark)'], cta:'Get started', hl:false },
                  { name:'Solo', price:'$19', period:'/mo', desc:'For creators.', features:['20 content items/mo','100 outputs/mo','All AI tools','Brand voice + persona','No watermark'], cta:'Start trial', hl:true },
                  { name:'Team', price:'$49', period:'/mo', desc:'For teams.', features:['100 content items/mo','500 outputs/mo','5 workspaces','Team members','Review links'], cta:'Start trial', hl:false },
                  { name:'Agency', price:'$99', period:'/mo', desc:'Unlimited.', features:['Unlimited everything','White-label portals','Priority support','API access'], cta:'Contact us', hl:false },
                ].map(plan=>(
                  <div key={plan.name} style={{ position:'relative', display:'flex', flexDirection:'column', padding:'28px 24px', borderRadius:20, background: plan.hl ? 'rgba(124,58,237,.08)' : 'rgba(255,255,255,.02)', border: plan.hl ? '1px solid rgba(124,58,237,.4)' : '1px solid rgba(255,255,255,.07)', boxShadow: plan.hl ? '0 0 60px rgba(124,58,237,.12)' : 'none' }}>
                    {plan.hl && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#7c3aed,#c026d3)', color:'#fff', fontSize:11, fontWeight:600, padding:'4px 14px', borderRadius:'0 0 10px 10px' }}>Popular</div>}
                    <div style={{ marginTop: plan.hl ? 16 : 0 }}>
                      <p style={{ fontSize:15, fontWeight:700 }}>{plan.name}</p>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:3 }}>{plan.desc}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:4, margin:'20px 0' }}>
                      <span style={{ fontSize:42, fontWeight:800, letterSpacing:'-.04em' }}>{plan.price}</span>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>{plan.period}</span>
                    </div>
                    <ul style={{ display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                      {plan.features.map(f=>(
                        <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'rgba(255,255,255,.5)' }}>
                          <Check style={{ width:13, height:13, color:'#34d399', marginTop:2, flexShrink:0 }} />{f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:40, borderRadius:999, marginTop:24, fontSize:13, fontWeight:600, textDecoration:'none', transition:'all .2s', background: plan.hl ? 'linear-gradient(135deg,#7c3aed,#c026d3)' : 'rgba(255,255,255,.06)', color: plan.hl ? '#fff' : 'rgba(255,255,255,.6)', border: plan.hl ? 'none' : '1px solid rgba(255,255,255,.09)' }}>{plan.cta}</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ FAQ ════════════════════════════════════════════ */}
          <section style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'100px 24px' }}>
            <div style={{ maxWidth:640, margin:'0 auto' }}>
              <p className="section-label" style={{ textAlign:'center' }}>FAQ</p>
              <h2 className="section-h2" style={{ textAlign:'center' }}>Common questions</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:48 }}>
                {FAQS.map(f=>(
                  <details key={f.q} style={{ borderRadius:14, border:'1px solid rgba(255,255,255,.07)', background:'rgba(255,255,255,.02)', overflow:'hidden' }}>
                    <summary style={{ padding:'18px 22px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:15, fontWeight:500 }}>{f.q}<ChevronDown className="faq-chev" style={{ width:16, height:16, color:'rgba(255,255,255,.3)', flexShrink:0 }} /></summary>
                    <div style={{ padding:'0 22px 18px', fontSize:14, lineHeight:1.7, color:'rgba(255,255,255,.42)' }}>{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ══ CTA ═══════════════════════════════════════════ */}
          <section style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'120px 24px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 100%, rgba(124,58,237,.15) 0%, transparent 60%)' }} />
            <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center', position:'relative' }}>
              <h2 style={{ fontSize:'clamp(36px,6vw,60px)', fontWeight:800, letterSpacing:'-.04em', lineHeight:1.05 }}>Stop editing.{' '}<span className="gradient-text">Start publishing.</span></h2>
              <p style={{ fontSize:16, lineHeight:1.65, color:'rgba(255,255,255,.4)', maxWidth:440, margin:'20px auto 0' }}>Free forever. Bring your own AI key. Real video rendering. Zero markup.</p>
              <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:8, height:48, padding:'0 32px', borderRadius:999, background:'#fff', color:'#000', fontSize:15, fontWeight:600, textDecoration:'none', marginTop:36, boxShadow:'0 0 60px rgba(139,92,246,.3)', transition:'all .2s' }}>Create free account <ArrowRight style={{ width:16, height:16 }} /></Link>
              <p style={{ marginTop:14, fontSize:12, color:'rgba(255,255,255,.18)' }}>No credit card · 25+ AI tools included</p>
            </div>
          </section>
        </main>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'48px 24px' }}>
          <div style={{ maxWidth:960, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32 }}>
            <div>
              <span style={{ fontSize:16, fontWeight:700, background:'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Clipflow</span>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.25)', marginTop:6, maxWidth:260, lineHeight:1.6 }}>AI video repurposing with real video rendering. One video — every platform.</p>
            </div>
            <div style={{ display:'flex', gap:40, fontSize:13, color:'rgba(255,255,255,.3)' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.2)' }}>Product</span>
                {['#features','#video','#pricing','#compare'].map(h=><a key={h} href={h} style={{ textDecoration:'none', color:'inherit' }}>{h.slice(1).charAt(0).toUpperCase()+h.slice(2)}</a>)}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <span style={{ fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.2)' }}>Account</span>
                <Link href="/login" style={{ textDecoration:'none', color:'inherit' }}>Sign in</Link>
                <Link href="/signup" style={{ textDecoration:'none', color:'inherit' }}>Sign up free</Link>
              </div>
            </div>
          </div>
          <div style={{ maxWidth:960, margin:'32px auto 0', paddingTop:20, borderTop:'1px solid rgba(255,255,255,.05)', fontSize:12, color:'rgba(255,255,255,.15)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <span>© {new Date().getFullYear()} Clipflow. All rights reserved.</span>
            <div style={{ display:'flex', gap:16 }}>
              <Link href="/privacy" style={{ color:'inherit', textDecoration:'none' }}>Privacy</Link>
              <Link href="/terms" style={{ color:'inherit', textDecoration:'none' }}>Terms</Link>
            </div>
          </div>
        </footer>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context':'https://schema.org', '@type':'SoftwareApplication', name:'Clipflow', applicationCategory:'BusinessApplication', operatingSystem:'Web', url:'https://clipflow.to', description:'AI video repurposing with real video rendering. 25+ AI tools.', offers:[{price:'0',priceCurrency:'USD',name:'Free'},{price:'19',priceCurrency:'USD',name:'Solo'},{price:'49',priceCurrency:'USD',name:'Team'},{price:'99',priceCurrency:'USD',name:'Agency'}].map(o=>({'@type':'Offer',...o})) }) }} />
    </>
  )
}
