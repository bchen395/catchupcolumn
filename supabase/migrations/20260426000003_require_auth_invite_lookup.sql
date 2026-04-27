-- ============================================================
-- 20260426000003_require_auth_invite_lookup.sql
-- Restrict find_group_by_invite_code to authenticated callers
-- only. Previously callable by anyone (unauthenticated), which
-- allowed brute-force enumeration of invite codes.
-- The function still runs as security definer (to bypass RLS
-- and return the group row), but now raises an exception if
-- the caller has no active auth session.
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
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  -- Only allow authenticated callers
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = 'PGRST301';
  end if;

  return query
    select g.id, g.name, g.description, g.cover_image_url, g.publish_day,
           g.publish_time, g.created_by, g.invite_code, g.created_at
    from public.groups g
    where lower(g.invite_code) = lower(trim(p_invite_code))
    limit 1;
end;
$$;
