-- ============================================================
-- 20260928155710_compile_robustness.sql
--
-- Two production risks in the weekly compile (bugs.md H2 and H3).
--
-- H3. One Group with an unrecognised timezone failed the compile for every
-- Group. compile_due_editions' loop guarded its conversions with
--
--   exists (select 1 from pg_timezone_names tz where tz.name = g.timezone)
--
-- but a WHERE clause is not an evaluation order. EXPLAIN on production shows
-- the planner running due_publish_slot(..., g.timezone, ...) as a filter on the
-- groups scan and joining pg_timezone_names above it, so an unknown zone
-- raised 22023 ("time zone ... not recognized") and the whole call failed:
-- every Group missed its slot and the cron only logged a 500.
--
-- Fix, part 1: the loop joins pg_timezone_names and every conversion takes
-- its zone from the joined row (tz.name), never from g.timezone. That is a
-- data dependency, not a hope about plan shape: a zone the database doesn't
-- list has no tz row, so no plan can hand it to `at time zone`. Groups
-- skipped this way are reported in the result's `details` with reason
-- 'invalid timezone'. The report compares names only; it converts nothing.
--
-- Why not the alternatives:
--   * A MATERIALIZED CTE of valid Groups works only while every conversion
--     reads the CTE's columns, and the loop still needs FOR UPDATE on
--     public.groups itself, so it means joining back to the table. More
--     moving parts for the same guarantee.
--   * due_publish_slot returning null for an unknown zone would still leave
--     the guard's own `e.created_at at time zone ...` exposed, and a
--     null-safe helper needs either a CASE (the same evaluation-order
--     question, plus constant-folding caveats) or an exception block.
--   * A per-Group begin ... exception ... end can't catch an error raised by
--     the FOR query itself, so the due check would have to move into the
--     loop body. The query would then lock every Group every tick instead
--     of only the due ones, and each Group would cost a subtransaction.
--
-- Fix, part 2: a BEFORE INSERT OR UPDATE OF timezone trigger rejects a zone
-- pg_timezone_names doesn't list, with the stable code 'invalid_timezone'.
-- It is the same exact-name test the compile uses, so any row the trigger
-- accepts is one the compile can schedule. (A CHECK constraint can't run a
-- subquery.) The app retries such an insert on 'UTC' and tells the person
-- (lib/groups.ts createGroup, app/group/create.tsx). Every production row
-- passed this test when it was written (2026-09-28).
--
-- H2. About 1 in 4 cron ticks timed out. The cron's net.http_post passed no
-- timeout_milliseconds, so pg_net gave up after its 5000 ms default: 5 of 24
-- retained ticks on 2026-09-28 (four of them on the hour), 6 of 24 on
-- 2026-09-25, never a non-200. DNS and TLS took ~60 ms of each 5 s; the rest
-- was waiting on the function. Whether a run pg_net stops waiting for
-- finishes anyway is unknown, so assume the worst: cut off mid-email, the
-- edition stays claimed but unmarked, and 5 minutes later the next tick
-- re-claims it and emails every recipient again.
--
-- Fix, part 3: timeout_milliseconds := 150000. That is Supabase's edge
-- function request idle timeout: a function that hasn't responded by 150 s
-- gets a 504 from the platform whatever the caller does, on every plan. A
-- shorter wait lets pg_net abandon runs the platform would have finished; a
-- longer one buys nothing. pg_net is asynchronous (the cron job only
-- enqueues) and this job is its only caller, so a long wait delays nothing.
-- The command is otherwise unchanged, vault lookups included. It is set with
-- cron.alter_job on the one job of that name, so the jobid, schedule, owner
-- and active flag stay as they are.
--
-- The compile-editions function change that goes with this (tolerance 20 ->
-- 30, so every slot gets two in-window ticks) ships in the same PR but needs
-- a function redeploy; it is not part of this migration.
--
-- Unchanged: compile_due_editions' signature, SECURITY DEFINER, search_path,
-- grants, advisory lock, re-check, edition numbering, the rest of the return
-- shape, and its comments. due_publish_slot and publish_edition_now are not
-- redefined.
-- ============================================================

