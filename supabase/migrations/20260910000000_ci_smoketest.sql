-- Throwaway migration exercising the CI migrations job after the
-- supabase/setup-cli v1 -> v3 bump. Branch deleted after the run.
comment on table public.editions is 'Compiled weekly newsletters.';
