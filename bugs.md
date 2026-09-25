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

## ~~Pending deploy~~ — cleared

The 2026-07-03 security-hardening migration is **live**. `docs/PRESUBMISSION_CHECKLIST.md`
Gate 2 records every local migration as having a `remote` counterpart (30 as of
2026-09-24), which includes `20260703000000_security_hardening.sql`. The
coupled client changes shipped in the same tree. Nothing is pending here.

---

## Audit pass — 2026-09-10

A full-repo audit ahead of App Store submission (dependencies, dead code,
client bugs, query cost, delivery). **Fixed in the working tree** — see
[Resolved in the 2026-09-10 pass](#resolved-in-the-2026-09-10-pass).

Two corrections to *this document*, which had drifted:

- **L5 is wrong — do not act on it.** It advises dropping `created_by` from
  `createGroup`'s insert "and letting the trigger own it." `groups.created_by`
  has **no DB default** (checked in `001_initial_schema.sql` and
  `20260426000001_fix_group_created_trigger.sql`), and `handle_new_group()`
  reads `new.created_by` to insert the moderator row. Dropping it would insert
  NULL and fail the `group_members.user_id` FK — every group creation would
  break. The column is *required*, not redundant, and RLS already constrains
  it (`with check (created_by = auth.uid())`). L5 is struck below.
- **The "Resolved" list references v1 tokens that no longer exist** — e.g.
  "Hardcoded `#2e78b7` not-found link color — now `Colors.orange`". There is no
  `Colors.orange`; the v1 orange/peach palette was deleted in the v2 reskin and
  `+not-found.tsx` uses `Colors.ink`. Likewise the icon set is no longer
  "brand-orange". Those entries describe a state two design systems ago — kept
  only as history, not as a description of the current tree.

---

## Late publish slots — 2026-09-25

### H1. A Group publishing at 23:40 or later never auto-publishes — FIXED in a migration, pending `db push`
- **Where:** `compile_due_editions`, last defined in
  `supabase/migrations/20260525000000_manual_publish.sql:141` (due check),
  `:144` (slot-scoped duplicate guard) and `:167` (the guard's re-check after
  the advisory lock).
- **Found by** the Group Zero readout-queries work (`scripts/group-zero/readout.sql`
  q0 reports it as "SLOT NEVER FIRES"). Confirmed on production 2026-09-24. It
  was never recorded here before.
- The due check compared times of day: `local_now::time >= publish_time and
  local_now::time < publish_time + tolerance`. `time + interval` wraps at
  midnight (`23:45 + 20 min = 00:05`), so at the cron's 20-minute tolerance no
  time of day satisfied both halves for any publish_time ≥ 23:40. The app's
  picker offers 11:45 PM. A Group on that slot only ever published by hand.
- The obvious fix has two traps. A 23:45 window runs to 00:05 on the *next*
  day, where the day-of-week check sees the wrong day. And the duplicate guard
  ("an edition on local_now's date, at or after publish_time") would not
  recognise the 23:45 edition at the 00:00 tick, so the Group would get two
  editions.
- **Fix:** `supabase/migrations/20260925212248_fix_late_publish_slot_wrap.sql`
  adds `due_publish_slot(...)`, which returns the matched slot as a local
  timestamp (today's or yesterday's) or null. `compile_due_editions` now uses
  it for the due check and both guard checks, so all three compare timestamps.
  For every slot before 23:40 the result is identical to the old logic; the PR
  has the production sweep that shows it. `publish_edition_now` has no slot
  logic and is unchanged.
- **Status: pending `supabase db push`** (the owner pushes). Until it's live,
  `scripts/group-zero/` keeps refusing slots ≥ 23:40 and the readout's q0
  warning stays true.
- DST behaviour is unchanged. A slot inside the spring-forward gap (e.g. 02:30
  America/New_York on 2026-03-08) doesn't publish that week. A slot inside the
  fall-back repeat publishes once.

---

## Medium

### M1. Per-recipient email failures are never retried
- **Where:** `supabase/functions/_shared/edition-dispatch.ts:154`
- `mark_edition_emailed` is called after the send loop **regardless of `failed > 0`**, and the function never re-attempts the recipients that errored. A transient Resend 4xx/5xx for a subset of members means those members **permanently** miss that edition's email.
- This is a **deliberate trade-off** (the inline comment: "not retrying to avoid duplicate sends") — the edition still arrives in-app and via push. Flagged so it's a conscious decision, not an oversight.
- **Fix (if delivery guarantees matter):** track send state per recipient (e.g. a `edition_email_recipients` table) so a retry sweep can target only the ones that failed, instead of an all-or-nothing per-edition marker.

---

## Low

### ~~L2. EMAIL_FROM defaults to the Resend sandbox sender~~ — RESOLVED 2026-09-22
- **Where:** `supabase/functions/_shared/edition-dispatch.ts:22`
- Falls back to `'Catch Up Column <onboarding@resend.dev>'` when the env var is unset. Fine for dev; tanks deliverability in production.
- **Production was never on the fallback.** Verified 2026-09-22 by comparing the `secrets list` digest (the SHA-256 of the value) against the expected string: `EMAIL_FROM` is exactly `Catch Up Column <hello@catchupcolumn.com>`, and has been since 2026-07-17. The fallback stays in code for dev. Whether Resend has the domain `verified` is a separate check, still open in `docs/LAUNCH.md` step 4.

### L3. Auth init still proceeds if profile creation fails twice
- **Where:** `hooks/use-auth.ts:23`
- `ensureUserProfile` now throws (good) and the hook retries once (added 2026-06-27), but if **both** attempts fail it still `console.warn`s and clears loading, so a brand-new user whose profile row was never created lands on screens that join on `users.id`.
- Intentionally *not* an auto-sign-out (that would log out returning users on a flaky network — their profile already exists, so the failure is harmless). Residual risk is limited to genuinely-new users on a hard RLS/network failure.
- **Fix (if you want zero residual):** surface the error through the hook and show a retry/error screen in `app/_layout.tsx` instead of rendering the tab tree.

### L4. `fetchThisWeeksBylines` dedupes by author across all of the user's groups
- **Where:** `lib/posts.ts:46`
- Passed all of the user's group ids and dedupes by `author_id` globally, so someone who wrote in two of your groups this week collapses into a single byline carrying their **earliest** timestamp. Acceptable for the Home "this week" strip, but confirm it's intended — a per-group byline would read more accurately.

### ~~L5. `createGroup` still passes `created_by` to the insert~~ — WITHDRAWN 2026-09-10
- **Where:** `lib/groups.ts` (`createGroup`)
- This finding was **incorrect**. `groups.created_by` has no DB default, and
  `handle_new_group()` reads `new.created_by` to create the moderator row —
  so omitting it inserts NULL and breaks group creation with an FK error.
  Passing it is required. The pre-insert `created_by === auth.uid()` assertion
  plus the RLS `with check` are the correct belt-and-braces. **No change.**

---

## Minor / hygiene

### N1. `types/database.ts` is hand-written with `Relationships: []`
- **Where:** `types/database.ts`, forcing `as unknown as GroupRowWithMembers` casts in `lib/groups.ts:21`/`:148`.
- **Fix:** generate via `supabase gen types typescript` so joined selects type without casts. (Carried over from the previous audit as #29 — still open.)

### ~~N2. Dead `emptyMail` icon token~~ — FIXED 2026-09-10
- **Where:** `constants/icons.ts`
- It was worse than one token: **ten** of the registry's entries were
  unreferenced (`emptyMail`, `chevronRight`, `chevronLeft`, `emptyInbox`,
  `emptyProfile`, `qr`, and the four `tab*` glyphs that `custom-tab-bar`'s own
  `TAB_META` had superseded). All ten deleted, and the file's stale
  "After Phase 5 …" header rewritten.

### N3. `SnapColumn` disables `react-hooks/exhaustive-deps`
- **Where:** `components/snap-column.tsx:50` — the effect omits `selectedIndex`, so an external change while `visible` stays true won't scroll to match. Still latent (current call sites don't hit the case), but as of 2026-09-10 **ESLint is wired** (`npm run lint`), so this and the four other `eslint-disable` comments now suppress a rule that actually runs — they're real decisions, not decoration. `npm run lint` is at 0 errors; 39 warnings remain and are documented as expected in the `verify-changes` skill.

### ~~N4. Post sort uses `localeCompare` on ISO timestamps~~ — FIXED 2026-09-10
- **Where:** `lib/editions.ts` (`fetchEditionWithPosts`) and `app/(tabs)/inbox.tsx` (`buildSections`, which had the same pattern on `published_at`)
- Both now compare `new Date(x).getTime()`.

---

## Latent / defense-in-depth

### D1. Edition-number uniqueness leans on the advisory lock, not the constraint path
- **Where:** `supabase/migrations/20260525000000_manual_publish.sql:204`
- `max(edition_number)+1` under a per-group `pg_try_advisory_xact_lock` is race-safe for every current writer (all edition inserts go through the locked RPC). It is **not** safe against a hypothetical future direct-insert path that skips the lock. No such path exists today — noted so it isn't introduced unknowingly.

### ~~D2. Auth: minimum password length 6, no email confirmation~~ — LARGELY CLOSED 2026-09-16

Email sign-in codes landed and are now the default for both sign-in and sign-up,
so there is no password-signup path left to create an unverified account: the
code *is* proof of address. `enable_confirmations` can stay off deliberately
rather than undecided. The password-length setting still applies to accounts
created before the change; raising it in the dashboard remains worthwhile but no
longer gates anything. *(2026-09-24: `docs/LAUNCH.md` step 5 records it as
already raised on 2026-08-22 — the two disagree; confirm in the dashboard.)*
Original note follows.

### D2 (original). Auth: minimum password length 6, no email confirmation
- **Where:** `supabase/config.toml` (`minimum_password_length = 6`, `[auth.email] enable_confirmations = false`). NOTE: `config.toml` governs **local** dev only — production auth settings live in the Supabase **dashboard** (Authentication → Providers/Policies). Changing the file does not change prod.
- Weak passwords are accepted, and email ownership isn't verified before first sign-in (someone could sign up under another person's address). **Owner decision:** raise the minimum (8+) in the dashboard; weigh enabling email confirmation against the onboarding friction it adds for the older-adult audience (the app already has a resend-confirmation path if you enable it).

