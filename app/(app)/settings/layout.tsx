import Link from 'next/link'

// Settings groups — matching the sidebar's grouped style. Referrals is
// called out first because it's the highest-conversion action.
const groups = [
  {
    label: 'Account',
    items: [
      { href: '/settings/profile', label: 'Profile' },
      { href: '/settings/workspace', label: 'Workspace' },
      { href: '/settings/referrals', label: 'Refer & earn' },
    ],
  },
  {
    label: 'AI',
    items: [
      { href: '/settings/ai-keys', label: 'API keys' },
      { href: '/settings/brand-voice', label: 'Brand Voice' },
      { href: '/settings/personas', label: 'AI Personas' },
    ],
  },
  {
    label: 'Workflow',
    items: [
      { href: '/settings/integrations', label: 'Integrations' },
      { href: '/settings/templates', label: 'Templates' },
      { href: '/settings/reports', label: 'Reports' },
      { href: '/settings/webhooks', label: 'Webhooks' },
      { href: '/settings/extension', label: 'Extension' },
    ],
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 p-4 sm:flex-row sm:gap-10 sm:p-8">
      <aside className="w-full shrink-0 sm:w-52">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </h2>
        <nav className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
