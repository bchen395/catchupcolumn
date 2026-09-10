# Launch Runbook — Catch Up Column

Everything left to take Catch Up Column from "code-complete" to "live in the App
Store," in order. Steps marked **[owner]** need your accounts/logins and can't be
automated from the repo.

**Scope decision (2026-08-22): iOS first, Android later.** Every step below is
iOS-only unless it says otherwise. Play Console, the FCM service account, and
`assetlinks.json` are out of scope for this launch — see
[Android — deferred](#android--deferred) at the bottom for what's already in place
and what it will need when you pick it back up.

Companion docs:

- **[PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md)** — the flat, tickable
  list to work through on submission day. This doc is the narrative (what happened and
  why); that one is the procedure.
- **[STORE_LISTING.md](./STORE_LISTING.md)** — metadata, descriptions, and the exact
  privacy/data-safety questionnaire answers.

Project ref: `wvaxfyhihcfilewygtzp` · Bundle ID: `com.catchupcolumn.app`

**Plan (as of 2026-08-22):** the backend, legal hosting, the UI redesign, the EAS env
vars, and **UGC moderation (step 9, shipped 2026-08-05)** are all done — the last of
those was the likeliest App Review rejection, and it's closed.

The active product work is now the **illustration rework (step 6b)**. Because
screenshots freeze the final look, and because the Apple Developer enrollment only
starts being useful once there's art worth building against, those are **deliberately
deferred**:

- ⏸ **Store screenshots (step 7)** — deferred until the illustrations land.
- ⏸ **Apple Developer Program enrollment + push credentials (steps 3, 7)** — deferred
  by choice. Nothing else is blocked on them; see step 3.

So the order from here is: **illustrations (6b) → enroll + first build (7, 8) →
screenshots → submit.**

Cleared on 2026-08-22, both needing no Apple account: the **Vercel redeploy** (step 2
— edition permalinks now 200 where they previously 404'd, so edition emails' primary
CTA works) and the **Supabase Auth dashboard settings** (step 5).

Still open and independent of Apple:

1. **Resend** (step 4) — DNS is correctly provisioned; confirm Resend flipped the
   domain to `verified`, re-set `EMAIL_FROM`, and add the missing DMARC record.
2. **Confirm the `compile-editions` cron is firing** — see
   [Verifying the compile-editions cron](#verifying-the-compile-editions-cron). If it
   isn't, weekly compilation silently never runs and the core feature is dead.

---

## ✅ Already done

**2026-07-03 pre-launch pass**

- **Security migration `20260703000000` applied to production** (`supabase db push`)
  — confirmed live via `supabase migration list`. Closes the cross-group
  post-injection hole, the email leak, and the unsubscribe-token leak.
- **All 4 edge functions verified byte-identical to the repo** — no redeploy needed.
- **Client code** updated to match the new DB grants (stops reading `users.email`).
- **Icons** regenerated in the brand palette + Android notification icon; `app.json`
  colors fixed; iPad support dropped; `eas.json` created.
- **Legal/support docs** written under `docs/`; Profile screen links to them.
- **Pre-launch PR merged** (`launch-prep-security-store`, #8) — the committed app
  code now matches the already-applied database changes, so the app runs from `main`
  (the earlier "run from the branch" caveat no longer applies).

**2026-07-17 web & legal-hosting pass** — branch `web-legal-pages-and-vercel` (PR pending, step 1)

- **Legal/support pages built as styled static HTML** in `web/` (`privacy.html`,
  `terms.html`, `support.html`, `delete-account.html`) — resolves the in-app and
  App Store Connect / Play Console URLs that previously 404'd.
- **Doc placeholders filled:** support email `support@catchupcolumn.com`; Terms
  governed by California, USA.
- **Deployment switched to Vercel:** `web/vercel.json` holds all routing (clean URLs,
  `/start` redirect, `/edition/*` rewrite, AASA content-type header); the
  Cloudflare-only `_redirects` file was removed.
- **Universal/app-link files added** under `web/.well-known/` (AASA + `assetlinks.json`),
  scoped to `/edition/*`. Apple Team ID and Android SHA-256 are placeholders — harmless
  until a build declares the domain (see step 2).
- **BRAND.md** records the accepted decision to keep bright orange as text (knowingly
  below WCAG AA) — revisit in the redesign (step 6). *(Resolved in the 2026-07-18
  redesign; see below.)*

**2026-07-18 redesign & merge pass**

- **Web & legal-hosting PR merged** (`web-legal-pages-and-vercel`, #9) — step 1 done;
  the legal/support pages, Vercel config, and `.well-known` files are on `main`.
- **EAS project linked** (`eas init`) — `owner` (`bchen395`) + `extra.eas.projectId`
  are committed to `app.json`. The *rest* of step 3 (env vars + push credentials) is
  still open — see step 3.
- **Full UI redesign landed (step 6)** — the v2 editorial system reached every screen.
  This closed the orange-as-text contrast question: body/UI text is now all
  ink/inkSoft (AA everywhere) and vermilion is confined to bold small-caps
  kicker/stamp roles (BRAND.md §2). Store screenshots (step 7) are now unblocked.

**2026-08-04 verification pass** — everything below was checked against production,
not assumed. Where this doc previously disagreed with reality, reality won.

*Verified green:*

- **All 27 migrations are applied to prod** (`supabase migration list --linked`),
  including `20260710000000` (invite-preview RPCs) and `20260711000000` (email
  payload images).
- **All 4 edge functions are deployed and current** (`supabase functions list`).
  Careful: `delete-account` reports `updated_at` 2026-05-05, *earlier* than its last
  code change (2026-05-06) — that timestamp is a red herring. Downloading the live
  source confirms it contains the `prepare_account_deletion` call, so account
  deletion works. Don't "fix" this based on the timestamp alone.
- **EAS production env vars are set** — `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` both present (`eas env:list production`). This doc
  previously listed them as open.
- **Function secrets all set:** `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`
  (updated 2026-07-17, so no longer the sandbox default), `WEB_BASE_URL`.
- **Site is live on Vercel** — `/privacy`, `/terms`, `/support`, `/delete-account`
  all 200. The apex 308-redirects to `www`, so **`www` is canonical.**
- `npm run typecheck` clean · `expo-doctor` 18/18 · `deno check` clean on the shared
  dispatch module.

*Fixed in this pass:*

- **Edition permalinks were 404ing in production.** `web/vercel.json` rewrote
  `/edition/:path*` → `/edition/index.html`, but with `cleanUrls: true` that `.html`
  route 308s, and a rewrite landing on a redirect resolves to a 404. Every edition
  email's primary CTA was dead. Destination is now the clean `/edition` path.
  **Needs a Vercel redeploy to take effect** — re-verify with the curl in
  `web/README.md`.
- **Dropped the bogus `RECORD_AUDIO` Android permission** from `app.json` — the app
  has no audio code anywhere; it was scaffolding that would have forced a microphone
  disclosure in Play data safety.
- **Canonicalized on `www`** — `Strings.legal.*` and the `WEB_BASE_URL` fallback in
  `edition-dispatch.ts` no longer pay a redirect hop. `web/README.md`'s universal-links
  snippet now uses `www` too; the old snippet claimed the apex, which **cannot work**
  because Apple and Google don't follow redirects when fetching
  `.well-known/` files.
- **Expo patch versions aligned** (`expo install --fix`) — 6 packages were behind;
  `expo-doctor` now passes 18/18. This also added the now-required `expo-web-browser`
  config plugin to `app.json`.

---

## 1. Merge the web & legal-hosting PR — ✅ done (2026-07-18, PR #9)

Landed the legal/support pages, the Vercel config, and the `.well-known` files on
`main`. (Universal-links placeholders in `.well-known/` remain — see step 2.)

## 2. Site on Vercel + domain — ✅ done (edition permalinks verified 2026-08-22)

The site is what `WEB_BASE_URL` and every email/edition link resolve to. It is live:
`/privacy`, `/terms`, `/support`, `/delete-account` all return 200, and the
`.well-known/` files serve with `content-type: application/json`.

**`www` is canonical** — the apex 308-redirects to it. All in-app and email links now
target `www` directly.

✅ **Redeployed 2026-08-22 to pick up the `/edition/*` rewrite fix** — the permalink
now returns 200 where it previously 404'd, so every edition email's primary CTA works.
Re-run this after any `web/vercel.json` change; it is the easiest thing in the project
to regress silently:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://www.catchupcolumn.com/edition/00000000-0000-0000-0000-000000000000
# → 200. A 404 means the rewrite is broken and every edition email's CTA is dead.
```

☐ **Confirm the `WEB_BASE_URL` secret points at `www`** (the value is hashed in
`secrets list`, so it can't be read back):

```bash
npx supabase secrets set WEB_BASE_URL='https://www.catchupcolumn.com'
```

**Universal links** stay dormant until you (a) replace `TEAMID` in
`web/.well-known/apple-app-site-association` with your Apple Team ID and the Android
SHA-256 in `assetlinks.json`, and (b) add `associatedDomains`/`intentFilters` to
`app.json` (snippet in `web/README.md`). **Declare `www.catchupcolumn.com`, not the
apex** — Apple and Google don't follow the 308.

## 3. EAS project setup **[owner]** — ✅ done for now (credentials deferred)

- ✅ **`eas init` done** — `owner` (`bchen395`) + `extra.eas.projectId`
  (`c9be4074-4916-4e94-9276-811bbe8a05dc`) are committed to `app.json`.
- ✅ **Supabase env vars on EAS** — verified present in the `production` environment
  (2026-08-04). This was the part that would break the app at launch, and it's done.
- ⏸ **Push credentials — deferred with the Apple enrollment.** The iOS APNs key can
  only be created from an Apple Developer account, so this is blocked on step 7 by
  choice, not by oversight. EAS creates it interactively during the first
  `eas build`, so there is nothing to do ahead of time:

  ```bash
  npx eas-cli credentials    # iOS: add an APNs key (needs Apple enrollment)
  ```

  **Consequence while deferred:** production push notifications won't register. Email
  delivery is unaffected, so editions still reach people. Push is the only casualty.

**Nothing else in step 3 is outstanding** — with the env vars set and the project
linked, an unsigned iOS *simulator* build already works today if you want to smoke-test
the binary before enrolling (see step 6b).

## 4. Email deliverability — Resend **[owner]** — DNS verified, three checks left

**DNS is correctly provisioned** (checked 2026-08-22). The records match Resend's
standard layout for the **root** domain `catchupcolumn.com`:

| Record | Value | Purpose |
| --- | --- | --- |
| `resend._domainkey.catchupcolumn.com` TXT | DKIM public key | message signing |
| `send.catchupcolumn.com` TXT | `v=spf1 include:amazonses.com ~all` | SPF on the envelope domain |
| `send.catchupcolumn.com` MX | `feedback-smtp.us-east-1.amazonses.com` | bounce handling |

> **The missing SPF record on the root is correct, not a bug.** SPF is evaluated
> against the envelope sender (`send.catchupcolumn.com`), which has it. Don't "fix"
> this by adding an SPF record to the apex. Because DKIM sits on the root, `EMAIL_FROM`
> must use the root domain (`@catchupcolumn.com`), not `@send.catchupcolumn.com`.

☐ **Add a DMARC record.** There is none at `_dmarc.catchupcolumn.com`. Resend doesn't
require it to verify, but Gmail's and Yahoo's bulk-sender rules lean on it, and this
app mails newsletters to family inboxes. `p=none` is monitor-only and cannot break
delivery:

```
_dmarc.catchupcolumn.com  TXT  "v=DMARC1; p=none; rua=mailto:support@catchupcolumn.com"
```

☐ **Confirm Resend flipped the domain to `verified`.** Correct DNS is not the same as
Resend having confirmed it:

```bash
curl -s https://api.resend.com/domains -H "Authorization: Bearer $RESEND_API_KEY"
# look for "status": "verified" on catchupcolumn.com
```

☐ **Re-set `EMAIL_FROM`.** The secret is hashed and can't be read back, and if it is
unset, `_shared/edition-dispatch.ts` silently falls back to `onboarding@resend.dev`:

```bash
npx supabase secrets set EMAIL_FROM='Catch Up Column <hello@catchupcolumn.com>'
```

(No function redeploy needed — secrets are read at runtime.)

## 5. Supabase Auth dashboard settings **[owner]** — ✅ done (2026-08-22)

These are **not** in `config.toml` (that governs local dev only) — they were set in the
Supabase dashboard → Authentication. `config.toml` still shows the old local-dev values
(`minimum_password_length = 6`, `enable_confirmations = false`); that is expected and
is not a signal about production.

- ✅ **Redirect URLs:** `catchupcolumn://` and `catchupcolumn://(auth)/reset-password`
  allowlisted, so password-reset deep links work in release builds.
- ✅ **Minimum password length** raised from 6.
- ✅ **Email confirmation** decision made.

Re-confirm the redirect allowlist after the first release build — it is the one
setting whose breakage only shows up on a signed binary.

## 6. Redesign the UI — ✅ done (2026-07-18)

The v2 editorial system ("NYT structure, HeyTea charm") reached every screen. The
orange-as-text contrast question is resolved: body/UI text is all ink/inkSoft (AA
everywhere) and vermilion is confined to bold small-caps kicker/stamp roles
(BRAND.md §2). Store screenshots (step 7) are now unblocked.

If you revisit the UI further, run the `verify-changes` checklist first — `npm run
typecheck` plus manual QA of every screen (auth, onboarding, group create/join,
composer, editions list, edition reader, profile) at large system font sizes.

## 6b. Illustration rework — ⚠️ the active product gate

Reworking the hand-drawn illustration world (the paperboy and his dog). This is the
**last planned product change before launch**, and it's why steps 7–8 are deferred:
screenshots and the store build both freeze the final look.

**What exists today** — 8 components in `components/illustrations/`:
`paperboy-mark`, `paperboy-mailbox-scene`, `dog-with-paper-scene`,
`sleeping-dog-doodle`, `printing-press-scene`, `mug-doodle`, `rolled-paper-glyph`,
`invite-ticket`. All 8 are wired: the inbox empty state, the groups and post
screens, the profile footer, the group welcome screen, and the loading screen
(`printing-press-loading.tsx`, `ride` / `press` variants). (A 9th,
`sketch-border`, was listed here but had never been imported by any screen;
deleted 2026-09-10 — see BRAND §11.)

**Scope: to be defined.** Nail down which illustrations change before starting so it
doesn't sprawl — this is chrome, not a re-architecture.

**Constraints from `design/BRAND.md` (§3, §4, §12, §13) — don't break these:**

- Illustrations live in **app chrome only, never inside editions**.
- Monoline strokes draw in `illustrationInk` (true `#000`), not text `ink`.
- Hand-lettering is for **static words baked into art only** — never dynamic text
  (that's why invite codes are live vermilion `Jost`, not lettering).
- **Reduce Motion:** every animated illustration must park in a static pose (the
  spinning wheels, the press flywheel, the welcome-screen dog leap). Verify this — no
  automated check enforces it.
- **Splash/icon lockstep:** `assets/images/icon.png` and `splash-icon.png` are
  generated from the same rider geometry as `paperboy-mark.tsx`. If the mark changes,
  **regenerate both** — nothing enforces this either, and a mismatched icon is very
  visible.

**When done:**

- Run the `verify-changes` checklist (typecheck + manual QA at large font sizes).
- Update `design/BRAND.md` in the same change as any decision that shifts — it's the
  source of truth.
- Optionally smoke-test on a simulator build without needing an Apple account
  (`eas.json`'s `preview` profile is already `ios: { simulator: true }`):

  ```bash
  npx eas-cli build --platform ios --profile preview
  ```

  This exercises font loading and the splash on a real binary. It won't test push or
  universal links — those need the signed production build.
- **Then** unblock steps 7 and 8.

## 7. Store account, assets, and metadata **[owner]** — ⏸ deferred until 6b lands

iOS only. Deferred by choice until the illustration rework is done, since screenshots
freeze the final look.

- ⏸ Enroll in the **Apple Developer Program** ($99/yr). Confirm the bundle ID
  `com.catchupcolumn.app` is final — it's **immutable after first submission**. This
  is also where you get the **Apple Team ID** that step 2's universal links need, and
  what unblocks the APNs key in step 3.
- ⏸ Create the app record in App Store Connect.
- ⏸ **Screenshots — capture after 6b:** iPhone 6.9" required (Home, an edition front
  page, the composer, a group). No iPad shots needed (iPad support is off).
  > `/screenshots` in the repo holds design-reference images only (and is untracked as
  > of `bce0de3`) — no store shots exist yet.
- ⏸ Paste the descriptions, keywords, and the privacy answers from
  [STORE_LISTING.md](./STORE_LISTING.md). Enter the `www` URLs from step 2.
- ⏸ Age rating questionnaire — **flag user-generated content** (the app has it, and
  step 9's affordances are what make that answer safe).

*Play Console enrollment and Android shots move to [Android — deferred](#android--deferred).*

## 8. Build & submit **[owner]** — ⏸ deferred; also the *first ever* release build

`eas build:list` is empty. Nothing in this app has run outside Expo Go, so the first
build is also the first test of font loading, splash-hide, push registration, deep
links, and the notification icon on a signed binary. Budget time for it to not work
first try.

iOS only, and deferred until 6b lands and you've enrolled (step 7).

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

This is where EAS prompts for the **APNs key** (step 3's deferred item), so have the
Apple account ready.

Before submitting, install the build and confirm on-device: fonts load, the splash
hides, a push token registers, `catchupcolumn://` deep links open, and the photo
picker prompts with the expected permission copy.

Then complete the App Store Connect review forms (age rating / privacy — **flag
user-generated content**) and submit for review.

## 9. UGC moderation — ✅ done (2026-08-05, PR #14)

Apple Guideline 1.2 expects three things from an app where users publish content
others see. **Decided 2026-08-05: build all three** rather than argue the invite-only
model — a rejection costs a review cycle and both affordances were cheap. This was
previously flagged as the likeliest rejection cause; it is now closed.

- ✅ **Published acceptable-use terms** — `docs/TERMS.md §4` / `web/terms.html`, both
  now describing the report path and the moderator's removal power.
- ✅ **A way to report objectionable content** — "Report this story" at the foot of
  every story in the reader (`components/report-story-link.tsx`, wired in
  `components/story-article.tsx`), drafting a mailto to `support@catchupcolumn.com`
  with the story/group/edition ids. Hidden on your own posts. `lib/report.ts` is the
  seam to swap for a real endpoint if volume ever justifies it.
- ✅ **A way to block/eject an abusive user** — moderators get a "Remove" action on
  every other member's row (`app/group/[id].tsx`), backed by the `remove_group_member`
  RPC (`20260806003026_member_moderation.sql`, hardened by `20260806005907`). Removal
  also deletes the member's *uncompiled* posts, so an ejected member's pending story
  can't land in tomorrow's edition; published editions are untouched.
  `prevent_last_moderator_removal` still guards the sole-moderator case.

☐ **Still to do:** smoke-test both affordances on device (Gate 7 in
[PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md)), and re-run the Gate 1
automated checks — this code landed after Gate 1 last passed.

## 10. Post-approval

☐ Fill `appStoreUrl` in `web/config.js` and redeploy, so the site's App Store button
appears instead of the "coming soon" line. (Leave `playStoreUrl` empty until Android
ships.)

---

## Android — deferred

Deferred as of 2026-08-22 to get iOS out first. Nothing here is broken; it's just out
of scope. **Already in place** (no need to redo it):

- `android.package` = `com.catchupcolumn.app` and the adaptive icon in `app.json`.
- The monochrome notification icon (`assets/images/notification-icon.png`).
- `web/.well-known/assetlinks.json` exists with a placeholder fingerprint.
- The bogus `RECORD_AUDIO` permission was removed 2026-08-04 — **verify it hasn't come
  back** when you resume, or Play will force a microphone disclosure.

**What it will need when you pick it back up:**

- Google Play Console enrollment ($25 one-time) and the app record.
- The **FCM v1 service account** via `npx eas-cli credentials` (the Android half of
  step 3's push credentials).
- `assetlinks.json`: replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT` with
  the Play **app-signing** fingerprint (not the upload key), and add `intentFilters`
  to `app.json` declaring **`www.catchupcolumn.com`** — Google does not follow the
  apex→www 308.
- Android phone screenshots, and the Play **data safety** form from
  `STORE_LISTING.md §7–8`.
- `npx eas-cli build --platform android --profile production` +
  `submit --platform android --latest`.

---

## Post-launch smoke test (recommended before wide release)

Using a TestFlight / internal-testing build:

1. Sign up → set name/avatar → create a group. Confirm profile loads (validates the
   `users` column-grant change against production).
2. Invite a second test account; both see the group.
3. Write a post with a photo; publish the edition (moderator "publish now").
4. Confirm the edition email arrives from your verified domain and the push fires.
5. **Tap the email's "read the edition" link** → must land on the bouncer page and
   hand off to the app, *not* a 404 (regression check for the `/edition/*` rewrite).
6. Tap the email's unsubscribe link → confirm the styled confirmation page.
7. Profile → Delete account → confirm it completes and signs out.
8. Confirm the 15-minute `compile-editions` cron is actually firing — see
   [Verifying the compile-editions cron](#verifying-the-compile-editions-cron) below.
   If it isn't, weekly compilation silently never runs and the core feature is dead.

---

## Verifying the compile-editions cron

⚠️ **`cron.job_run_details` showing `succeeded` does NOT mean the cron worked.** The
job body is a `select net.http_post(...)`, and pg_net is *asynchronous* — it queues the
request and returns immediately, so the SQL statement succeeds regardless of what the
HTTP call does. If the `project_url` Vault secret is missing, the URL evaluates to
`NULL` and the POST goes nowhere while the job still logs as healthy. Check the
response table, not just the job table.

Run these in the Supabase dashboard SQL editor, in order:

```sql
-- 1. Is the job scheduled and active?
select jobid, jobname, schedule, active from cron.job
where jobname = 'compile-editions-every-15-minutes';

-- 2. Do both Vault secrets exist, with the right values? (the silent killer)
--    project_url must have NO trailing slash — the job appends /functions/v1/...
--    compile_editions_cron_secret must equal the function's CRON_SECRET, or every call 401s.
--    NB: prints secrets in cleartext; don't screen-share.
select name, decrypted_secret from vault.decrypted_secrets
where name in ('project_url', 'compile_editions_cron_secret');

-- 3. Is it firing every 15 minutes?
select status, return_message, start_time from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'compile-editions-every-15-minutes')
order by start_time desc limit 10;

-- 4. Did the HTTP request actually succeed? ← the check that proves it
select id, status_code, content, created from net._http_response
order by created desc limit 10;
```

Reading step 4: `200` → working. `401` → the Vault secret doesn't match the function's
`CRON_SECRET`. `500` "CRON_SECRET is not configured" → the function secret is missing.
**No rows at all** → the request was never queued, almost certainly the missing
`project_url`.

If a secret is absent (use `vault.update_secret` if the row exists but is wrong):

```sql
select vault.create_secret('https://wvaxfyhihcfilewygtzp.supabase.co', 'project_url');
select vault.create_secret('<same value as the CRON_SECRET function secret>', 'compile_editions_cron_secret');
```

To isolate function health from cron wiring, call the function directly. A `200` with
`compiled` / `skipped_no_posts` counts means the function and RPC are fine and any
problem is in the cron/Vault wiring:

```bash
curl -i -X POST https://wvaxfyhihcfilewygtzp.supabase.co/functions/v1/compile-editions \
  -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" \
  -d '{"source":"manual"}'
```

⚠️ That curl is *usually* a no-op — `compile_due_editions` only picks up groups whose
`publish_day` is today and whose `publish_time` fell inside the last 15 minutes (in the
group's own timezone), plus a 22-hour duplicate guard. **But if a group is inside its
publish window right now, this really will publish an edition and email every member.**
Check your groups' `publish_day`/`publish_time` first if any are real rather than test
groups.
