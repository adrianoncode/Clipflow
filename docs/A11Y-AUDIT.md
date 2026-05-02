# Accessibility Audit — Clipflow

Last automated scan: 2026-05-02 via axe-core 4.10.2 (WCAG 2.0 + 2.1 levels A & AA).

## Coverage

Manual senior-design audit across the user journey, plus an axe-core
sweep of every public route, all rendered against the local dev
build. Authenticated routes are not yet auto-scanned (axe needs a
browser session); the manual passes covered them surface by surface
and the same fixes apply because the chrome (sidebar, topbar,
buttons, forms, status indicators) is shared.

## Automated scan results

| Route | Violations | Incomplete | Notes |
| --- | --- | --- | --- |
| `/` | **0** | 53 | All gradient/animation false positives (verified pixel-level: logo 17.85:1, mono-label 6.35:1, links 17.85:1) |
| `/login` | **0** | 8 | Same gradient false positives |
| `/signup` | **0** | 1 | — |
| `/magic-link` | **0** | — | — |
| `/compare` | **0** | — | — |
| `/features` | **0** | — | — |
| `/for` | **0** | — | — |
| `/privacy` | **0** | — | — |
| `/help` | **0** | — | — |
| `/terms` | **0** | — | — |

**Aggregate: ZERO WCAG 2.1 AA violations across 10 public routes.**

## Manual passes (5 of them, see git log `fix(a11y):`)

| Pass | Surface | Highlights |
| --- | --- | --- |
| 1 | Auth + app shell + highlights + ZapCap | Focus rings, ARIA, inert affordances; killed JS-hover; ESC closes drawer; phantom-button rectified |
| 2 | Dashboard charts | Donut SVG promoted to `role="img"`; FunnelStackCard headings ↑h3; aria-hidden icons |
| 3 | Skip-links + heading anchor + landing kinetic h1 | Auth + onboarding skip-links; AppTopbar carries the `<h1>` for every authenticated route; rotating headline gets a static screen-reader label |
| 4 | Content-detail sub-tabs (outputs/subtitles/broll/cleanup/auto-gen) | `focus:outline-none` removed; aria-pressed on toggle buttons; status announcements on async ops |
| 5 | Color-contrast + marketing icons | Auth + onboarding muted-foreground 4.33→5.34:1; marketing CTA icons aria-hidden + motion-reduce |

## Re-running axe

The dev server's compile latency makes per-route scanning slow.
Run on production for cleaner results:

```bash
# Against deployed app
npx @axe-core/cli https://clipflow.to
npx @axe-core/cli https://clipflow.to/login
# … etc.
```

Or, in browser DevTools, open <https://clipflow.to> and paste:

```js
const s = document.createElement('script')
s.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js'
s.onload = () => axe.run({ runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
  .then(r => console.log({ violations: r.violations, incomplete: r.incomplete }))
document.head.appendChild(s)
```

## Known unscanned surfaces

- All `(app)/*` routes — need an authenticated session for axe.
- Heavy editor components (`clip-preview-editor`, `brand-voice-editor`)
  — manual review covered the mounting context but not deep
  interaction. Re-run axe per page after authentication.
- The 3 495-line `components/landing/new-landing.tsx` was sampled at
  the hero; the rest of the page passed manual contrast checks
  (`lv2-fg-soft` 11.55:1, `lv2-mono` 6.35:1) but the deeper sections
  are not exhaustively audited.

## Next time

- Add `@axe-core/playwright` to the e2e suite so every PR runs the
  scan automatically.
- Add a CI gate that fails on new violations vs. the recorded
  baseline above.
- Re-run the manual pass on Avatar / Dub / Reframe sub-tabs once
  they evolve past the current "minimal" surface area.