### D3. `users.display_name`/`avatar_url`/`bio` still enumerable by any authenticated user
- **Where:** `users` SELECT policy remains `using (true)` (only the `email` *column* was locked down this pass).
- Deliberately left open: bylines and member previews need display_name/avatar across groups, and scoping the row policy to co-members risks breaking the invite-preview and author-embed paths. Residual is limited to display-name/avatar/bio enumeration, not contact info. Revisit only if profile enumeration becomes a concern.

### D4. Do NOT revoke EXECUTE on `is_group_member` / `is_group_moderator` from `authenticated`
- A prior audit suggested this as a membership-oracle hardening. **It would break the app:** these SECURITY DEFINER helpers are called inside RLS `USING`/`WITH CHECK` expressions, which evaluate with the *querying* role's privileges — revoking EXECUTE from `authenticated` yields "permission denied for function" on every groups/posts/editions/members read. The oracle risk (a boolean membership check) is negligible; leave the default grant in place.

---

## Top-priority list

Rewritten 2026-09-10. Items 1–3 of the old list are **done**: the security
migration is live (Gate 2), `eas init` has run (`app.json` carries `owner` and
`extra.eas.projectId`), and the legal/support pages return 200 (Gate 4).
`docs/PRESUBMISSION_CHECKLIST.md` is the authoritative submission-day list —
this is only the code-side residue.

