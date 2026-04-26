import { SettingsShell } from '@/components/settings/settings-shell'

/**
 * /billing lives at the top level of the (app) group instead of under
 * /settings/* (URL-stability reasons), but for navigation it belongs
 * to the settings section. Wrapping it in the same SettingsShell lets
 * the vertical sub-nav follow the user across Profile / Security /
 * Billing / Referrals without each click feeling like a context jump.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>
}
