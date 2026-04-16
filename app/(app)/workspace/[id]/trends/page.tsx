import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, PenLine, Upload } from 'lucide-react'

import { getUser } from '@/lib/auth/get-user'
import { getWorkspacePlan } from '@/lib/billing/get-subscription'
import { UpgradeGate } from '@/components/billing/upgrade-gate'
import { TrendRadarClient } from '@/components/workspace/trend-radar-client'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Trend Radar' }

interface PageProps {
  params: { id: string }
}

export default async function TrendsPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/login')

  const plan = await getWorkspacePlan(params.id)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div>
        <Link
          href={`/workspace/${params.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to workspace
        </Link>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trend Radar</h1>
          <p className="mt-1 text-muted-foreground">
            What&apos;s trending right now — matched to your content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/workspace/${params.id}/ghostwriter`}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-border/50 px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:text-primary hover:shadow-sm"
          >
            <PenLine className="h-3.5 w-3.5" />
            Write script
          </Link>
          <Link
            href={`/workspace/${params.id}/content/new`}
            className="group inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Upload className="h-3.5 w-3.5" />
            Create content
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
      <UpgradeGate
        currentPlan={plan ?? 'free'}
        requiredPlan="solo"
        workspaceId={params.id}
        featureName="Trend Radar"
        description="See what's trending right now on TikTok, Instagram, and YouTube — matched to your content niche. Powered by Apify scrapers."
      >
        <TrendRadarClient workspaceId={params.id} />
      </UpgradeGate>
    </div>
  )
}
