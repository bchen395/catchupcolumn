---
name: db-migrations
description: Use when writing or editing anything in `supabase/migrations/` — new tables, columns, RLS policies, SECURITY DEFINER functions/RPCs, triggers, storage policies, or cron. This is the highest-risk surface in the repo (RLS and security-definer functions gate all data access); follow these invariants exactly.
---

# Database migrations & RLS — Catch Up Column

Migrations are the **source of truth** for the schema, RLS, and every RPC. The app-side types in `types/database.ts` and the schema summary in CLAUDE.md are mirrors that *you* keep in sync. Getting RLS or a `security definer` function wrong is a security bug, not a cosmetic one — this surface has already had a dedicated security-fix sweep (`20260505000000_critical_security_fixes.sql`). Treat every rule below as load-bearing.

## Read first (sources of truth, in order)

1. **The latest few migrations in `supabase/migrations/`** — sorted lexically by timestamp. Read 2–3 recent ones to match current style before writing. Good exemplars:
   - `20260505000000_critical_security_fixes.sql` — RLS helpers, deny-direct-insert policy, atomic join RPC.
   - `20260525000000_manual_publish.sql` — the `publish_edition_now` / `compile_due_editions` RPC pattern (advisory lock, `for update`, slot guard).
   - `20260506000000_storage_path_hardening.sql` — storage `foldername` path gating.
2. **`001_initial_schema.sql`** — base tables, the first RLS policies, and `handle_new_group` / membership triggers.
3. **CLAUDE.md → Database Schema & Notable RPCs** — the prose contract you must keep true.
4. **The `data-layer` skill** — how the app calls what you write (and why direct writes to some tables must fail).

## Hard rules (invariants)

- **Migrations are append-only and immutable.** Never edit a migration that has shipped. Fix forward with a new file: `npx supabase migration new <name>` → `YYYYMMDDHHMMSS_<name>.sql`. The timestamp ordering *is* the dependency order.
- **RLS on every table.** New table → `alter table public.<t> enable row level security;` plus explicit policies. A table with RLS on and no policy denies everything; a table with RLS *off* exposes everything. Never leave it ambiguous.
- **`set search_path = public` on EVERY `security definer` function.** This is the #1 footgun and the reason for the `20260505000000` sweep — without it a hostile client `search_path` can shadow `public.is_group_member` etc. and bypass authorization. No exceptions.
  ```sql
  create or replace function public.is_group_moderator(p_group_id uuid, p_user_id uuid)
  returns boolean language sql security definer stable
  set search_path = public
  as $$ select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = p_user_id and role = 'moderator'
  ); $$;
  ```
- **Authorize inside the function, against `auth.uid()`.** RPCs that mutate on behalf of a role check membership/moderator status explicitly and `raise exception` with a **stable, parseable code** (the app matches on the message string): `not_authenticated`, `not_moderator`, `no_posts_to_publish`, `publish_in_progress`, `invalid_invite_code`. Reuse existing codes; don't invent synonyms.
- **Lock down privileged tables; route writes through RPCs.** Direct client inserts that could escalate privilege are denied with `with check (false)` (see `group_members`), and the only legitimate writers are a `security definer` trigger or RPC. If you add a table where the client shouldn't write directly, do the same.
- **`grant execute` deliberately.** Caller-facing RPCs → `to authenticated`. Worker/dispatch RPCs called only by edge functions with the service role → `to service_role` (e.g. `compile_due_editions`). Don't over-grant.
- **Storage policies gate on path segments.** Buckets are private; policies parse the object path with `(storage.foldername(name))[n]`. Match the app's path conventions exactly:
  - `avatars` → `[1] = auth.uid()::text`
  - `post-images` → `[1] = auth.uid()::text and [2] = 'posts'`
  - `group-covers` → `((storage.foldername(name))[1])::uuid` checked via `is_group_moderator`
  If a write policy and the app's upload path disagree, the upload "succeeds" but the read policy can't find it — silent breakage. Keep this skill's list and the `data-layer` list in sync.
- **Concurrency: lock before compile.** Edition-creating RPCs take a per-group advisory lock (`pg_try_advisory_xact_lock(hashtextextended('compile_due_editions:' || group_id, 0))`), select uncompiled posts `for update`, and re-check the slot guard after acquiring the lock. Copy that pattern for anything that compiles/claims; don't roll your own.
- **Delivery uses claim/lease idempotency.** The `editions` delivery columns (`emailed_at`/`email_claim_at`/`email_attempts`, `pushed_at`/`push_claim_at`/`push_attempts`) are driven by RPCs (`claim_edition_for_email`, `mark_edition_emailed`, `release_*`, `increment_edition_push_attempts`, …) with a 5-minute stale-claim window. These columns are **server-only** — they are intentionally absent from `types/database.ts`. Don't expose them to the client.
- **Idempotent joins / case-insensitive codes.** Membership inserts use `on conflict (group_id, user_id) do nothing`. Invite codes are matched `lower(invite_code) = lower(trim(p_invite_code))` — codes are lowercase hex; an `upper(...)` comparison silently never matches (a real past regression).
- **Naming.** Tables plural snake_case; columns snake_case; functions `verb_noun` or `is_noun`; RPC params `p_*`; triggers `handle_*` / `prevent_*` / `check_*`.

## The cross-file sync obligation (do this in the same change)

A migration is not done until its mirrors match:

1. **`types/database.ts`** — add/update the table `Row`/`Insert`/`Update` and any `Database['public']['Functions']` signature. (Hand-written; bug #29. See `data-layer`.) Remember: server-only delivery columns stay *out* of the types.
2. **CLAUDE.md → Database Schema** — update the table/column list and the "Notable RPCs" line if you added or changed an RPC.

## Workflow for a migration

1. Read the 2–3 most recent migrations and the closest existing analogue (an RLS policy or RPC like the one you're writing).
2. `npx supabase migration new <name>`.
3. Write it: enable RLS, explicit policies, `set search_path = public` on every definer function, stable error codes, deliberate grants, advisory-lock/claim patterns where relevant.
4. Apply locally: `npx supabase db push` (or against a local `supabase start` stack first).
5. Sync `types/database.ts` and CLAUDE.md.
6. Sanity-check authorization mentally: "Could a non-member / non-moderator call this and succeed? Could a client write this table directly?" If yes and it shouldn't, you're missing a policy or a check.

## Keep this skill alive (self-maintenance)

Before finishing a session that established or changed a backend invariant — without being asked:

- Record new conventions (a new claim pattern, a new storage bucket + its path gate, a new stable error code) here **and** in CLAUDE.md's schema summary.
- If a security rule is tightened (as in `20260505000000`/`20260506000000`), capture the rule and its rationale here so it isn't re-introduced as a regression.
- Keep the storage path-segment list identical to the one in the `data-layer` skill.
