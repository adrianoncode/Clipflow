import { Skeleton } from '@/components/ui/skeleton'

/**
 * Generic loading skeleton for the settings sub-layout. Covers every
 * settings tab (profile, workspace, brand voice, AI keys, channels,
 * integrations, security, audit log, templates, referrals, extension)
 * since they all follow the same PageHeading → sectioned cards rhythm.
 */
export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-8">
      {/* Breadcrumb */}
      <Skeleton className="h-3 w-40 rounded" />

      {/* PageHeading */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded" />
      </div>

      {/* Two-column card grid — roughly matches the most common
          settings shape (form on the left, context on the right). */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
