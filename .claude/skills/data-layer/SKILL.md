---
name: data-layer
description: Use when reading or writing app-side Supabase data — anything in `lib/` (data-access functions, queries, mutations, storage uploads, signed URLs) or `types/database.ts`. Catches the session up on the client idiom, when to use an RPC vs a table query, the nested-select cast convention, the manual type-sync rule, and storage path conventions.
---

# Data layer — Catch Up Column

This is the app-side data layer: the `supabase-js` client, the `lib/` functions that wrap it, and the hand-written types they return. It's the backend counterpart to `frontend-design`. Everything *server-side* (SQL, RLS, RPC bodies, cron) lives in the **`db-migrations`** skill; anything running on Deno with the service role lives in **`edge-functions`**. This skill is the seam between the UI and Supabase.

## Read first (sources of truth, in order)

1. **`lib/supabase.ts`** — the single client. Anon key, session-aware, platform storage adapter (SecureStore native / localStorage web). There is exactly one client; never construct another.
2. **`types/database.ts`** — the hand-written type mirror. `Row` / `Insert` / `Update` per table, derived join types (`GroupWithMembers`, `EditionWithPosts`, `PostWithAuthor`), and the `Database['public']['Functions']` RPC signatures. Read the type you're about to use before guessing its shape.
3. **CLAUDE.md → Database Schema** — the prose summary of tables, columns, and notable RPCs. Quick orientation only; migrations are the real source of truth.
4. **The `db-migrations` skill** — read it before assuming a table/column/RPC exists or that a mutation is allowed by RLS.

## Hard rules

- **One client.** Import `{ supabase }` from `@/lib/supabase`. Never call `createClient` anywhere else in app code — it's anon-key + session-bound on purpose. Service-role work does not belong in `lib/`; it belongs in an edge function.
- **All Supabase access goes through `lib/`.** Components, screens, and hooks call a `lib/<entity>.ts` function — never `supabase.from(...)` inline. Data functions are `const` arrow exports, `async`, and typed with `Row`/`Insert`/`Update` imported from `@/types`.
- **The canonical idiom.** Destructure `{ data, error }`, `if (error) throw error;`, return `data`. Throw — don't swallow or return error objects. Use `.single()` when a row must exist (returns `T`), `.maybeSingle()` when it legitimately may not (return `T | null`).
  ```ts
  const { data, error } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
  if (error) throw error;
  return data; // PostRow | null
  ```
- **RPC vs table query.** A mutation that is role-gated (moderator-only), atomic/transactional, or blocked by RLS goes through `supabase.rpc('fn', { p_x: value })` — not a direct write. Direct inserts to `group_members` fail by design (`with check (false)`); joins/publishes/deletes are RPCs (`join_group_by_invite_code`, `delete_group_as_moderator`, and `publish_edition_now` via the edge function). When in doubt, check the RLS policy in `db-migrations` — if the policy forbids the direct write, there's an RPC for it.
- **Nested selects need a cast.** `Relationships: []` is intentionally hardcoded in `types/database.ts` (Supabase `gen types` bug **#29**), so `supabase-js` can't infer joined/embedded shapes. Cast the result to a derived type: `data as unknown as GroupRowWithMembers` (see `lib/groups.ts`, `lib/editions.ts`). Don't fight the inference or invent inline shapes — add the derived type to `types/database.ts` and cast to it.
- **Storage stores paths, not URLs.** Columns like `posts.image_url` hold the **storage path** (`<userId>/posts/<postId>/image.jpg`), never a signed or public URL. Buckets are private — sign at read time with `createSignedUrl(path, ttl)`. Uploads use `{ upsert: true }`.
- **The first path segment(s) gate RLS — get them wrong and the upload silently becomes unreadable.** Conventions enforced by storage policies (see `db-migrations`):
  - `avatars` → `<userId>/...`
  - `post-images` → `<userId>/posts/<postId>/...` (both the `<uid>` *and* the `posts` segment are checked)
  - `group-covers` → `<groupId>/cover.jpg`
- **Map errors to warm copy.** When surfacing an RPC/edge error to the UI, match on the stable code string (see the `mapRpcError`-style parsing in `lib/editions.ts` and `lib/auth.ts`) and render copy from `constants/strings.ts`. Never show a raw Postgres message to a user — the audience is grandparents, not engineers.
- **Refresh the session after changing auth metadata** (`lib/auth.ts`), or the JWT keeps carrying stale claims.

## `lib/` inventory — check here before adding a function

| File | Owns |
| --- | --- |
| `supabase.ts` | The client singleton + platform storage adapters. |
| `auth.ts` | Sign-up/in/out, profile sync (`ensureUserProfile`), avatar upload, auth error mapping. |
| `groups.ts` | Group CRUD, membership, invite-code join/lookup (RPCs), cover upload. |
| `posts.ts` | Post CRUD, image upload + signed display URLs, current-post lookup. |
| `editions.ts` | Edition list/detail queries, publish-now invoke, edition error parsing. |
| `edition-seen.ts` | Local per-device "seen" state (AsyncStorage) — not Supabase. |
| `notifications.ts` | Push token registration + Expo project id resolution. |
| `image.ts` | `resizeImageForUpload` and image helpers used before upload. |
| `haptics.ts` | Haptic feedback wrappers. |
| `edition-layout.ts` | Front-page layout computation for the reader. |

Group a new data function with its entity's file; create a new `lib/<entity>.ts` only for a genuinely new noun.

## Type-sync obligation

`types/database.ts` is **hand-written, not generated** — there is no `supabase gen types` in the pipeline yet (bug #29). Whenever a migration changes the schema, update this file *in the same change*:

- New/changed column → update the table's `Row`, and its `Insert`/`Update` if the column is writable.
- New RPC or changed signature → update `Database['public']['Functions']`.
- New join query shape → add a derived type (`XWithY`) to cast to.
- Conventions: `Insert = Omit<Row, server-defaulted keys> & { ...?: optional }`; `Update = Partial<Omit<Row, immutable keys>>` (omit `id`, FKs, and `created_at`).

## Workflow for a data change

1. Read the relevant `lib/<entity>.ts` for the existing idiom, and the type in `types/database.ts`.
2. If it's server-side (new table/column/RPC/policy), do that in a migration first — see **`db-migrations`** — then sync `types/database.ts`.
3. Write the `lib/` function in the canonical idiom; pick `.single()` vs `.maybeSingle()` deliberately.
4. For nested data, add/return a derived type and cast `as unknown as`.
5. For uploads, follow the bucket path convention exactly and store the path, not a URL.
6. Surface failures as mapped codes → `Strings`, never raw errors.
7. Typecheck: `npm run typecheck` (it covers `lib/` and `types/`; it does **not** cover `supabase/functions/`).

## Keep this skill alive (self-maintenance)

Before finishing a session that changed a data-layer convention — without being asked:

- Update the `lib/` inventory or hard rules here if the idiom, file layout, or storage conventions changed.
- **When bug #29 is resolved** (types become generated), delete the nested-select cast rule and the hand-sync obligation, and update `lib/supabase.ts`/`types/database.ts` notes accordingly.
- If a new bucket or path convention is introduced, record it both here and in the `db-migrations` storage-RLS section.
