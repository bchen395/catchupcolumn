# Pre-Submission Checklist — Catch Up Column

The run-through before pressing submit in App Store Connect / Play Console. Work top
to bottom: each gate assumes the ones above it passed.

- **Why this doc exists:** [LAUNCH.md](./LAUNCH.md) is the *narrative* runbook (what
  happened, what's left, why). This is the flat, tickable list you actually work
  through on submission day.
- **Metadata, descriptions, and the privacy/data-safety answers** live in
  [STORE_LISTING.md](./STORE_LISTING.md) — copy from there, don't retype.
- **How to verify app changes** is in the `verify-changes` skill.

Statuses below were verified against production on **2026-08-04**. Re-verify anything
older than your last deploy.

---

## Gate 1 — Code freeze

**The static half is automated as of 2026-09-10.** `.github/workflows/ci.yml` runs it
on every PR and push to `main`, so this gate is now *"CI is green on the commit
you're shipping"* rather than a list to retype:

```bash
gh run list --branch main --limit 1
```

CI covers `npm run typecheck`, `npm run lint`, `npx expo-doctor`,
`npx expo install --check`, `deno check` on **every** edge-function file, the
edition-email fixture render (fails on Gmail's ~102KB clip limit), a real Metro
bundle for **both** iOS and Android, and — when SQL changed — a from-scratch
migration apply plus `supabase db lint`.

> The old line here was `deno check supabase/functions/**/index.ts`, which only
> reached the four `index.ts` files: `**` doesn't recurse in non-globstar bash, so
> `_shared/` (the entire email + dispatch engine) was never type-checked by this
> gate. CI uses `find … -print0 | xargs -0 deno check` instead.

- [ ] CI green on the release commit
- [ ] `npx expo-doctor` → **21/21** (it was 18 checks before SDK 57)
- [ ] Bundle size sanity-checked from the CI run summary — it prints JS and asset
      totals per platform
- [ ] No `console.log` or `TODO` left in `app/`, `components/`, `lib/`, `hooks/`
- [ ] **UGC moderation decision made** — see Gate 6; it can change what you ship

**What CI cannot do — still on you.** It never renders a screen, sends a push, or
touches a device:

- [ ] Manual QA per the `verify-changes` skill: auth, onboarding, group create/join,
      composer, editions list, edition reader, profile — **each at large system font
      sizes** (the audience is older adults; this is not optional polish)

## Gate 2 — Backend parity with production

- [x] `npx supabase migration list --linked` — every local migration shows a `remote`
      counterpart *(2026-08-05: all 29 applied ✅ — the two moderation migrations
      pushed on top of the 27 verified 2026-08-04)*
- [ ] `npx supabase functions list` — all 4 functions `ACTIVE`
      *(2026-08-04: deployed and current ✅)*
      > `delete-account` reports an `updated_at` **earlier** than its last code
      > change. That timestamp is a red herring — the deployed source does contain the
      > `prepare_account_deletion` call (verified by `supabase functions download`).
      > Don't redeploy on the strength of the timestamp alone.
- [ ] Function secrets present: `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`,
      `WEB_BASE_URL` *(2026-08-04: all set ✅)*
- [ ] `WEB_BASE_URL` is the **`www`** host — values are hashed in `secrets list`, so
      set it rather than trying to read it:
      `npx supabase secrets set WEB_BASE_URL='https://www.catchupcolumn.com'`
- [ ] Resend **sending domain is verified**, and `EMAIL_FROM` uses it (not
      `onboarding@resend.dev`)
- [ ] `compile-editions` cron is actually firing — check `cron.job_run_details` in the
      Supabase dashboard. It reads the Vault secrets `project_url` and
      `compile_editions_cron_secret`; if either is missing, **weekly compilation
      silently never runs** and the core feature is dead.

## Gate 3 — Supabase Auth dashboard

Not in `config.toml` — that governs local dev only. Set these in the dashboard under
Authentication:

- [ ] Redirect allowlist includes `catchupcolumn://` and
      `catchupcolumn://(auth)/reset-password` (password reset breaks in release builds
      without this)
- [ ] Minimum password length raised from 6 → 8+
- [ ] Email confirmation: decision made (prevents signup under someone else's address;
      costs a step for the older-adult audience — the app already has a
      resend-confirmation path if you enable it)

## Gate 4 — Web surface

- [ ] Legal/support pages return 200 *(2026-08-04 ✅)*:
      ```bash
      for p in / /privacy /terms /support /delete-account; do
        curl -sL -o /dev/null -w "$p %{http_code}\n" "https://www.catchupcolumn.com$p"
      done
      ```
- [ ] **Edition permalinks resolve** — this was 404ing in production and is every
      edition email's primary CTA:
      ```bash
      curl -s -o /dev/null -w '%{http_code}\n' \
        https://www.catchupcolumn.com/edition/00000000-0000-0000-0000-000000000000
      # → 200. A 404 means the /edition/* rewrite regressed.
      ```
- [ ] If enabling universal links: `TEAMID` replaced in
      `web/.well-known/apple-app-site-association`, SHA-256 replaced in
      `assetlinks.json`, and `associatedDomains`/`intentFilters` added to `app.json`
      declaring **`www.catchupcolumn.com`** — Apple and Google do not follow the
      apex→www 308, so claiming the apex fails verification silently

## Gate 5 — Build & credentials

> This is the **first ever release build** — `eas build:list` is empty, so nothing in
> this app has run outside Expo Go. Budget time for it to fail once or twice.

- [ ] Push credentials uploaded: `npx eas-cli credentials` — APNs key (iOS), FCM v1
      service account (Android). Without these, production push silently never
      registers. They're normally created during the first build if you skip ahead.
- [ ] EAS env vars present: `npx eas-cli env:list production` — the app throws at
      launch without `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` *(2026-08-04: set ✅)*
- [ ] `npx eas-cli build --platform all --profile production`
- [ ] **Install the signed binary** and confirm, on a real device — none of this is
      exercised by Expo Go:
  - [ ] Lora + Jost fonts load (no system-font fallback)
  - [ ] Splash screen hides (doesn't hang)
  - [ ] Push token registers
  - [ ] `catchupcolumn://` deep link opens the app
  - [ ] Photo picker prompts with the expected permission copy
  - [ ] Notification icon renders correctly (monochrome, Android)

## Gate 6 — App Review risk: user-generated content

Apple Guideline 1.2 expects three things from an app where users publish content
others see. **Decided 2026-08-05: build all three** rather than argue the
invite-only model — a rejection costs a review cycle, and both affordances were
cheap.

- [x] Published acceptable-use terms — `docs/TERMS.md §4` / `web/terms.html`
      (both now describe the report path and the moderator's removal power)
- [x] A way to **report** objectionable content — "Report this story" at the foot of
      every story in the reader (`components/report-story-link.tsx`), which drafts a
      mailto to `support@catchupcolumn.com` with the story/group/edition ids
      attached. Hidden on your own posts. `lib/report.ts` is the seam to swap for a
      real endpoint if volume ever justifies one.
- [x] A way to **block or eject** an abusive user — moderators get a "Remove" action
      on every other member's row in `app/group/[id].tsx`, backed by the
      `remove_group_member` RPC (`20260806003026_member_moderation.sql`). Removal
      also deletes the member's *uncompiled* posts, so an ejected member's pending
      story can't still land in tomorrow's edition; published editions are untouched.
      `prevent_last_moderator_removal` still guards the sole-moderator case.

- [ ] Re-run the Gate 1 automated checks — this code landed after Gate 1 passed
- [ ] Smoke-test both affordances on device (folded into Gate 7 below)

## Gate 7 — On-device smoke test

Using the TestFlight / internal-testing build, with two accounts:

- [ ] Sign up → set name/avatar → create a group → profile loads (validates the
      `users` column-grant change against production)
- [ ] Second account joins by invite code (exercises the `get_invite_preview*` RPCs —
      live in the DB but never tested from a release build)
- [ ] Write a post with a photo → moderator "publish now"
- [ ] Edition email arrives **from the verified domain**
- [ ] The email's "read the edition" link lands on the bouncer and hands off to the
      app — **not a 404**
- [ ] Push notification fires
- [ ] Unsubscribe link → styled confirmation page
- [ ] **Report this story** → drafts an email to support with the ids attached, and
      is absent on your own post
- [ ] **Moderator removes the second account** → they lose access, their unpublished
      post disappears from the next edition, and the published edition is unchanged
- [ ] Profile → Delete account → completes and signs out

## Gate 8 — Store consoles

- [ ] Apple Developer Program ($99/yr) and Play Console ($25 one-time) enrolled
- [ ] Bundle ID `com.catchupcolumn.app` confirmed final — **immutable after first
      submission**
- [ ] App records created in both consoles
- [ ] Screenshots captured: iPhone 6.9" required (Home, edition front page, composer,
      group) + Android phone. No iPad shots (iPad support is off).
      > `/screenshots` in the repo holds design-reference images only — no store
      > shots exist yet.
- [ ] Descriptions, subtitle, keywords, promo text pasted from `STORE_LISTING.md`
- [ ] URLs entered (the `www` ones from `STORE_LISTING.md §6`)
- [ ] Apple privacy labels + Play data safety completed from `STORE_LISTING.md §7–8`
- [ ] Age rating questionnaire — **flag user-generated content**
- [ ] Microphone/audio does *not* appear in Play's permission list (the bogus
      `RECORD_AUDIO` declaration was removed 2026-08-04; verify it didn't come back)
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption: false` is set — no extra docs

## Gate 9 — Submit

- [ ] `npx eas-cli submit --platform ios --latest`
- [ ] `npx eas-cli submit --platform android --latest`

## After approval

- [ ] Fill `appStoreUrl` / `playStoreUrl` in `web/config.js` and redeploy, so the
      site's download buttons replace the "coming soon" line
