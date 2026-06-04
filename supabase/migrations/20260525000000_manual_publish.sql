-- ============================================================
-- 20260525000000_manual_publish.sql
-- Let moderators publish an edition immediately, without changing
-- the group's regular weekly slot.
--
-- 1. publish_edition_now(p_group_id): authenticated RPC — moderator-only,
--    compiles all uncompiled posts for one group into a new Edition right
--    now. Shares the per-group advisory lock with compile_due_editions so
--    a concurrent cron run can't double-compile.
--
-- 2. compile_due_editions: replace the "no edition in the last 22 hours"
--    skip guard with a slot-scoped one. The 22h window suppressed the
--    next regular cron slot whenever a moderator manually published within
--    the previous day. The new guard only skips if an edition was already
--    created during *today's* scheduled slot (today in group tz, at or
--    after publish_time).
-- ============================================================

-- ------------------------------------------------------------
-- 1. publish_edition_now — moderator-triggered immediate publish
-- ------------------------------------------------------------
create or replace function public.publish_edition_now(p_group_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_moderator boolean;
  v_post_ids uuid[];
  v_post_count int;
  v_next_number int;
  v_edition_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'moderator'
  ) into v_is_moderator;

  if not v_is_moderator then
    raise exception 'not_moderator' using errcode = '42501';
  end if;

  -- Same per-group advisory lock pattern as compile_due_editions, so a
  -- concurrent cron run and a manual publish can't both insert an edition
  -- for this group at the same time.
  if not pg_try_advisory_xact_lock(
    hashtextextended('compile_due_editions:' || p_group_id::text, 0)
  ) then
    raise exception 'publish_in_progress' using errcode = '55P03';
  end if;

  -- Lock the uncompiled posts for this group so a concurrent writer can't
  -- slip a post in between the count and the update below.
  select
    coalesce(array_agg(p.id order by p.created_at), '{}'::uuid[]),
    count(*)::int
  into v_post_ids, v_post_count
  from (
    select id, created_at
    from public.posts
    where group_id = p_group_id
      and edition_id is null
    order by created_at
    for update
  ) p;

  if v_post_count = 0 then
    raise exception 'no_posts_to_publish' using errcode = 'P0001';
  end if;

  select coalesce(max(edition_number), 0) + 1
  into v_next_number
  from public.editions
  where group_id = p_group_id;

  insert into public.editions (group_id, edition_number, published_at)
  values (p_group_id, v_next_number, now())
  returning id into v_edition_id;

  update public.posts
  set edition_id = v_edition_id
  where id = any(v_post_ids)
    and edition_id is null;

  get diagnostics v_post_count = row_count;

  return jsonb_build_object(
    'edition_id', v_edition_id,
    'edition_number', v_next_number,
    'post_count', v_post_count,
    'group_id', p_group_id
  );
end;
$$;

grant execute on function public.publish_edition_now(uuid) to authenticated;

-- ------------------------------------------------------------
-- 2. compile_due_editions — slot-scoped duplicate guard
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
      and extract(dow from now() at time zone g.timezone)::int = g.publish_day
      and (now() at time zone g.timezone)::time >= g.publish_time
      and (now() at time zone g.timezone)::time < g.publish_time + (p_tolerance_minutes || ' minutes')::interval
      and not exists (
        -- Skip only if an edition was already created for *this* scheduled
        -- slot. Manual publishes earlier in the week (or earlier today)
        -- should not suppress the regular cron run.
        select 1
        from public.editions e
        where e.group_id = g.id
          and (e.created_at at time zone g.timezone)::date
              = (now() at time zone g.timezone)::date
          and (e.created_at at time zone g.timezone)::time >= g.publish_time
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
    -- inserted today's edition for this group.
    if exists (
      select 1
      from public.editions e
      where e.group_id = v_group.id
        and (e.created_at at time zone v_group.timezone)::date
            = (now() at time zone v_group.timezone)::date
        and (e.created_at at time zone v_group.timezone)::time >= v_group.publish_time
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

grant execute on function public.compile_due_editions(int) to service_role;
