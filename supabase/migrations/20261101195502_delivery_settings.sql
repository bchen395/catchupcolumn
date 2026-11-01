-- ============================================================
-- 20261101195502_delivery_settings.sql
--
-- Each member chooses, per Group, whether they get the edition email and the
-- edition notification (decided 2026-10-30). The flags already exist and
-- delivery already honours them:
--   - group_members.email_subscribed (20260430010000), read by
--     get_edition_email_payload (latest: 20261003154759);
--   - group_members.push_subscribed (20260505000040), read by
--     get_edition_push_targets.
-- Until now the only way to change either was the email's unsubscribe link,
-- which can only turn email off (unsubscribe_by_token). The app gets a switch
-- for each, on the Group page.
--
--   1. set_delivery_preferences — the caller's own row only. Either flag may
--      be left null to keep it as it is.
--   2. group_members UPDATE narrowed to the role column. The table-wide grant
--      plus the "Moderators can manage members" policy let a moderator PATCH
--      any member's email_subscribed, push_subscribed or unsubscribe_token
--      through the API. Members' own changes now go through (1); role is the
--      only column the moderator policy is for.
-- ============================================================

-- ------------------------------------------------------------
-- 1. set_delivery_preferences
-- ------------------------------------------------------------
-- Returns the row as saved, so the app shows what the server holds rather
-- than what it asked for.
create or replace function public.set_delivery_preferences(
  p_group_id uuid,
  p_email_subscribed boolean default null,
  p_push_subscribed boolean default null
)
returns table (email_subscribed boolean, push_subscribed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;

  -- Qualified throughout: the output columns share these names.
  return query
  update public.group_members gm
  set email_subscribed = coalesce(p_email_subscribed, gm.email_subscribed),
      push_subscribed  = coalesce(p_push_subscribed, gm.push_subscribed)
  where gm.group_id = p_group_id
    and gm.user_id = v_user_id
  returning gm.email_subscribed, gm.push_subscribed;

  -- Not in the Group (never joined, left, or removed). Nothing was written.
  if not found then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.set_delivery_preferences(uuid, boolean, boolean)
  from public, anon;
grant execute on function public.set_delivery_preferences(uuid, boolean, boolean)
  to authenticated;

-- ------------------------------------------------------------
-- 2. group_members UPDATE → role only
-- ------------------------------------------------------------
-- RLS can't scope a policy to columns, so the privilege layer does it, as
-- 20260703000000 did for SELECT. A PATCH of any other column now fails with
-- 42501 before the policy is consulted. The SECURITY DEFINER writers
-- (set_delivery_preferences, unsubscribe_by_token, hand_over_groups, …) run
-- as the owner and are unaffected; service_role keeps its default grants.
-- anon never had an UPDATE policy here; revoking its grant says so.
revoke update on table public.group_members from anon, authenticated;
grant update (role) on table public.group_members to authenticated;
