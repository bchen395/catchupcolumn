# Launch Runbook — Catch Up Column

Everything left to take Catch Up Column from "code-complete" to "live in the App
Store and Play Store," in order. Steps marked **[owner]** need your accounts/logins
and can't be automated from the repo. Metadata and questionnaire answers live in
[STORE_LISTING.md](./STORE_LISTING.md).

Project ref: `wvaxfyhihcfilewygtzp` · Bundle ID: `com.catchupcolumn.app`

**Plan:** the backend and legal-hosting work is done; the remaining gate before
store submission is the **UI redesign (step 6)**. Store screenshots (step 7) and the
production build (step 8) both capture the final UI, so the redesign comes before
them. The infra/owner steps (2–5) don't depend on the UI and can proceed in parallel.

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
  below WCAG AA) — revisit in the redesign (step 6).

---

## 1. Merge the web & legal-hosting PR **[owner]**

Open a PR from `web-legal-pages-and-vercel` into `main` and merge it. This lands the
legal/support pages, the Vercel config, and the `.well-known` files.

## 2. Deploy the site to Vercel + point the domain **[owner]** — *in progress*

The site is what `WEB_BASE_URL` and every email/edition link resolve to.

1. Import the repo into Vercel with **Root Directory `web`** (Framework: Other, no
   build command). Vercel reads `web/vercel.json`.
2. Add `catchupcolumn.com` (+ `www`) under Domains and create the DNS records in
   Cloudflare with the **proxy turned OFF (grey cloud)** — full steps in
   `web/README.md`.

Verify after deploy:

```bash
curl -sI https://catchupcolumn.com/privacy | grep -i '^HTTP'   # → 200
```

**Universal links** stay dormant until you (a) replace `TEAMID` in
`web/.well-known/apple-app-site-association` with your Apple Team ID and the Android
SHA-256 in `assetlinks.json`, and (b) add `associatedDomains`/`intentFilters` to
`app.json` (snippet in `web/README.md`) so the next build declares the domain.

## 3. EAS project setup **[owner]** — unblocks builds *and* production push

Without an EAS project ID, production push notifications silently never register —
this is the single most important step for a working release build.

```bash
npx eas-cli login
npx eas-cli init            # creates the project; writes owner + extra.eas.projectId into app.json
```

Then make the public Supabase config available to EAS Build (the app throws at
launch if these are missing). Values are the same as your `.env.local`:

```bash
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://wvaxfyhihcfilewygtzp.supabase.co"
npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<your anon key>"
# repeat with --environment preview if you want internal preview builds too
```

Upload push credentials (needed for push on real devices):

```bash
npx eas-cli credentials    # iOS: add an APNs key · Android: add the FCM v1 service account
```

Commit the `app.json` change that `eas init` makes (the new `owner` +
`extra.eas.projectId`). If you're enabling universal links, add the
`associatedDomains`/`intentFilters` block (step 2) in the same commit so it's in the
build.

## 4. Email deliverability — Resend **[owner]**

`EMAIL_FROM` currently falls back to the Resend sandbox sender, which tanks
deliverability. Verify your domain in Resend, then point the secret at it:

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

## 6. Redesign the UI **[planned — the remaining product gate]**

The last major work item before launch. Store screenshots (step 7) and the
production build (step 8) both freeze the final look, so land the redesign first.

- **Start from the design system:** read `design/BRAND.md` and the `frontend-design`
  skill; BRAND.md is the source of truth — update it in the same change as any
  decision that shifts.
- **Scope (to define):** e.g. the contrast pass on orange-as-text (currently an
  accepted below-AA decision, BRAND.md §2), typography, spacing, and screen-level
  polish. Nail the scope down before starting so it doesn't sprawl.
- **Verify when done:** run the `verify-changes` checklist — `npm run typecheck` plus
  manual QA of every screen (auth, onboarding, group create/join, composer, editions
  list, edition reader, profile) at large system font sizes.
- Only capture store screenshots **after** this lands.

## 7. Store accounts, assets, and metadata **[owner]**

- Enroll in the **Apple Developer Program** ($99/yr) and **Google Play Console**
  ($25 one-time). Confirm the bundle ID `com.catchupcolumn.app` is final — it's
  immutable after first submission. (You'll also need the Apple Team ID here for
  step 2's universal links.)
- Create the app records in App Store Connect and Play Console.
- **Screenshots (after the redesign, step 6):** iPhone 6.9" required (Home, an edition
  front page, the composer, a group). No iPad shots needed (iPad support is off).
  Android phone shots too.
- Paste the descriptions, keywords, and the privacy/data-safety answers from
  [STORE_LISTING.md](./STORE_LISTING.md). Enter the URLs from step 2.

## 8. Build & submit **[owner]**

```bash
npx eas-cli build --platform all --profile production
npx eas-cli submit --platform ios --latest
npx eas-cli submit --platform android --latest
```

Then complete the store-console review forms (age rating / data safety) and submit
for review.

---

## Post-launch smoke test (recommended before wide release)

Using a TestFlight / internal-testing build:

1. Sign up → set name/avatar → create a group. Confirm profile loads (validates the
   `users` column-grant change against production).
2. Invite a second test account; both see the group.
3. Write a post with a photo; publish the edition (moderator "publish now").
4. Confirm the edition email arrives from your verified domain and the push fires.
5. Tap the email's unsubscribe link → confirm the styled confirmation page.
6. Profile → Delete account → confirm it completes and signs out.
