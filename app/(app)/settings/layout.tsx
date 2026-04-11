import Link from 'next/link'

const sections = [
  { href: '/settings/workspace', label: 'Workspace' },
  { href: '/settings/ai-keys', label: 'AI keys' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full gap-8 p-8">
      <aside className="w-48 shrink-0">
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
