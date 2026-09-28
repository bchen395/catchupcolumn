-- ============================================================
-- 20260925212248_fix_late_publish_slot_wrap.sql
--
-- A Group whose publish_time is 23:40 or later never auto-published.
--
-- compile_due_editions (20260525000000) matched a Group as due with
--
--   extract(dow from local_now)::int = publish_day
--   and local_now::time >= publish_time
--   and local_now::time <  publish_time + tolerance
--
-- `time + interval` wraps at midnight: time '23:45' + interval '20 minutes'
-- is 00:05, so at the cron's 20-minute tolerance no time of day satisfied
-- both bounds for any publish_time >= 23:40. The app's time picker offers
-- 11:45 PM. Confirmed on production 2026-09-24.
--
-- Fixing the time comparison alone is not enough. A 23:45 window runs to
-- 00:05 on the NEXT calendar day, where the day-of-week check sees the wrong
-- day. And the slot-scoped duplicate guard ("an edition created on local_now's
-- date, at or after publish_time") would not recognise the edition compiled at
-- 23:45 when the 00:00 tick came round, so that tick would publish again.
--
-- Fix: slot matching on local timestamps, not times of day.
--
--   1. due_publish_slot() is the one definition of "due". It builds the
--      candidate slot (local date + publish_time) for today and for
--      yesterday, keeps the one that falls on publish_day, and returns it
--      when slot <= local_now < slot + tolerance; otherwise null.
--   2. compile_due_editions uses it for the due check, and its duplicate
--      guard (and the re-check after the advisory lock) becomes "an edition
--      created at or after this slot". A 23:45 slot compiled at 23:45 is
--      recognised as that slot's edition at 00:00 the next day.
--
-- When the window ends before midnight (publish_time + tolerance < 24:00,
-- which at 20 minutes is every publish_time before 23:40) the due check is
-- identical to the old expressions. So is the guard, with one difference: the
-- old one also required the edition to fall on local_now's date, which for
-- such a window only excluded editions created after now().
--
-- publish_edition_now is not redefined. It shares the advisory lock but has no
-- slot logic of its own.
--
-- DST. Both sides are still local wall-clock timestamps from `at time zone`,
-- as before, so DST behaves exactly as it did:
--   * Skipped hour (spring forward; 02:00-02:59 America/New_York on
--     2026-03-08). No instant has a local time in [02:30, 02:50), so a 02:30
--     slot does not publish that week. Its posts go out in the next week's
--     edition, or by hand.
--   * Repeated hour (fall back; 01:00-01:59 on 2026-11-01). A 01:30 slot's
--     window occurs twice. The first pass (EDT) compiles; on the repeat (EST)
--     the guard finds that edition at or after the slot and skips. Still one
--     edition per slot. If the first pass had no posts, the repeat compiles
--     whatever arrived in between.
--
-- Signature, SECURITY DEFINER, search_path, grants, the advisory lock,
-- edition numbering, return shape and comments of compile_due_editions are
-- unchanged from 20260525000000. Only the slot expressions differ, plus the
-- two guard comments, which now say how "this slot" is identified.
-- ============================================================

-- ------------------------------------------------------------
-- 1. due_publish_slot — which slot, if any, is due at p_at
-- ------------------------------------------------------------
-- Returns the slot as a local timestamp in p_timezone (the same wall-clock
-- form `created_at at time zone g.timezone` produces), or null when p_at is
-- inside no slot's window. Only today's and yesterday's local dates are
-- considered, so p_tolerance_minutes must be under 24 * 60; the cron passes 20.
-- The two candidates fall on different weekdays, so at most one matches.
--
-- STABLE rather than IMMUTABLE: the answer depends on the server's time zone
-- database, which a Postgres upgrade can change. SECURITY INVOKER; it reads no
-- tables. An unrecognised p_timezone raises, as the inline expressions it
-- replaces did.
create or replace function public.due_publish_slot(
  p_publish_day int,
  p_publish_time time,
  p_timezone text,
  p_at timestamptz,
  p_tolerance_minutes int
)
returns timestamp
language sql
stable
set search_path = public
as $$
  select c.slot
  from (select p_at at time zone p_timezone as local_now) n
  cross join lateral (
    values (n.local_now::date + p_publish_time),
           ((n.local_now::date - 1) + p_publish_time)
  ) as c(slot)
  where extract(dow from c.slot)::int = p_publish_day
    and n.local_now >= c.slot
    and n.local_now < c.slot + (p_tolerance_minutes || ' minutes')::interval
  order by c.slot desc
  limit 1;
$$;

-- Internal helper: called only from compile_due_editions, which runs as its
-- owner. Not part of the PostgREST surface.
revoke all on function public.due_publish_slot(int, time, text, timestamptz, int) from public, anon, authenticated;
grant execute on function public.due_publish_slot(int, time, text, timestamptz, int) to service_role;

-- ------------------------------------------------------------
-- 2. compile_due_editions — slot matched on timestamps
-- ------------------------------------------------------------
create or replace function public.compile_due_editions(
  p_tolerance_minutes int default 15
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group record;
  v_post_ids uuid[];
  v_post_count int;
  v_next_number int;
  v_edition_id uuid;
  v_compiled int := 0;
  v_skipped_no_posts int := 0;
  v_details jsonb := '[]'::jsonb;
begin
  for v_group in
    select
      g.id,
      g.name,
      g.timezone,
      g.publish_day,
      g.publish_time
    from public.groups g
    where
      exists (
        select 1
        from pg_timezone_names tz
        where tz.name = g.timezone
      )
      and public.due_publish_slot(
            g.publish_day, g.publish_time, g.timezone, now(), p_tolerance_minutes
          ) is not null
      and not exists (
        -- Skip only if an edition was already created for *this* scheduled
        -- slot. Manual publishes earlier in the week (or earlier today)
        -- should not suppress the regular cron run. "This slot" is the
        -- local timestamp due_publish_slot returns, so a slot whose window
        -- crosses midnight still finds the edition it compiled before it.
        select 1
        from public.editions e
        where e.group_id = g.id
          and (e.created_at at time zone g.timezone)
              >= public.due_publish_slot(
                   g.publish_day, g.publish_time, g.timezone, now(), p_tolerance_minutes
                 )
      )
    order by g.id
    for update skip locked
  loop
    if not pg_try_advisory_xact_lock(
      hashtextextended('compile_due_editions:' || v_group.id::text, 0)
    ) then
      continue;
    end if;

    -- Re-check the slot guard after acquiring the lock: a peer that just
    -- committed (cron or manual publish during this slot) may have already
    -- inserted this slot's edition for this group. now() is fixed for the
    -- transaction, so due_publish_slot returns the same slot as above.
    if exists (
      select 1
      from public.editions e
      where e.group_id = v_group.id
        and (e.created_at at time zone v_group.timezone)
            >= public.due_publish_slot(
                 v_group.publish_day, v_group.publish_time, v_group.timezone,
                 now(), p_tolerance_minutes
               )
    ) then
      continue;
    end if;

    select
      coalesce(array_agg(p.id order by p.created_at), '{}'::uuid[]),
      count(*)::int
    into v_post_ids, v_post_count
    from (
      select id, created_at
      from public.posts
      where group_id = v_group.id
        and edition_id is null
      order by created_at
      for update
    ) p;

    if v_post_count = 0 then
      v_skipped_no_posts := v_skipped_no_posts + 1;
      v_details := v_details || jsonb_build_array(
        jsonb_build_object(
          'group_id', v_group.id,
          'group_name', v_group.name,
          'skipped', true,
          'reason', 'no posts'
        )
      );
      continue;
    end if;

    select coalesce(max(edition_number), 0) + 1
    into v_next_number
    from public.editions
    where group_id = v_group.id;

    insert into public.editions (group_id, edition_number, published_at)
    values (v_group.id, v_next_number, now())
    returning id into v_edition_id;

    update public.posts
    set edition_id = v_edition_id
    where id = any(v_post_ids)
      and edition_id is null;

    get diagnostics v_post_count = row_count;

    v_compiled := v_compiled + 1;
    v_details := v_details || jsonb_build_array(
      jsonb_build_object(
        'group_id', v_group.id,
        'group_name', v_group.name,
        'edition_number', v_next_number,
        'post_count', v_post_count
      )
    );
  end loop;

  return jsonb_build_object(
    'compiled', v_compiled,
    'skipped_no_posts', v_skipped_no_posts,
    'details', v_details
  );
end;
$$;

-- Grants unchanged from 20260627000000 (create or replace keeps them);
-- re-asserted so the privilege set is obvious from this file.
revoke all on function public.compile_due_editions(int) from public, anon, authenticated;
grant execute on function public.compile_due_editions(int) to service_role;
