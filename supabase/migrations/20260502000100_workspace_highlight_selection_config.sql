-- ============================================================================
--  Per-workspace highlight selection knobs
-- ============================================================================
--
--  Phase 1 of the Deep-Research feature pass. The find-viral-moments
--  action used to hard-code "top 3 by virality_score get
--  selected_for_drafts=true". Two problems:
--
--    1. Workspaces with a longer-form publishing rhythm (agencies,
--       coaches running 5-platform calendars) want more than 3 clips
--       auto-selected. Solo creators sometimes want only the single
--       best clip auto-selected so the review step is a one-button
--       commit.
--
--    2. When the AI returns weak candidates (every clip below 60),
--       the existing flow still flagged the top 3 — landing the user
--       on a default selection of mediocre clips. Better to leave
--       selection empty and prompt them to re-run or relax the
--       threshold.
--
--  Two new columns on `workspaces`:
--    - highlight_top_n      smallint, 1..10, default 3
--    - highlight_min_score  smallint, 0..100, default 0 (off)
--
--  The action reads these and applies them at insert time. Existing
--  rows keep working because both columns have NOT NULL defaults.
-- ============================================================================

alter table public.workspaces
  add column if not exists highlight_top_n smallint not null default 3
    check (highlight_top_n between 1 and 10),
  add column if not exists highlight_min_score smallint not null default 0
    check (highlight_min_score between 0 and 100);

comment on column public.workspaces.highlight_top_n is
  'Number of highest-virality clips automatically selected for drafts after find-viral-moments. 1..10. Default 3.';

comment on column public.workspaces.highlight_min_score is
  'Minimum virality_score (0..100) required for auto-selection. Clips below this floor are detected and stored but not auto-flagged. Default 0 (no floor).';
