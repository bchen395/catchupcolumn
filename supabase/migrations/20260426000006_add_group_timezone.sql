-- ============================================================
-- 20260426000006_add_group_timezone.sql
-- Adds a timezone field to groups so publish_time is compared
-- in the group's local timezone rather than UTC.
--
-- Also adds a get_groups_to_compile() RPC used by the
-- compile-editions Edge Function to determine which groups
-- are due for a new edition right now.
-- ============================================================

-- --------------------------------------------------------
-- 1. Add timezone column
-- --------------------------------------------------------
alter table public.groups
  add column timezone text not null default 'UTC';

-- --------------------------------------------------------
-- 2. RPC: get_groups_to_compile
--
-- Returns groups whose publish window is NOW (within the
-- rolling tolerance) and which have not yet had an edition
-- created in the last 22 hours (idempotency guard).
--
-- Parameters:
--   p_tolerance_minutes  INT  — how many minutes wide the
--                               matching window is (default 15)
-- --------------------------------------------------------
create or replace function public.get_groups_to_compile(
  p_tolerance_minutes int default 15
)
returns table (
  id         uuid,
  name       text,
  timezone   text,
  publish_day  int,
  publish_time time
)
language sql
security definer
stable
set search_path = public
as $$
  select
    g.id,
    g.name,
    g.timezone,
    g.publish_day,
    g.publish_time
  from public.groups g
  where
    -- Day-of-week matches in the group's local timezone
    -- (0 = Sunday … 6 = Saturday, matching our publish_day convention)
    extract(dow from now() at time zone g.timezone)::int = g.publish_day

    -- Current local time is within the publish window:
    --   [publish_time,  publish_time + tolerance)
    and (now() at time zone g.timezone)::time >= g.publish_time
    and (now() at time zone g.timezone)::time <  g.publish_time + (p_tolerance_minutes || ' minutes')::interval

    -- Idempotency: skip if we already compiled an edition in the last 22 hours
    and not exists (
      select 1
      from public.editions e
      where e.group_id = g.id
        and e.created_at > now() - interval '22 hours'
    );
$$;

-- Grant execute to the service_role used by the Edge Function
grant execute on function public.get_groups_to_compile(int) to service_role;
