# Catch Up Column — Bug Audit

Regenerated **2026-06-27** from a fresh four-pass review (Supabase migrations + edge
functions, client data/auth layer, app screens + components, and docs) against the
current working tree. Findings are ordered by severity. File:line references are
clickable in editors that support them.

This audit **supersedes** the 2026-05-05 version. Since then all four original
"critical" items and the bulk of the high/medium list were fixed — see
[Resolved since the last audit](#resolved-since-the-last-audit) at the bottom. The
codebase is in good shape; what remains is mostly a deliberate trade-off, ops
config, and hygiene.

---

## Pre-launch pass — 2026-07-03

A launch-prep review (four parallel audits: edition front-page revamp, backend
security, client bugs, store readiness) plus fixes. **The two "pending deploy"
items below are now confirmed LIVE** — migration `20260627000000` shows as `remote`
in `supabase migration list`, and `compile-editions` is deployed at v13 (2026-06-27)
with the 20-minute tolerance. All four edge functions were verified byte-identical
to the repo via `supabase functions download`.

New this pass — **all fixed in the working tree**, see the dated resolved section:

- **HIGH — cross-group post injection** (`posts` UPDATE had no group-membership
  `WITH CHECK`). Fixed in migration `20260703000000_security_hardening.sql`.
- **MEDIUM — every user's email readable by any authenticated user** (`users`
  SELECT `using(true)`). Fixed via column-privilege revoke + client changes.
- **LOW/MED — `unsubscribe_token` readable by co-members.** Fixed via column revoke.
- **LOW — `prepare_account_deletion` callable directly by `authenticated`.** Revoked.
- **MEDIUM x2 — edition front-page byline & dateline clip** at long names / large
  font scales. Fixed with `flexShrink`/`numberOfLines`.

## Pending deploy (fixed in repo, not yet live)

- **Security hardening migration** — `supabase/migrations/20260703000000_security_hardening.sql`. **Apply with `npx supabase db push`.** Until applied, the HIGH cross-group post-injection hole is live. NOTE: this migration and the client changes in the same pass are coupled — deploy the app build and the migration together (the client stops reading `users.email` / embedding it; the migration revokes column access to it). Pushing the migration before the new build ships would break profile load on the *old* build's `select('*')`.

---

## Medium

### M1. Per-recipient email failures are never retried
- **Where:** `supabase/functions/_shared/edition-dispatch.ts:154`
- `mark_edition_emailed` is called after the send loop **regardless of `failed > 0`**, and the function never re-attempts the recipients that errored. A transient Resend 4xx/5xx for a subset of members means those members **permanently** miss that edition's email.
- This is a **deliberate trade-off** (the inline comment: "not retrying to avoid duplicate sends") — the edition still arrives in-app and via push. Flagged so it's a conscious decision, not an oversight.
- **Fix (if delivery guarantees matter):** track send state per recipient (e.g. a `edition_email_recipients` table) so a retry sweep can target only the ones that failed, instead of an all-or-nothing per-edition marker.

---

## Low

### L2. EMAIL_FROM defaults to the Resend sandbox sender
- **Where:** `supabase/functions/_shared/edition-dispatch.ts:22`
- Falls back to `'Catch Up Column <onboarding@resend.dev>'` when the env var is unset. Fine for dev; tanks deliverability in production.
- **Fix:** set `EMAIL_FROM` to a verified-domain sender before shipping. Already documented in the README deploy steps — this is an ops checklist item, not a code defect.

### L3. Auth init still proceeds if profile creation fails twice
- **Where:** `hooks/use-auth.ts:23`
- `ensureUserProfile` now throws (good) and the hook retries once (added 2026-06-27), but if **both** attempts fail it still `console.warn`s and clears loading, so a brand-new user whose profile row was never created lands on screens that join on `users.id`.
- Intentionally *not* an auto-sign-out (that would log out returning users on a flaky network — their profile already exists, so the failure is harmless). Residual risk is limited to genuinely-new users on a hard RLS/network failure.
- **Fix (if you want zero residual):** surface the error through the hook and show a retry/error screen in `app/_layout.tsx` instead of rendering the tab tree.

### L4. `fetchThisWeeksBylines` dedupes by author across all of the user's groups
- **Where:** `lib/posts.ts:46`
- Passed all of the user's group ids and dedupes by `author_id` globally, so someone who wrote in two of your groups this week collapses into a single byline carrying their **earliest** timestamp. Acceptable for the Home "this week" strip, but confirm it's intended — a per-group byline would read more accurately.

### L5. `createGroup` still passes `created_by` to the insert
- **Where:** `lib/groups.ts:174`
- A DB trigger derives the moderator from `created_by`. The dangerous footgun is closed — there's now an assertion that `created_by === auth.uid()` before insert — but the column is still passed redundantly.
- **Fix:** drop `created_by` from the insert payload and let the trigger own it.

---

## Minor / hygiene

