/**
 * Canonical list of product events. Used on both client and server
 * sides so the union stays in sync and we don't accidentally ship
 * "signup-completed" on one side and "signup_completed" on the other.
 *
 * Event-naming convention: snake_case, past tense, noun_verb_object
 * where possible. Examples: `content_imported`, `output_approved`,
 * `plan_upgrade_completed`.
 *
 * Keep this tight. Every event here costs PostHog quota and adds
 * noise to the dashboard. Add only when there's a question the
 * product team can't answer without it.
 */
export type AnalyticsEvent =
  | 'signup_completed'
  | 'onboarding_role_selected'
  | 'onboarding_workspace_created'
  | 'onboarding_ai_key_added'
  | 'content_imported'
  | 'outputs_generated'
  | 'output_approved'
  | 'output_scheduled'
  | 'post_published'
  | 'plan_upgrade_started'
  | 'plan_upgrade_completed'
  | 'plan_downgrade_started'
