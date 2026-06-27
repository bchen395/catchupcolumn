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

## Pending deploy (fixed in repo, not yet live)

These are fixed in the working tree but only take effect once shipped:

- **PUBLIC-execute lockdown migration** — `supabase/migrations/20260627000000_revoke_public_execute_on_service_rpcs.sql`. Closes a PII leak where `get_edition_email_payload` (and the other email/compile RPCs) were callable by `anon`/`authenticated` via the default Postgres `PUBLIC` grant. **Apply with `npx supabase db push`.**
- **Compile tolerance 15 → 20 min** — `supabase/functions/compile-editions/index.ts:39`. Stops a late/cold-start cron tick from missing a group's publish window. **Ships on next `npx supabase functions deploy compile-editions`.**

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

---

## Top-priority list

1. **Apply the security migration** (`db push`) and **redeploy `compile-editions`** — the two "pending deploy" fixes above. Until applied, the email/recipient-data leak is live.
2. **M1** — decide whether weekly email needs per-recipient retry, or accept the documented trade-off.
3. **L2** — set a production `EMAIL_FROM` before launch.

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
