-- ============================================================================
--  Stripe webhook hardening:
--    1. processed_stripe_events  — event-ID dedup table
--    2. referrals.reversed_at / reversal_reason / paid_invoice_id columns
-- ============================================================================
--
--  WHY
--  ───
--  The original webhook (`app/api/stripe/webhook/route.ts`) trusted that
--  every downstream operation was idempotent and credited the referrer at
--  `checkout.session.completed`. This produced two distinct money-loss /
--  trust-loss vectors:
--
--    A. Replay storm: Stripe retries failed webhook deliveries up to 3
--       days. `applyCouponToReferrerSubscriptions` blindly re-applies the
--       referral coupon on every replay, overwriting any other discount a
--       customer-success rep manually attached in the meantime.
--    B. Premature credit: SCA failures / 3DS declines / immediate
--       cancellations / refunds within the dispute window all left the
--       referrer with a permanent coupon for a referee who never paid.
--
--  WHAT
--  ────
--  1. `processed_stripe_events`: insert-or-conflict at the top of POST.
--     The (event_id, type) tuple is idempotency-keyed; if the row exists
--     the handler returns 200 and skips re-processing.
--
--  2. `referrals` table gets:
--       - paid_invoice_id text   — the Stripe invoice ID that confirmed
--                                  the referral. Set when status flips to
--                                  'confirmed'. Used to refuse reversal
--                                  on a different invoice.
--       - reversed_at    timestamptz — non-null when the referral was
--                                  reversed (refund / dispute / cancel
--                                  inside reversal window).
--       - reversal_reason text   — 'refund' | 'dispute' | 'subscription_canceled'
--                                  | 'manual'.
--
--  Both columns are nullable + default null so the migration is a no-op
--  on existing rows.
-- ============================================================================

-- 1. Event dedup table ──────────────────────────────────────────────────────
create table if not exists public.processed_stripe_events (
  event_id     text primary key,
  type         text not null,
  processed_at timestamptz not null default now()
);

comment on table public.processed_stripe_events is
  'Stripe webhook idempotency log. Insert-on-conflict-do-nothing at the top of the webhook handler. RLS not enabled — written exclusively by the admin client from the route handler.';

-- Optional: prune older than 30 days via a cron. Stripe's longest replay
-- window is 3 days, so a generous 30-day TTL keeps the table small while
-- handling any reasonable retry storm.
create index if not exists processed_stripe_events_processed_at_idx
  on public.processed_stripe_events (processed_at desc);

-- 2. Referral reversal columns ──────────────────────────────────────────────
alter table public.referrals
  add column if not exists paid_invoice_id  text,
  add column if not exists reversed_at      timestamptz,
  add column if not exists reversal_reason  text;

create index if not exists referrals_reversed_at_idx
  on public.referrals (reversed_at)
  where reversed_at is not null;

comment on column public.referrals.paid_invoice_id is
  'Stripe invoice.id that flipped this referral from pending to confirmed. Set in the invoice.paid handler.';
comment on column public.referrals.reversed_at is
  'When the referral was reversed (refund/dispute/cancel within the reversal window). Null = active/pending.';
comment on column public.referrals.reversal_reason is
  'One of: refund | dispute | subscription_canceled | manual.';
