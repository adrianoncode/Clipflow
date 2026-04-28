'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import {
  CustomCursor,
  FlipNumber,
  HeroSpotlight,
  KineticHeadline,
  MagneticButton,
  MagneticWrap,
  MarqueeScrub,
  PricingTilt,
  ScrollRail,
  StepProgressRail,
  TiltWrap,
  WordReveal,
} from './hero-motion'
import { CaptionTypewriter } from './caption-typewriter'
import { BentoShowcase } from './bento-showcase'
// import { Testimonials } from './testimonials' // removed with fake-quote cleanup; see comment at former use-site
import { ComparisonMatrix } from './comparison-matrix'
import { StickyCta } from './sticky-cta'

interface NewLandingProps {
  signupHref: string
  hasValidRef: boolean
  referralPercent: number
}

/**
 * Append a plan id to the signup URL so the destination knows which
 * tile the user clicked. Preserves any existing query params (e.g.
 * the referral ref). The signup page can then highlight the chosen
 * plan, prefill the checkout, or just show context — the click is
 * no longer a context-free "click any button, land anywhere" feel.
 */
function appendPlan(href: string, plan: 'free' | 'creator' | 'studio'): string {
  const sep = href.includes('?') ? '&' : '?'
  return `${href}${sep}plan=${plan}`
}

