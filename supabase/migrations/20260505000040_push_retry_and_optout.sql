-- ============================================================
-- 20260505000040_push_retry_and_optout.sql
-- Stop a single Expo blip from permanently silencing notifications.
--
-- Adds:
--   * editions.push_attempts — bounded retry counter
--   * editions.push_claim_at — claim/lease so concurrent workers don't
--     double-push or trample each other's retry budget
--   * group_members.push_subscribed — per-group push opt-out, mirroring
--     the existing email_subscribed flag
--   * claim_edition_for_push / release_edition_push_claim /
--     increment_edition_push_attempts RPCs
--   * Updated get_edition_push_targets to honor push_subscribed
--   * Updated mark_edition_pushed to clear the claim
-- ============================================================

alter table public.editions
  add column if not exists push_attempts int not null default 0,
  add column if not exists push_claim_at timestamptz;

alter table public.group_members
  add column if not exists push_subscribed boolean not null default true;

-- ------------------------------------------------------------
-- Honor push_subscribed in the targets RPC
-- ------------------------------------------------------------
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
  where gm.group_id = v_group_id
    and gm.push_subscribed = true;

  return v_result;
end;
$$;

revoke all on function public.get_edition_push_targets(uuid) from public, anon, authenticated;
grant execute on function public.get_edition_push_targets(uuid) to service_role;

-- ------------------------------------------------------------
-- Claim / release / increment RPCs
-- ------------------------------------------------------------
create or replace function public.claim_edition_for_push(p_edition_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claimed boolean := false;
begin
  update public.editions
  set push_claim_at = now()
  where id = p_edition_id
    and pushed_at is null
    and (push_claim_at is null or push_claim_at < now() - interval '5 minutes')
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

revoke all on function public.claim_edition_for_push(uuid) from public, anon, authenticated;
grant execute on function public.claim_edition_for_push(uuid) to service_role;

create or replace function public.release_edition_push_claim(p_edition_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.editions
  set push_claim_at = null
  where id = p_edition_id
    and pushed_at is null;
$$;

revoke all on function public.release_edition_push_claim(uuid) from public, anon, authenticated;
grant execute on function public.release_edition_push_claim(uuid) to service_role;

create or replace function public.increment_edition_push_attempts(p_edition_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempts int;
begin
  update public.editions
  set push_attempts = push_attempts + 1
  where id = p_edition_id
  returning push_attempts into v_attempts;

  return v_attempts;
end;
$$;

revoke all on function public.increment_edition_push_attempts(uuid) from public, anon, authenticated;
grant execute on function public.increment_edition_push_attempts(uuid) to service_role;

-- mark_edition_pushed must clear the claim alongside setting pushed_at.
create or replace function public.mark_edition_pushed(p_edition_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.editions
  set pushed_at = now(),
      push_claim_at = null
  where id = p_edition_id
    and pushed_at is null;
$$;

revoke all on function public.mark_edition_pushed(uuid) from public, anon, authenticated;
grant execute on function public.mark_edition_pushed(uuid) to service_role;
