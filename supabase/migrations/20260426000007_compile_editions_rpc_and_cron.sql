-- ============================================================
-- 20260426000007_compile_editions_rpc_and_cron.sql
-- Atomic weekly edition compilation and hosted Supabase Cron job.
--
-- Before this cron job can succeed in hosted Supabase, create matching
-- Vault secrets:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<same value as Edge Function CRON_SECRET>', 'compile_editions_cron_secret');
-- ============================================================

-- --------------------------------------------------------
-- 1. Atomic RPC: compile due groups into editions
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- 2. Keep invite lookup aligned with the groups row shape
-- --------------------------------------------------------
drop function if exists public.find_group_by_invite_code(text);

create or replace function public.find_group_by_invite_code(p_invite_code text)
returns table (
  id              uuid,
  name            text,
  description     text,
  cover_image_url text,
  publish_day     int,
  publish_time    time,
  timezone        text,
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
         timezone, created_by, invite_code, created_at
  from public.groups
  where invite_code = upper(trim(p_invite_code))
  limit 1;
$$;

-- --------------------------------------------------------
-- 3. Hosted Supabase Cron schedule
-- --------------------------------------------------------
create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('compile-editions-every-15-minutes');
exception
  when others then
    null;
end;
$$;

select cron.schedule(
  'compile-editions-every-15-minutes',
  '*/15 * * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/compile-editions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'compile_editions_cron_secret')
      ),
      body := jsonb_build_object('source', 'pg_cron', 'scheduled_at', now())
    ) as request_id;
  $$
);
