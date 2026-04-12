import Link from 'next/link'

const sections = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/workspace', label: 'Workspace' },
  { href: '/settings/ai-keys', label: 'AI keys' },
  { href: '/settings/brand-voice', label: 'Brand Voice' },
  { href: '/settings/templates', label: 'Templates' },
  { href: '/settings/reports', label: 'Reports' },
  { href: '/settings/extension', label: 'Extension' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col gap-6 p-4 sm:flex-row sm:gap-8 sm:p-8">
      <aside className="w-full shrink-0 sm:w-48">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Settings
        </h2>
        <nav className="flex flex-col gap-1 text-sm">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  )
}