**Resolved 2026-09-24: production wasn't running `main`.** `compile-editions`
and `publish-edition-now` had sat on a 2026-07-11 build — the v1 edition email,
no dead-push-token pruning — because merging deploys nothing to Supabase. Both
redeployed and verified matching `main` the same day. The lesson stands: a fix
to `_shared/` in this file isn't shipped until it's deployed. `docs/LAUNCH.md` →
Deploying edge functions.

1. **Build on SDK 57 and smoke-test on a device.** The 2026-09-10 upgrade
   (54 → 57) is typechecked and `expo-doctor`-clean but has never been built.
   Highest-risk spots: the splash screen (moved to the `expo-splash-screen`
   plugin with `enableFullScreenImage_legacy`), the tab bar (now
   `expo-router/js-tabs`), and Reanimated 4.5 animations. **Due before
   submission is too late:** the first build is the Group Zero TestFlight
   build, which editions 3–4 need (POSITIONING §6).
   **Partly done 2026-09-24:** an EAS `preview` build (simulator) built clean
   on Xcode 26.6 — the splash hides, Lora/Jost load, the sign-in screen
   renders, launch logs are clean. The tab bar and Reanimated are behind
   sign-in and still unchecked, and nothing has run on a phone. One upstream
   warning at launch, not ours to fix yet: *"`UIScene` lifecycle will soon be
   required."* A local build on Xcode 26.3 fails to compile `expo-modules-jsi`
   — SDK 57 needs Xcode ≥ 26.4 (LAUNCH step 8).
