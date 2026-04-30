'use client'

/**
 * Empty-state preview for the agency Clients page. Three faux client
 * workspace cards (a B2B SaaS, a fitness creator, a restaurant) so
 * an agency owner reads the populated shape — initial-monogram avatar,
 * client name, status pill, four mini-stats — instead of a generic
 * "no clients yet" paragraph. Pure decoration: aria-hidden.
 */

const CLIENTS = [
  {
    initials: 'AC',
    color: '#0F0F0F',
    accentBg: 'rgba(214,255,62,.18)',
    name: 'Acme Coaching',
    status: 'active',
    statusBg: 'bg-emerald-50',
    statusFg: 'text-emerald-700',
    members: 4,
    content: 38,
    drafts: 12,
    approved: 26,
    pulse: true,
  },
  {
    initials: 'NB',
    color: '#5C3A1A',
    accentBg: 'rgba(255,196,107,.20)',
    name: 'Northbrook Studio',
    status: 'active',
    statusBg: 'bg-emerald-50',
    statusFg: 'text-emerald-700',
    members: 2,
    content: 14,
    drafts: 5,
    approved: 9,
    pulse: false,
  },
  {
    initials: 'PV',
    color: '#1A3D2A',
    accentBg: 'rgba(15,107,77,.18)',
    name: 'PaverWorks',
    status: 'paused',
    statusBg: 'bg-amber-50',
    statusFg: 'text-amber-700',
    members: 1,
    content: 7,
    drafts: 0,
    approved: 4,
    pulse: false,
  },
]

export function ClientsEmptyPreview() {
  return (
    <div className="cf-clients-preview space-y-3" aria-hidden>
      <p
        className="mb-1 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]"
        style={{
          color: '#5f5850',
          fontFamily: 'var(--font-jetbrains-mono), monospace',
        }}
      >
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            background: '#F4D93D',
            boxShadow: '0 0 8px rgba(214,255,62,.7)',
          }}
        />
        What your roster looks like
      </p>
      {CLIENTS.map((c, i) => (
        <div
          key={c.name}
          className={`relative overflow-hidden rounded-2xl border border-border/50 bg-card p-4 ${
            c.pulse ? 'cf-clients-preview-pulse' : ''
          }`}
          style={{
            opacity: 1 - i * 0.12,
            boxShadow:
              '0 1px 0 rgba(255,255,255,.6) inset, 0 1px 2px rgba(15,15,15,.04)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-white"
              style={{
                background: `linear-gradient(140deg, ${c.color} 0%, ${c.color} 60%, #1A1A1A 100%)`,
                fontFamily: 'var(--font-inter-tight), sans-serif',
                boxShadow:
                  '0 1px 0 rgba(255,255,255,.18) inset, 0 6px 14px -6px rgba(15,15,15,.45)',
              }}
            >
              <span
                className="pointer-events-none absolute inset-1 rounded-[10px]"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 45%)',
                }}
              />
              <span className="relative">{c.initials}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[13px] font-semibold"
                style={{ color: '#181511' }}
              >
                {c.name}
              </p>
              <p className="text-[10.5px]" style={{ color: 'rgba(95,88,80,.85)' }}>
                Created {12 + i * 4} days ago
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${c.statusBg} ${c.statusFg}`}
            >
              {c.status}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { l: 'Members', v: c.members },
              { l: 'Content', v: c.content },
              { l: 'Drafts', v: c.drafts },
              { l: 'Approved', v: c.approved },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-md px-2 py-1.5 text-center"
                style={{ background: 'rgba(15,15,15,.04)' }}
              >
                <p
                  className="lv2-tabular text-[14px] font-bold leading-none"
                  style={{ color: s.v === 0 ? 'rgba(95,88,80,.55)' : '#181511' }}
                >
                  {s.v === 0 ? '—' : s.v}
                </p>
                <p
                  className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: '#7c7468' }}
                >
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes cf-clients-pulse {
          0%,
          100% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.6) inset,
              0 1px 2px rgba(15, 15, 15, 0.04);
          }
          50% {
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.6) inset,
              0 0 0 1px rgba(214, 255, 62, 0.4),
              0 0 16px -2px rgba(214, 255, 62, 0.4);
          }
        }
        .cf-clients-preview-pulse {
          animation: cf-clients-pulse 3s
            cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cf-clients-preview-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
