-- ===========================================================================
-- output_platform: add 'pinterest'
-- ===========================================================================
-- Pinterest has been a first-class citizen in the application code for
-- months — lib/platforms/index.ts lists it in OUTPUT_PLATFORMS, the
-- planner has a per-platform best-time table for it, and the channels
-- page wires up Composio OAuth for Pinterest accounts. The DB enum
-- never caught up, which means any actual Pinterest output insert was
-- one CHECK-style failure away from breaking production.
--
-- This migration aligns the enum with the code surface. Idempotent so
-- replaying a fresh local stack doesn't crash on the second run.
-- ===========================================================================

alter type public.output_platform add value if not exists 'pinterest';
