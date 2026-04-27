-- Allow creators to immediately read their newly-created group.
-- Without this, INSERT...SELECT * fails because PostgREST evaluates the RLS
-- SELECT policy ("is_column_member") before the on_column_created trigger has
-- inserted the creator into column_members, returning 0 rows (PGRST116).
create policy "Creators can read their own columns"
  on public.columns for select
  to authenticated
  using (created_by = auth.uid());
