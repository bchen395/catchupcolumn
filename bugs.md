# Catch Up Column — Bug Audit

Generated 2026-05-05 from a three-pass review (backend migrations + edge functions, data/auth layer, UI). Findings are ordered by severity. File:line references are clickable in editors that support them.

---

## Critical — security / correctness

### 1. Auth bypass: any signed-in user can join any group as moderator
- **Where:** `supabase/migrations/20260426000000_rename_columns_to_groups.sql:124`
- The `group_members` INSERT policy is `with check (user_id = auth.uid())` only. No check that an invite code was supplied, and `role` is unconstrained.
- An attacker who learns any `groups.id` can `insert into group_members (group_id, user_id, role) values (<id>, auth.uid(), 'moderator')`, then read every post/edition and modify group settings.
- The invite-code requirement currently lives only in the JS layer.

### 2. Invite-code lookup regressed and is broken for everyone
- **Where:** `supabase/migrations/20260426000007_compile_editions_rpc_and_cron.sql:147`
- Redefines `find_group_by_invite_code` with `where invite_code = upper(trim(...))`.
- Codes are stored lowercase (UUID hex from initial schema). Migrations `..0002` and `..0003` previously fixed this; the new migration silently reintroduces the bug **and** drops the auth check.
- Joining by code currently fails for all users.

### 3. `delete-account` orphans / errors out for last moderators or solo-group owners
- **Where:** `supabase/functions/delete-account/index.ts:57`
- Calls `auth.admin.deleteUser`. The cascade through `auth.users → public.users → group_members` does not set the `app.deleting_group` bypass that `prevent_last_moderator_removal` expects, so the cascade throws and deletion fails (or partially succeeds).
- Storage objects under `avatars/<uid>/` and `post-images/<uid>/` are also never cleaned up.

### 4. `SECURITY DEFINER` without `SET search_path` on hot-path RLS helpers
- **Where:** `supabase/migrations/20260426000000_rename_columns_to_groups.sql:63`
- `is_group_member` and `is_group_moderator` lack `set search_path = public`. Every other definer function in the repo sets it; these two are outliers.
- Real exploit vector via temp-schema shadowing, plus the Supabase linter flags it. Called by every RLS check.

---

## High

### 5. Cron interval == tolerance window — editions can slip through
- **Where:** `supabase/migrations/20260426000007_compile_editions_rpc_and_cron.sql:15` (function), cron at line 168
- `compile_due_editions` uses a 15-minute tolerance and the cron is `*/15 * * * *`.
- Any drift (cold start, lateness) past the boundary means a 09:00 group fires at 09:15:02 and matches nothing.
- Fix: drop the cron to `*/10` or widen tolerance to ~20 min.

### 6. Public URL handed out for the private `post-images` bucket
- **Where:** `lib/posts.ts:108`
- Returns `getPublicUrl(...)` even though `supabase/migrations/20260430000000_scope_post_images_to_group_members.sql` restricts the bucket via RLS. Those URLs will 4xx on render.
- Fix: use `createSignedUrl`.
- Related: `lib/groups.ts:146` writes group covers to `avatars/groups/<id>/...`, which doesn't fit the `<userId>/...` RLS shape used by avatars.

### 7. Auth init double-fires and races
- **Where:** `hooks/use-auth.ts:12`
- `getSession()` runs **and** `onAuthStateChange` fires `INITIAL_SESSION`, so `ensureUserProfile` and `registerForPushAsync` execute twice on every cold start.
- Neither is awaited before `setLoading(false)`; the listener can also `setSession` after unmount.
- Fix: add a mounted flag, dedupe init vs. INITIAL_SESSION, await profile creation before clearing loading.

### 8. Push token registered on every `onAuthStateChange`
- **Where:** `lib/notifications.ts:71`
- `TOKEN_REFRESHED` fires periodically; each call hits Expo + a DB upsert.
- No `projectId` passed to `getExpoPushTokenAsync` — works in dev, fails in EAS production builds.
- Fix: cache token in memory, only upsert on change, pass `projectId` from `Constants.expoConfig.extra.eas.projectId`.