### N1. `types/database.ts` is hand-written with `Relationships: []`
- **Where:** `types/database.ts`, forcing `as unknown as GroupRowWithMembers` casts in `lib/groups.ts:21`/`:148`.
- **Fix:** generate via `supabase gen types typescript` so joined selects type without casts. (Carried over from the previous audit as #29 — still open.)

### N2. Dead `emptyMail` icon token
- **Where:** `constants/icons.ts:45`
- `emptyMail: mci('email-outline')` is unreferenced after the Mail tab was removed.
- **Fix:** delete the token.

### N3. `SnapColumn` disables `react-hooks/exhaustive-deps`
- **Where:** `components/snap-column.tsx:50` — the effect omits `selectedIndex`, so an external change while `visible` stays true won't scroll to match. Latent only (the repo has no ESLint config wired, and current call sites don't hit the case).

### N4. Post sort uses `localeCompare` on ISO timestamps
- **Where:** `lib/editions.ts` (`fetchEditionWithPosts`)
- Correct for ISO-8601 (lexicographic == chronological) but fragile if the timestamp format ever changes. Prefer a numeric/`Date` compare. Cosmetic.

---

## Latent / defense-in-depth

### D1. Edition-number uniqueness leans on the advisory lock, not the constraint path
- **Where:** `supabase/migrations/20260525000000_manual_publish.sql:204`
- `max(edition_number)+1` under a per-group `pg_try_advisory_xact_lock` is race-safe for every current writer (all edition inserts go through the locked RPC). It is **not** safe against a hypothetical future direct-insert path that skips the lock. No such path exists today — noted so it isn't introduced unknowingly.

### D2. Auth: minimum password length 6, no email confirmation
- **Where:** `supabase/config.toml` (`minimum_password_length = 6`, `[auth.email] enable_confirmations = false`). NOTE: `config.toml` governs **local** dev only — production auth settings live in the Supabase **dashboard** (Authentication → Providers/Policies). Changing the file does not change prod.
- Weak passwords are accepted, and email ownership isn't verified before first sign-in (someone could sign up under another person's address). **Owner decision:** raise the minimum (8+) in the dashboard; weigh enabling email confirmation against the onboarding friction it adds for the older-adult audience (the app already has a resend-confirmation path if you enable it).

### D3. `users.display_name`/`avatar_url`/`bio` still enumerable by any authenticated user
- **Where:** `users` SELECT policy remains `using (true)` (only the `email` *column* was locked down this pass).
- Deliberately left open: bylines and member previews need display_name/avatar across groups, and scoping the row policy to co-members risks breaking the invite-preview and author-embed paths. Residual is limited to display-name/avatar/bio enumeration, not contact info. Revisit only if profile enumeration becomes a concern.

### D4. Do NOT revoke EXECUTE on `is_group_member` / `is_group_moderator` from `authenticated`
- A prior audit suggested this as a membership-oracle hardening. **It would break the app:** these SECURITY DEFINER helpers are called inside RLS `USING`/`WITH CHECK` expressions, which evaluate with the *querying* role's privileges — revoking EXECUTE from `authenticated` yields "permission denied for function" on every groups/posts/editions/members read. The oracle risk (a boolean membership check) is negligible; leave the default grant in place.

---

## Top-priority list

1. **Apply the 2026-07-03 security migration** (`npx supabase db push`) — closes the
   live HIGH cross-group post-injection hole. Ship it together with the app build
   that contains the coupled client changes (see Pending deploy note).
2. **Run `eas init`** — writes `owner` + `extra.eas.projectId` to app.json. Without
   it, production push notifications silently never register (a core feature). See
   `docs/STORE_LISTING.md` §11.
3. **Host the legal/support docs** (`docs/PRIVACY.md`, `SUPPORT.md`, `DATA_DELETION.md`)
   and enter the URLs in App Store Connect / Play Console — hard submission blockers.
4. **L2** — set a production `EMAIL_FROM` (verified Resend domain) before launch.
5. **M1** — decide whether weekly email needs per-recipient retry, or accept the trade-off.
6. **Auth config (dashboard, not code):** raise minimum password length (currently 6)
   and decide on email confirmation (currently off) — see D2/D3 below.

Everything else is low-risk cleanup that can ride along with normal work.

---

## Resolved since the last audit

For context — the following 2026-05-05 findings are confirmed fixed in the current
tree (verified file-by-file during this pass):

