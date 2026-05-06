-- ============================================================
-- 20260501000000_push_notifications.sql
-- Phase 8: Push notifications
--   • push_tokens table (one row per device)
--   • pushed_at column on editions for idempotency
--   • RPCs to fetch tokens for an edition and mark it pushed
-- ============================================================

-- --------------------------------------------------------
-- 1. push_tokens table
-- --------------------------------------------------------
create table if not exists public.push_tokens (
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

create index if not exists idx_push_tokens_user_id on public.push_tokens(user_id);

alter table public.push_tokens enable row level security;

-- Users can read/insert/delete their own tokens. The service role bypasses RLS.
create policy "push_tokens_select_own"
  on public.push_tokens for select
  using (auth.uid() = user_id);

create policy "push_tokens_insert_own"
  on public.push_tokens for insert
  with check (auth.uid() = user_id);

create policy "push_tokens_delete_own"
  on public.push_tokens for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------
-- 2. pushed_at on editions (idempotency for push delivery)
-- --------------------------------------------------------
alter table public.editions
  add column if not exists pushed_at timestamptz;

-- --------------------------------------------------------
-- 3. RPC: list push tokens for the recipients of an edition
--    Returns: jsonb array of { user_id, token, platform, group_name }
-- --------------------------------------------------------
create or replace function public.get_edition_push_targets(p_edition_id uuid)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_group_id uuid;
  v_group_name text;
  v_result jsonb;
begin
  select e.group_id, g.name
  into v_group_id, v_group_name
  from public.editions e
  join public.groups g on g.id = e.group_id
  where e.id = p_edition_id;

  if v_group_id is null then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', pt.user_id,
    'token', pt.token,
    'platform', pt.platform,
    'group_name', v_group_name,
    'group_id', v_group_id,
    'edition_id', p_edition_id
  )), '[]'::jsonb)
  into v_result
  from public.group_members gm
  join public.push_tokens pt on pt.user_id = gm.user_id
  where gm.group_id = v_group_id;

  return v_result;
end;
$$;

revoke all on function public.get_edition_push_targets(uuid) from public, anon, authenticated;
grant execute on function public.get_edition_push_targets(uuid) to service_role;

-- --------------------------------------------------------
-- 4. RPC: mark an edition as pushed
-- --------------------------------------------------------
create or replace function public.mark_edition_pushed(p_edition_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.editions
  set pushed_at = now()
  where id = p_edition_id;
end;
$$;

revoke all on function public.mark_edition_pushed(uuid) from public, anon, authenticated;
grant execute on function public.mark_edition_pushed(uuid) to service_role;
