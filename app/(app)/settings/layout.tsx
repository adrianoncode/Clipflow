import { SettingsBreadcrumbs } from '@/components/settings/settings-breadcrumbs'
import { SettingsNav } from '@/components/settings/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
      {/* ── Breadcrumbs ── deep-links and settings jumps need a visible
          trail back to Dashboard + Settings root. The horizontal nav
          only shows peers, not parents. */}
      <SettingsBreadcrumbs />

      {/* ── Horizontal settings navigation ── */}
      <SettingsNav />

      {/* ── Content ── */}
      <div className="mt-8">{children}</div>
    </div>
  )
}