**Critical / high (all fixed):**
- Moderator self-promote auth bypass — `group_members` INSERT is now `with check (false)`; joins go through `join_group_by_invite_code` (role hard-coded to `contributor`).
- Broken invite-code lookup (`upper()` regression) — now case-insensitive `lower(...)` compare with an auth check; client only trims.
- `delete-account` orphaning last moderators + leaving storage — `prepare_account_deletion` handles handoff and purges avatars/post-images/group-covers.
- Missing `set search_path` on `is_group_member` / `is_group_moderator` — added.
- Public URL for the private `post-images` bucket — now `createSignedUrl`; storage paths hardened to `<uid>/posts/<postId>/...`; group covers moved to a dedicated `group-covers` bucket.
- Push: no retry cap / no per-user opt-out — `push_attempts` cap + claim leases + `push_subscribed` honored.
- `compile_due_editions` idempotency race — per-group advisory lock + re-check; email/push use claim/lease RPCs.
- Reset-password flow kicked back to inbox — root redirect now skips the reset-password screen.
- Auth init double-fire / race — single `onAuthStateChange`, mounted guard, per-user dedupe.
- Push token re-registered every event + missing `projectId` — memoised per user, `projectId` passed for EAS builds.
- Initial route timing — `initialRouteName` is `(auth)/login`.
- `editions` writes unblocked client-side — `revoke update, delete ... from authenticated`.
- `fetchEditionsForUser` relying solely on RLS — now filters `.in('group_id', ...)` explicitly.

**Medium / minor (all fixed):**
- `ensureUserProfile` swallowing errors — now throws (hook retries; see L3).
- `.single()` → `.maybeSingle()` on profile update; redundant `Authorization` header dropped from `functions.invoke`.
- Stale onboarding metadata — `refreshSession()` after `updateUser`.
- `posts` insert forcing `image_url: null` — now optional in the insert type.
- `supabase.ts` silent empty-env fallback — throws at module load.
- 14px body/caption text — `caption`/`label` raised to the 16px floor.
- `MediaTypeOptions` deprecation — all call sites use `mediaTypes: ['images']`. (Note: in the pinned `expo-image-picker@17.0.10` the old enum *warns*, it does not throw.)
- Bio never collected / no `display_name` cap — onboarding + profile collect bio with `BIO_MAX`, and `display_name` has `DISPLAY_NAME_MAX`.
- Group cover upload had no rollback — `removeGroupCover` on settings-save failure.
- `buildSections` recomputed every render — wrapped in `useMemo`.
- Hardcoded modal width 320 — now `maxWidth: 320` (won't overflow narrow screens).
- Hardcoded `#2e78b7` not-found link color — now `Colors.orange`.
- RN `Image` mixed with `AppImage` in group detail — now `AppImage` throughout.
- `signup` had no resend-confirmation path — `resendConfirmationEmail` + button added.
- Foreground notification handler — `setNotificationHandler` now shows banner + sound.
- `package.json start --tunnel` — now plain `expo start`, with a separate `start:tunnel`.

**Fixed during this 2026-06-27 pass (working tree):**
- Email/compile RPC `PUBLIC` execute leak (migration; pending `db push`).
- Cron miss-window — compile tolerance 15 → 20 min.
- `soonestPublish` time-of-day tie-break and `nextPublishForGroup` `NaN` guard.
- Sign-out now drops the device push token (`unregisterPushAsync`).
- `FiledStamp` re-animates on rapid saves and no longer latches when no group is selected.
- Upload helpers check `fetch(...).ok` before uploading.
- `use-auth` retries `ensureUserProfile` once (see L3 for the residual).

**Fixed during the 2026-07-03 pre-launch pass (working tree):**
- **HIGH: cross-group post injection** — `posts` UPDATE `WITH CHECK` now requires `is_group_member(group_id, auth.uid())` and `edition_id is null`; `USING` requires `edition_id is null` (drafts only). Compiler/publish RPCs are SECURITY DEFINER and bypass RLS, so they still set `edition_id`. (`20260703000000_security_hardening.sql`)
- **MEDIUM: all users' emails readable** — table `SELECT` on `users` revoked from `authenticated`; column `SELECT` re-granted on `(id, display_name, avatar_url, bio, created_at)` only. Client stopped reading/embedding `users.email` (`lib/auth.ts`, `lib/editions.ts`, `lib/groups.ts`).
- **LOW/MED: `unsubscribe_token` readable by co-members** — same column-grant treatment on `group_members` (every column except `unsubscribe_token`).
- **LOW: `prepare_account_deletion` callable by `authenticated`** — revoked; `service_role` only (deletion routes through the edge function).
- **MEDIUM: edition front-page byline clip** — `edition-lead.tsx` / `edition-secondary.tsx` bylines now `flex: 1` + `numberOfLines={2}`.
- **MEDIUM: masthead dateline clip at large font scales** — `mastheadDate` now `flexShrink: 1` + centered so it wraps instead of colliding with the folio rules.
- **LOW: initials broke on emoji names** — `getInitials` (`components/avatar.tsx`) spreads to code points.
- **Store readiness:** icons regenerated in the orange brand palette (illegible wordmark dropped, main icon flattened to RGB for App Store), monochrome Android notification icon added and wired in `app.json`, `primaryColor` corrected to `#FF7237`, splash made transparent on `paperWarm`; `eas.json` created; legal/support/data-deletion docs and store-listing metadata drafted under `docs/`.
- **Verified in sync:** all four deployed edge functions are byte-identical to the repo (`supabase functions download`); the `20260627000000` PUBLIC-execute migration is `remote` (live); `compile-editions` v13 carries the 20-min tolerance.
