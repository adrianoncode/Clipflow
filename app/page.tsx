import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, X, ChevronDown, Zap, Play } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clipflow — AI Video Repurposing · TikTok, Reels, Shorts & LinkedIn',
  description: 'Turn one video into platform-native content. AI subtitles, B-Roll, virality scoring, video clipping, social scheduling. BYOK — zero AI markup.',
  alternates: { canonical: 'https://clipflow.to' },
}

const COMP = [
  { f: 'Auto-clip long videos', c: true, o: true, k: true },
  { f: 'All 4 platform drafts at once', c: true, o: false, k: false },
  { f: 'Burn captions onto video', c: true, o: true, k: true },
  { f: 'Brand voice + AI persona', c: true, o: false, k: false },
  { f: 'A/B hook testing', c: true, o: false, k: false },
  { f: 'Virality scoring', c: true, o: true, k: false },
  { f: 'AI B-Roll assembly', c: true, o: 'Beta', k: false },
  { f: 'Content DNA analyzer', c: true, o: false, k: false },
  { f: '30-day AI content calendar', c: true, o: false, k: false },
  { f: 'Creator search (5 platforms)', c: true, o: false, k: false },
  { f: 'AI thumbnails (DALL-E)', c: true, o: false, k: false },
  { f: 'BYOK — zero AI markup', c: true, o: false, k: false },
]

