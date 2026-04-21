-- ===========================================================================
-- Workspace niche — industry preset for tone calibration
-- ===========================================================================
-- Stores which of the six niche presets (creator / podcaster / coach /
-- saas / ecommerce / agency) is active for a workspace. The generation
-- pipeline loads this and injects the preset's tone guidance into the
-- system prompt so output reads correct for the industry.
--
-- Nullable. When null the generation layer falls back to the pure
-- platform template — which was the old behavior before niche presets
-- existed, so existing workspaces are unaffected by this migration.
-- ===========================================================================

alter table public.workspaces
  add column if not exists active_niche text;

-- Soft constraint: only allow known values. Using a plain check rather
-- than an enum so adding a new preset doesn't require a schema change.
alter table public.workspaces
  add constraint workspaces_active_niche_check
  check (
    active_niche is null
    or active_niche in ('creator', 'podcaster', 'coach', 'saas', 'ecommerce', 'agency')
  );
