import { NextRequest, NextResponse } from 'next/server'

import { requireWorkspaceMember } from '@/lib/auth/require-workspace-member'
import { createClient } from '@/lib/supabase/server'
import { getReframeJobStatus } from '@/lib/reframe/reframe-video'

/**
 * Polls the status of a Replicate reframe job. Previously, this route
 * auth-checked the caller but accepted *any* jobId — meaning a logged-in
 * user could poll other customers' reframe jobs and read their output
 * URLs. Now:
 *   1. Caller provides workspace_id + content_id alongside jobId
 *   2. We verify workspace membership
 *   3. We verify the content belongs to that workspace AND that its
 *      stored metadata.reframe_job.jobId matches — so the caller can
 *      only poll jobs they actually kicked off.
 */
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get('jobId')
  const workspaceId = req.nextUrl.searchParams.get('workspace_id')
  const contentId = req.nextUrl.searchParams.get('content_id')

  if (!jobId || !workspaceId || !contentId) {
    return NextResponse.json(
      { error: 'Missing jobId, workspace_id, or content_id' },
      { status: 400 },
    )
  }

  const check = await requireWorkspaceMember(workspaceId)
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.status })
  }

  // Verify this job was kicked off from this workspace's content item.
  const supabase = createClient()
  const { data: item } = await supabase
    .from('content_items')
    .select('metadata')
    .eq('id', contentId)
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  const storedJobId = (
    (item?.metadata as Record<string, unknown> | null)?.reframe_job as
      | { jobId?: string }
      | undefined
  )?.jobId

  if (!storedJobId || storedJobId !== jobId) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const result = await getReframeJobStatus(jobId)
  return NextResponse.json(result)
}