-- ------------------------------------------------------------
-- 1. compile_due_editions — unknown zones skipped and reported
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
  -- Groups whose timezone the database doesn't list can't be matched to a
  -- slot. Report them; the loop below leaves them out. This compares names
  -- only, so it can't raise on the zones it is looking for.
  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'group_id', g.id,
               'group_name', g.name,
               'skipped', true,
               'reason', 'invalid timezone',
               'timezone', g.timezone
             )
             order by g.id
           ),
           '[]'::jsonb
         )
  into v_details
  from public.groups g
  where not exists (
    select 1
    from pg_timezone_names tz
    where tz.name = g.timezone
  );

  for v_group in
    select
      g.id,
      g.name,
      tz.name as timezone,
      g.publish_day,
      g.publish_time
    from public.groups g
    -- Only Groups whose zone the database lists, and every conversion below
    -- reads the zone from tz.name, not g.timezone. A filter can't promise
    -- that: the planner is free to evaluate a conversion before it, and did.
    -- Reading the joined row means an unknown zone never reaches one.
    join pg_timezone_names tz
      on tz.name = g.timezone
    where
      public.due_publish_slot(
            g.publish_day, g.publish_time, tz.name, now(), p_tolerance_minutes
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
          and (e.created_at at time zone tz.name)
              >= public.due_publish_slot(
                   g.publish_day, g.publish_time, tz.name, now(), p_tolerance_minutes
                 )
      )
    order by g.id
    for update of g skip locked
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

-- ------------------------------------------------------------
-- 2. check_group_timezone — reject a zone the compile can't use
-- ------------------------------------------------------------
-- The same exact-name test as the compile loop's join, deliberately: `at time
-- zone` also accepts other spellings (any letter case, POSIX strings such as
-- 'UTC+5') that pg_timezone_names doesn't list and the compile has always
-- skipped. Accepting those here would store a Group that never publishes.
--
-- An UPDATE that leaves timezone as it was is let through, so a row stored
-- before this trigger existed (or orphaned by a future tz database) never
-- blocks an unrelated edit. `update of timezone` already skips updates that
-- don't mention the column; this covers the ones that repeat its value.
--
-- SECURITY INVOKER: pg_timezone_names is readable by everyone, so the
-- trigger needs no privilege the writer lacks.
create or replace function public.check_group_timezone()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.timezone is not distinct from old.timezone then
    return new;
  end if;

  if not exists (
    select 1
    from pg_timezone_names tz
    where tz.name = new.timezone
  ) then
    raise exception 'invalid_timezone'
      using errcode = 'P0001',
            detail = format(
              'groups.timezone %L is not a time zone this database knows (pg_timezone_names).',
              new.timezone
            ),
            hint = 'Use an IANA zone name such as America/New_York, or UTC.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_group_timezone on public.groups;
create trigger check_group_timezone
  before insert or update of timezone on public.groups
  for each row
  execute function public.check_group_timezone();

-- ------------------------------------------------------------
-- 3. The compile cron waits as long as the platform allows
-- ------------------------------------------------------------
-- The command is 20260426000007's, byte for byte, plus the
-- timeout_milliseconds argument. `into strict` makes this fail rather than
-- guess if there is no job of this name, or more than one.
do $$
declare
  v_jobid bigint;
begin
  select jobid
  into strict v_jobid
  from cron.job
  where jobname = 'compile-editions-every-15-minutes';

  perform cron.alter_job(
    job_id := v_jobid,
    command := $cmd$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/compile-editions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'compile_editions_cron_secret')
      ),
      body := jsonb_build_object('source', 'pg_cron', 'scheduled_at', now()),
      timeout_milliseconds := 150000
    ) as request_id;
  $cmd$
  );

  if not exists (
    select 1
    from cron.job
    where jobid = v_jobid
      and command like '%timeout_milliseconds := 150000%'
  ) then
    raise exception 'compile-editions cron job % was not updated', v_jobid;
  end if;
end;
$$;