2. ~~**L2** — set a production `EMAIL_FROM` (verified Resend domain) before
   launch.~~ **Done** — verified 2026-09-22; it had been set since 2026-07-17.
3. **M1** — decide whether weekly email needs per-recipient retry, or accept the
   trade-off.
4. **Auth config (dashboard, not code):** email confirmation is decided (stays
   off — the code flow is proof of address, D2). Minimum password length is
   **disputed**: `docs/LAUNCH.md` step 5 records it raised 2026-08-22, D2 below
   believed it was still 6. Read it in the dashboard and fix the loser.
5. **Universal links are declared nowhere — and as of 2026-09-22 this is
   actionable.** `app.json` has no
   `associatedDomains` (iOS) or `intentFilters` (Android), and the AASA file
   still contains a literal `TEAMID` while `assetlinks.json` still contains
   `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT`. Every edition email's
   primary CTA is an `https://www.catchupcolumn.com/edition/<id>` link, so
   today it lands in the browser and never hands off to the app. Tracked in
   Gate 4 as optional; it is the difference between the email working and the
   email half-working.
   **The blocker is gone:** the Apple enrollment landed 2026-09-22, so the Team
   ID exists. The iOS half can ship alone — `assetlinks.json` still needs a
   signed Android build, but the two files are independent and Android is
   deferred. This moved from "waiting on Apple" to "waiting on someone pasting
   a string."
   **The server half is fixed:** the `WEB_BASE_URL` secret pointed at the apex,
   which 308s to `www` and which universal links can't claim, so the Team ID
   alone would not have been enough. Set to `www` 2026-09-22.
   **The iOS client half landed 2026-09-24:** AASA appID
   `6RDS3S724Z.com.catchupcolumn.app`, `ios.associatedDomains` declared. It is
   an entitlement, so it reaches phones only with the first native build; close
   this item once a TestFlight build opens an edition-email link in the app.
   Android (`assetlinks.json`, `intentFilters`) is still open and deferred.

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

---

## Resolved in the 2026-09-10 pass

Found and fixed in this pass (all typechecked; `npm run lint` at 0 errors;
`deno check` clean). **None of these are verified on a device** — see the
session summary for what still needs a real build.

**Bugs**

- **The Editions list showed an empty grey box instead of every lead photo.**
  `inbox.tsx` passed the raw `posts.image_url` — a *storage path* in a private
  bucket — straight to `<AppImage>`, which can't render it. Every other photo
  surface goes through `EditorialPhoto`/`usePostImageUrl`, which sign first.
  Extracted `components/edition-row.tsx`, which signs its own thumbnail (and is
  memoised, so a list re-render no longer re-signs every row).
- **`getInitials` existed three times and had drifted.** `components/avatar.tsx`
  had the emoji fix (spread to code points); `avatar-picker.tsx` and
  `profile.tsx` still used `part[0]`, so a name starting with an emoji or other
  astral character rendered a broken surrogate half. One copy now, in
  `lib/names.ts`, with a `fallback` argument for the 'CU' placeholder case.
