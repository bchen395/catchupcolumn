# Pre-Submission Checklist — Catch Up Column

The run-through before pressing submit in App Store Connect / Play Console. Work top
to bottom: each gate assumes the ones above it passed.

- ~~**Don't start this yet.** [POSITIONING.md](./POSITIONING.md) §8 gates submission
  on four clean editions of a real Group (its §6). Nothing below is wrong; it's
  just not due until Group Zero has run.~~ **No longer gated on Group Zero —
  the owner skipped it on 2026-10-24.** There is no external TestFlight and no
  Beta App Review: once the illustration rework lands ([LAUNCH.md](./LAUNCH.md)
  step 6b) and these gates pass, the build goes straight to App Store review.
- **This doc owns the procedure.** [LAUNCH.md](./LAUNCH.md) is the *narrative*
  runbook (what happened, what's left, why) and points here rather than keeping a
  second copy of any list. Where the two ever disagree, this one wins.
- **Metadata, descriptions, and the privacy/data-safety answers** live in
  [STORE_LISTING.md](./STORE_LISTING.md) — copy from there, don't retype.
- **How to verify app changes** is in the `verify-changes` skill.

Statuses below carry their own dates; the last pass against production was
**2026-09-24** (Gates 2–4), with Gate 2's migrations and functions re-done
**2026-10-24** and again **2026-11-02**, after the Guideline 1.2 work
(#64–#70). Re-verify anything older than your last deploy — and
remember that **merging deploys nothing** to Supabase: migrations and edge
functions ship by hand (Gate 2).

**Supabase CLI v3 (since 2026-11-02).** The repo pins 3.0.0, so `npx supabase`
runs it. The production commands below carry `--remote` (without it v3 targets
the local stack), and a deploy asks before it runs, default No ([LAUNCH.md →
Deploying edge functions](./LAUNCH.md#deploying-edge-functions)).

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
- [x] **UGC moderation decision made** — see Gate 6; it can change what you ship
      *(owner, 2026-10-30: close the gaps in code; shipped as #64–#70,
      2026-10-31 to 2026-11-02)*

**What CI cannot do — still on you.** It never renders a screen, sends a push, or
touches a device:

- [ ] Manual QA per the `verify-changes` skill: auth, onboarding, group create/join,
      composer, editions list, edition reader, profile — **each at large system font
      sizes**. Not optional polish: CLAUDE.md's accessibility floor is a product
      requirement, and family Groups contain grandparents.

## Gate 2 — Backend parity with production

- [x] `npx supabase migration list --remote` — every local migration shows a `remote`
      counterpart *(2026-09-24: all 30 applied ✅, through `20260923003208`;
      2026-10-24: all 33 ✅, through `20261003154759_multi_photo_posts`;
      2026-11-02: all 38 ✅, through `20261101204252_user_blocks`)*
- [x] `npx supabase functions list --remote` — all ~~4~~ 5 functions `ACTIVE` **and the deployed
      source matches `main`** *(2026-09-24 ✅ — after redeploying `compile-editions`
      and `publish-edition-now`, which had been on a 2026-07-11 build sending the v1
      email; 2026-10-24 ✅ — `compile-editions` v20 and `publish-edition-now` v9
      deployed, then all four downloaded and diffed clean; 2026-11-02 ✅ —
      `report-story` v1 (new, #64), `compile-editions` v21 and
      `publish-edition-now` v10 (#70) deployed, and those three downloaded and
      diffed clean. **`unsubscribe` is behind `main` on purpose** until release
      day — After approval, below)*. Re-check before submission with the download-and-diff in
      [LAUNCH.md → Deploying edge functions](./LAUNCH.md#deploying-edge-functions).
      > Compare source, not timestamps. `updated_at` is accurate, but it only says
      > *when*; `delete-account`'s once looked older than its last commit because
      > it had been deployed from the working tree before that commit was made.
- [x] Function secrets present: `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`,
      `WEB_BASE_URL` *(2026-08-04: all set ✅; re-checked 2026-09-22)*
- [x] `WEB_BASE_URL` is the **`www`** host *(set 2026-09-22 — it had been the
      apex, which universal links can't claim)*. Values are hashed in
      `secrets list`, but the digest is the SHA-256 of the raw value, so compare
      rather than re-set blind — [LAUNCH.md](./LAUNCH.md) step 2 has the commands.
- [x] Resend **sending domain is verified**, and `EMAIL_FROM` uses it (not
      `onboarding@resend.dev`) — the `EMAIL_FROM` half ✅ *(digest-verified
      2026-09-22: `Catch Up Column <hello@catchupcolumn.com>`)*; ~~the domain
      status is still unconfirmed~~ the domain ✅ *(`verified` in the Resend
      dashboard, read by the owner 2026-10-30)*
- [x] Resend **open and click tracking can't apply** *(owner, 2026-11-03)*: the
      domain's Configuration tab shows only **Configure** under "Enable tracking
      metrics" — no tracking subdomain — and Resend tracks only through a
      verified one. Never set one up: the privacy policy promises no
      per-recipient tracking. (The tracking switches won't save without a
      subdomain; that's expected, not a fault.)
- [x] `compile-editions` cron is actually firing *(verified end to end
      2026-09-22 — `200`s in `net._http_response` on every tick)*. **A `succeeded` row in
      `cron.job_run_details` does not prove this** — pg_net is async, so the job
      logs healthy even when the POST goes nowhere. Run the four queries in
      [LAUNCH.md → Verifying the compile-editions cron](./LAUNCH.md#verifying-the-compile-editions-cron);
      if the Vault secrets are missing, **weekly compilation silently never runs**
      and the core feature is dead.

## Gate 3 — Supabase Auth dashboard

Not in `config.toml` — that governs local dev only. Set these in the dashboard under
Authentication:

- [x] Redirect allowlist includes `catchupcolumn://` *(set 2026-08-22 — LAUNCH
      step 5)*. The `catchupcolumn://(auth)/reset-password` entry has been unused
      since 2026-09-25 — the reset link was replaced by a code sign-in — and was
      removed 2026-10-30 (item 7, below).
- [x] **Magic Link email template contains `{{ .Token }}`**, not
      `{{ .ConfirmationURL }}` *(pasted 2026-09-22 from
      `supabase/templates/magic-link.html`)* — without it the code sign-in flow
      silently mails a link instead of a code, and the link cannot hand back to
      the app until universal links exist. See [LAUNCH.md](./LAUNCH.md) step 5.
- [x] **Confirm signup template contains `{{ .Token }}`** *(pasted 2026-09-22 from
      `supabase/templates/confirm-signup.html`)* — **two templates, not one:**
      sign-in renders from Magic Link, sign-up from Confirm signup. Found the
      hard way.
- [x] **Email OTP length is 6** *(set 2026-09-22)*, matching `CODE_LENGTH` in
      `hooks/use-email-code.ts`. It was 8, which makes sign-in impossible — the
      input is capped at 6 and silently truncates. The two have to move together.
- [x] **Both templates have a plain subject line** *(set 2026-09-22)*, not
      Supabase's default "Your Magic Link" on a body that says "here is your code"
- [x] **Code email verified on both entry points** *(both 2026-09-22 — sign-up
      with a never-used address, confirmed in `auth.users`)*. For a re-test, use
      a never-used address — a prior failed test creates the user, so reuse tests
      sign-in. Six digits on both, no button on either.
- [x] **Minimum password length is 8, with no required character types**
      *(decided 2026-09-25; read 2026-09-28 — it was already 8)*, matching `PASSWORD_MIN_LENGTH` in `lib/auth.ts`.
      Passwords are optional and set from Profile. LAUNCH step 5 → "Passwords
      and code lifetime" item 1.
- [x] **Secure password change is on**; "Require current password" is **off** *(2026-09-28)*
      (item 2 — a code-only account has no password its owner knows)
- [x] **Reauthentication template** *(2026-09-28)* pasted from
      `supabase/templates/reauthentication.html`, with a plain subject (item 3)
- [x] **Password-changed and email-changed notifications on** *(2026-09-28)*, with
      `supabase/templates/password-changed.html` (item 4). *Found off and turned
      back on 2026-11-04. Re-check before submitting: `npx supabase config diff
      --remote` should list no `notification` paths.*
- [x] **Email OTP expiry is 600s**, matching `CODE_EXPIRY_MINUTES` — set only
      after the "10 minutes" app copy and both code templates are live (item 5)
      *(set 2026-10-30, with both code templates pasted in the same sitting —
      before the build: Group Zero is skipped, so no older build is in anyone's
      hands)*
- [x] **`catchupcolumn://(auth)/reset-password` removed from Redirect URLs** —
      after the first production build is what people run; older builds still
      use it (item 7) *(removed 2026-10-30, for the same reason)*
- [x] **Common-password blocklist instead of leaked password protection** — the
      project is on Free, where the toggle isn't offered (2026-09-28);
      `lib/common-passwords.ts` is checked in the app (item 6). Turn the toggle
      on if the project moves to Pro.
- [x] Email confirmation: stays **off** *(decided 2026-09-16)* — the code flow is
      itself proof of address, and there is no password-signup path any more
- [x] **Custom SMTP is enabled and points at Resend** *(set 2026-09-22; code emails
      verified arriving that day)* — `smtp.resend.com`, user `resend`, sender on
      the root domain. On Supabase's built-in sender the 6-digit code throttles
      partway through onboarding one Group, and the error is project-wide. Verify
      it survived any project changes.
- [x] **Auth "rate limit for sending emails" is 100/hour** *(set 2026-09-22)*, not the 30 Supabase
      defaults to when custom SMTP is switched on. Re-derive from peak signups
      per hour before launch — the 100 was sized for Group Zero, not for the
      store. Reasoning in [LAUNCH.md](./LAUNCH.md) step 5.
- [x] Per-address minimum interval between auth emails is still set (60s default) *(60s, confirmed 2026-09-28)*
      — it is what makes the 100/hour ceiling safe. It's under Emails → **SMTP
      Settings** ("Minimum interval between emails being sent"), not Rate Limits
- [ ] Resend plan's **daily** cap clears expected volume — auth email and edition
      email now share it *(cap read 2026-10-30: 100/day, 3,000/month. Whether
      that clears launch volume is the re-derivation LAUNCH step 5 asks for at App Store
      launch)*

## Gate 4 — Web surface

- [x] Legal/support pages return 200 *(2026-09-24 ✅)*:
      ```bash
      for p in / /privacy /terms /support /delete-account; do
        curl -sL -o /dev/null -w "$p %{http_code}\n" "https://www.catchupcolumn.com$p"
      done
      ```
- [x] **Edition permalinks resolve** *(2026-09-24 ✅ — re-run after any
      `vercel.json` change)* — this was 404ing in production and is every
      edition email's primary CTA:
      ```bash
      curl -s -o /dev/null -w '%{http_code}\n' \
        https://www.catchupcolumn.com/edition/00000000-0000-0000-0000-000000000000
      # → 200. A 404 means the /edition/* rewrite regressed.
      ```
- [ ] If enabling universal links: `TEAMID` replaced in (**iOS done 2026-09-24**
      — AASA appID `6RDS3S724Z.com.catchupcolumn.app`, `associatedDomains`
      declared; untick-able until a native build carrying it is verified on a
      device; Android still open)
      `web/.well-known/apple-app-site-association`, SHA-256 replaced in
      `assetlinks.json`, and `associatedDomains`/`intentFilters` added to `app.json`
      declaring **`www.catchupcolumn.com`** — Apple and Google do not follow the
      apex→www 308, so claiming the apex fails verification silently

## Gate 5 — Build & credentials

> This is the **first ever release build** — the only EAS build so far is a 2026-09-24
> simulator `preview` build (LAUNCH step 8), so no signed binary has ever run on a
> phone. Budget time for it to fail once or twice.

- [ ] Push credentials uploaded: `npx eas-cli credentials` — APNs key (iOS), FCM v1
      service account (Android). Without these, production push silently never
      registers. They're normally created during the first build if you skip ahead.
- [ ] EAS env vars present: `npx eas-cli env:list production` — the app throws at
      launch without `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY` *(2026-08-04: set ✅)*,
      and needs **`EXPO_PUBLIC_SENTRY_DSN`** here too — `.env.local` is gitignored
      and never reaches an EAS build ([LAUNCH.md](./LAUNCH.md) step 10)
      *(2026-09-24: DSN set ✅ in production and preview)*. **Also
      `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`** — without them the
      production build fails at the Sentry step (LAUNCH step 10.4)
- [ ] `npx eas-cli build --platform all --profile production`
- [ ] **Install the signed binary** and confirm, on a real device — none of this is
      exercised by Expo Go:
  - [ ] Lora + Jost fonts load (no system-font fallback)
  - [ ] Splash screen hides (doesn't hang)
  - [ ] Push token registers
  - [x] `catchupcolumn://` deep link opens the app *(build 10, 2026-11-04; a
        tapped `https://www.catchupcolumn.com/edition/…` link opens it too)*
  - [ ] Photo picker prompts with the expected permission copy
  - [ ] Notification icon renders correctly (monochrome, Android)
  - [ ] ~~Setting a password (Profile → Set a password) offers to save it to iCloud
        Keychain, and the password field suggests a strong one — needs the
        `webcredentials` entitlement, which only a signed build has~~
        **Accepted for 1.0 (owner, 2026-11-04):** build 10 neither suggests
        nor saves on Set a password, though the password sign-in screen does
        offer to save, so the entitlement works. See `bugs.md` L6.
        **Fix merged 2026-11-05 (#77), not yet on a device:** re-check after
        the batched OTA: the suggestion, the save, and the update-saved-password
        prompt after *Forgot your password?*

## Gate 6 — App Review risk: user-generated content

Apple Guideline 1.2 expects three things from an app where users publish content
others see. The first pass shipped 2026-08-05 (PR #14); the gaps found
2026-10-30 were closed in code by #64–#70 (2026-10-31 to 2026-11-02, server
half live in production). The decisions and the code pointers are
[LAUNCH.md](./LAUNCH.md) step 9 and `STORE_LISTING.md` §9.3. What's left is
verification on a phone.

- [x] Published acceptable-use terms — `docs/TERMS.md §4` / `web/terms.html`
      *(rewritten for zero tolerance, effective 2026-11-02)*, **agreed to at
      sign-up** ("Agree and email me a code", #67)
- [x] A way to **report** objectionable content — *sends from inside the app
      since #64; answered within 24 hours (`docs/MODERATION.md`)*
- [x] A way to **block or eject** an abusive user — *one-way block (#70);
      removal is a ban, with "Let back in" (#66); a moderator can take down any
      one story (#69)*
- [x] Filtering — *no word filter, by decision (owner, 2026-10-30): the Review
      Notes' "Filtering:" line makes the structural case (`STORE_LISTING.md`
      §13.3)*

- [x] Re-run the Gate 1 automated checks — *moot since 2026-09-10: CI runs Gate 1
      on every PR, #64–#70 included*
- [ ] Smoke-test every affordance on device (folded into Gate 7 below). Eject is
      already proven against production (2026-09-22); report, block, take down,
      the ban and the Terms agreement haven't been run on a phone
- [ ] Age rating questionnaire answer prepared: **flag user-generated content**
      (Gate 8 ticks it; getting this wrong is the rejection this gate exists to
      prevent) — *drafted 2026-10-30 in `STORE_LISTING.md` §9.1; the owner
      chose the 18+ override and Messaging and Chat: Yes the same day. §9.3 maps what Guideline
      1.2 asks for to what ships (2026-11-02).*

## Gate 7 — On-device smoke test

Using the TestFlight / internal-testing build, with two accounts (three for the
#66, #69 and #70 scripts below, which use a moderator and two contributors):

> **The production side of three of these is already proven** (2026-09-22,
> from a dev build against the live project, checked with before/after
> queries): sign-up with a fresh address; a moderator removing a member who had
> an unpublished post with a photo (membership, post and photo all deleted,
> nothing else touched); and account deletion (auth user, profile and avatar
> all gone). Both removal and deletion go through the `storage.protect_delete`
> fix, which had never succeeded before. The boxes stay open: this gate is
> about the **release build**, and that still has to be run.

- [ ] Sign up → set name/avatar → create a group → profile loads (validates the
      `users` column-grant change against production)
- [ ] Second account joins by invite code (exercises the `get_invite_preview*` RPCs —
      live in the DB but never tested from a release build)
- [ ] Write a post with a photo → moderator "publish now"
- [ ] Edition email arrives **from the verified domain**
- [ ] The email's "read the edition" link lands on the bouncer and hands off to the
      app — **not a 404**
- [ ] Push notification fires
- [ ] Unsubscribe link → styled confirmation page *(its new last line, pointing
      at "Email me each edition", shows only after the release-day deploy)*
- [ ] **Report this story** → the report sheet sends from inside the app, the
      email arrives at `support@` with the note and the ids, and the link is
      absent on your own post *(the full script is #64's)*
- [ ] **Moderator removes the second account** → they lose access, their unpublished
      post disappears from the next edition, the published edition is unchanged,
      and the invite code no longer lets them back in *(the full script is #66's)*
- [ ] Profile → Delete my account → completes and signs out
- [ ] **Guideline 1.2 work (#64–#70), first on this build.** Each PR body holds
      its script: `gh pr view <n>`.
  - [ ] **#65, on production with throwaway accounts:** delete a *creator's*
        account while their Group still has a member → the deletion completes,
        and the Group passes to that member as moderator. The steps and the
        read-only checks are in the PR's "QA on production"
  - [ ] **#69, one production take-down with photos, using T1/T2** — the storage
        guard isn't proven by CI or a local stack. Steps in the PR's "After
        merging" item 3: a 2-photo story taken down from the phone leaves 0
        files, its email photos stop loading, then the operator path
  - [ ] **#64's device script** — report with and without a note, the failure
        and "Email us instead", keyboard, largest text, VoiceOver, the reader
        overlay
  - [ ] **#66's device script** — remove, the removed person's join refused,
        "Let back in", contributors can't remove
  - [ ] **#67's device script** — "Agree and email me a code", the Terms link
        round trip, an invite pending, the new account's `terms_version`
        (`2026-11-02` on a build carrying this Terms change), Help & support
  - [ ] **#68's device script** — the email and notification switches on two
        Groups, the unsubscribe link flipping the switch, notifications blocked
        on the phone, a failed save, a moderator refused another member's flags.
        *Notifications blocked on the phone passed 2026-11-04 (build 10): the
        note and Open Settings show, and the note clears on return without
        reopening the page*
  - [ ] **#70's device script** — block, what disappears where, the email
        without the blocked writer, the deep link, Unblock
- [ ] **Auth (#44, first on this build):**
  - [ ] Sign-in and sign-up code screens say the code expires in 10 minutes
  - [x] Profile → Set a password, on a fresh sign-in → saves without asking for a
        code; Profile then says "Change your password"; the password-changed email
        arrives *(build 10, 2026-11-04; the email only after the notification
        was switched back on, Gate 3)*
  - [x] Sign out → *Use a password instead* → sign in with it *(2026-11-04)*
  - [x] A wrong password → "If you usually sign in with a code, use that
        instead." *(2026-11-04)*
  - [x] `password1` is refused as one of the most common passwords *(2026-11-04)*
  - [x] *Forgot your password?* → code arrives → lands on "Choose a new password"
        → sign in with the new one *(2026-11-04)*
  - [ ] Signed in on two devices → sign out on one → the other stays signed in
  - [~] *If a session over a day old is at hand:* Set a password → a confirmation
        code is emailed, a wrong code is refused, the right one saves
        *(2026-11-05, T1 signed in since 11-03: the code was asked for and the
        right one saved. A wrong code wasn't tried)*

## Gate 8 — Store consoles

- [x] Apple Developer Program ($99/yr) enrolled *(2026-09-22)*
- [ ] Play Console ($25 one-time) enrolled — Android is deferred, so this is only
      needed if that changes
- [x] Bundle ID `com.catchupcolumn.app` confirmed final — owner, 2026-09-24.
      **Immutable after the
      first build upload**, which is the ~~Group Zero TestFlight~~ first
      production build (Group Zero skipped 2026-10-24), not
      submission. Decide it before that build ([LAUNCH.md](./LAUNCH.md) step 7)
- [ ] App records created in both consoles *(App Store Connect: app
      `6830424103`, 2026-11-03; Play deferred)*
- [ ] Screenshots captured: ~~iPhone 6.9" required~~ iPhone with Dynamic Island
      (medium display) required, large display too — sizes in `STORE_LISTING.md`
      §5, checked 2026-10-30 (Home, edition front page, composer,
      group) + Android phone. No iPad shots (iPad support is off).
      > `/screenshots` in the repo holds design-reference images only — no store
      > shots exist yet.
- [ ] Descriptions, subtitle, keywords, promo text pasted from `STORE_LISTING.md`
      *(iOS done 2026-11-04, with the categories, content rights, Free in 174
      of 175 regions, manual release, copyright and the App Review contact.
      2026-11-05: the EU was dropped for 1.0, so 147 of 175 regions and no DSA
      declaration. Still open on iOS: sign-in details and Review Notes,
      screenshots, the build. `STORE_LISTING.md` §13.5)*
- [ ] URLs entered (the `www` ones from `STORE_LISTING.md §6`) *(iOS: privacy,
      support and marketing, 2026-11-04)*
- [ ] Apple privacy labels + Play data safety completed from `STORE_LISTING.md §7–8`
      *(Apple label published 2026-11-04: 7 types linked, 3 Diagnostics not
      linked, none for tracking)*
- [ ] Age rating questionnaire — **flag user-generated content** *(iOS done
      2026-11-04: calculated 4+, overridden to 18+)*
- [ ] Microphone/audio does *not* appear in Play's permission list (the bogus
      `RECORD_AUDIO` declaration was removed 2026-08-04; verify it didn't come back)
      > **It had come back** — `expo-image-picker`'s config plugin adds
      > `RECORD_AUDIO` (Android) and generic camera and microphone purpose
      > strings (iOS) unless told not to, and `expo-secure-store`'s adds a Face
      > ID one. The app uses none of the three. Set to `false` in `app.json`
      > 2026-10-24; check with
      > `npx expo config --type introspect --json | jq '.ios.infoPlist'`, which
      > should show `NSPhotoLibraryUsageDescription` as the only usage string.
- [ ] Export compliance: `ITSAppUsesNonExemptEncryption: false` is set — no extra docs

## Gate 9 — Submit

- [ ] `npx eas-cli submit --platform ios --latest`
- [ ] `npx eas-cli submit --platform android --latest`

## After approval

- [ ] **On release day, when you release the version:** deploy `unsubscribe`
      (#68's new last line points at the "Email me each edition" switch, which
      only the new build has). It asks first; answer `y`:
      ```bash
      npx supabase functions deploy unsubscribe --use-api --remote
      ```
      Then download-and-diff all five functions
      ([LAUNCH.md → Deploying edge functions](./LAUNCH.md#deploying-edge-functions)):
      production should match `main` again
- [ ] Fill `appStoreUrl` / `playStoreUrl` in `web/config.js` and redeploy, so the
      site's download buttons replace the "coming soon" line