const FAQ = [
  { q: 'What does BYOK mean?', a: 'Bring Your Own Key. Connect your OpenAI, Anthropic, or Google key. We route AI calls through your key — zero markup on usage.' },
  { q: 'How is this different from OpusClip?', a: 'OpusClip clips videos. Clipflow does that PLUS 30+ AI tools: content strategy, newsletters, carousels, creator research, hashtag analysis, and more.' },
  { q: 'Can I render real videos?', a: 'Yes. We render MP4s via Shotstack — burn captions, stitch B-Roll, add brand intros. All cloud-rendered.' },
  { q: 'Is there a free plan?', a: '3 content items, 10 outputs per month. No credit card. Free forever.' },
]

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        @keyframes glow { 0%,100% { opacity:.3 } 50% { opacity:.55 } }
        @keyframes grad { 0% { background-position:0% 50% } 50% { background-position:100% 50% } 100% { background-position:0% 50% } }
        @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }

        .fu { animation:fade-up .65s ease both }
        .fu1 { animation:fade-up .65s .08s ease both }
        .fu2 { animation:fade-up .65s .16s ease both }
        .fu3 { animation:fade-up .65s .28s ease both }
        .fu4 { animation:fade-up .65s .4s ease both }
        .fl { animation:float 6s ease-in-out infinite }
        .gl { animation:glow 3s ease-in-out infinite }
        .gt { background:linear-gradient(135deg,#a78bfa,#ec4899,#f97316); background-size:200% 200%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; animation:grad 5s ease infinite }
        .mq { animation:marquee 35s linear infinite }

        .hw:hover { color:#fff !important }
        details summary { list-style:none } details summary::-webkit-details-marker { display:none }
        details[open] .chev { transform:rotate(180deg) } .chev { transition:transform .2s }
      `}</style>

      <div style={{ background:'#0a0a0b', color:'#f7f8f8', minHeight:'100vh', fontFamily:'var(--font-inter),-apple-system,BlinkMacSystemFont,sans-serif' }}>

        {/* ══ NAV ═══════════════════════════════════════════════ */}
        <header style={{ position:'fixed', inset:'0 0 auto 0', zIndex:100, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(10,10,11,.85)', backdropFilter:'blur(16px)' }}>
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-.02em', background:'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Clipflow</span>
          <nav style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', gap:28, fontSize:13, color:'rgba(255,255,255,.4)' }}>
            {[['#how','How it works'],['#features','Features'],['#compare','Compare'],['#pricing','Pricing']].map(([h,l])=>(
              <a key={h} href={h} className="hw" style={{ textDecoration:'none', color:'rgba(255,255,255,.4)', transition:'color .15s' }}>{l}</a>
            ))}
          </nav>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link href="/login" style={{ fontSize:13, color:'rgba(255,255,255,.4)', textDecoration:'none', transition:'color .15s' }} className="hw">Log in</Link>
            <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', height:32, padding:'0 14px', borderRadius:8, background:'#fff', color:'#000', fontSize:13, fontWeight:500, textDecoration:'none', transition:'opacity .15s' }}>Start free</Link>
          </div>
        </header>

        <main style={{ paddingTop:56 }}>

          {/* ══ HERO ════════════════════════════════════════════ */}
          <section style={{ position:'relative', overflow:'hidden', textAlign:'center', padding:'100px 24px 0' }}>
            <div className="gl" style={{ position:'absolute', top:-60, left:'50%', transform:'translateX(-50%)', width:700, height:500, borderRadius:'50%', background:'radial-gradient(ellipse,rgba(139,92,246,.18) 0%,transparent 65%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 75%,#0a0a0b)', pointerEvents:'none' }} />

            <div style={{ position:'relative', maxWidth:720, margin:'0 auto' }}>
              {/* Eyebrow */}
              <div className="fu" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 14px', borderRadius:999, border:'1px solid rgba(255,255,255,.08)', background:'rgba(255,255,255,.04)', fontSize:13, color:'#888', marginBottom:28 }}>
                <Zap style={{ width:12, height:12, color:'#a78bfa' }} /> AI video rendering is here
              </div>

              {/* H1 */}
              <h1 className="fu1" style={{ fontSize:'clamp(40px,7.5vw,68px)', fontWeight:700, lineHeight:1.08, letterSpacing:'-.035em' }}>
                One video.<br /><span className="gt">Every platform.</span>
              </h1>

              {/* Sub */}
              <p className="fu2" style={{ fontSize:17, lineHeight:1.6, color:'#95a2b3', maxWidth:520, margin:'20px auto 0', letterSpacing:'-.01em' }}>
                Paste a YouTube link. Clipflow generates TikTok, Reels, Shorts &amp; LinkedIn drafts with AI subtitles, B-Roll, and virality scoring. All rendered as real MP4s.
              </p>

              {/* CTAs */}
              <div className="fu3" style={{ display:'flex', gap:10, justifyContent:'center', marginTop:32 }}>
                <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:6, height:44, padding:'0 22px', borderRadius:8, background:'#fff', color:'#000', fontSize:15, fontWeight:500, textDecoration:'none', transition:'opacity .15s' }}>
                  Start free <ArrowRight style={{ width:15, height:15 }} />
                </Link>
                <Link href="#how" style={{ display:'inline-flex', alignItems:'center', gap:6, height:44, padding:'0 22px', borderRadius:8, border:'1px solid rgba(255,255,255,.12)', color:'#888', fontSize:15, fontWeight:500, textDecoration:'none', transition:'all .15s' }}>
                  <Play style={{ width:13, height:13 }} /> See how it works
                </Link>
              </div>
              <p className="fu4" style={{ marginTop:14, fontSize:13, color:'rgba(255,255,255,.25)' }}>No credit card required · Free forever plan</p>

              {/* Avatar stack social proof */}
              <div className="fu4" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:32 }}>
                <div style={{ display:'flex' }}>
                  {['#7c3aed','#ec4899','#f97316','#10b981','#0ea5e9'].map((c,i)=>(
                    <div key={i} style={{ width:28, height:28, borderRadius:'50%', background:c, border:'2px solid #0a0a0b', marginLeft: i>0 ? -8 : 0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff' }}>
                      {['S','M','P','J','L'][i]}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize:13, color:'#888' }}>Join 2,400+ creators</span>
                <span style={{ fontSize:13, color:'#fbbf24' }}>★★★★★</span>
              </div>
            </div>

            {/* ── Product mockup ── */}
            <div style={{ position:'relative', marginTop:56, maxWidth:1000, marginLeft:'auto', marginRight:'auto', padding:'0 20px' }}>
              <div style={{ position:'absolute', inset:'-40px -40px', pointerEvents:'none' }}>
                <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:500, height:300, background:'radial-gradient(ellipse,rgba(139,92,246,.22) 0%,transparent 65%)', filter:'blur(30px)' }} />
              </div>
              <div className="fl" style={{ position:'relative', borderRadius:12, border:'1px solid rgba(255,255,255,.08)', boxShadow:'0 32px 80px rgba(0,0,0,.5)', overflow:'hidden', background:'#111114' }}>
                {/* Title bar */}
                <div style={{ display:'flex', alignItems:'center', height:36, padding:'0 12px', gap:6, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  {['#ff5f57','#febc2e','#28c840'].map((c,i)=>(<span key={i} style={{ width:10, height:10, borderRadius:'50%', background:c }} />))}
                  <div style={{ flex:1, height:20, borderRadius:5, margin:'0 40px', background:'rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'rgba(255,255,255,.18)' }}>clipflow.to</div>
                </div>
                {/* App */}
                <div style={{ display:'flex', height:340 }}>
                  <div style={{ width:160, flexShrink:0, background:'#0e0e12', borderRight:'1px solid rgba(255,255,255,.06)', padding:'12px 8px' }}>
                    {['Dashboard','Pipeline','Calendar','Ghostwriter','All Tools','Trends','Channels'].map((n,i)=>(
                      <div key={n} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:5, marginBottom:1, background: i===4 ? 'rgba(124,58,237,.12)' : 'transparent', borderLeft: i===4 ? '2px solid #8b5cf6' : '2px solid transparent' }}>
                        <span style={{ fontSize:10, color: i===4 ? '#a78bfa' : 'rgba(255,255,255,.25)' }}>{'◈▤◷✦🔮📈🔗'[i]}</span>
                        <span style={{ fontSize:11, color: i===4 ? '#e0e0e0' : 'rgba(255,255,255,.3)', fontWeight: i===4 ? 500 : 400 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex:1, padding:'14px', background:'#0c0c0f' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                      <div><p style={{ fontSize:13, fontWeight:600 }}>Product Demo.mp4</p><p style={{ fontSize:10, color:'rgba(255,255,255,.25)', marginTop:2 }}>4 drafts · 24s · gpt-4o</p></div>
                      <span style={{ fontSize:9, fontWeight:600, padding:'3px 8px', borderRadius:999, background:'rgba(52,211,153,.08)', color:'#34d399', border:'1px solid rgba(52,211,153,.15)', alignSelf:'flex-start' }}>✓ Ready</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {[{p:'TikTok',s:94,bg:'rgba(236,72,153,.06)',b:'rgba(236,72,153,.12)',c:'#f9a8d4',h:'POV: You spend 8h editing 😭'},{p:'Reels',s:89,bg:'rgba(168,85,247,.06)',b:'rgba(168,85,247,.12)',c:'#d8b4fe',h:'The workflow saving 6+ hours ✨'},{p:'Shorts',s:85,bg:'rgba(239,68,68,.06)',b:'rgba(239,68,68,.12)',c:'#fca5a5',h:'I automated my content pipeline'},{p:'LinkedIn',s:81,bg:'rgba(59,130,246,.06)',b:'rgba(59,130,246,.12)',c:'#93c5fd',h:'80% of creators waste time on distribution'}].map(c=>(
                        <div key={c.p} style={{ padding:'10px', borderRadius:8, background:c.bg, border:`1px solid ${c.b}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                            <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:999, background:c.b, color:c.c }}>{c.p}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:c.s>88?'#34d399':'#fbbf24' }}>{c.s}</span>
                          </div>
                          <p style={{ fontSize:10.5, lineHeight:1.45, color:'rgba(255,255,255,.5)' }}>{c.h}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:80, background:'linear-gradient(to top,#0a0a0b,transparent)', pointerEvents:'none', zIndex:2 }} />
            </div>
          </section>

          {/* ══ LOGOS ═══════════════════════════════════════════ */}
          <section style={{ padding:'40px 24px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
            <p style={{ textAlign:'center', fontSize:12, fontWeight:500, color:'rgba(255,255,255,.2)', marginBottom:20, letterSpacing:'.05em', textTransform:'uppercase' }}>Powered by</p>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:40, opacity:.35, fontSize:13, fontWeight:600, color:'#fff', flexWrap:'wrap' }}>
              {['OpenAI','Anthropic','Google Gemini','ElevenLabs','Shotstack','Pexels'].map(n=>(
                <span key={n}>{n}</span>
              ))}
            </div>
          </section>

          {/* ══ HOW IT WORKS ════════════════════════════════════ */}
          <section id="how" style={{ padding:'96px 24px' }}>
            <div style={{ maxWidth:800, margin:'0 auto' }}>
              <p style={{ textAlign:'center', fontSize:12, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:'#a78bfa', marginBottom:12 }}>How it works</p>
              <h2 style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-.03em' }}>Raw content to published — in minutes</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:2, marginTop:48, borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,.06)' }}>
                {[
                  { n:'01', t:'Add content', d:'Upload video, paste YouTube link, drop a web article, or type a script. Whisper transcribes automatically.' },
                  { n:'02', t:'Generate everything', d:'One click → 4 platform drafts + newsletter + carousel + chapters. AI persona and brand voice applied.' },
                  { n:'03', t:'Publish everywhere', d:'Edit, approve, schedule. Captions burned in, B-Roll assembled, videos rendered. Post directly to social.' },
                ].map(s=>(
                  <div key={s.n} style={{ padding:'32px 28px', background:'rgba(255,255,255,.02)' }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'rgba(255,255,255,.15)' }}>{s.n}</span>
                    <h3 style={{ fontSize:17, fontWeight:600, letterSpacing:'-.01em', margin:'10px 0 8px' }}>{s.t}</h3>
                    <p style={{ fontSize:14, lineHeight:1.65, color:'#95a2b3' }}>{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ MARQUEE ═════════════════════════════════════════ */}
          <section style={{ borderTop:'1px solid rgba(255,255,255,.06)', borderBottom:'1px solid rgba(255,255,255,.06)', overflow:'hidden', padding:'24px 0' }}>
            <div style={{ display:'flex', width:'max-content' }} className="mq">
              {[...Array(2)].map((_,si)=>(
                <div key={si} style={{ display:'flex', gap:20, paddingRight:20 }}>
                  {['"Cut my production time by 90%" — Sarah K.','"LinkedIn posts that don\'t sound like AI" — Marcus T.','"BYOK saves us $400/month" — Priya M.','"The Content DNA feature is a game changer" — Jake R.','"25 tools in one place" — Omar S.','"Finally, real video rendering" — Lisa C.'].map(q=>(
                    <span key={q} style={{ whiteSpace:'nowrap', fontSize:13, color:'rgba(255,255,255,.28)', padding:'6px 16px', borderRadius:999, border:'1px solid rgba(255,255,255,.05)' }}>{q}</span>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ══ BENTO FEATURES ══════════════════════════════════ */}
          <section id="features" style={{ padding:'96px 24px' }}>
            <div style={{ maxWidth:900, margin:'0 auto' }}>
              <p style={{ textAlign:'center', fontSize:12, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:'#a78bfa', marginBottom:12 }}>Features</p>
              <h2 style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-.03em' }}>30+ AI tools. One platform.</h2>
              <p style={{ textAlign:'center', fontSize:16, color:'#95a2b3', marginTop:12, maxWidth:460, marginLeft:'auto', marginRight:'auto' }}>Strategy, creation, video processing, publishing — everything in one place.</p>

              {/* Bento grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:48 }}>
                {/* Large cards — span 2 or 1 */}
                {[
                  { span:2, icon:'🧬', title:'Content DNA', desc:'Upload your top videos → AI extracts your winning formula: hooks, structure, tone. Every future draft optimized for your style.', color:'#7c3aed' },
                  { span:1, icon:'⚡', title:'Full Repurpose', desc:'1 click → 4 drafts + newsletter + carousel + chapters. All parallel.', color:'#fbbf24' },
                  { span:1, icon:'🔥', title:'Viral Hooks', desc:'25 proven templates per niche. Emotion, format, and virality score.', color:'#ec4899' },
                  { span:1, icon:'🎬', title:'Video Rendering', desc:'Burn captions, assemble B-Roll, clip segments. Real MP4 output.', color:'#34d399' },
                  { span:1, icon:'🔍', title:'Creator Search', desc:'Find creators on YouTube, TikTok, Instagram, Twitter, LinkedIn.', color:'#0ea5e9' },
                  { span:1, icon:'🎙️', title:'AI Persona', desc:'Name, backstory, expertise, writing quirks. The AI becomes them.', color:'#a78bfa' },
                  { span:1, icon:'📅', title:'30-Day Calendar', desc:'AI generates a full month of content ideas with scripts and hooks.', color:'#f97316' },
                  { span:1, icon:'#️⃣', title:'Hashtag Research', desc:'Data-driven analysis with reach estimates and ready-to-use sets.', color:'#06b6d4' },
                ].map((f,i)=>(
                  <div key={i} style={{ gridColumn: f.span===2 ? 'span 2' : 'span 1', padding:'24px', borderRadius:12, border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)', transition:'all .2s' }}>
                    <span style={{ fontSize:24, display:'block', marginBottom:12 }}>{f.icon}</span>
                    <h3 style={{ fontSize:15, fontWeight:600, letterSpacing:'-.01em', marginBottom:6 }}>{f.title}</h3>
                    <p style={{ fontSize:13, lineHeight:1.6, color:'#95a2b3' }}>{f.desc}</p>
                  </div>
                ))}

                {/* BYOK highlight — full width */}
                <div style={{ gridColumn:'span 3', padding:'28px', borderRadius:12, border:'1px solid rgba(139,92,246,.25)', background:'linear-gradient(135deg,rgba(139,92,246,.08),rgba(236,72,153,.04))', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
                  <div>
                    <h3 style={{ fontSize:17, fontWeight:700, letterSpacing:'-.02em' }}>BYOK — Bring Your Own Key</h3>
                    <p style={{ fontSize:14, color:'#95a2b3', marginTop:6, maxWidth:500 }}>Your own OpenAI, Anthropic, or Google key. All AI calls at cost — we never charge a markup. Saves teams $200+/month.</p>
                  </div>
                  <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:6, height:40, padding:'0 20px', borderRadius:8, background:'#7c3aed', color:'#fff', fontSize:14, fontWeight:500, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>Try free <ArrowRight style={{ width:14, height:14 }} /></Link>
                </div>
              </div>
            </div>
          </section>

          {/* ══ COMPARE ════════════════════════════════════════ */}
          <section id="compare" style={{ padding:'96px 24px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ maxWidth:740, margin:'0 auto' }}>
              <p style={{ textAlign:'center', fontSize:12, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:'#a78bfa', marginBottom:12 }}>Compare</p>
              <h2 style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-.03em' }}>More tools. Real video. Zero markup.</h2>
              <div style={{ border:'1px solid rgba(255,255,255,.06)', borderRadius:12, overflow:'hidden', marginTop:40 }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
                      <th style={{ padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:500, color:'#888' }}>Feature</th>
                      <th style={{ padding:'12px 16px', textAlign:'center' }}><span className="gt" style={{ fontSize:13, fontWeight:700 }}>Clipflow</span></th>
                      <th style={{ padding:'12px 16px', textAlign:'center', fontSize:12, fontWeight:500, color:'#888' }}>OpusClip</th>
                      <th style={{ padding:'12px 16px', textAlign:'center', fontSize:12, fontWeight:500, color:'#888' }}>Klap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMP.map((r,i)=>(
                      <tr key={r.f} style={{ borderBottom: i<COMP.length-1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                        <td style={{ padding:'10px 16px', fontSize:13, color:'#95a2b3' }}>{r.f}</td>
                        {[r.c,r.o,r.k].map((v,j)=>(
                          <td key={j} style={{ padding:'10px 16px', textAlign:'center' }}>
                            {v===true?<Check style={{ width:14, height:14, color:'#a78bfa', margin:'0 auto' }} />:v===false?<X style={{ width:14, height:14, color:'rgba(255,255,255,.1)', margin:'0 auto' }} />:<span style={{ fontSize:11, color:'#888' }}>{v}</span>}
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
          <section id="pricing" style={{ padding:'96px 24px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ maxWidth:920, margin:'0 auto' }}>
              <p style={{ textAlign:'center', fontSize:12, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:'#a78bfa', marginBottom:12 }}>Pricing</p>
              <h2 style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:700, lineHeight:1.1, letterSpacing:'-.03em' }}>Start free. Scale when ready.</h2>
              <p style={{ textAlign:'center', fontSize:15, color:'#95a2b3', marginTop:10 }}>BYOK — pay your AI provider at cost. Zero markup.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:48 }}>
                {[
                  { n:'Free', p:'$0', per:'/forever', d:'Try it out.', f:['3 content/mo','10 outputs/mo','1 workspace','All AI tools'], cta:'Get started', hl:false },
                  { n:'Solo', p:'$19', per:'/mo', d:'For creators.', f:['20 content/mo','100 outputs/mo','Brand voice + persona','Video rendering','Client review links'], cta:'Start trial', hl:true },
                  { n:'Team', p:'$49', per:'/mo', d:'For teams.', f:['100 content/mo','500 outputs/mo','5 workspaces','Team members','Everything in Solo'], cta:'Start trial', hl:false },
                  { n:'Agency', p:'$99', per:'/mo', d:'Unlimited.', f:['Unlimited content','Unlimited outputs','Unlimited workspaces','White-label portals','API access'], cta:'Contact us', hl:false },
                ].map(plan=>(
                  <div key={plan.n} style={{ position:'relative', display:'flex', flexDirection:'column', padding:'24px 20px', borderRadius:12, background: plan.hl ? 'rgba(139,92,246,.06)' : 'rgba(255,255,255,.02)', border: plan.hl ? '1px solid rgba(139,92,246,.3)' : '1px solid rgba(255,255,255,.06)', boxShadow: plan.hl ? '0 0 40px rgba(139,92,246,.08)' : 'none' }}>
                    {plan.hl && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', background:'#7c3aed', color:'#fff', fontSize:10, fontWeight:600, padding:'3px 12px', borderRadius:'0 0 8px 8px' }}>Popular</div>}
                    <p style={{ fontSize:14, fontWeight:600, marginTop: plan.hl ? 12 : 0 }}>{plan.n}</p>
                    <p style={{ fontSize:11, color:'#888', marginTop:2 }}>{plan.d}</p>
                    <div style={{ display:'flex', alignItems:'baseline', gap:3, margin:'16px 0' }}>
                      <span style={{ fontSize:36, fontWeight:800, letterSpacing:'-.04em' }}>{plan.p}</span>
                      <span style={{ fontSize:13, color:'#888' }}>{plan.per}</span>
                    </div>
                    <ul style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                      {plan.f.map(f=>(
                        <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:13, color:'#95a2b3' }}>
                          <Check style={{ width:13, height:13, color:'#34d399', marginTop:2, flexShrink:0 }} />{f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:38, borderRadius:8, marginTop:20, fontSize:13, fontWeight:500, textDecoration:'none', transition:'all .15s', background: plan.hl ? '#7c3aed' : 'rgba(255,255,255,.05)', color: plan.hl ? '#fff' : '#888', border: plan.hl ? 'none' : '1px solid rgba(255,255,255,.08)' }}>{plan.cta}</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ FAQ ════════════════════════════════════════════ */}
          <section style={{ padding:'96px 24px', borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <div style={{ maxWidth:600, margin:'0 auto' }}>
              <h2 style={{ textAlign:'center', fontSize:'clamp(24px,3.5vw,36px)', fontWeight:700, letterSpacing:'-.02em', marginBottom:40 }}>Questions</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {FAQ.map(f=>(
                  <details key={f.q} style={{ borderRadius:10, border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)' }}>
                    <summary style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:14, fontWeight:500 }}>{f.q}<ChevronDown className="chev" style={{ width:15, height:15, color:'#888', flexShrink:0 }} /></summary>
                    <div style={{ padding:'0 20px 16px', fontSize:14, lineHeight:1.65, color:'#95a2b3' }}>{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ══ CTA ═══════════════════════════════════════════ */}
          <section style={{ padding:'96px 24px', position:'relative' }}>
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 80%,rgba(139,92,246,.12) 0%,transparent 60%)' }} />
            <div style={{ maxWidth:560, margin:'0 auto', textAlign:'center', position:'relative' }}>
              <h2 style={{ fontSize:'clamp(32px,5.5vw,52px)', fontWeight:700, letterSpacing:'-.035em', lineHeight:1.08 }}>Stop editing.<br /><span className="gt">Start publishing.</span></h2>
              <p style={{ fontSize:15, color:'#95a2b3', marginTop:16, maxWidth:400, marginLeft:'auto', marginRight:'auto' }}>30+ AI tools. Real video rendering. Zero markup. Free to start.</p>
              <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:6, height:44, padding:'0 28px', borderRadius:8, background:'#fff', color:'#000', fontSize:15, fontWeight:500, textDecoration:'none', marginTop:32 }}>Create free account <ArrowRight style={{ width:15, height:15 }} /></Link>
              <p style={{ marginTop:12, fontSize:12, color:'rgba(255,255,255,.2)' }}>No credit card required</p>
            </div>
          </section>
        </main>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'40px 24px' }}>
          <div style={{ maxWidth:900, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
            <div>
              <span style={{ fontSize:15, fontWeight:700, background:'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Clipflow</span>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.2)', marginTop:4, maxWidth:240 }}>AI video repurposing with real rendering. One video — every platform.</p>
            </div>
            <div style={{ display:'flex', gap:36, fontSize:12, color:'rgba(255,255,255,.25)' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[['#features','Features'],['#pricing','Pricing'],['#compare','Compare'],['#how','How it works']].map(([h,l])=><a key={h} href={h} style={{ textDecoration:'none', color:'inherit' }}>{l}</a>)}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <Link href="/login" style={{ textDecoration:'none', color:'inherit' }}>Log in</Link>
                <Link href="/signup" style={{ textDecoration:'none', color:'inherit' }}>Sign up</Link>
                <Link href="/changelog" style={{ textDecoration:'none', color:'inherit' }}>Changelog</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <Link href="/privacy" style={{ textDecoration:'none', color:'inherit' }}>Privacy</Link>
                <Link href="/terms" style={{ textDecoration:'none', color:'inherit' }}>Terms</Link>
              </div>
            </div>
          </div>
          <div style={{ maxWidth:900, margin:'28px auto 0', paddingTop:16, borderTop:'1px solid rgba(255,255,255,.04)', fontSize:11, color:'rgba(255,255,255,.12)' }}>© {new Date().getFullYear()} Clipflow. All rights reserved.</div>
        </footer>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:'Clipflow',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:'https://clipflow.to',offers:[{price:'0',name:'Free'},{price:'19',name:'Solo'},{price:'49',name:'Team'},{price:'99',name:'Agency'}].map(o=>({'@type':'Offer',priceCurrency:'USD',...o}))}) }} />
    </>
  )
}
