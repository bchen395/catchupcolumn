-- ============================================================
-- 20260426000002_fix_invite_code_lookup.sql
-- Invite codes are stored lowercase (gen_random_uuid() hex chars
-- are a-f 0-9).  The previous function compared upper(input) to
-- the stored value, so the match always failed.
-- Fix: compare lower(stored) = lower(input) so the lookup works
-- regardless of how the caller capitalises the code.
-- ============================================================

create or replace function public.find_group_by_invite_code(p_invite_code text)
returns table (
  id              uuid,
  name            text,
  description     text,
  cover_image_url text,
  publish_day     int,
  publish_time    time,
  created_by      uuid,
  invite_code     text,
  created_at      timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select id, name, description, cover_image_url, publish_day, publish_time,
         created_by, invite_code, created_at
  from public.groups
  where lower(invite_code) = lower(trim(p_invite_code))
  limit 1;
$$;