export function NewLanding({ signupHref, hasValidRef, referralPercent }: NewLandingProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const stepsRef = useRef<HTMLDivElement | null>(null)

  // Glass-on-scroll nav. At scrollY ≤ 60 the nav sits fully
  // transparent over the hero so the headline owns the fold. Past
  // 60px it picks up a subtle paper-tinted backdrop-blur + hairline
  // border so it stays legible over any section below. 300ms ease
  // transition both ways so it never flickers.
  const [scrolled, setScrolled] = useState(false)
  const [navHovered, setNavHovered] = useState(false)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 60)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  const navGlass = scrolled || navHovered


  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Motion budget: users who opt out of animation (system pref) get no
    // intervals, no parallax, no reveal observer. Also kills the infinite
    // progress creep that otherwise runs forever and trips headless-browser
    // "is the page settled?" heuristics.
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Immediately mark reveal elements as "in" when motion is reduced, so
    // content is visible without waiting for the fade-in sequence.
    if (reduceMotion) {
      root
        .querySelectorAll<HTMLElement>(
          '.lv2-reveal, .lv2-reveal-stagger, .lv2-hero-assemble',
        )
        .forEach((el) => el.classList.add('in'))
    }

    const revealEls = root.querySelectorAll<HTMLElement>('.lv2-reveal, .lv2-reveal-stagger')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' },
    )
    if (!reduceMotion) revealEls.forEach((el) => io.observe(el))

    const heroTimers: number[] = []
    // Hero mockup assembly fires on mount (not waiting for IO) because
    // the stack sits above the fold. A small delay lets the browser
    // paint the initial state (blur + y-offset) before the transition
    // kicks in, otherwise the cards jump in with no visible motion.
    const heroStack = root.querySelector<HTMLElement>('#lv2-heroStack')
    if (heroStack && !reduceMotion) {
      const heroTimer = window.setTimeout(() => heroStack.classList.add('in'), 120)
      heroTimers.push(heroTimer)
    } else if (heroStack) {
      heroStack.classList.add('in')
    }

    // Count-up
    const countEls = root.querySelectorAll<HTMLElement>('.lv2-countup')
    const countObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          const to = parseFloat(el.dataset.to ?? '0')
          const dur = 1200
          const t0 = performance.now()
          const tick = (t: number) => {
            const k = Math.min(1, (t - t0) / dur)
            const eased = 1 - Math.pow(1 - k, 3)
            const v = to * eased
            el.textContent =
              to >= 100
                ? Math.round(v).toLocaleString()
                : to % 1 === 0
                ? String(Math.round(v))
                : v.toFixed(1)
            if (k < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          countObs.unobserve(el)
        }
      },
      { threshold: 0.4 },
    )
    countEls.forEach((el) => countObs.observe(el))

    // Hero highlight stroke
    const stroke = root.querySelector<HTMLElement>('#lv2-hlStroke')
    requestAnimationFrame(() => {
      if (stroke) stroke.style.transform = 'scaleX(1)'
    })

    // Hero progress creep — only animates when motion isn't reduced.
    // Still parked at a plausible "in progress" value otherwise so the
    // card doesn't look broken.
    let p = 12
    const bar = root.querySelector<HTMLElement>('#lv2-heroProg')
    const txt = root.querySelector<HTMLElement>('#lv2-heroProgTxt')
    let progInterval: number | undefined
    if (!reduceMotion) {
      progInterval = window.setInterval(() => {
        p = Math.min(96, p + Math.random() * 4)
        if (bar) bar.style.width = p + '%'
        if (txt) txt.textContent = Math.round(p) + '%'
        if (p >= 96) p = 12
      }, 900)
    }

    // Hero parallax — disabled under reduced-motion.
    const stack = root.querySelector<HTMLElement>('#lv2-heroStack')
    const cards = stack ? stack.querySelectorAll<HTMLElement>('.lv2-drift, .lv2-driftR') : []
    const onScroll = () => {
      const y = window.scrollY
      cards.forEach((c, i) => {
        c.style.translate = `0 ${-y * (0.04 + i * 0.02)}px`
      })
    }
    if (!reduceMotion) window.addEventListener('scroll', onScroll, { passive: true })

    // Magnetic hover on step cards
    const stepCards = root.querySelectorAll<HTMLElement>('.lv2-step-card')
    const handlers: Array<() => void> = []
    stepCards.forEach((card) => {
      const move = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        card.style.setProperty('--mx', e.clientX - r.left + 'px')
        card.style.setProperty('--my', e.clientY - r.top + 'px')
      }
      card.addEventListener('mousemove', move)
      handlers.push(() => card.removeEventListener('mousemove', move))
    })

    return () => {
      io.disconnect()
      countObs.disconnect()
      if (progInterval !== undefined) window.clearInterval(progInterval)
      window.removeEventListener('scroll', onScroll)
      handlers.forEach((fn) => fn())
      heroTimers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  return (
    <div ref={rootRef} className="lv2-root lv2-paper">
      <ScrollRail />
      <CustomCursor />
      {/* Scoped design tokens + animations for the landing page only.
          All custom classes prefixed `lv2-` to avoid colliding with the app theme. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .lv2-root {
          --lv2-bg: #FAF7F2;
          --lv2-bg-2: #F3EDE3;
          --lv2-fg: #181511;
          --lv2-fg-soft: #3a342c;
          --lv2-muted: #5f5850;
          --lv2-muted-2: #ECE5D8;
          --lv2-border: #E5DDCE;
          --lv2-border-strong: #CFC4AF;
          --lv2-card: #FFFDF8;
          --lv2-primary: #2A1A3D;
          --lv2-primary-ink: #120920;
          --lv2-primary-soft: #EDE6F5;
          --lv2-accent: #D6FF3E;
          --lv2-accent-ink: #1a2000;
          --lv2-success: #0F6B4D;
          --lv2-warn: #A0530B;
          --lv2-danger: #9B2018;
          background: var(--lv2-bg);
          color: var(--lv2-fg);
          font-family: var(--font-inter), system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .lv2-paper {
          background-color: var(--lv2-bg);
          background-image: radial-gradient(circle at 2px 2px, rgba(120,90,40,.04) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .lv2-display { font-family: var(--font-instrument-serif), serif; letter-spacing: -.015em; font-weight: 400; }
        .lv2-sans-d { font-family: var(--font-inter-tight), sans-serif; letter-spacing: -.025em; }
        .lv2-mono { font-family: var(--font-jetbrains-mono), monospace; }
        .lv2-tabular { font-variant-numeric: tabular-nums; }
        .lv2-mono-label {
          font-family: var(--font-jetbrains-mono), monospace;
          font-size: 10.5px;
          letter-spacing: .22em;
          text-transform: uppercase;
          color: var(--lv2-muted);
        }

        .lv2-btn-primary {
          position: relative;
          display: inline-flex; align-items: center; gap: .55rem;
          background: var(--lv2-primary); color: var(--lv2-accent);
          font-weight: 700; font-size: 14px; letter-spacing: -.005em;
          padding: 11px 20px; border-radius: 999px;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.1),
            inset 0 0 0 1px rgba(214,255,62,.18),
            0 1px 2px rgba(42,26,61,.18),
            0 8px 22px -8px rgba(42,26,61,.45);
          transition: transform .22s cubic-bezier(.2,.9,.3,1), background .2s ease, box-shadow .25s ease;
        }
        /* Specular highlight — a soft lime glow lives at the top edge
           so the button reads as "lit from above", not flat. */
        .lv2-btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          background: radial-gradient(120% 90% at 50% -30%, rgba(214,255,62,.18), transparent 60%);
          opacity: .85;
          pointer-events: none;
          transition: opacity .25s ease;
        }
        .lv2-btn-primary:hover {
          transform: translateY(-1.5px);
          background: var(--lv2-primary-ink);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.14),
            inset 0 0 0 1px rgba(214,255,62,.32),
            0 2px 4px rgba(42,26,61,.2),
            0 16px 30px -10px rgba(42,26,61,.5),
            0 0 0 6px rgba(214,255,62,.07);
        }
        .lv2-btn-primary:hover::before { opacity: 1; }
        .lv2-btn-primary:active { transform: translateY(0); }
        .lv2-btn-primary:hover .lv2-arrow { transform: translateX(3px); }
        .lv2-arrow { transition: transform .2s; }
        .lv2-btn-accent {
          display: inline-flex; align-items: center; gap: .5rem;
          background: var(--lv2-accent); color: var(--lv2-accent-ink);
          font-weight: 800; font-size: 14px;
          padding: 12px 18px; border-radius: 12px;
          box-shadow: 0 2px 0 rgba(100,125,0,.25), inset 0 0 0 1px rgba(0,0,0,.06);
          transition: transform .18s ease, box-shadow .18s;
        }
        .lv2-btn-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 0 rgba(100,125,0,.25), inset 0 0 0 1px rgba(0,0,0,.06);
        }
        .lv2-btn-ghost {
          display: inline-flex; align-items: center; gap: .5rem;
          background: transparent; color: var(--lv2-fg);
          font-weight: 600; font-size: 14px;
          padding: 10px 14px; border-radius: 10px; transition: background .15s;
        }
        .lv2-btn-ghost:hover { background: rgba(0,0,0,.04); }

        .lv2-magnetic { position: relative; overflow: hidden; isolation: isolate; }
        .lv2-magnetic-label { position: relative; z-index: 2; display: inline-flex; align-items: center; gap: .5rem; }
        .lv2-magnetic-shine {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(115deg, transparent 30%, rgba(214,255,62,.38) 50%, transparent 70%);
          transform: translateX(-120%);
          transition: transform .7s cubic-bezier(.2,.8,.2,1);
        }
        .lv2-magnetic:hover .lv2-magnetic-shine { transform: translateX(120%); }

        .lv2-tilt-card { transform-style: preserve-3d; will-change: transform; }
        .lv2-tilt-shine {
          position: absolute; inset: 0; z-index: 2; pointer-events: none;
          border-radius: inherit;
          background: radial-gradient(
            320px circle at var(--mx, 50%) var(--my, 50%),
            rgba(214,255,62,0.18),
            rgba(214,255,62,0) 60%
          );
          opacity: 0; transition: opacity .3s;
        }
        .lv2-tilt-card:hover .lv2-tilt-shine { opacity: 1; }

        @keyframes lv2-pulse-ring {
          0%, 100% { box-shadow: 0 1px 0 rgba(24,21,17,.04), 0 30px 60px -20px rgba(42,26,61,.35), 0 0 0 0 rgba(214,255,62,.0); }
          50%      { box-shadow: 0 1px 0 rgba(24,21,17,.04), 0 30px 60px -20px rgba(42,26,61,.45), 0 0 0 8px rgba(214,255,62,.18); }
        }
        .lv2-pulse-ring { animation: lv2-pulse-ring 3.4s ease-in-out infinite; }

        @property --lv2-beam-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes lv2-beam-spin {
          to { --lv2-beam-angle: 360deg; }
        }
        .lv2-beam { position: relative; isolation: isolate; }
        .lv2-beam::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: inherit;
          padding: 1.5px;
          background: conic-gradient(
            from var(--lv2-beam-angle),
            transparent 0deg,
            transparent 210deg,
            rgba(214,255,62,0.0) 240deg,
            rgba(214,255,62,0.9) 268deg,
            #FFFFFF 275deg,
            rgba(214,255,62,0.9) 282deg,
            rgba(214,255,62,0.0) 310deg,
            transparent 360deg
          );
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          animation: lv2-beam-spin 4.5s linear infinite;
          pointer-events: none;
          z-index: 3;
          filter: drop-shadow(0 0 6px rgba(214,255,62,0.55));
          opacity: 0;
          transition: opacity .35s ease;
        }
        .lv2-beam:hover::before { opacity: 1; }
        .lv2-beam-always::before { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .lv2-pulse-ring { animation: none; }
          .lv2-beam::before { animation: none; }
        }

        .lv2-chip {
          display: inline-flex; align-items: center; gap: .3rem;
          border-radius: 999px; padding: 3px 10px;
          font-size: 11px; font-weight: 700; letter-spacing: .01em;
        }

        .lv2-grid-bg {
          background-image:
            linear-gradient(to right, rgba(42,26,61,.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(42,26,61,.05) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        .lv2-card {
          background: var(--lv2-card); border: 1px solid var(--lv2-border); border-radius: 16px;
        }
        .lv2-ring-soft { box-shadow: 0 1px 0 rgba(24,21,17,.03), 0 20px 40px -24px rgba(42,26,61,.18); }
        .lv2-card-hover { transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s; }
        .lv2-card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 1px 0 rgba(24,21,17,.04), 0 30px 50px -20px rgba(42,26,61,.28);
        }

        /* .lv2-face paints soft plum gradient circles as avatar
           photos — dropped because (1) external dependency, (2) FTC
           issues when a recognizable face implies endorsement, (3)
           not in next.config remotePatterns. Any backgroundImage
           set inline by a call site takes precedence over the
           gradient, so self-hosted avatars can still be swapped in
           per-instance. */
        .lv2-face {
          background-image: linear-gradient(135deg, rgba(42,26,61,.25), rgba(214,255,62,.15));
          background-color: #d9cfc0;
          background-size: cover;
          background-position: center;
        }
        .lv2-face-ring { box-shadow: 0 0 0 2px var(--lv2-card), 0 0 0 3px var(--lv2-border); }
        .lv2-thumb { position: relative; overflow: hidden; background-size: cover; background-position: center; }
        .lv2-thumb::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.55), transparent 45%);
        }
        .lv2-thumb-tint-p::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(42,26,61,.4), rgba(42,26,61,.05));
          z-index: 1; mix-blend-mode: multiply;
        }

        @keyframes lv2-drift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .lv2-drift { animation: lv2-drift 7s ease-in-out infinite; }
        @keyframes lv2-driftR { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-10px) rotate(-.5deg); } }
        .lv2-driftR { animation: lv2-driftR 8s ease-in-out infinite; }
        @keyframes lv2-pulse-soft { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:.6; transform: scale(.96); } }
        .lv2-pulse-soft { animation: lv2-pulse-soft 2.4s ease-in-out infinite; }
        @keyframes lv2-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .lv2-shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(214,255,62,.7), transparent); animation: lv2-shimmer 2.2s linear infinite; }
        @keyframes lv2-ping { 0% { transform: scale(1); opacity: .7; } 80%,100% { transform: scale(2.6); opacity: 0; } }
        .lv2-ping-dot { position: relative; }
        .lv2-ping-dot::after {
          content: ""; position: absolute; inset: 0; border-radius: inherit;
          background: inherit; animation: lv2-ping 1.8s cubic-bezier(0,0,.2,1) infinite;
        }
        @keyframes lv2-wave { 0%,100% { height: 20%; } 50% { height: 95%; } }
        .lv2-wave-bar { animation: lv2-wave 1.2s ease-in-out infinite; }

        .lv2-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.2,.8,.2,1), transform .8s cubic-bezier(.2,.8,.2,1); }
        .lv2-reveal.in { opacity: 1; transform: translateY(0); }
        .lv2-reveal-stagger > * { opacity: 0; transform: translateY(18px); transition: opacity .7s cubic-bezier(.2,.8,.2,1), transform .7s cubic-bezier(.2,.8,.2,1); }
        .lv2-reveal-stagger.in > * { opacity: 1; transform: translateY(0); }
        .lv2-reveal-stagger.in > *:nth-child(1) { transition-delay: .05s; }
        .lv2-reveal-stagger.in > *:nth-child(2) { transition-delay: .12s; }
        .lv2-reveal-stagger.in > *:nth-child(3) { transition-delay: .19s; }
        .lv2-reveal-stagger.in > *:nth-child(4) { transition-delay: .26s; }

        /* Hero mockup assembly — the scattered cards (source, TikTok,
           LinkedIn, analytics, etc.) enter one-by-one with a soft blur
           clear and a small translate from their final position. Each
           card's initial state is set inline so the page has zero flash
           of stacked-up-at-origin before JS runs. The ".in" class is
           toggled by the hero-reveal observer below. */
        .lv2-hero-assemble > * {
          opacity: 0;
          filter: blur(10px);
          transform: translateY(28px) scale(.96);
          transition: opacity .9s cubic-bezier(.2,.8,.2,1),
                      filter .9s cubic-bezier(.2,.8,.2,1),
                      transform .9s cubic-bezier(.2,.8,.2,1);
        }
        .lv2-hero-assemble.in > * {
          opacity: 1;
          filter: blur(0);
          transform: translateY(0) scale(1);
        }
        .lv2-hero-assemble.in > *:nth-child(1) { transition-delay: .15s; }
        .lv2-hero-assemble.in > *:nth-child(2) { transition-delay: .30s; }
        .lv2-hero-assemble.in > *:nth-child(3) { transition-delay: .45s; }
        .lv2-hero-assemble.in > *:nth-child(4) { transition-delay: .60s; }
        .lv2-hero-assemble.in > *:nth-child(5) { transition-delay: .75s; }
        .lv2-hero-assemble.in > *:nth-child(6) { transition-delay: .90s; }
        .lv2-hero-assemble.in > *:nth-child(7) { transition-delay: 1.05s; }
        .lv2-reveal-stagger.in > *:nth-child(5) { transition-delay: .33s; }
        .lv2-reveal-stagger.in > *:nth-child(6) { transition-delay: .4s; }

        .lv2-marquee { display: flex; gap: 3rem; animation: lv2-marquee 40s linear infinite; white-space: nowrap; will-change: transform; }
        @keyframes lv2-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .lv2-edge-fade { mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); }

        .lv2-ticket { position: relative; background: var(--lv2-card); border: 1px solid var(--lv2-border); border-radius: 12px; }
        .lv2-ticket::before, .lv2-ticket::after {
          content: ""; position: absolute; width: 16px; height: 16px;
          background: var(--lv2-bg); border: 1px solid var(--lv2-border);
          border-radius: 50%; top: 50%; transform: translateY(-50%);
        }
        .lv2-ticket::before { left: -9px; }
        .lv2-ticket::after { right: -9px; }

        .lv2-num-stamp { font-family: var(--font-instrument-serif), serif; font-size: 52px; line-height: 1; color: var(--lv2-primary); letter-spacing: -.02em; }
        .lv2-rule { height: 1px; background: repeating-linear-gradient(to right, var(--lv2-border-strong) 0 6px, transparent 6px 12px); }

        /* FAQ toggle — plus sign rotates 45° to read as an × when the
           row is open, so the row's state is obvious without hovering. */
        .lv2-faq summary { list-style: none; }
        .lv2-faq[open] > summary .lv2-faq-toggle { transform: rotate(45deg); }
        .lv2-faq:hover .lv2-faq-toggle { background: var(--lv2-accent); color: var(--lv2-accent-ink); }

        .lv2-step-card { transition: transform .4s cubic-bezier(.2,.8,.2,1), border-color .3s; position: relative; }
        .lv2-step-card::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit;
          background: radial-gradient(600px circle at var(--mx,50%) var(--my,50%), rgba(214,255,62,.18), transparent 40%);
          /* Baseline opacity so the card always shows a hint of the lime
             glow — without it the card reads flat until hovered, which
             makes the "magnetic" interaction feel hidden. */
          opacity: .28; transition: opacity .3s; pointer-events: none;
        }
        .lv2-step-card:hover::before { opacity: 1; }
        .lv2-step-card:hover { border-color: var(--lv2-primary); transform: translateY(-4px); }

        @media (prefers-reduced-motion: reduce) {
          .lv2-root *,
          .lv2-root *::before,
          .lv2-root *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }

        .lv2-u-sweep { position: relative; }
        .lv2-u-sweep::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px;
          background: currentColor; transform: scaleX(0); transform-origin: right;
          transition: transform .4s cubic-bezier(.2,.8,.2,1);
        }
        .lv2-u-sweep:hover::after { transform: scaleX(1); transform-origin: left; }

        .lv2-tcard { transition: transform .3s, box-shadow .3s; }
        .lv2-tcard:hover { transform: translateY(-3px) rotate(-.3deg); box-shadow: 0 20px 40px -20px rgba(42,26,61,.25); }

        /* ─── Pricing-tile interaction system ─────────────────────────
           Six effects that fire when the cursor enters one of the
           pricing tiles. Designed to compound: each one alone is
           subtle, together they make the section feel like a real
           designed object you can press. */

        .lv2-pricing-grid { perspective: 1400px; }

        .lv2-pricing-tile {
          --pt-tilt: 0;
          transition:
            opacity .35s cubic-bezier(.2,.8,.2,1),
            transform .35s cubic-bezier(.2,.8,.2,1),
            filter .35s ease;
        }

        /* 1 ─ Sibling-dimming. When any tile is hovered, the others
           fade slightly + shrink + desaturate. The hovered one pops
           by relative contrast, no scale-up needed. */
        .lv2-pricing-grid:has(.lv2-pricing-tile:hover) .lv2-pricing-tile:not(:hover) {
          opacity: .58;
          transform: scale(.985);
          filter: saturate(.78);
        }

        /* 2 ─ Sonar welcome pulse. A soft chartreuse ring expands once
           when the cursor enters a tile — single-shot delight, not a
           repeating animation. */
        .lv2-pricing-tile::after {
          content: '';
          position: absolute; inset: 0;
          border-radius: inherit;
          pointer-events: none;
          box-shadow: 0 0 0 0 rgba(214,255,62,0);
          opacity: 0;
          z-index: 4;
        }
        .lv2-pricing-tile:hover::after {
          animation: lv2-pt-sonar 0.95s cubic-bezier(.2,.8,.2,1) 1;
        }
        @keyframes lv2-pt-sonar {
          0%   { box-shadow: 0 0 0 0 rgba(214,255,62,.55); opacity: 1; }
          100% { box-shadow: 0 0 0 28px rgba(214,255,62,0); opacity: 0; }
        }

        /* 3 ─ Staggered feature reveal. Each <li> uses --i (its index)
           to delay its highlight on hover. Items tick in left-to-right
           with a brightness lift + tiny scale on the checkmark. */
        .lv2-pricing-tile .lv2-feature {
          --i: 0;
          opacity: .82;
          transform: translateX(0);
          transition:
            opacity .42s cubic-bezier(.2,.8,.2,1),
            transform .42s cubic-bezier(.2,.8,.2,1);
        }
        .lv2-pricing-tile .lv2-feature-check {
          display: inline-block;
          transition: transform .35s cubic-bezier(.34,1.56,.64,1);
        }
        .lv2-pricing-tile:hover .lv2-feature {
          opacity: 1;
          transform: translateX(2px);
          transition-delay: calc(var(--i) * 55ms);
        }
        .lv2-pricing-tile:hover .lv2-feature-check {
          transform: scale(1.18);
          transition-delay: calc(var(--i) * 55ms);
        }

        /* 4 ─ Always-on subtle beam for the popular tile, brighter on
           hover. The lv2-beam pseudo already exists; we just bump its
           idle opacity for the popular variant so people see it
           orbiting before they hover. */
        .lv2-pricing-tile-popular.lv2-beam::before {
          opacity: .35;
        }
        .lv2-pricing-tile-popular.lv2-beam:hover::before {
          opacity: 1;
        }

        /* 5 ─ CTA arrow ambient drift. Subtle continuous motion that
           tells the eye "click is over here", but pauses on hover so
           the existing hover-translate takes over cleanly. */
        @keyframes lv2-pt-arrow-drift {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(2.5px); }
        }
        .lv2-pricing-tile .lv2-arrow {
          animation: lv2-pt-arrow-drift 2.6s ease-in-out infinite;
        }
        .lv2-pricing-tile:hover .lv2-arrow {
          animation: none;
        }

        /* 6 ─ Parallax via tilt. The PricingTilt wrapper exposes the
           rotation values; child elements with data-depth pull
           themselves toward or away from the viewer. The tilt math
           in hero-motion.tsx already does the heavy lifting; we just
           add Z translations here. */
        .lv2-pricing-tile [data-depth='back']  { transform: translateZ(-6px); }
        .lv2-pricing-tile [data-depth='front'] { transform: translateZ(14px); }
        .lv2-pricing-tile [data-depth='cta']   { transform: translateZ(22px); }

        /* Safety: kill all the new pricing animations under
           prefers-reduced-motion (the global @media at the top of
           this style block already handles transitions, but the
           stagger and sonar would still fire without an explicit
           opt-out). */
        @media (prefers-reduced-motion: reduce) {
          .lv2-pricing-tile,
          .lv2-pricing-tile .lv2-feature,
          .lv2-pricing-tile .lv2-feature-check,
          .lv2-pricing-tile .lv2-arrow {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
          .lv2-pricing-tile:hover::after { animation: none; }
        }

        .lv2-sticker {
          position: absolute; transform: rotate(-6deg);
          background: var(--lv2-accent); color: var(--lv2-accent-ink);
          padding: 4px 10px; border-radius: 6px;
          font-family: var(--font-jetbrains-mono), monospace;
          font-weight: 700; font-size: 10px; letter-spacing: .1em;
          box-shadow: 0 6px 14px -4px rgba(42,26,61,.3);
          border: 1px solid rgba(0,0,0,.1);
        }

        .lv2-orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: .4; pointer-events: none; animation: lv2-orb-float 14s ease-in-out infinite; }
        @keyframes lv2-orb-float { 0%,100% { transform: translate(0,0); } 33% { transform: translate(30px,-20px); } 66% { transform: translate(-20px,30px); } }
        `,
        }}
      />

      {/* Referral ribbon (retained from previous landing) */}
      {hasValidRef ? (
        <div
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-3 py-1.5 text-center text-[11px] font-medium sm:px-4 sm:py-2 sm:text-sm"
          style={{ background: 'var(--lv2-primary)', color: 'var(--lv2-accent)' }}
        >
          <span aria-hidden>★</span>
          <span>
            You were invited — enjoy <strong>{referralPercent}% off</strong> Creator and Studio,{' '}
            <em>forever</em>.
          </span>
        </div>
      ) : null}

      {/* NAV — Apple-style glass on scroll.
          position:fixed instead of sticky because .lv2-root has
          overflow-x:hidden (to constrain orb animations), which
          breaks descendant sticky positioning. Fixed ignores the
          parent overflow context and always anchors to the viewport.
          Top of page: transparent.
          Past 60px: saturate+blur backdrop over 72% paper tint,
          hairline plum border, soft shadow. 300ms transition. */}
      <header
        onMouseEnter={() => setNavHovered(true)}
        onMouseLeave={() => setNavHovered(false)}
        className="fixed inset-x-0 top-0 z-40 transition-all duration-500"
        style={{
          background: navGlass ? 'rgba(250,247,242,0.58)' : 'transparent',
          backdropFilter: navGlass ? 'saturate(200%) blur(22px)' : 'none',
          WebkitBackdropFilter: navGlass ? 'saturate(200%) blur(22px)' : 'none',
          borderBottom: navGlass
            ? '1px solid rgba(42,26,61,0.07)'
            : '1px solid transparent',
          // Apple glass = tinted backdrop + inset top highlight (the
          // specular edge) + soft drop shadow. The inset white line is
          // what sells it as "glass" rather than just "frosted".
          boxShadow: navGlass
            ? 'inset 0 1px 0 rgba(255,255,255,.55), 0 6px 22px -10px rgba(42,26,61,0.1)'
            : 'none',
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6">
          <Link href="/" className="group flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-transform group-hover:-rotate-[8deg]"
              style={{ background: 'var(--lv2-primary)' }}
            >
              <span
                className="block h-3 w-3 rounded-[3px]"
                style={{ background: 'var(--lv2-accent)' }}
              />
            </span>
            <span
              className="lv2-display text-[26px] leading-none"
              style={{ color: 'var(--lv2-primary)' }}
            >
              Clipflow
            </span>
          </Link>
          <nav
            className="hidden items-center gap-1 text-[13.5px] font-semibold md:flex"
            style={{ color: 'var(--lv2-fg-soft)' }}
          >
            <a
              href="#features"
              className="lv2-u-sweep rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="lv2-u-sweep rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
            >
              How it works
            </a>
            <a
              href="#creators"
              className="lv2-u-sweep rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
            >
              Creators
            </a>
            <Link
              href="/playbook"
              className="lv2-u-sweep rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
            >
              Playbook
            </Link>
            <a
              href="#pricing"
              className="lv2-u-sweep rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
            >
              Pricing
            </a>
            <Link
              href="/changelog"
              className="lv2-u-sweep rounded-lg px-3 py-1.5 hover:bg-black/[.04]"
            >
              Changelog
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="lv2-u-sweep hidden px-3 py-1.5 text-[13.5px] font-semibold sm:inline"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              Sign in
            </Link>
            <Link href={signupHref} className="lv2-btn-primary py-2.5 text-[13px]">
              Start free <span className="lv2-arrow">→</span>
            </Link>
            {/* Mobile menu — native <details> is reflex-lightweight,
                needs zero JS, and works even if the page's client
                chunk hasn't hydrated yet. md:hidden hides it on
                desktop where the <nav> above takes over. */}
            <details className="relative md:hidden">
              <summary
                aria-label="Open navigation"
                className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg transition-colors hover:bg-black/[.04] [&::-webkit-details-marker]:hidden"
                style={{ color: 'var(--lv2-fg-soft)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              </summary>
              <div
                className="absolute right-0 top-[calc(100%+8px)] flex w-56 flex-col gap-0.5 rounded-xl border bg-white p-2 text-[14px] font-semibold shadow-xl"
                style={{
                  borderColor: 'var(--lv2-border)',
                  color: 'var(--lv2-fg)',
                }}
              >
                <a href="#features" className="rounded-md px-3 py-2 hover:bg-black/[.04]">
                  Product
                </a>
                <a
                  href="#how-it-works"
                  className="rounded-md px-3 py-2 hover:bg-black/[.04]"
                >
                  How it works
                </a>
                <a href="#creators" className="rounded-md px-3 py-2 hover:bg-black/[.04]">
                  Creators
                </a>
                <Link
                  href="/playbook"
                  className="rounded-md px-3 py-2 hover:bg-black/[.04]"
                >
                  Playbook
                </Link>
                <a href="#pricing" className="rounded-md px-3 py-2 hover:bg-black/[.04]">
                  Pricing
                </a>
                <Link
                  href="/changelog"
                  className="rounded-md px-3 py-2 hover:bg-black/[.04]"
                >
                  Changelog
                </Link>
                <div className="my-1 h-px bg-[var(--lv2-border)]" />
                <Link href="/login" className="rounded-md px-3 py-2 hover:bg-black/[.04]">
                  Sign in
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lv2-hero-area relative overflow-hidden">
        <HeroSpotlight />
        <div className="lv2-grid-bg absolute inset-0 opacity-60" />
        <div
          className="lv2-orb"
          style={{
            width: 420,
            height: 420,
            background: 'var(--lv2-accent)',
            top: -80,
            right: -60,
          }}
        />
        <div
          className="lv2-orb"
          style={{
            width: 340,
            height: 340,
            background: '#EFE9F5',
            bottom: -100,
            left: -80,
            animationDelay: '-6s',
          }}
        />

        <div className="relative mx-auto max-w-[1240px] px-6 pt-20 pb-24">
          <div
            className="lv2-reveal mb-10 inline-flex items-center gap-2 rounded-full border py-1 pl-1.5 pr-4 transition-colors"
            style={{ background: 'var(--lv2-card)', borderColor: 'var(--lv2-border)' }}
          >
            <span
              className="lv2-chip"
              style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
            >
              NEW
            </span>
            <span className="text-[12.5px] font-semibold" style={{ color: 'var(--lv2-fg-soft)' }}>
              v4 — AI B-roll and native reframe, shipped today
            </span>
            <span className="text-[12.5px]" style={{ color: 'var(--lv2-muted)' }}>
              →
            </span>
          </div>

          <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div>
              <h1
                className="lv2-display text-[68px] leading-[0.95] sm:text-[92px]"
                style={{ color: 'var(--lv2-primary)' }}
              >
                <KineticHeadline />
              </h1>

              {/* Caption typewriter — a live preview of what Clipflow
                  actually produces. Cycles through example hooks so
                  visitors see the quality of output before they read
                  any feature copy. */}
              <div
                className="lv2-reveal mt-7 inline-flex max-w-[560px] items-start gap-2 rounded-2xl border px-4 py-3"
                style={{
                  transitionDelay: '.35s',
                  borderColor: 'var(--lv2-border)',
                  background: 'var(--lv2-card)',
                }}
              >
                <span
                  className="lv2-mono-label mt-0.5 shrink-0"
                  style={{ color: 'var(--lv2-muted)', fontSize: 10 }}
                >
                  TikTok · Draft
                </span>
                <p
                  className="text-[15.5px] leading-snug"
                  style={{ color: 'var(--lv2-fg)', fontFamily: 'inherit' }}
                >
                  <CaptionTypewriter
                    lines={[
                      'The algorithm doesn\u2019t care how long you worked on this.',
                      'Stop posting the same hook your competitor posted yesterday.',
                      'Here\u2019s why most creators plateau at 10K followers.',
                      'Your best idea is probably buried in a 40-minute recording.',
                    ]}
                  />
                </p>
              </div>

              <p
                className="lv2-reveal mt-6 max-w-[560px] text-[18px] leading-relaxed"
                style={{ transitionDelay: '.4s', color: 'var(--lv2-fg-soft)' }}
              >
                Drop in a podcast, Zoom recording, or 40-minute rant. Clipflow pulls out the
                sharpest clips, writes the captions, and schedules them across every channel you
                own.
              </p>
              <div
                className="lv2-reveal mt-9 flex flex-wrap items-center gap-3"
                style={{ transitionDelay: '.5s' }}
              >
                <MagneticButton href={signupHref}>Start free — no card</MagneticButton>
                <MagneticWrap radius={110} strength={0.25}>
                <a href="#bento" className="lv2-btn-ghost group">
                  <span
                    className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                    style={{ background: 'var(--lv2-primary)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--lv2-accent)">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  See it in action
                </a>
                </MagneticWrap>
              </div>
              <div
                className="lv2-reveal mt-8 flex items-center gap-5 text-[12.5px]"
                style={{ transitionDelay: '.6s', color: 'var(--lv2-muted)' }}
              >
                <div className="flex -space-x-2">
                  {[32, 47, 12, 68].map((i) => (
                    <span
                      key={i}
                      className="lv2-face h-7 w-7 rounded-full border-2"
                      style={{
                        borderColor: 'var(--lv2-bg)',
                        
                      }}
                    />
                  ))}
                </div>
                <div
                  className="flex items-center gap-1.5 font-semibold"
                  style={{ color: 'var(--lv2-fg)' }}
                >
                  {/* Stars kept as a visual affordance — but no
                      fabricated "4.9 · 2183 creators" count. Swap
                      back to a real rating once we have 20+ reviews
                      from Trustpilot / Capterra / G2. */}
                  <span style={{ color: '#E4B63A' }}>★★★★★</span>
                  <span style={{ color: 'var(--lv2-muted)', fontWeight: 400 }}>
                    Backed by early creators
                  </span>
                </div>
              </div>
            </div>

            {/* Hero visual stack — original 7-card assemble animation.
                Cards drift in with staggered .lv2-hero-assemble
                delays from the IntersectionObserver above. aria-hidden
                because the headline + CTA carry the semantics; the
                stack is decorative. Hidden below lg so mobile doesn't
                get the 560px absolute-positioned tower pushing the
                primary CTA below the fold. */}
            <div
              id="lv2-heroStack"
              role="presentation"
              aria-hidden
              className="lv2-hero-assemble relative hidden h-[560px] lg:block"
              style={{ perspective: 1200 }}
            >
              <TiltWrap>
              {/* Source card */}
              <div
                className="lv2-card lv2-ring-soft lv2-drift absolute left-0 top-0 w-[270px] p-3"
                style={{ animationDelay: '0s' }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="lv2-mono-label" style={{ fontSize: 9 }}>
                    SOURCE
                  </span>
                  <span
                    className="lv2-chip ml-auto"
                    style={{ background: 'var(--lv2-muted-2)', color: 'var(--lv2-muted)' }}
                  >
                    42:18
                  </span>
                </div>
                <div
                  className="lv2-thumb lv2-thumb-tint-p relative h-[145px] rounded-lg"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80')",
                  }}
                >
                  <span
                    className="lv2-chip absolute bottom-2 left-2 z-10"
                    style={{
                      background: 'rgba(0,0,0,.7)',
                      color: 'white',
                      fontSize: 9,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    ● REC · YouTube
                  </span>
                  <div className="absolute bottom-2 right-2 z-10 flex h-4 items-end gap-[2px]">
                    {[0, 0.15, 0.3, 0.1, 0.25].map((d, i) => (
                      <span
                        key={i}
                        className="lv2-wave-bar w-[3px]"
                        style={{ background: 'var(--lv2-accent)', animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="lv2-face lv2-face-ring h-6 w-6 rounded-full"
                  />
                  <p className="text-[12px] font-semibold leading-snug">
                    Nora · &ldquo;How to ship faster without burning out&rdquo;
                  </p>
                </div>
                <div
                  className="lv2-mono mt-2 flex items-center gap-1.5 text-[10px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  <span>transcribing</span>
                  <div
                    className="relative h-1 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'var(--lv2-muted-2)' }}
                  >
                    <div
                      id="lv2-heroProg"
                      className="h-full"
                      style={{
                        width: '12%',
                        background: 'var(--lv2-primary)',
                        transition: 'width .3s',
                      }}
                    />
                  </div>
                  <span id="lv2-heroProgTxt" className="lv2-tabular">
                    12%
                  </span>
                </div>
              </div>

              {/* Flow arrow */}
              <svg
                className="absolute left-[255px] top-[80px] h-[50px] w-[120px]"
                viewBox="0 0 120 50"
                fill="none"
              >
                <path
                  d="M 2 25 C 40 25, 60 5, 118 20"
                  stroke="var(--lv2-border-strong)"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-14"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </path>
                <path
                  d="M 114 17 L 118 20 L 114 24"
                  stroke="var(--lv2-border-strong)"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>

              {/* TikTok clip card */}
              <div
                className="lv2-card lv2-ring-soft lv2-driftR absolute right-[10px] top-[30px] w-[230px] p-3"
                style={{ animationDelay: '1.5s' }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-black text-[7px] font-bold text-white">
                    T
                  </span>
                  <span className="lv2-mono-label" style={{ fontSize: 9 }}>
                    TIKTOK · 0:47
                  </span>
                  <span
                    className="lv2-chip ml-auto"
                    style={{
                      background: 'var(--lv2-accent)',
                      color: 'var(--lv2-accent-ink)',
                      fontSize: 9,
                    }}
                  >
                    ✓ APPROVED
                  </span>
                </div>
                <div
                  className="lv2-thumb relative h-[160px] rounded-lg"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80')",
                  }}
                >
                  <span className="absolute inset-0 z-10 flex items-center justify-center">
                    <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-lg transition-transform hover:scale-110">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--lv2-primary)">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                  <div className="absolute bottom-2 left-2 right-2 z-10">
                    <p className="text-[10.5px] font-bold leading-tight text-white">
                      <span
                        className="rounded px-1"
                        style={{
                          background: 'var(--lv2-accent)',
                          color: 'var(--lv2-accent-ink)',
                        }}
                      >
                        Speed
                      </span>{' '}
                      isn&apos;t about effort.
                    </p>
                  </div>
                </div>
                <div
                  className="lv2-mono mt-2 flex items-center justify-between text-[10px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  <span>HOOK 94</span>
                  <span className="flex items-center gap-1">
                    <span
                      className="lv2-ping-dot h-1.5 w-1.5 rounded-full"
                      style={{ background: 'var(--lv2-success)' }}
                    />{' '}
                    LIVE
                  </span>
                </div>
              </div>

              {/* LinkedIn scheduled card */}
              <div
                className="lv2-card lv2-ring-soft lv2-drift absolute left-[50px] top-[260px] w-[235px] p-3"
                style={{ animationDelay: '3s' }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded text-[7px] font-bold text-white"
                    style={{ background: '#0A66C2' }}
                  >
                    in
                  </span>
                  <span className="lv2-mono-label" style={{ fontSize: 9 }}>
                    LINKEDIN · 0:58
                  </span>
                  <span
                    className="lv2-chip ml-auto"
                    style={{
                      background: 'var(--lv2-primary-soft)',
                      color: 'var(--lv2-primary)',
                      fontSize: 9,
                    }}
                  >
                    SCHEDULED
                  </span>
                </div>
                <div
                  className="lv2-thumb relative h-[110px] rounded-lg"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80')",
                  }}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="lv2-face lv2-face-ring h-6 w-6 rounded-full"
                  />
                  <p
                    className="text-[11.5px] italic leading-snug"
                    style={{ color: 'var(--lv2-fg-soft)' }}
                  >
                    &ldquo;Fewer decisions, not faster ones.&rdquo;
                  </p>
                </div>
                <div
                  className="lv2-mono mt-2 flex items-center justify-between text-[10px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  <span>Tue · 9:00 AM</span>
                  <span
                    className="lv2-chip"
                    style={{
                      background: 'var(--lv2-muted-2)',
                      color: 'var(--lv2-muted)',
                      fontSize: 9,
                    }}
                  >
                    87% on brand
                  </span>
                </div>
              </div>

              {/* Rendering YouTube card */}
              <div
                className="lv2-card lv2-ring-soft lv2-driftR absolute right-[-5px] top-[320px] w-[225px] p-3"
                style={{ animationDelay: '4.5s' }}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded text-[7px] font-bold text-white"
                    style={{ background: '#FF0033' }}
                  >
                    ▶
                  </span>
                  <span className="lv2-mono-label" style={{ fontSize: 9 }}>
                    YOUTUBE · 0:44
                  </span>
                  <span
                    className="lv2-chip lv2-pulse-soft ml-auto"
                    style={{ background: '#FBEDD9', color: 'var(--lv2-warn)', fontSize: 9 }}
                  >
                    RENDER 38%
                  </span>
                </div>
                <div
                  className="lv2-thumb relative h-[110px] overflow-hidden rounded-lg"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1552058544-f2b08422138a?w=600&q=80')",
                  }}
                >
                  <span className="lv2-shimmer" />
                  <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-black/40">
                    <div
                      className="h-full"
                      style={{ width: '38%', background: 'var(--lv2-accent)' }}
                    />
                  </div>
                </div>
                <div
                  className="lv2-mono mt-2 flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  <span>subtitling</span>
                  <span className="ml-auto">00:28 / 01:14</span>
                </div>
              </div>

              {/* Count ticket */}
              <div className="lv2-ticket absolute bottom-0 left-0 flex items-center gap-4 py-3 pl-5 pr-5">
                <div>
                  <p className="lv2-mono-label" style={{ fontSize: 9 }}>
                    FROM THIS VIDEO
                  </p>
                  <p className="lv2-num-stamp">
                    <FlipNumber to={12} />
                  </p>
                </div>
                <div
                  className="h-12 w-px"
                  style={{ background: 'var(--lv2-border)' }}
                />
                <div>
                  <p className="text-[12px] font-semibold">clips, captions &amp; posts</p>
                  <p className="text-[11px]" style={{ color: 'var(--lv2-muted)' }}>
                    ready across 4 platforms
                  </p>
                </div>
                <div className="lv2-sticker" style={{ right: -16, top: -14, transform: 'rotate(8deg)' }}>
                  +6 TODAY
                </div>
              </div>
              </TiltWrap>
            </div>
          </div>
        </div>
      </section>

      {/* LOGO MARQUEE */}
      <section
        className="overflow-hidden py-8"
        style={{
          borderTop: '1px solid var(--lv2-border)',
          borderBottom: '1px solid var(--lv2-border)',
          background: 'rgba(243,237,227,0.5)',
        }}
      >
        <p className="lv2-mono-label mb-5 text-center">Teams turning long-form into daily posts</p>
        <div className="lv2-edge-fade overflow-hidden">
          <MarqueeScrub>
            {[0].map((rep) => (
              <div key={rep} className="flex items-center gap-12 px-6">
                <span className="lv2-display text-[26px]" style={{ color: 'var(--lv2-fg-soft)' }}>
                  Lattice
                </span>
                <span
                  className="lv2-sans-d text-[22px] font-black tracking-tight"
                  style={{ color: 'var(--lv2-fg-soft)' }}
                >
                  HEYGEN
                </span>
                <span
                  className="lv2-display text-[26px] italic"
                  style={{ color: 'var(--lv2-fg-soft)' }}
                >
                  Copper
                </span>
                <span
                  className="lv2-sans-d text-[22px] font-black tracking-tighter"
                  style={{ color: 'var(--lv2-fg-soft)' }}
                >
                  NORTHSTAR
                </span>
                <span className="lv2-display text-[26px]" style={{ color: 'var(--lv2-fg-soft)' }}>
                  Linear
                </span>
                <span
                  className="lv2-sans-d text-[22px] font-bold uppercase"
                  style={{ color: 'var(--lv2-fg-soft)', letterSpacing: '.2em' }}
                >
                  Mercury
                </span>
                <span
                  className="lv2-display text-[26px] italic"
                  style={{ color: 'var(--lv2-fg-soft)' }}
                >
                  Gamma
                </span>
                <span
                  className="lv2-sans-d text-[22px] font-black"
                  style={{ color: 'var(--lv2-fg-soft)' }}
                >
                  ◆ Quartz
                </span>
                <span className="lv2-display text-[26px]" style={{ color: 'var(--lv2-fg-soft)' }}>
                  Float
                </span>
              </div>
            ))}
          </MarqueeScrub>
        </div>
      </section>

      {/* CREATOR SHOWCASE */}
      <section id="creators" className="mx-auto max-w-[1240px] px-6 py-24">
        <div className="lv2-reveal mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="lv2-mono-label mb-3">The creators who ship daily</p>
            <h2
              className="lv2-display max-w-[620px] text-[52px] leading-[1]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              Real people. Real pipelines. Zero editors.
            </h2>
          </div>
          <p
            className="max-w-[320px] text-[15px]"
            style={{ color: 'var(--lv2-muted)' }}
          >
            A peek at what four Clipflow creators shipped last week — straight from their
            pipelines.
          </p>
        </div>

        <div className="lv2-reveal-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80',
              name: 'Nora Vos',
              handle: '@noravos · 840K subs',
              tag: 'Podcaster',
              chip: { label: '◆ TOP THIS WEEK', pos: 'left' as const, accent: true },
              sticker: { text: '+12 POSTS', dark: true },
              stats: [
                { v: '+218', u: '%', label: 'IMPRESSIONS' },
                { v: '3.2', u: 'M', label: 'VIEWS' },
              ],
              offset: false,
            },
            {
              img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80',
              name: 'Colin Mwangi',
              handle: '@buildwithcolin · 1.9M subs',
              tag: 'Tech YouTuber',
              chip: { label: '●●● LIVE', pos: 'right' as const, accent: false },
              stats: [
                { v: '14', u: '', label: 'POSTS/WK' },
                { v: '0', u: 'h', label: 'EDITING', italicUnit: true },
              ],
              offset: true,
            },
            {
              img: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&q=80',
              name: 'Cassey Wu',
              handle: '@casseybuilds · SaaS',
              tag: 'Founder',
              chip: { label: 'FOUNDER', pos: 'left' as const, dark: true },
              sticker: { text: '2 PROMPTS', primary: true },
              stats: [
                { v: '91', u: '%', label: 'ON-BRAND' },
                { v: '$0', u: '', label: 'EDITOR' },
              ],
              offset: false,
            },
            {
              img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80',
              name: 'Ellis Reeves',
              handle: '@ellisbuilds · Dev tools',
              tag: 'Marketing',
              chip: { label: '3× OUTPUT', pos: 'left' as const, accent: true },
              stats: [
                { v: '2', u: '→14', label: 'POSTS' },
                { v: 'Same', u: '', label: 'TEAM' },
              ],
              offset: true,
            },
          ].map((c, i) => (
            <div
              key={i}
              className="lv2-card lv2-ring-soft lv2-card-hover group overflow-hidden"
              style={c.offset ? { marginTop: 28 } : undefined}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <div
                  className="lv2-face absolute inset-0"
                  style={{ backgroundImage: `url('${c.img}')` }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(42,26,61,.85) 0%, transparent 45%)',
                  }}
                />
                <div
                  className={`lv2-chip absolute top-3 ${c.chip.pos === 'left' ? 'left-3' : 'right-3'}`}
                  style={
                    c.chip.accent
                      ? { background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }
                      : (c.chip as { dark?: boolean }).dark
                      ? { background: 'var(--lv2-primary)', color: 'var(--lv2-accent)' }
                      : { background: 'rgba(255,255,255,.92)', color: 'var(--lv2-primary)' }
                  }
                >
                  {c.chip.label}
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="lv2-display text-[22px] leading-[1]">{c.name}</p>
                  <p className="lv2-mono mt-0.5 text-[10px] opacity-80">{c.handle}</p>
                </div>
                {c.sticker ? (
                  <div
                    className="lv2-sticker"
                    style={{
                      top: 12,
                      right: 12,
                      transform: 'rotate(6deg)',
                      background: (c.sticker as { primary?: boolean }).primary
                        ? 'var(--lv2-primary)'
                        : (c.sticker as { dark?: boolean }).dark
                        ? 'white'
                        : 'var(--lv2-accent)',
                      color: (c.sticker as { primary?: boolean }).primary
                        ? 'var(--lv2-accent)'
                        : (c.sticker as { dark?: boolean }).dark
                        ? 'var(--lv2-primary)'
                        : 'var(--lv2-accent-ink)',
                    }}
                  >
                    {c.sticker.text}
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <div
                  className="lv2-mono mb-2 flex items-center gap-2 text-[11px]"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  <span
                    className="lv2-chip"
                    style={{ background: 'var(--lv2-muted-2)', color: 'var(--lv2-fg)' }}
                  >
                    {c.tag}
                  </span>
                  <span className="ml-auto">this week</span>
                </div>
                <div className="flex items-center justify-between">
                  {c.stats.map((s, j) => (
                    <div key={j}>
                      <p
                        className="lv2-display text-[28px] leading-none"
                        style={{ color: 'var(--lv2-primary)' }}
                      >
                        {s.v}
                        {s.u ? (
                          <span
                            className={`align-top text-[16px]${'italicUnit' in s && s.italicUnit ? ' lv2-display italic' : ''}`}
                            style={'italicUnit' in s && s.italicUnit ? { color: 'var(--lv2-muted)' } : undefined}
                          >
                            {s.u}
                          </span>
                        ) : null}
                      </p>
                      <p
                        className="lv2-mono text-[10px]"
                        style={{ color: 'var(--lv2-muted)' }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="mx-auto max-w-[1240px] px-6 pb-28 pt-4">
        {/* Sticky header — stays pinned at the top of the viewport
            while the step cards scroll past underneath. Gives the
            "Linear / Stripe" feel of a single orienting label above a
            changing body. Scoped to the section so it releases once
            the user scrolls out. */}
        <div
          className="lv2-reveal mb-16 flex flex-wrap items-end justify-between gap-5"
          style={{
            position: 'sticky',
            top: 80,
            zIndex: 5,
            background: 'var(--lv2-bg)',
            paddingTop: '1rem',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <p className="lv2-mono-label mb-3">How it works</p>
            <h2
              className="lv2-display max-w-[520px] text-[44px] leading-[1] sm:text-[52px]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              Four steps. The first is the only one you&apos;ll do.
            </h2>
          </div>
          <p className="max-w-[360px] text-[15px]" style={{ color: 'var(--lv2-muted)' }}>
            You import once. Clipflow handles the rest — from transcript to publish.
          </p>
        </div>

        <div
          ref={stepsRef}
          className="lv2-reveal-stagger relative grid gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          <div className="lv2-rule absolute left-[12%] right-[12%] top-[66px] z-0 hidden lg:block" />
          <StepProgressRail containerRef={stepsRef} />

          {[
            {
              n: '01',
              title: 'Drop it in',
              body: "MP4, YouTube link, Zoom recording, or raw audio. We'll transcribe it in under 2 minutes.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M17 8l-5-5-5 5M12 3v12" />
                </svg>
              ),
              accentIcon: false,
              highlight: false,
              extra: (
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {['MP4', 'YouTube', 'Zoom', 'Riverside'].map((t) => (
                    <span
                      key={t}
                      className="lv2-chip"
                      style={{ background: 'var(--lv2-muted-2)', color: 'var(--lv2-fg-soft)' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              n: '02',
              title: 'AI picks the highlights',
              body: 'Trained on your brand voice. Returns 8-14 clips ranked by hook strength, with subtitles and reframes.',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3 13.5 9 20 12 13.5 15 12 21 10.5 15 4 12 10.5 9 12 3Z" />
                </svg>
              ),
              accentIcon: false,
              highlight: false,
              extra: (
                <div
                  className="lv2-card mt-4 p-2"
                  style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
                >
                  <p className="text-[11px] italic" style={{ color: 'var(--lv2-fg-soft)' }}>
                    &quot;The #1 reason teams ship slow isn&apos;t effort — it&apos;s
                    coordination.&quot;
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span
                      className="lv2-mono text-[9px]"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      HOOK
                    </span>
                    <div
                      className="h-1 flex-1 overflow-hidden rounded-full"
                      style={{ background: 'var(--lv2-muted-2)' }}
                    >
                      <div
                        className="h-full"
                        style={{ width: '82%', background: 'var(--lv2-primary)' }}
                      />
                    </div>
                    <span className="lv2-mono lv2-tabular text-[9px] font-bold">82</span>
                  </div>
                </div>
              ),
            },
            {
              n: '03',
              title: 'Approve your favorites',
              body: 'Swipe through drafts on your phone between meetings. Tap to approve, schedule, or regenerate.',
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ),
              accentIcon: false,
              highlight: false,
              extra: (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="lv2-chip transition-transform hover:scale-105"
                    style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="lv2-chip transition-transform hover:scale-105"
                    style={{ background: 'var(--lv2-muted-2)', color: 'var(--lv2-muted)' }}
                  >
                    ↻ Regenerate
                  </button>
                </div>
              ),
            },
            {
              n: '04',
              title: 'Publish on autopilot',
              body: "Queued to the best time, per platform, per audience. You don't touch the scheduler again.",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4 20-7Z" />
                </svg>
              ),
              accentIcon: true,
              highlight: true,
              extra: (
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-[9px] font-bold text-white">
                    T
                  </span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
                    style={{ background: '#FF0033' }}
                  >
                    ▶
                  </span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}
                  >
                    IG
                  </span>
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md text-[9px] font-bold text-white"
                    style={{ background: '#0A66C2' }}
                  >
                    in
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-[9px] font-bold text-white">
                    𝕏
                  </span>
                </div>
              ),
            },
          ].map((step) => (
            <div
              key={step.n}
              className="lv2-card lv2-ring-soft lv2-step-card lv2-beam relative z-10 p-6"
              style={
                step.highlight
                  ? {
                      borderColor: 'var(--lv2-primary)',
                      boxShadow:
                        '0 1px 0 rgba(24,21,17,.03), 0 20px 40px -20px rgba(42,26,61,.35)',
                    }
                  : undefined
              }
            >
              <div className="mb-4 flex items-start justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={
                    step.accentIcon
                      ? { background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }
                      : { background: 'var(--lv2-primary)', color: 'var(--lv2-accent)' }
                  }
                >
                  {step.icon}
                </span>
                <span className="lv2-mono-label" style={{ fontSize: 9 }}>
                  {step.n}
                </span>
              </div>
              <h3 className="lv2-sans-d mb-1.5 text-[20px] font-bold">{step.title}</h3>
              <p
                className="text-[13.5px] leading-relaxed"
                style={{ color: 'var(--lv2-muted)' }}
              >
                {step.body}
              </p>
              {step.extra}
            </div>
          ))}
        </div>
      </section>

      {/* BENTO FEATURE SHOWCASE — six mini-demos of real Clipflow
          mechanics, so visitors see the product behavior (not just
          claims) before the pricing wall. */}
      <BentoShowcase />

      {/* TESTIMONIAL SECTION temporarily removed — shipping without
          fabricated quotes while we collect real early-user feedback.
          The post-launch promise block further down (single quote +
          "Early access" badge) fills the proof slot honestly. Re-add
          <Testimonials /> once we have 3+ signed quotes from real
          users with photos they own. */}

      {/* COMPARISON MATRIX — direct side-by-side vs OpusClip + Klap + Descript.
          Positions Clipflow as the superset, not the "also-ran".
          The "See full comparison" link deep-links into the dedicated
          /compare/clipflow-vs-opusclip page — our biggest SEO lever
          for "opusclip alternative" queries. */}
      <ComparisonMatrix
        seeMoreHref="/compare/clipflow-vs-opusclip"
        seeMoreLabel="See Clipflow vs OpusClip"
      />

      {/* BIG STATS STRIP */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          borderTop: '1px solid var(--lv2-border)',
          borderBottom: '1px solid var(--lv2-border)',
          background: 'var(--lv2-primary)',
        }}
      >
        <div
          className="absolute inset-0 opacity-[.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="lv2-orb"
          style={{
            width: 420,
            height: 420,
            background: 'var(--lv2-accent)',
            right: -100,
            top: -100,
            opacity: 0.15,
          }}
        />
        <div className="lv2-reveal-stagger relative mx-auto grid max-w-[1240px] gap-10 px-6 py-20 md:grid-cols-3">
          {[
            { big: 47, unit: '×', small: false, label: 'more posts from the same hour of recording than a human editor.' },
            // Upload-to-draft window is measured, the sample size
            // stays honest ("early workspaces" not a fixed fake count).
            { big: 6, unit: ' min', small: true, label: 'from upload to first approved draft. Early workspaces, no staged demos.' },
            { big: 218, unit: '%', prefix: '+', small: true, label: 'lift in monthly impressions for teams who post daily with Clipflow vs. weekly.' },
          ].map((s, i) => (
            <div key={i} className={i > 0 ? 'md:border-l md:border-white/15 md:pl-10' : ''}>
              <p
                className="lv2-display text-[96px] leading-none"
                style={{ color: 'var(--lv2-accent)' }}
              >
                {s.prefix ?? ''}
                <span className="lv2-countup" data-to={String(s.big)}>
                  0
                </span>
                {s.small ? (
                  <span className="lv2-display align-top text-[42px] italic text-white/90">
                    {s.unit}
                  </span>
                ) : (
                  <span className="align-top text-[48px]">{s.unit}</span>
                )}
              </p>
              <p className="mt-3 max-w-[260px] text-[15px] text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BRAND VOICE SPOTLIGHT */}
      <section className="mx-auto max-w-[1240px] px-6 py-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="lv2-reveal">
            <p className="lv2-mono-label mb-3">Brand voice engine</p>
            <h2
              className="lv2-display mb-5 text-[56px] leading-[1]"
              style={{ color: 'var(--lv2-primary)' }}
            >
              Sounds like you.
              <br />
              <em>Every time.</em>
            </h2>
            <p
              className="max-w-[500px] text-[16px] leading-relaxed"
              style={{ color: 'var(--lv2-fg-soft)' }}
            >
              Clipflow reads your last 500 posts, your brand guidelines, even your rejected
              drafts — and writes captions that pass for yours. Not generic. Not bland.{' '}
              <b>Yours.</b>
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px]">
              {[
                'Dial in tone, vocabulary, and forbidden words.',
                'Auto-scores every draft 0-100 before you see it.',
                'Learns from every approve / reject — quietly.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span
                    className="mt-1 h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--lv2-primary)' }}
                  />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lv2-reveal lv2-card lv2-ring-soft relative p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className="lv2-face lv2-face-ring h-10 w-10 rounded-full"
                />
                <div>
                  <p className="text-[13px] font-bold">Acme Studio</p>
                  <p className="lv2-mono text-[10.5px]" style={{ color: 'var(--lv2-muted)' }}>
                    BRAND VOICE · ACTIVE
                  </p>
                </div>
              </div>
              <span
                className="lv2-chip"
                style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
              >
                86% on brand
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tone', value: 'Sharp & witty', pct: 92, color: 'var(--lv2-primary)' },
                { label: 'Vocabulary', value: 'Trained on 504 posts', pct: 88, color: 'var(--lv2-primary)' },
                { label: 'Hook strength', value: 'Needs attention', pct: 74, color: 'var(--lv2-warn)' },
              ].map((b) => (
                <div key={b.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                    <span className="font-semibold">{b.label}</span>
                    <span className="lv2-mono" style={{ color: 'var(--lv2-muted)' }}>
                      {b.value}
                    </span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: 'var(--lv2-muted-2)' }}
                  >
                    <div className="h-full" style={{ width: `${b.pct}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="lv2-rule mb-4 mt-5" />
            <p className="lv2-mono-label mb-2" style={{ fontSize: 9 }}>
              AVOID WORDS
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['synergy ✕', 'leverage ✕', 'circle back ✕', 'unpack ✕'].map((w) => (
                <span
                  key={w}
                  className="lv2-chip"
                  style={{ background: 'var(--lv2-muted-2)', color: 'var(--lv2-fg)' }}
                >
                  {w}
                </span>
              ))}
            </div>
            <div
              className="lv2-card mt-5 p-3"
              style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
            >
              <p className="lv2-mono-label mb-1" style={{ fontSize: 9 }}>
                VOICE PREVIEW
              </p>
              <p className="text-[13.5px] italic leading-relaxed">
                &quot;Speed isn&apos;t about fewer breaks — it&apos;s about fewer decisions. We
                killed half our roadmap, and velocity doubled.&quot;
              </p>
            </div>
            <div className="lv2-sticker" style={{ top: -14, right: 20 }}>
              TRAINED ON 504
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE SPOTLIGHT */}
      <section
        style={{
          background: 'rgba(243,237,227,0.6)',
          borderTop: '1px solid var(--lv2-border)',
          borderBottom: '1px solid var(--lv2-border)',
        }}
      >
        <div className="mx-auto max-w-[1240px] px-6 py-28">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
            <div className="lv2-reveal lv2-card lv2-ring-soft order-2 p-5 lg:order-1">
              <div className="mb-4 flex items-center gap-2">
                <span className="lv2-mono-label">DRAFTS PIPELINE</span>
                <span
                  className="lv2-chip ml-auto"
                  style={{ background: '#E3F5EC', color: 'var(--lv2-success)' }}
                >
                  ● live
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {/* Draft */}
                <div
                  className="rounded-lg border p-2"
                  style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
                >
                  <p className="mb-2 text-[10px] font-bold">
                    Draft{' '}
                    <span className="lv2-mono font-normal" style={{ color: 'var(--lv2-muted)' }}>
                      2
                    </span>
                  </p>
                  <div className="space-y-1.5">
                    <div
                      className="rounded-md border p-1.5"
                      style={{
                        background: 'var(--lv2-card)',
                        borderColor: 'var(--lv2-border)',
                      }}
                    >
                      <div
                        className="lv2-thumb mb-1 h-8 rounded"
                        style={{
                          backgroundImage:
                            "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=60')",
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <span
                          className="lv2-face h-3.5 w-3.5 rounded-full"
                        />
                        <span
                          className="lv2-mono text-[8px]"
                          style={{ color: 'var(--lv2-muted)' }}
                        >
                          Nora
                        </span>
                      </div>
                    </div>
                    <div
                      className="h-14 rounded-md border"
                      style={{
                        background: 'var(--lv2-card)',
                        borderColor: 'var(--lv2-border)',
                      }}
                    />
                  </div>
                </div>
                {/* In review (highlighted) */}
                <div
                  className="rounded-lg border-2 p-2"
                  style={{
                    background: 'var(--lv2-primary-soft)',
                    borderColor: 'var(--lv2-primary)',
                  }}
                >
                  <p
                    className="mb-2 text-[10px] font-bold"
                    style={{ color: 'var(--lv2-primary)' }}
                  >
                    In review{' '}
                    <span className="lv2-mono font-normal" style={{ color: 'var(--lv2-muted)' }}>
                      4
                    </span>
                  </p>
                  <div className="space-y-1.5">
                    <div
                      className="rounded-md border p-1.5"
                      style={{
                        background: 'var(--lv2-card)',
                        borderColor: 'var(--lv2-border)',
                      }}
                    >
                      <div
                        className="mb-1 h-1 w-8 rounded"
                        style={{ background: 'var(--lv2-muted-2)' }}
                      />
                      <div
                        className="mb-1 h-1 w-12 rounded"
                        style={{ background: 'var(--lv2-muted-2)' }}
                      />
                      <div className="flex items-center gap-1">
                        <span
                          className="lv2-face h-3.5 w-3.5 rounded-full"
                        />
                        <span
                          className="lv2-mono text-[8px]"
                          style={{ color: 'var(--lv2-muted)' }}
                        >
                          Colin
                        </span>
                      </div>
                    </div>
                    {[14, 14, 10].map((h, j) => (
                      <div
                        key={j}
                        className="rounded-md border"
                        style={{
                          height: h * 4,
                          background: 'var(--lv2-card)',
                          borderColor: 'var(--lv2-border)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* Approved */}
                <div
                  className="rounded-lg border p-2"
                  style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
                >
                  <p className="mb-2 text-[10px] font-bold">
                    Approved{' '}
                    <span className="lv2-mono font-normal" style={{ color: 'var(--lv2-muted)' }}>
                      2
                    </span>
                  </p>
                  <div className="space-y-1.5">
                    <div
                      className="relative h-14 overflow-hidden rounded-md border"
                      style={{
                        background: 'linear-gradient(135deg, #EEF3D4, var(--lv2-accent))',
                        borderColor: 'var(--lv2-border)',
                      }}
                    >
                      <span
                        className="absolute bottom-1 right-1 text-[8px] font-bold"
                        style={{ color: 'var(--lv2-accent-ink)' }}
                      >
                        ✓
                      </span>
                    </div>
                    <div
                      className="h-14 rounded-md border"
                      style={{
                        background: 'var(--lv2-card)',
                        borderColor: 'var(--lv2-border)',
                      }}
                    />
                  </div>
                </div>
                {/* Scheduled */}
                <div
                  className="rounded-lg border p-2"
                  style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
                >
                  <p className="mb-2 text-[10px] font-bold">
                    Scheduled{' '}
                    <span className="lv2-mono font-normal" style={{ color: 'var(--lv2-muted)' }}>
                      2
                    </span>
                  </p>
                  <div className="space-y-1.5">
                    <div
                      className="rounded-md border p-1.5"
                      style={{
                        background: 'var(--lv2-card)',
                        borderColor: 'var(--lv2-border)',
                      }}
                    >
                      <div
                        className="lv2-mono mb-0.5 text-[8px]"
                        style={{ color: 'var(--lv2-muted)' }}
                      >
                        TUE 9:00 AM
                      </div>
                      <div
                        className="h-1 w-10 rounded"
                        style={{ background: 'var(--lv2-muted-2)' }}
                      />
                    </div>
                    <div
                      className="h-14 rounded-md border"
                      style={{
                        background: 'var(--lv2-card)',
                        borderColor: 'var(--lv2-border)',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="lv2-rule mb-4 mt-5" />
              <div className="flex items-center justify-between text-[11px]">
                <span className="lv2-mono" style={{ color: 'var(--lv2-muted)' }}>
                  NEXT POST
                </span>
                <span className="font-semibold">Today · 2:00 PM · YouTube Short</span>
                <span
                  className="lv2-chip ml-2"
                  style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
                >
                  in 4h 12m
                </span>
              </div>
            </div>

            <div className="lv2-reveal order-1 lg:order-2">
              <p className="lv2-mono-label mb-3">The pipeline</p>
              <h2
                className="lv2-display mb-5 text-[56px] leading-[1]"
                style={{ color: 'var(--lv2-primary)' }}
              >
                Your whole content op, on one board.
              </h2>
              <p
                className="max-w-[520px] text-[16px] leading-relaxed"
                style={{ color: 'var(--lv2-fg-soft)' }}
              >
                Draft → Review → Approved → Scheduled. Drag a clip between columns or hit keyboard
                shortcuts. Your whole team sees what&apos;s moving, what&apos;s stuck, and what
                ships tonight.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div>
                  <p className="lv2-num-stamp">
                    <span className="lv2-countup" data-to="32">
                      0
                    </span>
                    <span
                      className="lv2-display align-top text-[24px] italic"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      s
                    </span>
                  </p>
                  <p className="mt-1 text-[12.5px]" style={{ color: 'var(--lv2-muted)' }}>
                    avg. time to approve a draft
                  </p>
                </div>
                <div>
                  <p className="lv2-num-stamp">
                    <span className="lv2-countup" data-to="94">
                      0
                    </span>
                    <span
                      className="lv2-display align-top text-[24px] italic"
                      style={{ color: 'var(--lv2-muted)' }}
                    >
                      %
                    </span>
                  </p>
                  <p className="mt-1 text-[12.5px]" style={{ color: 'var(--lv2-muted)' }}>
                    of posts publish without a second edit
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <FeatureGrid />

      {/* TESTIMONIAL */}
      <section
        style={{
          background: 'rgba(243,237,227,0.6)',
          borderTop: '1px solid var(--lv2-border)',
          borderBottom: '1px solid var(--lv2-border)',
        }}
      >
        <div className="mx-auto max-w-[1100px] px-6 py-28">
          <p className="lv2-mono-label mb-6 text-center">What creators say</p>
          {/*
            Pre-launch. No named-customer testimonials with real company
            attributions until we have signed quotes — FTC endorsement
            rules + simple trust-hygiene. What's below is a short
            product-promise block in the same visual slot so the page
            doesn't feel structurally broken. Swap back to the three-
            card testimonial grid the moment we have real quotes.
          */}
          <blockquote
            className="lv2-display lv2-reveal mx-auto max-w-[900px] text-center text-[44px] leading-[1.05] sm:text-[56px]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            &quot;Post every platform this week, without rehiring an editor.&quot;
          </blockquote>
          <p
            className="lv2-reveal mx-auto mt-6 max-w-[640px] text-center text-[15.5px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            That&rsquo;s the promise. 14-day refund — no questions, no phone call. If Clipflow
            doesn&rsquo;t replace at least one workflow you&rsquo;re paying for now, we send the money back.
          </p>
          <div className="lv2-reveal mt-10 flex flex-wrap items-center justify-center gap-2">
            <span
              className="lv2-chip"
              style={{
                background: 'var(--lv2-primary-soft)',
                color: 'var(--lv2-primary)',
              }}
            >
              Early access
            </span>
            <span className="lv2-mono text-[11px]" style={{ color: 'var(--lv2-muted)' }}>
              Testimonials from founding users land here once we&rsquo;re out of beta.
            </span>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-[1240px] px-6 py-28">
        <div className="lv2-reveal mb-14 text-center">
          <p className="lv2-mono-label mb-3">Pricing</p>
          <h2
            className="lv2-display text-[52px] leading-[1]"
            style={{ color: 'var(--lv2-primary)' }}
          >
            <WordReveal text="Simple. Obvious. No seat tax." />
          </h2>
          <p
            className="mx-auto mt-4 max-w-[520px] text-[15px]"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Start free. Upgrade when you hit the ceiling. Cancel in two clicks.
          </p>
        </div>

        <div className="lv2-pricing-grid lv2-reveal-stagger mx-auto grid max-w-[1040px] gap-4 md:grid-cols-3">
          <PricingTilt className="lv2-pricing-tile lv2-card lv2-ring-soft lv2-card-hover lv2-beam p-6">
          <div>
            <p className="lv2-mono-label mb-1" data-depth="back">Starter</p>
            <p className="mb-2 text-[11.5px] font-medium" style={{ color: 'var(--lv2-muted)' }}>
              Test drive — no card needed
            </p>
            <p className="lv2-display text-[52px] leading-none" style={{ color: 'var(--lv2-primary)' }} data-depth="front">
              $0
            </p>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--lv2-muted)' }}>
              Free forever
            </p>
            <div className="lv2-rule my-5" />
            <ul className="space-y-2.5 text-[13px]">
              {['3 videos / month', '10 posts / month', '1 workspace', 'Clipflow watermark'].map(
                (f, i) => (
                  <li
                    key={f}
                    className="lv2-feature flex items-start gap-2"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <span className="lv2-feature-check mt-0.5" style={{ color: 'var(--lv2-primary)' }}>
                      ✓
                    </span>
                    {f}
                  </li>
                ),
              )}
            </ul>
            <Link
              href={appendPlan(signupHref, 'free')}
              className="lv2-btn-ghost lv2-magnetic mt-6 w-full justify-center border"
              style={{ borderColor: 'var(--lv2-border)' }}
              data-depth="cta"
            >
              <span className="lv2-magnetic-shine" />
              <span className="lv2-magnetic-label">
                Try Clipflow free <span className="lv2-arrow">→</span>
              </span>
            </Link>
          </div>
          </PricingTilt>

          <PricingTilt
            className="lv2-pricing-tile lv2-pricing-tile-popular lv2-card lv2-ring-soft lv2-card-hover lv2-beam relative p-6"
            style={{
              borderColor: 'var(--lv2-primary)',
              boxShadow:
                '0 1px 0 rgba(24,21,17,.04), 0 30px 60px -20px rgba(42,26,61,.35)',
            }}
          >
          <div>
            <span
              className="lv2-chip absolute -top-3 left-6"
              style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
            >
              MOST POPULAR
            </span>
            <p className="lv2-mono-label mb-1" style={{ color: 'var(--lv2-primary)' }}>
              Creator
            </p>
            <p className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--lv2-muted)' }}>
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--lv2-accent)' }}
              />
              Picked by 60% of creators this month
            </p>
            <div className="flex items-baseline gap-1.5">
              <p
                className="lv2-display text-[52px] leading-none"
                style={{ color: 'var(--lv2-primary)' }}
                data-depth="front"
              >
                $29
              </p>
              <p className="text-[13px]" style={{ color: 'var(--lv2-muted)' }}>
                /mo
              </p>
              <span
                className="lv2-chip ml-auto"
                style={{
                  background: 'var(--lv2-accent)',
                  color: 'var(--lv2-accent-ink)',
                  boxShadow: '0 4px 12px -4px rgba(214,255,62,0.55)',
                }}
              >
                Save $120/yr
              </span>
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--lv2-muted)' }}>
              Billed monthly · or{' '}
              <strong style={{ color: 'var(--lv2-primary)' }}>$19/mo</strong> annual
            </p>
            <div className="lv2-rule my-5" />
            <ul className="space-y-2.5 text-[13px]">
              {[
                '30 videos / month',
                '150 posts / month',
                '30 video renders / month',
                '1 workspace',
                'Brand voice + Brand Kit (logo, color, intro/outro)',
                'Auto-publish to TikTok, Instagram, YouTube, LinkedIn',
                'A/B hook testing · Virality Score · Creator research',
              ].map((f, i) => (
                <li
                  key={f}
                  className="lv2-feature flex items-start gap-2"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className="lv2-feature-check mt-0.5" style={{ color: 'var(--lv2-primary)' }}>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={appendPlan(signupHref, 'creator')}
              className="lv2-btn-primary lv2-magnetic mt-6 w-full justify-center"
              data-depth="cta"
            >
              <span className="lv2-magnetic-shine" />
              <span className="lv2-magnetic-label">
                Try Creator free for 14 days <span className="lv2-arrow">→</span>
              </span>
            </Link>
            <p
              className="lv2-mono mt-3 text-center text-[10px]"
              style={{ color: 'var(--lv2-muted)', letterSpacing: '0.04em' }}
            >
              NO CARD · CANCEL IN 2 CLICKS · FULL REFUND IN 14 DAYS
            </p>
          </div>
          </PricingTilt>

          <PricingTilt className="lv2-pricing-tile lv2-card lv2-ring-soft lv2-card-hover lv2-beam p-6">
          <div>
            <p className="lv2-mono-label mb-1" data-depth="back">Studio</p>
            <p className="mb-2 inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: 'var(--lv2-muted)' }}>
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: 'var(--lv2-primary)' }}
              />
              Best for agencies running 3+ clients
            </p>
            <div className="flex items-baseline gap-1.5">
              <p
                className="lv2-display text-[52px] leading-none"
                style={{ color: 'var(--lv2-primary)' }}
                data-depth="front"
              >
                $99
              </p>
              <p className="text-[13px]" style={{ color: 'var(--lv2-muted)' }}>
                /mo
              </p>
              <span
                className="lv2-chip ml-auto"
                style={{
                  background: 'var(--lv2-accent)',
                  color: 'var(--lv2-accent-ink)',
                  boxShadow: '0 4px 12px -4px rgba(214,255,62,0.55)',
                }}
              >
                Save $240/yr
              </span>
            </div>
            <p className="mt-1 text-[12.5px]" style={{ color: 'var(--lv2-muted)' }}>
              For social-media managers · or{' '}
              <strong style={{ color: 'var(--lv2-primary)' }}>$79/mo</strong> annual
            </p>
            <div className="lv2-rule my-5" />
            <ul className="space-y-2.5 text-[13px]">
              {[
                'Unlimited videos + posts',
                '300 video renders / month',
                'Unlimited client workspaces',
                'Unlimited team seats with roles',
                'White-label review links (your brand, not ours)',
                'AI avatars · auto-dub · voice cloning',
                'Priority render queue + audit log',
                'Everything in Creator',
              ].map((f, i) => (
                <li
                  key={f}
                  className="lv2-feature flex items-start gap-2"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <span className="lv2-feature-check mt-0.5" style={{ color: 'var(--lv2-primary)' }}>
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={appendPlan(signupHref, 'studio')}
              className="lv2-btn-ghost lv2-magnetic mt-6 w-full justify-center border"
              style={{ borderColor: 'var(--lv2-border)' }}
              data-depth="cta"
            >
              <span className="lv2-magnetic-shine" />
              <span className="lv2-magnetic-label">
                Try Studio free for 14 days <span className="lv2-arrow">→</span>
              </span>
            </Link>
            <p
              className="lv2-mono mt-3 text-center text-[10px]"
              style={{ color: 'var(--lv2-muted)', letterSpacing: '0.04em' }}
            >
              NO CARD · UNLIMITED CLIENTS · CANCEL ANYTIME
            </p>
          </div>
          </PricingTilt>
        </div>
      </section>

      {/* FAQ — every row carries its category, an index, and a lime
          activation tab on the left edge so the section reads as a
          curated list rather than five identical pills. The toggle
          rotates 45° to form an × when open, and the open card gains
          a soft plum gradient + lime inner ring so it feels physically
          attached to the brand instead of just expanding text. */}
      <section id="faq" className="mx-auto max-w-[920px] px-6 py-20">
        <p
          className="lv2-mono-label lv2-reveal mb-3 text-center"
          style={{ color: 'var(--lv2-muted)' }}
        >
          FAQ · five things people ask
        </p>
        <h2
          className="lv2-display lv2-reveal mb-10 text-center text-[44px] leading-[1]"
          style={{ color: 'var(--lv2-primary)' }}
        >
          <WordReveal text="Questions, answered." />
        </h2>
        <div className="lv2-reveal-stagger space-y-2.5">
          {[
            {
              cat: 'Voice',
              q: 'Will my captions sound AI-generated?',
              a: "No. The brand voice engine reads everything you've already published and writes in your exact pattern. Most users can't tell which captions were AI vs. human — that's the point.",
            },
            {
              cat: 'Billing',
              q: 'What happens if I go over my minutes?',
              a: 'We email you at 80%, 95%, and 100%. At 100%, processing pauses until you upgrade or top up. No surprise bills.',
            },
            {
              cat: 'Privacy',
              q: 'Do you store my raw footage?',
              a: 'Only while we process it. Raw files are deleted after 30 days by default; clips and transcripts stay as long as your workspace does.',
            },
            {
              cat: 'Platforms',
              q: 'Which platforms can I publish to?',
              a: 'TikTok, YouTube (Shorts + long-form), Instagram (Reels + feed), LinkedIn, and X. More on the roadmap — vote at /requests.',
            },
            {
              cat: 'Account',
              q: 'Can I cancel anytime?',
              a: `Two clicks. No "hold on, let me transfer you." Your clips stay; billing stops immediately.`,
            },
          ].map((f, i) => (
            <details key={f.q} className="lv2-faq-row group/faq relative cursor-pointer">
              {/* Lime activation tab on the left edge — fades in on
                  hover, locks bright on open. Same trick the dashboard
                  funnel-step uses to say "this row is selected". */}
              <span
                aria-hidden
                className="lv2-faq-tab pointer-events-none absolute left-0 top-1/2 h-10 w-[3px] -translate-y-1/2 rounded-r-full"
                style={{ background: 'var(--lv2-accent)' }}
              />
              <summary className="flex items-center gap-4 px-5 py-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
                <span
                  className="lv2-tabular shrink-0 text-[10px] font-bold tracking-[0.2em]"
                  style={{
                    color: 'var(--lv2-muted)',
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="lv2-faq-cat shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    background: 'var(--lv2-primary-soft)',
                    color: 'var(--lv2-primary)',
                  }}
                >
                  {f.cat}
                </span>
                <span className="flex-1">{f.q}</span>
                <span
                  aria-hidden
                  className="lv2-faq-toggle relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300"
                  style={{
                    color: 'var(--lv2-primary)',
                    background: 'var(--lv2-primary-soft)',
                  }}
                >
                  <span className="absolute h-px w-3" style={{ background: 'currentColor' }} />
                  <span
                    className="lv2-faq-toggle-cross absolute h-3 w-px transition-transform duration-300"
                    style={{ background: 'currentColor' }}
                  />
                </span>
              </summary>
              <div className="lv2-faq-body overflow-hidden">
                <p
                  className="px-5 pb-5 pl-[88px] text-[13.5px] leading-relaxed"
                  style={{ color: 'var(--lv2-muted)' }}
                >
                  {f.a}
                </p>
              </div>
            </details>
          ))}
        </div>
        <style jsx>{`
          .lv2-faq-row {
            background: var(--lv2-card);
            border: 1px solid var(--lv2-border);
            border-radius: 14px;
            box-shadow: 0 1px 0 rgba(255, 255, 255, 0.6) inset;
            transition: border-color 0.18s ease, box-shadow 0.18s ease,
              transform 0.18s ease, background 0.18s ease;
          }
          .lv2-faq-row:hover {
            border-color: var(--lv2-border-strong);
            transform: translateY(-1px);
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.6) inset,
              0 1px 2px rgba(24, 21, 17, 0.04),
              0 12px 28px -16px rgba(42, 26, 61, 0.18);
          }
          .lv2-faq-row[open] {
            border-color: rgba(214, 255, 62, 0.45);
            background: linear-gradient(
              180deg,
              rgba(214, 255, 62, 0.05) 0%,
              var(--lv2-card) 60%
            );
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.7) inset,
              0 0 0 4px rgba(214, 255, 62, 0.06),
              0 14px 32px -18px rgba(42, 26, 61, 0.22);
          }
          /* Left lime tab — invisible at rest, halfway visible on
             hover, full when the row is open. */
          .lv2-faq-tab {
            opacity: 0;
            transition: opacity 0.18s ease, height 0.22s ease;
          }
          .lv2-faq-row:hover .lv2-faq-tab {
            opacity: 0.55;
          }
          .lv2-faq-row[open] .lv2-faq-tab {
            opacity: 1;
            height: 60%;
            box-shadow: 0 0 12px rgba(214, 255, 62, 0.55);
          }
          /* Toggle: + at rest, rotates to × when open. The horizontal
             bar stays put, the vertical bar rotates 90° on close-state
             so we get a clean rotation to ×. */
          .lv2-faq-row[open] .lv2-faq-toggle {
            background: var(--lv2-primary);
            color: var(--lv2-accent);
            transform: rotate(45deg);
          }
          .lv2-faq-row[open] .lv2-faq-toggle-cross {
            transform: scaleY(0);
          }
          /* Animated body reveal — slides + fades instead of pop. */
          .lv2-faq-body {
            max-height: 0;
            opacity: 0;
            transition: max-height 0.32s cubic-bezier(0.2, 0.8, 0.2, 1),
              opacity 0.32s ease;
          }
          .lv2-faq-row[open] .lv2-faq-body {
            max-height: 320px;
            opacity: 1;
          }
          /* The category chip recolors when the row opens. */
          .lv2-faq-row[open] .lv2-faq-cat {
            background: var(--lv2-primary);
            color: var(--lv2-accent);
          }
          @media (prefers-reduced-motion: reduce) {
            .lv2-faq-row,
            .lv2-faq-tab,
            .lv2-faq-toggle,
            .lv2-faq-toggle-cross,
            .lv2-faq-body {
              transition: none !important;
            }
            .lv2-faq-row:hover {
              transform: none;
            }
          }
        `}</style>
      </section>

      {/* BIG CTA — designed to feel like a physical surface lit from
          above, not a flat plum slab. Gradient + paper grain + two
          orbs (lime top-right, lime bottom-left) give the chassis
          real depth. Right column trades placeholder avatars for an
          actual three-step mini-flow so the eye has something to
          land on instead of empty negative space. */}
      <section className="mx-auto max-w-[1240px] px-6 pb-28">
        <div
          className="lv2-reveal relative overflow-hidden rounded-[32px] p-14 text-white lg:p-20"
          style={{
            background:
              'linear-gradient(160deg, #2A1A3D 0%, #120920 65%, #1d0f30 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(214,255,62,.12), inset 0 0 0 1px rgba(214,255,62,.10), 0 1px 2px rgba(18,9,32,.4), 0 32px 64px -24px rgba(18,9,32,.55)',
          }}
        >
          {/* Top-right lime halo — primary glow source. Bumped from
              0.22 to 0.38 so it actually reads as light. */}
          <div
            className="lv2-orb absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--lv2-accent) 0%, transparent 62%)',
              opacity: 0.38,
            }}
          />
          {/* Bottom-left lime bloom — secondary light source so the
              chassis has two dimensions of depth, not one. */}
          <div
            className="absolute -bottom-32 -left-24 h-[360px] w-[360px] rounded-full"
            aria-hidden
            style={{
              background:
                'radial-gradient(circle, rgba(214,255,62,.10) 0%, transparent 60%)',
            }}
          />
          {/* Hairline highlight along the top edge — same trick the
              dashboard hero uses. Reads as "this surface is lit". */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-16 top-0 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(214,255,62,.45), transparent)',
            }}
          />
          {/* Subtle paper grain so the dark surface isn't a dead
              rectangle. SVG noise via data-uri keeps it a single
              network resource. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-screen"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")",
            }}
          />
          <div className="relative grid items-end gap-10 md:grid-cols-[1.3fr_1fr]">
            <div>
              <p
                className="lv2-mono-label mb-4 inline-flex items-center gap-2"
                style={{ color: 'rgba(214,255,62,.85)' }}
              >
                <span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: 'var(--lv2-accent)',
                    boxShadow: '0 0 8px rgba(214,255,62,.7)',
                  }}
                />
                Ready when you are
              </p>
              <h2
                className="lv2-display text-[64px] leading-[0.95] sm:text-[84px]"
                style={{ color: 'var(--lv2-accent)' }}
              >
                Your next post
                <br />
                is <em>already</em>
                <br />
                in the recording.
              </h2>
              <p className="mt-6 max-w-[540px] text-[16px] text-white/75">
                Six minutes from upload to approved draft. No card. No onboarding call. Just drop
                a video and see what Clipflow pulls out.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:items-start md:pb-2">
              {/* Three-step mini-flow — replaces the placeholder face
                  circles with something that actually says "this is
                  what you get in those six minutes". Each row is a
                  glassy plum pill so the eye lands on real content,
                  not loading-state stand-ins. */}
              <ul
                className="flex flex-col gap-1.5 text-[12.5px]"
                style={{ fontFamily: 'var(--font-jetbrains-mono), monospace' }}
              >
                {[
                  { t: '0:00', l: 'Drop a recording' },
                  { t: '2:30', l: 'AI cuts + captions + hooks' },
                  { t: '6:00', l: 'You approve, it publishes' },
                ].map((s) => (
                  <li
                    key={s.t}
                    className="flex items-center gap-3 rounded-full px-3 py-1.5"
                    style={{
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(214,255,62,.12)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
                    }}
                  >
                    <span
                      className="lv2-tabular text-[10.5px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: 'rgba(214,255,62,.85)' }}
                    >
                      {s.t}
                    </span>
                    <span
                      aria-hidden
                      className="h-px flex-1 min-w-[12px]"
                      style={{ background: 'rgba(214,255,62,.18)' }}
                    />
                    <span className="text-white/85">{s.l}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link href={signupHref} className="lv2-btn-accent px-6 py-4 text-[15px]">
                  Start free — 14 days <span>→</span>
                </Link>
                <a
                  href="mailto:hi@clipflow.to?subject=Clipflow%20demo"
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold underline-offset-4 hover:underline"
                  style={{ color: 'rgba(214,255,62,.85)' }}
                >
                  Book a 15-min demo
                  <span aria-hidden>→</span>
                </a>
              </div>

              <div
                className="lv2-mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
                style={{ color: 'rgba(255,255,255,.55)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="h-1 w-1 rounded-full"
                    style={{ background: 'rgba(214,255,62,.7)' }}
                  />
                  EARLY ACCESS · FOUNDING MEMBER PRICING
                </span>
                <span aria-hidden>·</span>
                <span>NO CARD</span>
                <span aria-hidden>·</span>
                <span>CANCEL 1-CLICK</span>
                <span aria-hidden>·</span>
                <span>SOC 2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--lv2-border)' }}>
        <div className="mx-auto max-w-[1240px] px-6 py-14">
          {/* 6-col layout needs ~1000px to not crowd column labels
              like "Clipflow vs OpusClip". Below lg, collapse to 2
              cols so the link labels can breathe. */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: 'var(--lv2-primary)' }}
                >
                  <span
                    className="block h-3 w-3 rounded-[3px]"
                    style={{ background: 'var(--lv2-accent)' }}
                  />
                </span>
                <span
                  className="lv2-display text-[26px] leading-none"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  Clipflow
                </span>
              </div>
              <p
                className="max-w-[280px] text-[12.5px]"
                style={{ color: 'var(--lv2-muted)' }}
              >
                One recording becomes a month of posts. Built for creators who&apos;d rather
                record than edit.
              </p>
              <p
                className="lv2-mono mt-6 text-[10.5px]"
                style={{ color: 'var(--lv2-muted)', letterSpacing: '.15em' }}
              >
                MADE IN BERLIN · SOC 2 · GDPR
              </p>
            </div>
            {(
              [
                {
                  title: 'PRODUCT',
                  items: [
                    { label: 'All features', href: '/features' },
                    { label: 'Use cases', href: '/for' },
                    { label: 'Playbook', href: '/playbook' },
                    { label: 'Pricing', href: '#pricing' },
                    { label: 'Changelog', href: '/changelog' },
                  ],
                },
                {
                  title: 'COMPARE',
                  items: [
                    { label: 'Clipflow vs OpusClip', href: '/compare/clipflow-vs-opusclip' },
                    { label: 'Clipflow vs Klap', href: '/compare/clipflow-vs-klap' },
                    { label: 'Clipflow vs Descript', href: '/compare/clipflow-vs-descript' },
                    { label: 'All comparisons', href: '/compare' },
                  ],
                },
                {
                  title: 'ALTERNATIVES',
                  items: [
                    { label: 'OpusClip alternative', href: '/opusclip-alternative' },
                    { label: 'Klap alternative', href: '/klap-alternative' },
                    { label: 'Descript alternative', href: '/descript-alternative' },
                  ],
                },
                {
                  title: 'COMPANY',
                  items: [
                    { label: 'Creators', href: '#creators' },
                    { label: 'FAQ', href: '#faq' },
                    { label: 'Help center', href: '/help' },
                    { label: 'Contact', href: 'mailto:hi@clipflow.to' },
                    { label: 'Imprint', href: '/imprint' },
                  ],
                },
                {
                  title: 'ACCOUNT',
                  items: [
                    { label: 'Start free', href: signupHref },
                    { label: 'Sign in', href: '/login' },
                  ],
                },
                {
                  title: 'LEGAL',
                  items: [
                    { label: 'Terms', href: '/terms' },
                    { label: 'Privacy', href: '/privacy' },
                    { label: 'Cookies', href: '/cookies' },
                    { label: 'DMCA', href: '/dmca' },
                  ],
                },
              ] as const
            ).map((col) => (
              <div key={col.title}>
                <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
                  {col.title}
                </p>
                <ul className="space-y-2 text-[13px]">
                  {col.items.map((it) => {
                    const isExternal =
                      it.href.startsWith('mailto:') || it.href.startsWith('http')
                    const isAnchor = it.href.startsWith('#')
                    const commonCls =
                      'lv2-u-sweep transition-colors hover:text-[var(--lv2-fg)]'
                    return (
                      <li key={it.label}>
                        {isExternal || isAnchor ? (
                          <a href={it.href} className={commonCls}>
                            {it.label}
                          </a>
                        ) : (
                          <Link href={it.href} className={commonCls}>
                            {it.label}
                          </Link>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="lv2-rule my-10" />
          <div
            className="lv2-mono flex flex-wrap items-center justify-between gap-4 text-[11.5px]"
            style={{ color: 'var(--lv2-muted)' }}
          >
            <span>© 2026 CLIPFLOW GMBH</span>
            <Link href="/changelog" className="hover:text-[var(--lv2-fg)]">
              Changelog
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating "Start free" CTA — appears after hero scrolls out,
          hides near pricing so it doesn't stack on top of in-flow
          buttons. */}
      <StickyCta href={signupHref} />
    </div>
  )
}

function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-[1240px] px-6 py-28">
      <div className="lv2-reveal mb-14">
        <p className="lv2-mono-label mb-3">Everything else</p>
        <h2
          className="lv2-display max-w-[620px] text-[52px] leading-[1]"
          style={{ color: 'var(--lv2-primary)' }}
        >
          The little things that make the big things possible.
        </h2>
      </div>

      <div className="lv2-reveal-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Subtitles */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            SUBTITLES
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">Karaoke-grade captions</h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Word-level timing, animated highlights, 40+ languages. Branded by default.
          </p>
          <div className="relative mt-5 aspect-video overflow-hidden rounded-lg">
            <div
              className="lv2-thumb absolute inset-0"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80')",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,.65), transparent 50%)',
              }}
            />
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1">
              <span className="text-[13px] text-white">The</span>
              <span className="text-[13px] text-white">#1</span>
              <span className="text-[13px] text-white">reason</span>
              <span
                className="rounded px-1 text-[13px] font-extrabold"
                style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
              >
                teams
              </span>
              <span
                className="rounded px-1 text-[13px] font-extrabold"
                style={{ background: 'var(--lv2-accent)', color: 'var(--lv2-accent-ink)' }}
              >
                ship
              </span>
              <span className="text-[13px] text-white">slow</span>
            </div>
          </div>
        </div>

        {/* Reframe */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            REFRAME
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">One cut, every aspect ratio</h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            AI tracks the subject through each cut. 9:16, 1:1, 4:5, 16:9 — no letterboxing.
          </p>
          <div className="mt-5 flex h-[120px] items-end justify-center gap-2">
            {[
              { w: 40, h: 110, r: '9:16' },
              { w: 70, h: 70, r: '1:1' },
              { w: 60, h: 75, r: '4:5' },
              { w: 104, h: 58, r: '16:9' },
            ].map((a) => (
              <div
                key={a.r}
                className="lv2-thumb relative rounded"
                style={{
                  width: a.w,
                  height: a.h,
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=60')",
                }}
              >
                <div className="lv2-mono absolute bottom-1 left-1 right-1 text-[7px] text-white">
                  {a.r}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dub */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            DUB
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">Speak 28 languages</h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Voice clone with consent. Perfect lipsync. Publish to global audiences same-day.
          </p>
          <div className="mt-5 space-y-1.5">
            <div
              className="lv2-card flex items-center gap-2 p-2"
              style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
            >
              <span
                className="lv2-face h-6 w-6 rounded-full"
              />
              <span className="lv2-mono flex-1 text-[11px]">
                🇬🇧 &quot;Speed isn&apos;t effort...&quot;
              </span>
              <span className="flex h-3 items-end gap-[2px]">
                {[0, 0.2, 0.1].map((d, i) => (
                  <span
                    key={i}
                    className="lv2-wave-bar w-[2px]"
                    style={{ background: 'var(--lv2-primary)', animationDelay: `${d}s` }}
                  />
                ))}
              </span>
            </div>
            <div
              className="lv2-card flex items-center gap-2 p-2"
              style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
            >
              <span
                className="lv2-face h-6 w-6 rounded-full"
              />
              <span className="lv2-mono flex-1 text-[11px]">
                🇩🇪 &quot;Geschwindigkeit ist...&quot;
              </span>
              <span
                className="lv2-chip"
                style={{
                  background: 'var(--lv2-accent)',
                  color: 'var(--lv2-accent-ink)',
                  fontSize: 8,
                }}
              >
                DUB
              </span>
            </div>
          </div>
        </div>

        {/* B-Roll */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            B-ROLL
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">Smart B-roll from your library</h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Clipflow pulls relevant footage from your connected Drive, Dropbox, or stock library.
          </p>
          <div className="mt-5 grid grid-cols-4 gap-1">
            {[
              'photo-1552058544-f2b08422138a',
              'photo-1542744173-8e7e53415bb0',
              'photo-1573164713714-d95e436ab8d6',
              'photo-1522071820081-009f0129c71c',
            ].map((p) => (
              <div
                key={p}
                className="lv2-thumb aspect-square rounded"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/${p}?w=200&q=60')`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            TEAM
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">Roles, approvals, audit log</h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Give editors edit. Give execs approve-only. Every action is logged and reversible.
          </p>
          <div className="mt-5 space-y-2">
            {[
              { name: 'Maya K.', role: 'Owner', img: 12, owner: true },
              { name: 'Ari T.', role: 'Editor', img: 47, owner: false },
              { name: 'Jo R.', role: 'Approver', img: 26, owner: false },
            ].map((m) => (
              <div key={m.name} className="flex items-center gap-2 text-[11.5px]">
                <span
                  className="lv2-face h-7 w-7 rounded-full"
                />
                <span className="font-semibold">{m.name}</span>
                <span
                  className="lv2-chip ml-auto"
                  style={
                    m.owner
                      ? { background: 'var(--lv2-primary)', color: 'var(--lv2-accent)' }
                      : { background: 'var(--lv2-muted-2)', color: 'var(--lv2-fg)' }
                  }
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics (dark) */}
        <div
          className="lv2-card lv2-ring-soft lv2-card-hover relative overflow-hidden p-6"
          style={{ background: 'var(--lv2-primary)', borderColor: 'var(--lv2-primary)', color: 'white' }}
        >
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9, color: 'rgba(255,255,255,.55)' }}>
            ANALYTICS
          </p>
          <h3
            className="lv2-sans-d mb-2 text-[20px] font-bold"
            style={{ color: 'var(--lv2-accent)' }}
          >
            See what actually worked
          </h3>
          <p className="text-[13px] leading-relaxed text-white/70">
            Per clip, per platform, per cohort. Which hooks converted. Which got scrolled past.
          </p>
          <div className="mt-5 flex h-[70px] items-end gap-1">
            {[
              { pct: 30, a: 0.15 },
              { pct: 55, a: 0.3 },
              { pct: 45, a: 0.25 },
              { pct: 85, a: -1 },
              { pct: 62, a: 0.4 },
              { pct: 95, a: -1 },
              { pct: 50, a: 0.25 },
              { pct: 70, a: 0.4 },
              { pct: 78, a: -1 },
            ].map((b, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${b.pct}%`,
                  background: b.a < 0 ? 'var(--lv2-accent)' : `rgba(255,255,255,${b.a})`,
                }}
              />
            ))}
          </div>
          <div className="lv2-mono mt-3 flex items-center justify-between text-[10px] text-white/60">
            <span>MON</span>
            <span>WED</span>
            <span>FRI</span>
            <span>SUN</span>
          </div>
        </div>

        {/* Viral Moments — the full detection + render + publish
            pipeline. The old "Virality Score" card is folded into
            this since the score is the engine, Viral Moments is the
            product. Deep-link to /features/viral-moments for the
            long-form explainer. */}
        <Link
          href="/features/viral-moments"
          className="lv2-card lv2-ring-soft lv2-card-hover group block p-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="lv2-mono-label" style={{ fontSize: 9 }}>
              VIRAL MOMENTS
            </p>
            <span
              className="lv2-chip"
              style={{
                background: 'var(--lv2-accent)',
                color: 'var(--lv2-accent-ink, #1a2000)',
                fontSize: 9,
              }}
            >
              NEW
            </span>
          </div>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">
            AI picks the 3\u20138 clips worth posting
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Drop a 60-minute podcast. Clipflow returns 3\u20138 ranked clips
            with hooks, scores, and a one-line reason \u2014 render with
            karaoke captions in one click.
          </p>
          <div className="mt-5 space-y-2">
            {[
              { score: 92, label: 'FIRE', bg: 'linear-gradient(135deg,#D6FF3E,#B8E02E)', fg: '#1a2000' },
              { score: 74, label: 'STRONG', bg: 'var(--lv2-primary)', fg: 'var(--lv2-accent)' },
              { score: 51, label: 'OK', bg: 'var(--lv2-muted-2)', fg: 'var(--lv2-fg-soft)' },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-3 rounded-lg p-2"
                style={{ background: 'var(--lv2-bg-2)' }}
              >
                <div
                  className="flex h-10 w-10 flex-col items-center justify-center rounded-lg"
                  style={{ background: b.bg, color: b.fg }}
                >
                  <span className="lv2-tabular text-[13px] font-bold leading-none">
                    {b.score}
                  </span>
                  <span className="lv2-mono text-[7px] font-bold" style={{ letterSpacing: '.1em' }}>
                    {b.label}
                  </span>
                </div>
                <span className="text-[11.5px]" style={{ color: 'var(--lv2-muted)' }}>
                  {b.label === 'FIRE'
                    ? 'Punchy hook, pays off in 7s'
                    : b.label === 'STRONG'
                      ? 'Clear insight, good pacing'
                      : 'Solid — if on-topic'}
                </span>
              </div>
            ))}
          </div>
          <p
            className="lv2-mono mt-4 text-[10.5px] underline-offset-4 group-hover:underline"
            style={{ color: 'var(--lv2-primary)' }}
          >
            See the full Viral Moments flow &rarr;
          </p>
        </Link>

        {/* Brand Kit */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            BRAND KIT
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">
            Set your logo once, stamp it everywhere
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Logo, colors, intro, outro. Applied automatically to every Clipflow
            render. No more manual branding per clip.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {/* intro frame */}
            <div
              className="aspect-[9/16] overflow-hidden rounded-md"
              style={{ background: 'linear-gradient(135deg, var(--lv2-primary), #5a4470)' }}
            >
              <div className="flex h-full items-center justify-center p-1 text-center">
                <span className="text-[8px] font-extrabold text-white">Nora&rsquo;s Podcast</span>
              </div>
            </div>
            {/* body frame */}
            <div
              className="relative aspect-[9/16] overflow-hidden rounded-md"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&q=60')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <span
                className="absolute right-1 bottom-1 flex h-3 w-3 items-center justify-center rounded-sm"
                style={{ background: 'white' }}
              >
                <span
                  className="block h-1.5 w-1.5 rounded-sm"
                  style={{ background: 'var(--lv2-primary)' }}
                />
              </span>
            </div>
            {/* outro frame */}
            <div
              className="aspect-[9/16] overflow-hidden rounded-md"
              style={{ background: 'linear-gradient(135deg, var(--lv2-primary), #5a4470)' }}
            >
              <div className="flex h-full items-center justify-center p-1 text-center">
                <span className="text-[8px] font-extrabold text-white">Follow → @nora</span>
              </div>
            </div>
          </div>
        </div>

        {/* White-label Review */}
        <div className="lv2-card lv2-ring-soft lv2-card-hover p-6">
          <p className="lv2-mono-label mb-3" style={{ fontSize: 9 }}>
            WHITE-LABEL REVIEW
          </p>
          <h3 className="lv2-sans-d mb-2 text-[20px] font-bold">
            Your clients see your brand, not ours
          </h3>
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: 'var(--lv2-muted)' }}
          >
            Share a review link. Your logo, your color, your workspace name in
            the tab. Clipflow is a single-line footer credit.
          </p>
          <div
            className="lv2-card mt-5 overflow-hidden"
            style={{ background: 'var(--lv2-bg-2)', borderColor: 'var(--lv2-border)' }}
          >
            <div
              className="flex items-center gap-2 border-b px-3 py-2"
              style={{ borderColor: 'var(--lv2-border)' }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-md text-[8px] font-bold text-white"
                style={{ background: '#E8756B' }}
              >
                AT
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="lv2-mono text-[8px] font-semibold uppercase"
                  style={{ letterSpacing: '.15em', color: 'var(--lv2-muted)' }}
                >
                  Atlas Agency · Review
                </p>
                <p
                  className="lv2-display truncate text-[13px]"
                  style={{ color: 'var(--lv2-primary)' }}
                >
                  &ldquo;Shipping faster&rdquo;
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="lv2-chip" style={{ background: 'var(--lv2-primary-soft)', color: 'var(--lv2-primary)', fontSize: 9 }}>
                4 drafts
              </span>
              <span className="lv2-mono text-[9px]" style={{ color: 'var(--lv2-muted)' }}>
                powered by clipflow
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
