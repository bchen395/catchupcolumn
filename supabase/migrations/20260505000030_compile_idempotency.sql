-- ============================================================
-- 20260505000030_compile_idempotency.sql
-- Make edition compilation and email dispatch safe under concurrent
-- invocations (manual trigger overlapping with the scheduled cron).
--
-- 1. compile_due_editions: take a per-group transaction-scoped advisory
--    lock before the "no recent edition" check, so two concurrent calls
--    can't both pass the guard and trip the editions unique constraint.
--
-- 2. Email send: introduce a claim/lease column on editions plus a
--    claim_edition_for_email RPC so only one worker dispatches a given
--    edition's emails at a time. mark_edition_emailed clears the claim.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Per-group advisory lock inside compile_due_editions
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
        select 1
        from public.editions e
        where e.group_id = g.id
          and e.created_at > now() - interval '22 hours'
      )
    order by g.id
    for update skip locked
  loop
    -- Per-group advisory lock (transaction-scoped) closes the gap between
    -- the "not exists" predicate above and the insert below. Any concurrent
    -- compile_due_editions call already holding this lock will skip the
    -- group via try_advisory; any caller blocked here re-evaluates the
    -- "no recent edition" guard before inserting.
    if not pg_try_advisory_xact_lock(
      hashtextextended('compile_due_editions:' || v_group.id::text, 0)
    ) then
      continue;
    end if;

    -- Re-check after acquiring the lock: a peer that just committed may
    -- have inserted the edition we were about to create.
    if exists (
      select 1
      from public.editions e
      where e.group_id = v_group.id
        and e.created_at > now() - interval '22 hours'
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

-- ------------------------------------------------------------
-- 2. Email send claim/lease
-- ------------------------------------------------------------
alter table public.editions
  add column if not exists email_claim_at timestamptz;

-- A worker can claim an edition for emailing iff it isn't already emailed
-- and either has no claim or the claim is stale (older than 5 minutes).
-- Returns true if this caller now owns the claim.
create or replace function public.claim_edition_for_email(p_edition_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean := false;
begin
  update public.editions
  set email_claim_at = now()
  where id = p_edition_id
    and emailed_at is null
    and (email_claim_at is null or email_claim_at < now() - interval '5 minutes')
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

grant execute on function public.claim_edition_for_email(uuid) to service_role;

-- mark_edition_emailed must clear the claim alongside setting emailed_at,
-- otherwise a successful send leaves a dangling claim_at.
create or replace function public.mark_edition_emailed(p_edition_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.editions
  set emailed_at = now(),
      email_claim_at = null
  where id = p_edition_id
    and emailed_at is null;
$$;

grant execute on function public.mark_edition_emailed(uuid) to service_role;

-- Allow callers to release a claim explicitly when a send fails so that
-- retry budget is honored without waiting for the 5-minute lease.
create or replace function public.release_edition_email_claim(p_edition_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.editions
  set email_claim_at = null
  where id = p_edition_id
    and emailed_at is null;
$$;

grant execute on function public.release_edition_email_claim(uuid) to service_role;
