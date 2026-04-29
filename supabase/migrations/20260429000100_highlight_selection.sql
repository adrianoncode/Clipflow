-- ===========================================================================
-- content_highlights: selection layer for "Make drafts" flow
-- ===========================================================================
-- Today every AI-found highlight is implicitly "active" — clicking
-- Render makes a video file, but there's no way for the reviewer to
-- say "yes, use these 3 specifically as the basis for drafts" without
-- ad-hoc rendering decisions.
--
-- The Selection-Layer adds:
--   - selected_for_drafts  bool  user/server-marked candidates that
--                                feed the per-platform Drafts step
--   - is_user_edited       bool  set when the reviewer modifies
--                                timing/caption/hook so a future
--                                Re-Find pass doesn't overwrite the
--                                hand-tuned highlight
--
-- Both default to false. The find-moments action seeds the top 3 by
-- virality_score with selected_for_drafts=true so the user starts with
-- an opinionated selection but can de-/re-select freely. Re-Find
-- preserves rows where is_user_edited=true.
-- ===========================================================================

alter table public.content_highlights
  add column if not exists selected_for_drafts boolean not null default false,
  add column if not exists is_user_edited boolean not null default false;

create index if not exists content_highlights_selected_idx
  on public.content_highlights (content_id, workspace_id)
  where selected_for_drafts = true;

comment on column public.content_highlights.selected_for_drafts is
  'Reviewer-picked highlights that should feed the per-platform Drafts step. The find-moments AI pass seeds top-3 by virality_score; reviewer can toggle freely afterwards.';

comment on column public.content_highlights.is_user_edited is
  'Set when the reviewer manually tunes timing, hook, or caption. Re-Find passes preserve these rows instead of overwriting.';
