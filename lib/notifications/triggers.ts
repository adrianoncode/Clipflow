import 'server-only'

import { createNotification } from '@/lib/notifications/create-notification'

/**
 * Notification triggers for key events in the app.
 * Each trigger creates an in-app notification for the relevant user(s).
 * All triggers are non-blocking (fire-and-forget).
 */

/** When AI outputs are generated for a content item */
export async function notifyOutputsGenerated(params: {
  userId: string
  workspaceId: string
  contentTitle: string
  contentId: string
  platformCount: number
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: 'output_generated',
    title: `${params.platformCount} drafts ready`,
    body: `Outputs generated for "${params.contentTitle}". Review and approve them.`,
    link: `/workspace/${params.workspaceId}/content/${params.contentId}/outputs`,
  }).catch(() => {})
}

/** When an output is approved */
export async function notifyOutputApproved(params: {
  userId: string
  workspaceId: string
  platform: string
  contentTitle: string
  contentId: string
}): Promise<void> {
  const platformLabels: Record<string, string> = {
    tiktok: 'TikTok', instagram_reels: 'Instagram Reels',
    youtube_shorts: 'YouTube Shorts', linkedin: 'LinkedIn',
  }
  await createNotification({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: 'output_approved',
    title: `${platformLabels[params.platform] ?? params.platform} approved`,
    body: `The ${platformLabels[params.platform] ?? params.platform} draft for "${params.contentTitle}" was approved.`,
    link: `/workspace/${params.workspaceId}/content/${params.contentId}/outputs`,
  }).catch(() => {})
}

/** When a client leaves a review comment */
export async function notifyReviewComment(params: {
  userId: string
  workspaceId: string
  reviewerName: string
  contentTitle: string
  contentId: string
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: 'review_comment',
    title: 'New review comment',
    body: `${params.reviewerName} commented on "${params.contentTitle}".`,
    link: `/workspace/${params.workspaceId}/content/${params.contentId}/outputs`,
  }).catch(() => {})
}

/** When a scheduled post is published */
export async function notifyPostPublished(params: {
  userId: string
  workspaceId: string
  platform: string
  contentTitle: string
}): Promise<void> {
  const platformLabels: Record<string, string> = {
    tiktok: 'TikTok', instagram: 'Instagram', instagram_reels: 'Instagram Reels',
    linkedin: 'LinkedIn', youtube: 'YouTube', youtube_shorts: 'YouTube Shorts',
  }
  await createNotification({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: 'post_published',
    title: `Published to ${platformLabels[params.platform] ?? params.platform}`,
    body: `"${params.contentTitle}" was published to ${platformLabels[params.platform] ?? params.platform}.`,
    link: undefined,
  }).catch(() => {})
}

/** When a team member is added to a workspace */
export async function notifyMemberAdded(params: {
  userId: string
  workspaceId: string
  invitedByName: string
  workspaceName: string
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: 'member_added',
    title: `Added to ${params.workspaceName}`,
    body: `${params.invitedByName} added you to the "${params.workspaceName}" workspace.`,
    link: `/workspace/${params.workspaceId}`,
  }).catch(() => {})
}

/** Weekly content summary */
export async function notifyWeeklySummary(params: {
  userId: string
  workspaceId: string
  contentCount: number
  outputCount: number
}): Promise<void> {
  await createNotification({
    userId: params.userId,
    workspaceId: params.workspaceId,
    type: 'weekly_summary',
    title: 'Your weekly summary',
    body: `This week: ${params.contentCount} content items, ${params.outputCount} outputs generated.`,
    link: '/dashboard',
  }).catch(() => {})
}
