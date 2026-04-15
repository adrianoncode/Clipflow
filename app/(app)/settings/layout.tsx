import { SettingsNav } from '@/components/settings/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-6 p-4 sm:flex-row sm:gap-10 sm:p-8">
      <aside className="w-full shrink-0 sm:w-52">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </h2>
        <SettingsNav />
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
