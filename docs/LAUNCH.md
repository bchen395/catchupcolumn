# Launch Runbook — Catch Up Column

Everything left to take Catch Up Column from "code-complete" to "live in the App
Store." Steps marked **[owner]** need your accounts/logins and can't be automated
from the repo.

**Scope decision (2026-08-22): iOS first, Android later.** Every step below is
iOS-only unless it says otherwise. Play Console, the FCM service account, and
`assetlinks.json` are out of scope for this launch — see
[Android — deferred](#android--deferred) at the bottom.

## Where this fits

- **[POSITIONING.md](./POSITIONING.md) sets the order, and it outranks this
  file.** Submission is gated on four clean editions of a real Group (its §6), so
  this runbook stays paused at step 7 until Group Zero has run. Read it first.
- **[PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md)** is the flat,
  tickable list for submission day, including the on-device smoke test. This doc
  is the narrative — what happened, what's left, and why. **Where the two
  overlap, the checklist is authoritative and this file points at it.**
- **[STORE_LISTING.md](./STORE_LISTING.md)** — metadata, descriptions, and the
  exact privacy/data-safety answers. POSITIONING §2's copy pass rewrites it
  before anything gets pasted into App Store Connect.

Project ref: `wvaxfyhihcfilewygtzp` · Bundle ID: `com.catchupcolumn.app`

## Current state (2026-09-22)

**Done and verified:** the backend, legal hosting, the Vercel site, the v2 UI
redesign, the EAS env vars, and UGC moderation (step 9) — that last one was the
likeliest App Review rejection, and it's closed. **Auth email moved off Supabase's
built-in sender onto Resend SMTP on 2026-09-22, sending limit 100/hour** (step 5);
until then the code sign-in flow would have throttled partway through onboarding a
single Group.

**Apple Developer enrollment is done (2026-09-22)** — the long pole with the
multi-day tail is behind us. Three things it unblocks, none of which were
actionable before and all of which are now:

1. **The Apple Team ID → universal links (step 2).** Enrollment is where the Team
   ID comes from, and `web/.well-known/apple-app-site-association` still contains
   a literal `TEAMID`. Until that is replaced and `associatedDomains` is added to
   `app.json`, every edition email's primary CTA lands in Safari instead of
   handing off to the app. This is the cheapest of the three and the only one
   that changes something already in front of users.
2. **The APNs push key (step 3).** EAS creates it interactively on the first
   `eas build` / `eas credentials` run. Production push doesn't register without
   it, which also gates POSITIONING §3's pre-publish nudge, since the nudge is
   push-only.
3. **The first TestFlight build (step 8).** What Group Zero's editions 3–4 need —
   Expo Go dropped remote push in SDK 53 — and the first release build this
   project has ever produced. Budget for it failing the first time.

**Still open and independent of Apple:**

4. **Resend** (step 4) — DNS is correctly provisioned; confirm Resend flipped the
   domain to `verified`, re-set `EMAIL_FROM`, and add the missing DMARC record.
5. **Confirm the `compile-editions` cron is firing** — see
   [Verifying the compile-editions cron](#verifying-the-compile-editions-cron).
   If it isn't, weekly compilation silently never runs and the core feature is
   dead. **Do this before Group Zero, not before submission.**
6. **Sentry DSN** (step 11) — the code is wired and inert until it's set, and
   Group Zero is exactly when crash reports start mattering.

**Deferred by choice:** the illustration rework (step 6b) and store screenshots
(step 7). Screenshots freeze the final look, and Group Zero produces real
friend-group sample content for them for free.

---

## ✅ Already done

A changelog, not a procedure — the numbered steps below carry anything still
actionable. Verified against production on the dates shown, not assumed.

**2026-07-03 — pre-launch security pass.** Migration `20260703000000` applied to
prod, closing the cross-group post-injection hole, the `users.email` leak, and the
`unsubscribe_token` leak; client code updated to match the new column grants.
Icons regenerated in the brand palette, iPad support dropped, `eas.json` created,
legal/support docs written under `docs/`. PR #8.

**2026-07-17/18 — web, legal hosting, and the redesign.** Legal/support pages
built as styled static HTML in `web/` and deployed to Vercel (`web/vercel.json`
holds all routing); `.well-known/` universal-link files added with placeholder
Team ID and SHA-256. `eas init` run — `owner` and `extra.eas.projectId` are
committed to `app.json`. **The full v2 editorial redesign reached every screen
(step 6)**, which also closed the orange-as-text contrast question: body and UI
text are now ink/inkSoft (AA everywhere) and vermilion is confined to bold
small-caps kicker/stamp roles (BRAND.md §2). PRs #9, #10.

**2026-08-04 — verification pass against production.** All 27 migrations applied,
all 4 edge functions deployed and current, EAS production env vars present, all
four function secrets set, the site live on Vercel with **`www` canonical** (the
apex 308-redirects). Three things were fixed rather than confirmed:

- **Edition permalinks were 404ing in production** — `vercel.json` rewrote
  `/edition/:path*` to `/edition/index.html`, but under `cleanUrls: true` that
  `.html` route 308s, and a rewrite landing on a redirect resolves to a 404.
  Every edition email's primary CTA was dead. Destination is now the clean
  `/edition` path. **This is the easiest thing in the project to regress
  silently** — re-verify with the curl in step 2 after any `vercel.json` change.
- **The bogus `RECORD_AUDIO` Android permission** was dropped from `app.json`.
  The app has no audio code; it was scaffolding that would have forced a
  microphone disclosure in Play data safety. Verify it hasn't come back.
- **Canonicalized on `www`** throughout `Strings.legal.*` and the `WEB_BASE_URL`
  fallback. `web/README.md`'s universal-links snippet previously claimed the
  apex, which **cannot work** — Apple and Google don't follow redirects when
  fetching `.well-known/` files.

**2026-08-05 — UGC moderation shipped (step 9).** PR #14.

**2026-08-22 — Vercel redeployed** to pick up the permalink fix (verified 200),
and the Supabase Auth dashboard settings were set (step 5).

**2026-09-10/14 — SDK 57, CI, and Group Zero tooling.** Expo SDK 54 → 57,
`eslint-config-expo` wired, CI added (`.github/workflows/ci.yml`), then Sentry,
`expo-updates`, and the print-resolution fix (POSITIONING §11).

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

☐ **Universal links — unblocked as of the 2026-09-22 Apple enrollment.** They stay
dormant until you (a) replace `TEAMID` in
`web/.well-known/apple-app-site-association` with your Apple Team ID and the Android
SHA-256 in `assetlinks.json`, and (b) add `associatedDomains`/`intentFilters` to
`app.json` (snippet in `web/README.md`). **Declare `www.catchupcolumn.com`, not the
apex** — Apple and Google don't follow the 308.

The Team ID half is now available and was the only blocker; the Android SHA-256
still waits on a signed Android build, which is deferred. iOS can go alone —
the two files are independent. Until this lands, every edition email's "read the
edition" button opens Safari rather than the app, which is the difference between
the email working and half-working (`bugs.md` top-priority #5). Re-deploy Vercel
after editing `.well-known/`, and re-run the permalink curl above.

## 3. EAS project setup **[owner]** — ✅ done; APNs key now unblocked (2026-09-22)

- ✅ **`eas init` done** — `owner` (`bchen395`) + `extra.eas.projectId`
  (`c9be4074-4916-4e94-9276-811bbe8a05dc`) are committed to `app.json`.
- ✅ **Supabase env vars on EAS** — verified present in the `production` environment
  (2026-08-04). This was the part that would break the app at launch, and it's done.
- ☐ **Push credentials — no longer blocked.** The Apple enrollment landed
  2026-09-22, and the iOS APNs key can only be created from an Apple Developer
  account. EAS creates it interactively during the first `eas build`, so there is
  still nothing to do ahead of that build — but it will no longer fail for want
  of an account:

  ```bash
  npx eas-cli credentials    # iOS: add an APNs key (needs Apple enrollment)
  ```

  **Consequence while missing:** production push notifications won't register.
  Email delivery is unaffected, so editions still reach people — but POSITIONING
  §3's pre-publish nudge is push-only, so this also gates the retention feature.

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

## 5. Supabase Auth dashboard settings **[owner]** — ✅ all set; one thing left to *verify* (2026-09-22)

These are **not** in `config.toml` (that governs local dev only) — they were set in the
Supabase dashboard → Authentication. `config.toml` still shows the old local-dev values
(`minimum_password_length = 6`, `enable_confirmations = false`); that is expected and
is not a signal about production.

- ✅ **Redirect URLs:** `catchupcolumn://` and `catchupcolumn://(auth)/reset-password`
  allowlisted, so password-reset deep links work in release builds.
- ✅ **Minimum password length** raised from 6.
- ✅ **Email confirmation** decision made.
- ✅ **Custom SMTP → Resend, sending limit 100/hour** (2026-09-22). Auth email no
  longer goes through Supabase's built-in sender. Detail below — it is the one
  setting here that has a capacity number attached, and the number was reasoned
  about rather than defaulted.

✅ **`{{ .Token }}` is in the Magic Link email template** — `supabase/templates/magic-link.html`
pasted into Dashboard → Authentication → Email Templates → **Magic Link** on
2026-09-22. The repo file stays the source of truth; if you edit one, edit the
other. Why it mattered: Supabase sends magic links and one-time codes through the
same call and the same template, and the stock template contains
`{{ .ConfirmationURL }}`, so people would have received a *link* — which cannot
hand back to the app until universal links are configured (step 2). The 6-digit
code needs none of that.

☐ **Paste `supabase/templates/confirm-signup.html` into the "Confirm signup"
template.** **There are two templates, not one** — confirmed by testing on
2026-09-22, when sign-up with a fresh address still arrived as the stock
*"Confirm your signup / Follow this link to confirm your user"* even though Magic
Link had already been fixed.

Both entry points go through the same call, but GoTrue routes them to different
templates:

| Entry point | `lib/auth.ts` | Template |
| --- | --- | --- |
| Sign in, existing account | `sendEmailCode(…, { allowNewUser: false })` | **Magic Link** — ✅ done |
| Sign up, new address | `sendEmailCode(…, { allowNewUser: true })` | **Confirm signup** — ☐ |

Fixing only one leaves the other mailing a dead link, and the half that breaks is
**sign-up** — nearly all of Group Zero. The app's signup screen asks for six
digits and has no way to receive a link, so the person is simply stuck.

☐ **Set the email OTP length to 6.** Dashboard → Authentication → the email
provider's **OTP Length**. Observed sending **8** digits on 2026-09-22, which
does not just look wrong — it makes sign-in *impossible*:
`hooks/use-email-code.ts` hard-codes `CODE_LENGTH = 6`, the input carries
`maxLength={6}`, and `setCode` slices to 6. An 8-digit code is silently truncated
as the person types, then rejected. There is no error that explains it.

**6 is the number to standardise on**, not 8: it matches `config.toml`'s
`otp_length = 6` for local dev, every piece of UI copy derives from
`CODE_LENGTH`, and fewer digits is the accessible choice for the audience the
floor exists for. Changing the dashboard is one field; changing the app is a
release.

☐ **Set both templates' subject lines.** A separate dashboard field the repo
files do not cover, and it still holds Supabase's defaults — the code email
arrived subject-lined *"Your Magic Link"* on 2026-09-22 while its body said
"here is your code." Use the same plain subject on both, e.g. **"Your Catch Up
Column code"**. Both templates carry a hidden preheader that already surfaces the
code in the inbox preview line.

☐ **Re-verify both paths after pasting.** An existing account *and* an address
that has genuinely never been used — note that a previous failed test **creates
the user**, so re-running with the same address exercises the sign-in path, not
sign-up. Use a fresh alias. Six digits on both, no button on either.

> **Don't "fix" this by turning email confirmation off instead.** Fixing the
> template is idempotent and holds regardless of that setting; flipping a setting
> to dodge a template is the kind of thing that silently reverts and takes
> sign-up with it.

☐ **Email confirmation can now be left off.** The code flow *is* confirmation —
nobody completes sign-up without receiving mail at that address — and there is no
longer a password-signup path that could create an unverified account. This
closes the open question in `bugs.md` D2.

### Auth email goes through Resend SMTP — ✅ set 2026-09-22

**Two email systems, and they are easy to confuse.** Only the second one is
governed by anything on this page:

- **Edition email** — the Resend **API**, called from
  `supabase/functions/_shared/edition-dispatch.ts`. Configured by the
  `RESEND_API_KEY` / `EMAIL_FROM` function secrets (step 4). Never touches
  Supabase Auth, and is **not** subject to the Auth rate limit below.
- **Auth email** — the 6-digit sign-in code (`lib/auth.ts` → `signInWithOtp`) and
  password reset (`resetPasswordForEmail`). These go through Supabase Auth,
  which until 2026-09-22 used Supabase's **built-in sender** — a testing
  facility with a low per-hour cap, on a shared IP, not intended for production.

Dashboard → Authentication → SMTP Settings, pointed at Resend: host
`smtp.resend.com`, user `resend`, password = the same `RESEND_API_KEY`, sender on
the **root** domain (`@catchupcolumn.com`) for the DKIM reason in step 4.

`supabase/templates/magic-link.html` is unaffected — SMTP is transport only, and
the template still has to carry `{{ .Token }}` per the item above.

#### Rate limit for sending emails: **100/hour**

Set 2026-09-22. Supabase defaults this to 30 once custom SMTP is enabled, and 30
is roughly the burst Group Zero itself creates — the worst possible place to sit.

The sizing quantity is peak concurrent onboarding, not total users. The realistic
spike is an organizer walking one whole Group through TestFlight install in a
single sitting: 6–10 people, at **1.5–2 emails each** once mistyped addresses,
codes landing in spam, and "resend code" taps are counted. That is 15–20 emails
for one Group; two Groups on the same evening, or one Group plus ordinary
sign-backs-in, clears 30.

Why the headroom is worth it: **the cap is project-wide, not per-user.** When it
is hit, the next person to open the app gets a hard error — including someone
signing back in who had nothing to do with the burst. During Group Zero that
reads as "the app is broken," or worse as "they lost interest," which is exactly
the signal corruption Sentry was wired to prevent
([POSITIONING.md](./POSITIONING.md) §11). You would be measuring retention
through a broken sign-in.

Why not higher: with custom SMTP the sender reputation on the line is **ours** —
our DKIM, our Resend account, `catchupcolumn.com`'s standing with Gmail. Someone
hammering the OTP endpoint against random addresses generates bounces and
complaints against our domain, not Supabase's. 100/hour keeps the blast radius
small enough to notice in Resend's dashboard before Gmail does.

Two companion checks, neither of which this setting covers:

☐ **Confirm the per-address minimum interval** (Authentication → Rate Limits —
Supabase defaults it to 60s). That is what actually stops one address being
spammed, and it is what makes a 100/hour ceiling safe rather than reckless.
`config.toml:223` shows `max_frequency = "1s"`, which is **local dev only** and
says nothing about production — same caveat as the rest of this step.

☐ **Check the Resend plan's daily cap.** On the free tier (100/day, 3,000/month —
verify in the Resend dashboard) a 100/hour Auth ceiling is notional, because Auth
email now shares that daily budget with edition email. Note the collision:
`groups.publish_day` defaults to 0 (Sunday) and `publish_time` to 09:00, so
unless a Group changed it, every Group Zero edition mails in one burst — 5 Groups
× 8 members ≈ 40 emails at 09:00 Sunday. Onboarding a new Group that same morning
stacks an auth burst on top of it.

**Re-derive this number at App Store launch.** It should track peak signups per
hour, which is a different quantity from anything Group Zero will show.

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

## 6b. Illustration rework — ⏸ deferred (no longer the gate)

Reworking the hand-drawn illustration world (the paperboy and his dog). Scope is in
[`design/ILLUSTRATION_REWORK.md`](../design/ILLUSTRATION_REWORK.md).

**Status changed 2026-09-16.** This was "the active product gate," on the reasoning
that screenshots freeze the final look. POSITIONING §8 supersedes that: Group Zero
is the long pole, it needs a TestFlight build rather than finished art, and it
produces real friend-group screenshot content as a by-product. So the rework is
still the last planned product change before *submission* — it just no longer
blocks the enrollment (step 7) or the first build (step 8), and the four-week
Group Zero run is the natural window to do it in.

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
- **Then** capture screenshots (step 7) against Group Zero's real content.

## 7. Store account, assets, and metadata **[owner]** — ✅ enrolled 2026-09-22; the rest deferred

iOS only. **Enrollment landed 2026-09-22.** Everything *after* it still waits,
because screenshots freeze the final look and Group Zero will produce better ones.

- ✅ **[owner] Apple Developer Program ($99/yr) — enrolled 2026-09-22.** This was
  the multi-day-tail item that gated the APNs key (step 3), the Team ID for
  step 2's universal links, and the TestFlight build Group Zero's editions 3–4
  need (step 8).
- ☐ **[owner] Copy the Apple Team ID out and use it.** It is in the developer
  account under Membership details. Two places want it: step 2's
  `web/.well-known/apple-app-site-association` (replacing the literal `TEAMID`)
  and `app.json`'s `associatedDomains`. Nothing else in this step is blocked on it.
- ☐ **[owner] Confirm the bundle ID `com.catchupcolumn.app` is final** before the
  first submission — it is **immutable afterwards**.
- ⏸ Create the app record in App Store Connect (after Group Zero).
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

iOS only. Deferred until Group Zero's four editions are in (POSITIONING §8) —
not until 6b lands; a TestFlight build for Group Zero comes first and needs only
the enrollment.

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
others see. **Decided 2026-08-05: build all three** rather than argue the
invite-only model — a rejection costs a review cycle and all three were cheap.
This was previously flagged as the likeliest rejection cause; it is now closed.

Shipped: acceptable-use terms (`docs/TERMS.md §4` / `web/terms.html`), a report
path (`components/report-story-link.tsx`, drafting a mailto with the
story/group/edition ids; `lib/report.ts` is the seam to swap for a real endpoint),
and moderator eject (`app/group/[id].tsx` → the `remove_group_member` RPC, which
also deletes the removed member's *uncompiled* posts so they can't land in
tomorrow's edition; `prevent_last_moderator_removal` guards the sole-moderator
case).

☐ **Still to do:** smoke-test both affordances on device, and re-run the Gate 1
automated checks — this code landed after Gate 1 last passed. Both are tracked in
[PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md) Gates 6–7; don't keep a
second copy of the list here.

## 10. Sentry setup **[owner]** — ☐ needed before Group Zero

Relocated here from POSITIONING §11 (2026-09-16) — that doc records *why* Sentry
and not the alternatives; this is how to turn it on.

The code is wired and inert until a DSN exists, and a crash on a friend's phone
during Group Zero reads as "they lost interest," which corrupts the only signal
the exercise produces. Sentry's free tier (5k errors a month) is far more than
Group Zero will generate. Parts 1–3 below take about ten minutes and are the ones that
matter; 4–5 make the traces readable.

**1. Create the project.** sentry.io → new organization if you don't have one →
**Create Project** → platform **React Native** → name it `catch-up-column`.
Alert frequency: "on every new issue" is right at this scale; you want the email.

**2. Copy the DSN.** Shown on the setup screen, and afterwards under
*Settings → Projects → catch-up-column → Client Keys (DSN)*. It looks like
`https://<hash>@o<org>.ingest.sentry.io/<project>`. The DSN is not a secret —
it's compiled into the app binary and only allows *writing* events — so
`EXPO_PUBLIC_` is the correct prefix and committing it would be harmless. It's
in `.env.local` (gitignored) purely to keep environments separable.

```bash
# .env.local
EXPO_PUBLIC_SENTRY_DSN=https://…@o0.ingest.sentry.io/0
```

**3. Verify it reports.** `Sentry.init` is deliberately disabled in dev
(`enabled: !__DEV__`), so a simulator run will *not* send anything — this is the
step people get stuck on. Test on a preview build:

```bash
eas build --profile preview --platform ios
```

Then temporarily add `Sentry.captureException(new Error('sentry smoke test'))`
to a screen, trigger it, and confirm the issue appears in the Sentry dashboard
within a minute or so. Remove the line afterwards. If nothing arrives, check
that the DSN was present at build time — `EXPO_PUBLIC_*` values are inlined
during the bundle step, not read at runtime, so a DSN added after the build
won't apply.

**4. Source maps.** Without these, every stack frame is a minified one-liner and
the reports are close to useless. The `@sentry/react-native` config plugin
uploads them during an EAS build when three build-time variables are present.
Create an auth token at *Settings → Auth Tokens* with the `project:releases`
scope, then:

```bash
eas secret:create --scope project --name SENTRY_ORG        --value <org-slug>
eas secret:create --scope project --name SENTRY_PROJECT    --value catch-up-column
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token>
```

`SENTRY_AUTH_TOKEN` **is** a real secret — never put it in `.env.local`, app.json,
or a commit. The other two are just names.

**5. Sanity-check what's being sent** once real reports arrive. Open an issue and
confirm it carries a stack trace, device model, OS and app version — and *not* a
display name, email, post body, or a URL with a group id in the query string.
The config in `app/_layout.tsx` is written to prevent all of those; if any shows
up, the config drifted and `docs/PRIVACY.md` plus the App Store privacy labels
in `docs/STORE_LISTING.md` need re-checking before submission.

**Not worth turning on:** performance tracing, session replay, profiling, user
feedback widgets. Each one widens what you collect, each needs a privacy-doc
update, and none of them answer a question you have at eight users.

## 11. Post-approval

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

## On-device smoke test

Owned by [PRESUBMISSION_CHECKLIST.md](./PRESUBMISSION_CHECKLIST.md) **Gate 7** —
two accounts, a TestFlight build, and eleven checks from signup through account
deletion. It used to be duplicated here; it isn't any more.

The one item in it that is *also* a live ops concern rather than a submission
gate is the cron, because it fails silently and Group Zero depends on it. That's
the next section.

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