### 9. Push delivery has no retry cap and no per-user opt-out
- **Where:** `supabase/functions/compile-editions/index.ts:357`
- Iterates everything where `pushed_at IS NULL`, calls `mark_edition_pushed` even when every Expo ticket fails, and has no `push_attempts` counter.
- A single Expo blip permanently silences notifications for those editions.
- Also `get_edition_push_targets` has no `push_subscribed` flag — users who unsubscribed from email still get pushes.

### 10. `compile_due_editions` is not actually idempotent under concurrent invocations
- **Where:** `supabase/migrations/20260426000007_compile_editions_rpc_and_cron.sql:55`
- `for update skip locked` locks `groups`, but the idempotency guard is the `not exists` predicate on `editions`, which isn't covered.
- Two concurrent runs (manual + scheduled) both pass the check; the unique constraint fires on the second insert and aborts the **whole** function.
- Same race on email send: `supabase/functions/compile-editions/index.ts:138` reads `emailed_at` then later writes it.
- Fix: wrap in an advisory lock keyed by `group_id`.

### 11. Reset-password flow is kicked back to inbox
- **Where:** `app/_layout.tsx:75` and `app/(auth)/reset-password.tsx:54`
- Once `setSession` succeeds inside the reset screen, the root redirect immediately replaces to `/(tabs)/inbox` before the user can pick a new password.

### 12. `MediaTypeOptions` is removed in expo-image-picker 17
- **Mixed usage:**
  - deprecated `ImagePicker.MediaTypeOptions.Images` at `app/(auth)/onboarding.tsx:108` and `app/group/[id].tsx:289`
  - new style `mediaTypes: ['images']` at `app/(tabs)/post.tsx:151`
- The deprecated form will throw at runtime with the current pinned version.

---

## Medium

### 13. Bio is never collected in the UI
- CLAUDE.md spec says max 200 chars.
- `app/(auth)/onboarding.tsx:211` and `lib/auth.updateCurrentUserProfile` only write `display_name` + `avatar_url`.
- `display_name` also has no length cap — empty check only at `app/(auth)/onboarding.tsx:133`.

### 14. `ensureUserProfile` swallows errors
- **Where:** `lib/auth.ts:75`
- On RLS or network failure it `console.warn`s and proceeds. Every screen that joins on `users.id` then breaks.
- Fix: throw, don't warn. Also `email: user.email ?? ''` will violate the NOT NULL/unique constraint on edge cases.

### 15. Initial route + redirect timing
- **Where:** `app/_layout.tsx:25`
- Sets `initialRouteName: '(tabs)'`. Tab screens can briefly mount before the redirect effect fires, kicking off `fetchEditionsForUser` against an unauthenticated client.
- Fix: make initial route `(auth)/login`, or refuse to render tab tree until auth resolves.

### 16. `editions` writes have no client-side blocker
- **Where:** `supabase/migrations/001_initial_schema.sql:207`
- Only SELECT and INSERT policies. Works in practice (edge function uses service role) but `revoke update, delete on public.editions from authenticated` is good defense in depth.

### 17. `fetchEditionsForUser` relies on RLS for filtering
- **Where:** `lib/editions.ts:8`
- Selects all editions with no explicit filter. Works only because RLS hides non-member rows.
- Fix: be explicit — filter by `group_id in (user's groups)` or join through `group_members`.

### 18. Stale display name / onboarding flag after profile update
- **Where:** `lib/auth.ts:185`
- `needsOnboarding` reads `user_metadata`, which only refreshes with the JWT. After `clearNeedsOnboardingFlag`, the local flag stays true until the next refresh.

### 19. `createGroup` redundant `created_by`
- **Where:** `lib/groups.ts:91`
- DB trigger (`20260426000001_fix_group_created_trigger.sql`) derives the moderator from `created_by`. Passing the wrong UUID would make a different user the moderator.
- Fix: drop it from the input or assert equality with `auth.uid()`.

### 20. Resend `from` is the sandbox sender
- **Where:** `supabase/functions/compile-editions/index.ts:31`
- `EMAIL_FROM = 'Catch Up Column <onboarding@resend.dev>'` will tank deliverability in production. Move to a verified domain.

### 21. Group cover upload has no rollback
- **Where:** `app/group/[id].tsx:279`
- If `updateGroupSettings` fails after the upload succeeds, the storage object is orphaned and local state stays stale.

