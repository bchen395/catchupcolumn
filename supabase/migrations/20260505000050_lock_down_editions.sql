-- ============================================================
-- 20260505000050_lock_down_editions.sql
-- Defense in depth: editions are written exclusively by the cron edge
-- function (which uses the service role and bypasses these grants).
-- Revoke direct UPDATE/DELETE for the authenticated role so an RLS
-- regression alone can't let a user mutate published editions.
-- ============================================================

revoke update, delete on public.editions from authenticated;