- **The composer could file two posts for one edition.** Autosave debounces at
  1200ms; tapping **Save** inside that window ran while the autosave's `create`
  was still in flight, and `handleSave` read the `existingPost` *state* (still
  null) rather than `existingPostRef`. Both inserted. `handleSave` now waits out
  an in-flight save, claims the save slot, and reads the ref.
- **Dead Expo push tokens were never pruned.** `DeviceNotRegistered` tickets
  (uninstall, revoked permission, reissued token) were counted as ordinary
  failures, so one dead device burned all three of an edition's push attempts
  every week and its row sat in `push_tokens` forever. `pushEdition` now deletes
  those tokens and excludes them from the retry budget — permanent failures
  aren't retriable. Expo requires this.
- **Sign-out left session state behind.** It ran inline in `profile.tsx` against
  `supabase` directly (against the `data-layer` rule that all access goes
  through `lib/`). Now `lib/auth.ts` owns `signOut(userId)`, which drops the
  push token *and* the cached signed URLs before ending the session, and
  `deleteAccount` routes through it.

**Performance**

- **Home ran the app's heaviest query in full to show one edition.**
  `fetchEditionsForUser` was unbounded and embeds every post's whole `body` (the
  lead picker ranks by length), and Home and the Editions tab each ran it
  independently on every focus. It now takes a `limit` (default 60, documented
  as needing pagination before it's raised) and Home passes `{ limit: 1 }`.
- **Signed photo URLs were re-fetched on every mount.** An edition front page
  signed the lead, the secondary and each brief separately, then signed them all
  again on the way back from a story. Now cached per storage path for the
  session in `lib/posts.ts`, expiring a minute before the signature does.

**Bloat**

- `components/illustrations/sketch-border.tsx` — never imported. Deleted.
- Ten unreferenced `constants/icons.ts` tokens. Deleted (see N2).
- `assets/fonts/SpaceMono-Regular.ttf` — Expo-template leftover, referenced
  nowhere. Deleted.
- `react-test-renderer` devDependency — no test runner exists, and it was
  pinned to a React version no longer installed. Removed.
- `formatWeekOf` was duplicated verbatim in `inbox.tsx` and
  `edition/[id]/index.tsx`. Moved to `lib/edition-layout.ts`.
- A `mimeType` field was threaded through three screens and two `lib`
  signatures and **never read** — every upload force-converts to JPEG in
  `resizeImageForUpload`. Removed, which collapsed three single-field wrapper
  types to plain `string | null`.
- `app/group/create.tsx` rendered its cover with RN's `Image` instead of
  `AppImage` (the same inconsistency that was fixed in group detail earlier).
- `package.json` was still named `catchupcolumn-init`.
- **`app/group/create.tsx` imported the `@expo/vector-icons` barrel**
  (`import { Ionicons } from '@expo/vector-icons'`) where every other file uses
  the direct subpath. The barrel re-exports ~20 icon families and each pulls
  its `.ttf` in as an asset, so one line was shipping 17 unused fonts. Switched
  to `@expo/vector-icons/Ionicons`: measured **6.3MB → 4.1MB** of bundled
  assets (20 font files → the 3 the app actually uses).

**Currency / tooling**

- **Expo SDK 54 → 57** (RN 0.81.5 → 0.86.3, React 19.1 → 19.2.3, TS 5.9 → 6.0).
  `npm audit` went 36 → 20 findings and 15 high → 2; the remainder are
  build-toolchain transitives, not shipped code. Two migrations were required:
  `Tabs`/`BottomTabBarProps` now come from `expo-router/js-tabs` (the plain
  `expo-router` export is deprecated), and `app.json` dropped `newArchEnabled`
  and `edgeToEdgeEnabled` (both mandatory now) with `splash` moved into the
  `expo-splash-screen` plugin. `expo-doctor` is 21/21.
- **ESLint is wired** — `eslint-config-expo` flat config, `npm run lint`.
