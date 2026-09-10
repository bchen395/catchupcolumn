-- Throwaway migration, used only to exercise the CI `migrations` job's
-- Supabase-stack path. This branch and its PR are deleted after the run.
comment on table public.editions is 'Compiled weekly newsletters.';
