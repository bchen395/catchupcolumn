# Launch Runbook — Catch Up Column

Everything left to take Catch Up Column from "code-complete" to "live in the App
Store and Play Store," in order. Steps marked **[owner]** need your accounts/logins
and can't be automated from the repo.

Companion docs:

- **[PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md)** — the flat, tickable
  list to work through on submission day. This doc is the narrative (what happened and
  why); that one is the procedure.
- **[STORE_LISTING.md](./STORE_LISTING.md)** — metadata, descriptions, and the exact
  privacy/data-safety questionnaire answers.

Project ref: `wvaxfyhihcfilewygtzp` · Bundle ID: `com.catchupcolumn.app`

**Plan (as of the 2026-08-04 verification pass):** the backend, legal hosting, the
UI redesign, and the EAS env vars are all done and verified against production. Two
things stand between here and submission:

1. **A product decision on UGC moderation (step 9)** — there is no report/block or
   remove-member path. This is the likeliest App Review rejection.
2. **The first-ever release build (step 8)** — `eas build:list` is empty, so nothing
   has run outside Expo Go. Push credentials get created during that first build.

Store screenshots (step 7) need the build too. Steps 4–5 are dashboard-only and can
happen in parallel.

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

## 2. Site on Vercel + domain — ✅ deployed, one fix pending redeploy

The site is what `WEB_BASE_URL` and every email/edition link resolve to. It is live:
`/privacy`, `/terms`, `/support`, `/delete-account` all return 200, and the
`.well-known/` files serve with `content-type: application/json`.

**`www` is canonical** — the apex 308-redirects to it. All in-app and email links now
target `www` directly.

☐ **Redeploy to pick up the `/edition/*` rewrite fix** (see the 2026-08-04 pass), then:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://www.catchupcolumn.com/edition/00000000-0000-0000-0000-000000000000
# → 200. A 404 means the rewrite is still broken and every edition email's CTA is dead.
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

## 3. EAS project setup **[owner]** — ✅ except push credentials

- ✅ **`eas init` done** — `owner` (`bchen395`) + `extra.eas.projectId`
  (`c9be4074-4916-4e94-9276-811bbe8a05dc`) are committed to `app.json`.
- ✅ **Supabase env vars on EAS** — verified present in the `production` environment.
- ☐ **Push credentials** — still needed. Without them production push silently never
  registers.

```bash
npx eas-cli credentials    # iOS: add an APNs key · Android: add the FCM v1 service account
```

These are normally created interactively during the first `eas build`, so step 8 will
prompt for them if you skip this.

## 4. Email deliverability — Resend **[owner]** — mostly done

The `EMAIL_FROM` secret was updated 2026-07-17, so it is no longer the Resend sandbox
default. Two things left to confirm (neither is readable from the CLI):

- ☐ The sending domain is **verified in Resend** — otherwise deliverability still tanks.
- ☐ `EMAIL_FROM` uses that verified domain:

```bash
npx supabase secrets set EMAIL_FROM='Catch Up Column <hello@catchupcolumn.com>'
```

(No function redeploy needed — secrets are read at runtime.)

## 5. Supabase Auth dashboard settings **[owner]**

These are **not** in `config.toml` (that governs local dev only) — set them in the
Supabase dashboard → Authentication:

- **Redirect URLs:** add `catchupcolumn://` (and `catchupcolumn://(auth)/reset-password`)
  to the allowlist so password-reset deep links work in release builds.
- **Minimum password length:** raise from 6 to at least 8.
- **Email confirmation:** decide whether to require it. It prevents sign-ups under
  someone else's address but adds a step for the older-adult audience; the app
  already has a resend-confirmation path if you enable it. (See `bugs.md` D2.)

## 6. Redesign the UI — ✅ done (2026-07-18)

The v2 editorial system ("NYT structure, HeyTea charm") reached every screen. The
orange-as-text contrast question is resolved: body/UI text is all ink/inkSoft (AA
everywhere) and vermilion is confined to bold small-caps kicker/stamp roles
(BRAND.md §2). Store screenshots (step 7) are now unblocked.

If you revisit the UI further, run the `verify-changes` checklist first — `npm run
typecheck` plus manual QA of every screen (auth, onboarding, group create/join,
composer, editions list, edition reader, profile) at large system font sizes.

## 7. Store accounts, assets, and metadata **[owner]**

- Enroll in the **Apple Developer Program** ($99/yr) and **Google Play Console**
  ($25 one-time). Confirm the bundle ID `com.catchupcolumn.app` is final — it's
  immutable after first submission. (You'll also need the Apple Team ID here for
  step 2's universal links.)
- Create the app records in App Store Connect and Play Console.
- **Screenshots (redesign done — ready to capture):** iPhone 6.9" required (Home, an
  edition front page, the composer, a group). No iPad shots needed (iPad support is
  off). Android phone shots too. Note `/screenshots` holds design-reference images
  only, so no store shots exist yet.
- Paste the descriptions, keywords, and the privacy/data-safety answers from
  [STORE_LISTING.md](./STORE_LISTING.md). Enter the URLs from step 2.

## 8. Build & submit **[owner]** — note: this is the *first ever* release build

`eas build:list` is empty. Nothing in this app has run outside Expo Go, so the first
build is also the first test of font loading, splash-hide, push registration, deep
links, and the notification icon on a signed binary. Budget time for it to not work
first try.

```bash
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

Before submitting, install the build and confirm on-device: fonts load, the splash
hides, a push token registers, `catchupcolumn://` deep links open, and the photo
picker prompts with the expected permission copy.

Then complete the store-console review forms (age rating / data safety — **flag
user-generated content**) and submit for review.

## 9. UGC moderation — ⚠️ open product decision, likeliest rejection cause

Apple Guideline 1.2 expects three things from an app where users publish content
others see. The app currently has one of them:

- ✅ **Published acceptable-use terms** — `docs/TERMS.md §4` / `web/terms.html`.
- ☐ **A way to report objectionable content** — does not exist anywhere in the app.
- ☐ **A way to block/eject an abusive user** — `lib/groups.ts` has `leaveGroup` and
  `deleteGroup`, but no remove-member. A moderator cannot eject anyone; the only
  escape is for the victim to leave. (The DB side is ready — see
  `prevent_last_moderator_removal`.)

"Groups are private and invite-only" is a reasonable argument and reviewers sometimes
accept it, but it's a coin flip. The cheap insurance is a moderator "remove member"
action plus a report path on a post (even one that just emails support).

Decide before submitting: build it, or write the reviewer note explaining the
invite-only model.

## 10. Post-approval

☐ Fill `appStoreUrl` / `playStoreUrl` in `web/config.js` and redeploy, so the site's
download buttons appear instead of the "coming soon" line.

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
8. Confirm the 15-minute `compile-editions` cron is actually firing — check
   `cron.job_run_details` in the Supabase dashboard. The job depends on the Vault
   secrets `project_url` and `compile_editions_cron_secret` existing; if either is
   missing, weekly compilation silently never runs.