### 22. `posts` insert type forces callers to pass `image_url: null`
- **Where:** `lib/posts.ts:39`
- `Pick<PostInsert, ...>` includes `image_url`, which is optional in the insert type but required in the `Pick`.
- Fix: use `Partial` on `image_url`.

### 23. `lib/auth.ts` profile update uses `.single()` instead of `.maybeSingle()`
- **Where:** `lib/auth.ts:101`
- If RLS denies the update, `.single()` raises "no rows returned" rather than "permission denied" — confusing surface.

### 24. `lib/auth.ts` redundant Authorization header on `functions.invoke`
- **Where:** `lib/auth.ts:171`
- `invoke` already attaches the session JWT; the manual header can collide with the SDK's own.

---

## Minor / hygiene

### 25. Accessibility miss for older-adult target
- `caption` and `label` are 14px in `components/themed-text.tsx` — used widely (inbox meta, group card description, profile sub-copy, edition meta) and violates the 16px-min rule in CLAUDE.md.

### 26. `buildSections(editions)` recomputed every render
- **Where:** `app/(tabs)/inbox.tsx:98` — wrap in `useMemo`.

### 27. `loadGroups` recreated on every group switch
- **Where:** `app/(tabs)/post.tsx:106` — extra network calls on every selection change.

### 28. Hardcoded modal width 320
- `app/group/[id].tsx:746`, `app/group/create.tsx:450` — overflows on 320dp Android phones.

### 29. `types/database.ts` `Relationships: []` everywhere
- **Where:** `types/database.ts:121`
- Forces `as unknown as ...` casts in `lib/groups.ts:39` and `lib/editions.ts:41`.
- Fix: generate via `supabase gen types`.

### 30. `lib/supabase.ts` silent fallback to empty env vars
- **Where:** `lib/supabase.ts:42` — `createClient('', '')` succeeds and every call fails at runtime with confusing errors. Throw at module load if either is empty.

### 31. `storage.foldername(name)[3]` post-image read policy mismatch
- **Where:** `supabase/migrations/20260430000000_scope_post_images_to_group_members.sql:22`
- The read policy expects path `<user_id>/posts/<post_id>/...`, but the upload policy (initial schema) only checks the first segment. A post saved with a different layout becomes unreadable.
- Fix: enforce the `[2] = 'posts'` shape on insert too.

### 32. `delete-account` doesn't clean up storage
- **Where:** `supabase/functions/delete-account/index.ts`
- After auth deletion, files in `avatars/<uid>/` and `post-images/<uid>/` remain. They become orphans (RLS allowed select/delete only by `auth.uid()`, which no longer exists).

### 33. `package.json` start script uses `--tunnel`
- Slow for normal dev. Consider `expo start` and let users opt into tunnel.

### 34. `app.json` foreground notification handler not declared
- `expo-notifications` is wired in `app/_layout.tsx:14` for tap handling, but no foreground display config — notifications received while the app is open won't show banners.

### 35. Hardcoded `<not-found>` link color
- `app/+not-found.tsx:35` uses `#2e78b7`, a hardcoded blue clashing with the warm palette and not in `Colors`.

### 36. `Image` from `react-native` mixed with `AppImage`
- `app/group/[id].tsx:8,449,81` uses RN `Image`; inbox uses `AppImage`. Inconsistent caching/loading behavior.

### 37. `SnapColumn` `useEffect` exhaustive-deps disabled
- `components/snap-column.tsx:47` ignores `selectedIndex`. If it changes externally while `visible` stays true, the column won't scroll to match.

### 38. `signup.tsx` no resend-confirmation path
- `app/(auth)/signup.tsx:46` shows an info banner if no session is returned, but offers no way to resend the confirmation email.

---

## Top-priority fix list

The four items to land first:

1. **#1** — `group_members` auth bypass (RLS check on role + invite verification)
2. **#2** — Broken invite-code lookup (currently no one can join groups)
3. **#4** — `set search_path = public` on `is_group_member` / `is_group_moderator`
4. **#11** — Reset-password redirect kick-out

After that: **#5** and **#10** (cron / idempotency correctness), then the lib-layer fixes #6–#9.
