import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, X, ChevronDown, Play, Star, Zap, Video, PenTool, BarChart3, Globe, Calendar, Layers, Mic, Hash, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Clipflow — AI Video Repurposing · TikTok, Reels, Shorts & LinkedIn',
  description: 'Turn one video into platform-native content. AI subtitles, B-Roll, virality scoring, video clipping. BYOK — zero AI markup.',
  alternates: { canonical: 'https://clipflow.to' },
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

export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes marquee { 0% { transform:translateX(0) } 100% { transform:translateX(-50%) } }
        .fu { animation:fade-up .6s ease both }
        .fu1 { animation:fade-up .6s .08s ease both }
        .fu2 { animation:fade-up .6s .16s ease both }
        .fu3 { animation:fade-up .6s .28s ease both }
        .mq { animation:marquee 30s linear infinite }
        details summary { list-style:none } details summary::-webkit-details-marker { display:none }
        details[open] .chv { transform:rotate(180deg) } .chv { transition:transform .2s }
      `}</style>

      <div style={{ background:'#fff', color:'#1a1a1a', minHeight:'100vh', fontFamily:'var(--font-inter),-apple-system,BlinkMacSystemFont,sans-serif' }}>

        {/* ══ NAV ═══════════════════════════════════════════════ */}
        <header style={{ position:'sticky', top:0, zIndex:100, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', borderBottom:'1px solid #eee', background:'rgba(255,255,255,.95)', backdropFilter:'blur(12px)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:32 }}>
            <span style={{ fontSize:18, fontWeight:800, letterSpacing:'-.02em', color:'#7c3aed' }}>Clipflow</span>
            <nav style={{ display:'flex', gap:24, fontSize:14, color:'#666' }}>
              {[['#features','Features'],['#pricing','Pricing'],['#compare','Compare'],['#faq','FAQ']].map(([h,l])=>(
                <a key={h} href={h} style={{ textDecoration:'none', color:'inherit', transition:'color .15s' }}>{l}</a>
              ))}
            </nav>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/login" style={{ fontSize:14, color:'#666', textDecoration:'none', padding:'8px 16px' }}>Log in</Link>
            <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', height:40, padding:'0 20px', borderRadius:8, background:'#7c3aed', color:'#fff', fontSize:14, fontWeight:600, textDecoration:'none', transition:'background .15s' }}>Try for free</Link>
          </div>
        </header>

        <main>

          {/* ══ HERO ════════════════════════════════════════════ */}
          <section style={{ position:'relative', overflow:'hidden', textAlign:'center', padding:'80px 24px 60px', background:'linear-gradient(180deg, #f8f6ff 0%, #fff 100%)' }}>
            <div style={{ position:'relative', maxWidth:720, margin:'0 auto' }}>
              {/* Badge */}
              <div className="fu" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background:'#f0ebff', fontSize:13, fontWeight:600, color:'#7c3aed', marginBottom:24 }}>
                <Zap style={{ width:13, height:13 }} /> Now with AI video rendering
              </div>

              <h1 className="fu1" style={{ fontSize:'clamp(36px, 6vw, 56px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-.03em', color:'#1a1a1a' }}>
                Turn one video into content for{' '}
                <span style={{ color:'#7c3aed' }}>every platform</span>
              </h1>

              <p className="fu2" style={{ fontSize:18, lineHeight:1.6, color:'#666', maxWidth:540, margin:'20px auto 0' }}>
                Paste a YouTube link. Get TikTok, Reels, Shorts &amp; LinkedIn drafts — with AI subtitles, B-Roll, and virality scoring. Real MP4 rendering included.
              </p>

              <div className="fu3" style={{ display:'flex', gap:10, justifyContent:'center', marginTop:28 }}>
                <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:6, height:48, padding:'0 28px', borderRadius:10, background:'#7c3aed', color:'#fff', fontSize:16, fontWeight:600, textDecoration:'none', boxShadow:'0 4px 14px rgba(124,58,237,.25)', transition:'all .15s' }}>
                  Start for free <ArrowRight style={{ width:16, height:16 }} />
                </Link>
                <Link href="#features" style={{ display:'inline-flex', alignItems:'center', gap:6, height:48, padding:'0 24px', borderRadius:10, border:'1px solid #ddd', color:'#666', fontSize:16, fontWeight:500, textDecoration:'none', transition:'all .15s' }}>
                  <Play style={{ width:14, height:14 }} /> See features
                </Link>
              </div>
              <p style={{ marginTop:12, fontSize:13, color:'#999' }}>No credit card required · Free forever plan</p>

              {/* Social proof */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:28 }}>
                <div style={{ display:'flex' }}>
                  {['#7c3aed','#ec4899','#f97316','#10b981','#0ea5e9'].map((c,i)=>(
                    <div key={i} style={{ width:30, height:30, borderRadius:'50%', background:c, border:'2.5px solid #fff', marginLeft:i>0?-8:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                      {['S','M','P','J','L'][i]}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize:14, color:'#666' }}>Trusted by <strong style={{ color:'#1a1a1a' }}>2,400+</strong> creators</span>
                <div style={{ display:'flex', gap:1 }}>
                  {[1,2,3,4,5].map(i=><Star key={i} style={{ width:14, height:14, fill:'#fbbf24', color:'#fbbf24' }} />)}
                </div>
              </div>
            </div>

            {/* Product mockup */}
            <div style={{ position:'relative', marginTop:48, maxWidth:960, marginLeft:'auto', marginRight:'auto', padding:'0 20px' }}>
              <div style={{ borderRadius:16, border:'1px solid #e5e7eb', boxShadow:'0 20px 60px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.05)', overflow:'hidden', background:'#0c0c0f' }}>
                <div style={{ display:'flex', alignItems:'center', height:36, padding:'0 12px', gap:6, borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  {['#ff5f57','#febc2e','#28c840'].map((c,i)=>(<span key={i} style={{ width:10, height:10, borderRadius:'50%', background:c }} />))}
                  <div style={{ flex:1, height:20, borderRadius:5, margin:'0 40px', background:'rgba(255,255,255,.04)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'rgba(255,255,255,.2)' }}>clipflow.to</div>
                </div>
                <div style={{ display:'flex', height:320 }}>
                  <div style={{ width:150, flexShrink:0, background:'#0e0e12', borderRight:'1px solid rgba(255,255,255,.06)', padding:'10px 8px' }}>
                    {['Dashboard','Pipeline','Calendar','Ghostwriter','All Tools','Trends'].map((n,i)=>(
                      <div key={n} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 7px', borderRadius:5, marginBottom:1, background:i===4?'rgba(124,58,237,.12)':'transparent' }}>
                        <span style={{ fontSize:10, color:i===4?'#a78bfa':'rgba(255,255,255,.25)' }}>{'◈▤◷✦🔮📈'[i]}</span>
                        <span style={{ fontSize:10.5, color:i===4?'#e0e0e0':'rgba(255,255,255,.3)' }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ flex:1, padding:'12px', background:'#0c0c0f' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <div><p style={{ fontSize:12, fontWeight:600, color:'#fff' }}>Product Demo.mp4</p><p style={{ fontSize:9, color:'rgba(255,255,255,.3)', marginTop:1 }}>4 drafts · 24s</p></div>
                      <span style={{ fontSize:8, fontWeight:600, padding:'3px 7px', borderRadius:999, background:'rgba(52,211,153,.1)', color:'#34d399' }}>✓ Ready</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                      {[{p:'TikTok',s:94,bg:'rgba(236,72,153,.06)',b:'rgba(236,72,153,.12)',c:'#f9a8d4'},{p:'Reels',s:89,bg:'rgba(168,85,247,.06)',b:'rgba(168,85,247,.12)',c:'#d8b4fe'},{p:'Shorts',s:85,bg:'rgba(239,68,68,.06)',b:'rgba(239,68,68,.12)',c:'#fca5a5'},{p:'LinkedIn',s:81,bg:'rgba(59,130,246,.06)',b:'rgba(59,130,246,.12)',c:'#93c5fd'}].map(c=>(
                        <div key={c.p} style={{ padding:'8px', borderRadius:6, background:c.bg, border:`1px solid ${c.b}` }}>
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                            <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:999, background:c.b, color:c.c }}>{c.p}</span>
                            <span style={{ fontSize:10, fontWeight:700, color:c.s>88?'#34d399':'#fbbf24' }}>{c.s}</span>
                          </div>
                          <p style={{ fontSize:9.5, lineHeight:1.4, color:'rgba(255,255,255,.5)' }}>AI-generated platform draft...</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══ LOGOS ═══════════════════════════════════════════ */}
          <section style={{ padding:'32px 24px', borderBottom:'1px solid #eee' }}>
            <p style={{ textAlign:'center', fontSize:13, fontWeight:500, color:'#999', marginBottom:16, letterSpacing:'.03em', textTransform:'uppercase' }}>Powered by leading AI providers</p>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:48, flexWrap:'wrap' }}>
              {['OpenAI','Anthropic','Google Gemini','ElevenLabs','Shotstack','Pexels'].map(n=>(
                <span key={n} style={{ fontSize:14, fontWeight:600, color:'#bbb' }}>{n}</span>
              ))}
            </div>
          </section>

          {/* ══ FEATURES GRID ══════════════════════════════════ */}
          <section id="features" style={{ padding:'80px 24px' }}>
            <div style={{ maxWidth:1000, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:56 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'#7c3aed', marginBottom:8 }}>30+ AI Tools</p>
                <h2 style={{ fontSize:'clamp(28px, 4vw, 42px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-.02em', color:'#1a1a1a' }}>Everything you need to repurpose content</h2>
                <p style={{ fontSize:16, color:'#888', marginTop:12, maxWidth:480, marginLeft:'auto', marginRight:'auto' }}>From strategy to publishing — one platform replaces your entire content workflow.</p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
                {[
                  { icon:Video, color:'#7c3aed', bg:'#f0ebff', title:'Video Rendering', desc:'Burn captions, stitch B-Roll, clip segments, add brand intros. Real MP4 output via Shotstack.' },
                  { icon:Zap, color:'#f59e0b', bg:'#fffbeb', title:'4 Platform Drafts', desc:'TikTok, Reels, Shorts, LinkedIn — all generated simultaneously in under 30 seconds.' },
                  { icon:PenTool, color:'#ec4899', bg:'#fdf2f8', title:'AI Ghostwriter', desc:'Full video scripts from a topic or trend. Brand voice and persona applied automatically.' },
                  { icon:BarChart3, color:'#10b981', bg:'#ecfdf5', title:'Virality Score', desc:'AI scores every output on hook strength, scroll-stop power, and shareability — before you post.' },
                  { icon:Mic, color:'#8b5cf6', bg:'#f5f3ff', title:'AI Persona', desc:'Give the AI a name, backstory, expertise, and writing style. Every draft sounds like them.' },
                  { icon:Calendar, color:'#0ea5e9', bg:'#f0f9ff', title:'30-Day Calendar', desc:'Input your niche → AI generates a full month of content ideas with hooks and scripts.' },
                  { icon:Users, color:'#f97316', bg:'#fff7ed', title:'Creator Search', desc:'Find creators on YouTube, TikTok, Instagram, Twitter, LinkedIn. Powered by ScrapeCreators.' },
                  { icon:Hash, color:'#06b6d4', bg:'#ecfeff', title:'Hashtag Research', desc:'Data-driven hashtag analysis with reach estimates, competition levels, and ready-to-use sets.' },
                  { icon:Globe, color:'#6366f1', bg:'#eef2ff', title:'24 Integrations', desc:'Slack, Discord, WordPress, Beehiiv, Notion, Airtable, Zapier, Make, and 16 more.' },
                ].map((f,i)=>(
                  <div key={i} style={{ padding:'28px 24px', borderRadius:12, border:'1px solid #eee', background:'#fff', transition:'all .2s', cursor:'default' }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                      <f.icon style={{ width:22, height:22, color:f.color }} />
                    </div>
                    <h3 style={{ fontSize:17, fontWeight:700, marginBottom:6, color:'#1a1a1a' }}>{f.title}</h3>
                    <p style={{ fontSize:14, lineHeight:1.6, color:'#888' }}>{f.desc}</p>
                  </div>
                ))}
              </div>

              {/* BYOK banner */}
              <div style={{ marginTop:16, padding:'28px 32px', borderRadius:12, background:'linear-gradient(135deg, #7c3aed, #6366f1)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
                <div>
                  <h3 style={{ fontSize:20, fontWeight:700, color:'#fff' }}>BYOK — Bring Your Own Key</h3>
                  <p style={{ fontSize:15, color:'rgba(255,255,255,.8)', marginTop:6, maxWidth:480 }}>Connect your own OpenAI, Anthropic, or Google key. All AI at cost — zero markup. Saves teams $200+/month.</p>
                </div>
                <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:6, height:44, padding:'0 24px', borderRadius:10, background:'#fff', color:'#7c3aed', fontSize:15, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>Try free <ArrowRight style={{ width:15, height:15 }} /></Link>
              </div>
            </div>
          </section>

          {/* ══ TESTIMONIALS MARQUEE ════════════════════════════ */}
          <section style={{ padding:'48px 0', background:'#fafafa', borderTop:'1px solid #eee', borderBottom:'1px solid #eee', overflow:'hidden' }}>
            <p style={{ textAlign:'center', fontSize:14, fontWeight:600, color:'#999', marginBottom:20 }}>What creators are saying</p>
            <div style={{ display:'flex', width:'max-content' }} className="mq">
              {[...Array(2)].map((_,si)=>(
                <div key={si} style={{ display:'flex', gap:16, paddingRight:16 }}>
                  {[
                    { q:'"Cut my production time by 90%"', n:'Sarah K.', r:'Creator · 280K' },
                    { q:'"LinkedIn posts that sound human"', n:'Marcus T.', r:'Agency Owner' },
                    { q:'"BYOK saves us $400/month"', n:'Priya M.', r:'Head of Content' },
                    { q:'"Content DNA is a game changer"', n:'Jake R.', r:'YouTuber · 150K' },
                    { q:'"30 tools in one place"', n:'Omar S.', r:'Freelancer' },
                    { q:'"Real video rendering — finally"', n:'Lisa C.', r:'Social Manager' },
                  ].map(t=>(
                    <div key={t.n} style={{ minWidth:280, padding:'20px', borderRadius:12, background:'#fff', border:'1px solid #eee', boxShadow:'0 1px 3px rgba(0,0,0,.04)' }}>
                      <div style={{ display:'flex', gap:1, marginBottom:10 }}>{[1,2,3,4,5].map(i=><Star key={i} style={{ width:12, height:12, fill:'#fbbf24', color:'#fbbf24' }} />)}</div>
                      <p style={{ fontSize:15, fontWeight:500, color:'#1a1a1a', marginBottom:12 }}>{t.q}</p>
                      <p style={{ fontSize:13, color:'#888' }}><strong style={{ color:'#555' }}>{t.n}</strong> · {t.r}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* ══ COMPARE ════════════════════════════════════════ */}
          <section id="compare" style={{ padding:'80px 24px' }}>
            <div style={{ maxWidth:720, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:40 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'#7c3aed', marginBottom:8 }}>Compare</p>
                <h2 style={{ fontSize:'clamp(26px, 3.5vw, 38px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-.02em' }}>More tools. Real video. Zero markup.</h2>
              </div>
              <div style={{ borderRadius:12, border:'1px solid #eee', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid #eee', background:'#fafafa' }}>
                      <th style={{ padding:'12px 16px', textAlign:'left', fontSize:13, fontWeight:500, color:'#888' }}>Feature</th>
                      <th style={{ padding:'12px 16px', textAlign:'center', fontSize:13, fontWeight:700, color:'#7c3aed' }}>Clipflow</th>
                      <th style={{ padding:'12px 16px', textAlign:'center', fontSize:13, fontWeight:500, color:'#888' }}>OpusClip</th>
                      <th style={{ padding:'12px 16px', textAlign:'center', fontSize:13, fontWeight:500, color:'#888' }}>Klap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMP.map((r,i)=>(
                      <tr key={r.f} style={{ borderBottom:i<COMP.length-1?'1px solid #f0f0f0':'none' }}>
                        <td style={{ padding:'10px 16px', fontSize:13, color:'#666' }}>{r.f}</td>
                        {[r.c,r.o,r.k].map((v,j)=>(
                          <td key={j} style={{ padding:'10px 16px', textAlign:'center' }}>
                            {v===true?<Check style={{ width:16, height:16, color:'#7c3aed', margin:'0 auto' }} />:v===false?<X style={{ width:16, height:16, color:'#ddd', margin:'0 auto' }} />:<span style={{ fontSize:11, color:'#888' }}>{v}</span>}
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
          <section id="pricing" style={{ padding:'80px 24px', background:'#fafafa', borderTop:'1px solid #eee' }}>
            <div style={{ maxWidth:960, margin:'0 auto' }}>
              <div style={{ textAlign:'center', marginBottom:48 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'#7c3aed', marginBottom:8 }}>Pricing</p>
                <h2 style={{ fontSize:'clamp(26px, 3.5vw, 38px)', fontWeight:800, lineHeight:1.1, letterSpacing:'-.02em' }}>Start free. Scale when ready.</h2>
                <p style={{ fontSize:15, color:'#888', marginTop:10 }}>BYOK — you pay your AI provider at cost. Zero markup from us.</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                {[
                  { n:'Free', p:'$0', per:'/forever', d:'Try it out.', f:['3 content/mo','10 outputs/mo','1 workspace','All AI tools'], cta:'Get started', hl:false },
                  { n:'Solo', p:'$19', per:'/mo', d:'For creators.', f:['20 content/mo','100 outputs/mo','Brand voice + persona','Video rendering','Review links'], cta:'Start trial', hl:true },
                  { n:'Team', p:'$49', per:'/mo', d:'For teams.', f:['100 content/mo','500 outputs/mo','5 workspaces','Team members','Everything in Solo'], cta:'Start trial', hl:false },
                  { n:'Agency', p:'$99', per:'/mo', d:'Unlimited.', f:['Unlimited content','Unlimited outputs','White-label portals','API access','Priority support'], cta:'Contact us', hl:false },
                ].map(plan=>(
                  <div key={plan.n} style={{ position:'relative', display:'flex', flexDirection:'column', padding:'28px 22px', borderRadius:12, background:'#fff', border:plan.hl?'2px solid #7c3aed':'1px solid #eee', boxShadow:plan.hl?'0 8px 30px rgba(124,58,237,.12)':'0 1px 3px rgba(0,0,0,.04)' }}>
                    {plan.hl&&<div style={{ position:'absolute', top:-1, left:'50%', transform:'translateX(-50)', background:'#7c3aed', color:'#fff', fontSize:11, fontWeight:600, padding:'4px 14px', borderRadius:'0 0 8px 8px' }}>Most popular</div>}
                    <p style={{ fontSize:16, fontWeight:700, marginTop:plan.hl?12:0 }}>{plan.n}</p>
                    <p style={{ fontSize:13, color:'#888', marginTop:2 }}>{plan.d}</p>
                    <div style={{ display:'flex', alignItems:'baseline', gap:3, margin:'16px 0' }}>
                      <span style={{ fontSize:40, fontWeight:800, letterSpacing:'-.04em' }}>{plan.p}</span>
                      <span style={{ fontSize:14, color:'#888' }}>{plan.per}</span>
                    </div>
                    <ul style={{ display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                      {plan.f.map(f=>(
                        <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#666' }}>
                          <Check style={{ width:14, height:14, color:'#10b981', flexShrink:0 }} />{f}
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" style={{ display:'flex', alignItems:'center', justifyContent:'center', height:42, borderRadius:8, marginTop:20, fontSize:14, fontWeight:600, textDecoration:'none', transition:'all .15s', background:plan.hl?'#7c3aed':'#fff', color:plan.hl?'#fff':'#666', border:plan.hl?'none':'1px solid #ddd' }}>{plan.cta}</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══ FAQ ════════════════════════════════════════════ */}
          <section id="faq" style={{ padding:'80px 24px' }}>
            <div style={{ maxWidth:600, margin:'0 auto' }}>
              <h2 style={{ textAlign:'center', fontSize:'clamp(24px,3.5vw,34px)', fontWeight:800, letterSpacing:'-.02em', marginBottom:36 }}>Frequently asked questions</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {FAQ.map(f=>(
                  <details key={f.q} style={{ borderRadius:10, border:'1px solid #eee', background:'#fff' }}>
                    <summary style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:15, fontWeight:600, color:'#1a1a1a' }}>{f.q}<ChevronDown className="chv" style={{ width:16, height:16, color:'#999', flexShrink:0 }} /></summary>
                    <div style={{ padding:'0 20px 16px', fontSize:14, lineHeight:1.65, color:'#888' }}>{f.a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* ══ CTA ═══════════════════════════════════════════ */}
          <section style={{ padding:'80px 24px', background:'linear-gradient(135deg, #7c3aed, #6366f1)', textAlign:'center' }}>
            <div style={{ maxWidth:560, margin:'0 auto' }}>
              <h2 style={{ fontSize:'clamp(28px, 5vw, 44px)', fontWeight:800, letterSpacing:'-.03em', lineHeight:1.1, color:'#fff' }}>Ready to stop editing and start publishing?</h2>
              <p style={{ fontSize:16, color:'rgba(255,255,255,.8)', marginTop:16 }}>30+ AI tools. Real video rendering. Zero markup. Free to start.</p>
              <Link href="/signup" style={{ display:'inline-flex', alignItems:'center', gap:6, height:48, padding:'0 32px', borderRadius:10, background:'#fff', color:'#7c3aed', fontSize:16, fontWeight:600, textDecoration:'none', marginTop:28, boxShadow:'0 4px 14px rgba(0,0,0,.15)' }}>Create free account <ArrowRight style={{ width:16, height:16 }} /></Link>
              <p style={{ marginTop:12, fontSize:13, color:'rgba(255,255,255,.5)' }}>No credit card required</p>
            </div>
          </section>
        </main>

        {/* ══ FOOTER ══════════════════════════════════════════ */}
        <footer style={{ padding:'48px 24px', borderTop:'1px solid #eee' }}>
          <div style={{ maxWidth:960, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:32 }}>
            <div>
              <span style={{ fontSize:18, fontWeight:800, color:'#7c3aed' }}>Clipflow</span>
              <p style={{ fontSize:13, color:'#999', marginTop:6, maxWidth:240 }}>AI video repurposing with real rendering. One video — every platform.</p>
            </div>
            <div style={{ display:'flex', gap:40, fontSize:13 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontWeight:700, color:'#1a1a1a', marginBottom:4 }}>Product</p>
                {['Features','Pricing','Compare','Changelog'].map(l=><a key={l} href={l==='Changelog'?'/changelog':`#${l.toLowerCase()}`} style={{ textDecoration:'none', color:'#888' }}>{l}</a>)}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontWeight:700, color:'#1a1a1a', marginBottom:4 }}>Account</p>
                <Link href="/login" style={{ textDecoration:'none', color:'#888' }}>Log in</Link>
                <Link href="/signup" style={{ textDecoration:'none', color:'#888' }}>Sign up</Link>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <p style={{ fontWeight:700, color:'#1a1a1a', marginBottom:4 }}>Legal</p>
                <Link href="/privacy" style={{ textDecoration:'none', color:'#888' }}>Privacy</Link>
                <Link href="/terms" style={{ textDecoration:'none', color:'#888' }}>Terms</Link>
              </div>
            </div>
          </div>
          <div style={{ maxWidth:960, margin:'32px auto 0', paddingTop:20, borderTop:'1px solid #eee', fontSize:12, color:'#ccc' }}>© {new Date().getFullYear()} Clipflow. All rights reserved.</div>
        </footer>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:'Clipflow',applicationCategory:'BusinessApplication',operatingSystem:'Web',url:'https://clipflow.to',offers:[{price:'0',name:'Free'},{price:'19',name:'Solo'},{price:'49',name:'Team'},{price:'99',name:'Agency'}].map(o=>({'@type':'Offer',priceCurrency:'USD',...o}))}) }} />
    </>
  )
}
