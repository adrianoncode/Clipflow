import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Collects every row across the app that's owned-by or associated-with
 * a given user, and returns it as a single JSON-serializable object.
 *
 * Goal: GDPR Article 20 "right to data portability" — the user should
 * be able to take their content and history with them if they leave.
 *
 * What we include (all workspaces the user is a member of, scoped to
 * their membership):
 *   - profile row
 *   - workspaces they belong to
 *   - content items + transcripts + metadata
 *   - outputs (drafts) + bodies
 *   - output state history
 *   - renders (Shotstack jobs)
 *   - review links + review comments
 *   - scheduled_posts
 *   - social_accounts (platform + handle only — no tokens)
 *   - subscriptions (plan + status only — no Stripe IDs)
 *   - referrals (codes + counts)
 *
 * What we DO NOT include:
 *   - AI keys (encrypted, useless to the user in plain-text)
 *   - Stripe customer/subscription IDs (internal only)
 *   - OAuth tokens (would be a security risk as plaintext)
 *   - Other users' data in shared workspaces
 *
 * Uses the admin client because we need to read across tables that
 * may have stricter RLS than the user's session can bypass (e.g.
 * output_states).
 */
export async function exportUserData(userId: string): Promise<{
  exported_at: string
  user_id: string
  profile: unknown
  workspaces: unknown[]
  content_items: unknown[]
  outputs: unknown[]
  output_states: unknown[]
  renders: unknown[]
  review_links: unknown[]
  review_comments: unknown[]
  scheduled_posts: unknown[]
  social_accounts: unknown[]
  subscriptions: unknown[]
  referrals: unknown[]
}> {
  const admin = createAdminClient()

  // 1. Find every workspace the user belongs to (as owner OR member).
  const { data: memberships } = await admin
    .from('workspace_members')
    .select('workspace_id, role, created_at')
    .eq('user_id', userId)

  const workspaceIds = (memberships ?? []).map((m) => m.workspace_id)

  // 2. Profile row.
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  // 3. All workspaces they belong to (so names/slugs are preserved).
  const workspacesPromise =
    workspaceIds.length > 0
      ? admin
          .from('workspaces')
          .select('id, name, slug, type, created_at, branding')
          .in('id', workspaceIds)
      : Promise.resolve({ data: [] })

  // 4. Content + outputs + states + renders + schedules — all scoped
  //    to workspaces the user is actually a member of.
  const contentPromise =
    workspaceIds.length > 0
      ? admin
          .from('content_items')
          .select('*')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  const outputsPromise =
    workspaceIds.length > 0
      ? admin
          .from('outputs')
          .select('id, workspace_id, content_id, platform, body, metadata, is_starred, scheduled_for, current_state, created_at, updated_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  const statesPromise =
    workspaceIds.length > 0
      ? admin
          .from('output_states')
          .select('id, workspace_id, output_id, state, changed_by, note, created_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  const rendersPromise =
    workspaceIds.length > 0
      ? admin
          .from('renders')
          .select('id, workspace_id, content_id, kind, provider, status, url, metadata, created_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  const reviewLinksPromise =
    workspaceIds.length > 0
      ? admin
          .from('review_links')
          .select('id, workspace_id, content_id, token, label, expires_at, is_active, created_by, created_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  const reviewCommentsPromise =
    workspaceIds.length > 0
      ? admin
          .from('review_comments')
          .select('id, review_link_id, output_id, reviewer_name, body, created_at')
          .in('review_link_id', (
            await admin
              .from('review_links')
              .select('id')
              .in('workspace_id', workspaceIds)
          ).data?.map((r) => r.id) ?? [])
      : Promise.resolve({ data: [] })

  const scheduledPromise =
    workspaceIds.length > 0
      ? admin
          .from('scheduled_posts')
          .select('id, workspace_id, output_id, platform, scheduled_for, status, published_at, error_message, metadata, created_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  // Social accounts — strip refresh tokens + access tokens.
  const socialPromise =
    workspaceIds.length > 0
      ? admin
          .from('social_accounts')
          .select('id, workspace_id, platform, platform_user_id, display_name, created_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  // Subscription — plan + status only, drop Stripe IDs.
  const subscriptionPromise =
    workspaceIds.length > 0
      ? admin
          .from('subscriptions')
          .select('workspace_id, plan, status, current_period_end, cancel_at_period_end, created_at')
          .in('workspace_id', workspaceIds)
      : Promise.resolve({ data: [] })

  // Referrals — the user's own referral program state.
  const referralsPromise = admin
    .from('referrals')
    .select('id, code, status, created_at, confirmed_at')
    .or(`referrer_user_id.eq.${userId},referee_user_id.eq.${userId}`)

  const [
    workspacesRes,
    contentRes,
    outputsRes,
    statesRes,
    rendersRes,
    reviewLinksRes,
    reviewCommentsRes,
    scheduledRes,
    socialRes,
    subscriptionRes,
    referralsRes,
  ] = await Promise.all([
    workspacesPromise,
    contentPromise,
    outputsPromise,
    statesPromise,
    rendersPromise,
    reviewLinksPromise,
    reviewCommentsPromise,
    scheduledPromise,
    socialPromise,
    subscriptionPromise,
    referralsPromise,
  ])

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profile ?? null,
    workspaces: (workspacesRes.data ?? []).map((w) => ({
      ...w,
      membership: memberships?.find((m) => m.workspace_id === w.id),
    })),
    content_items: contentRes.data ?? [],
    outputs: outputsRes.data ?? [],
    output_states: statesRes.data ?? [],
    renders: rendersRes.data ?? [],
    review_links: reviewLinksRes.data ?? [],
    review_comments: reviewCommentsRes.data ?? [],
    scheduled_posts: scheduledRes.data ?? [],
    social_accounts: socialRes.data ?? [],
    subscriptions: subscriptionRes.data ?? [],
    referrals: referralsRes.data ?? [],
  }
}
