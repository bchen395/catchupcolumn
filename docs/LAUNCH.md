# Launch Runbook — Catch Up Column

Everything left to take Catch Up Column from "code-complete" to "live in the App
Store and Play Store," in order. Steps marked **[owner]** need your accounts/logins
and can't be automated from the repo. Metadata and questionnaire answers live in
[STORE_LISTING.md](./STORE_LISTING.md).

Project ref: `wvaxfyhihcfilewygtzp` · Bundle ID: `com.catchupcolumn.app`

---

## ✅ Already done (2026-07-03 pre-launch pass)

- **Security migration `20260703000000` applied to production** (`supabase db push`)
  — confirmed live via `supabase migration list`. Closes the cross-group
  post-injection hole, the email leak, and the unsubscribe-token leak.
- **All 4 edge functions verified byte-identical to the repo** — no redeploy needed.
- **Client code** updated to match the new DB grants (stops reading `users.email`).
- **Icons** regenerated in the brand palette + Android notification icon; `app.json`
  colors fixed; iPad support dropped; `eas.json` created.
- **Legal/support docs** written under `docs/`; Profile screen links to them.

> ⚠️ The migration is live but the matching client code ships in the pending PR.
> Until that PR is merged and a build made from it, run the app **from that branch**
> — an old build calling `select('*')` on `users` will fail profile load against
> production. Merging resolves this.

---

## 1. Merge the pre-launch PR **[owner]**

Review and merge the open PR (branch `launch-prep-security-store`). This aligns the
committed app code with the already-applied database changes.

## 2. EAS project setup **[owner]** — unblocks builds *and* production push

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
`extra.eas.projectId`).

## 3. Host the legal & support docs **[owner]**

Done in-repo: the four docs are now built as styled HTML pages in `web/`
(`privacy.html`, `terms.html`, `support.html`, `delete-account.html`), the owner
placeholders are resolved (support email `support@catchupcolumn.com`; TERMS
governed by California, USA), and the in-app links already point at these URLs:

| Page | URL |
| --- | --- |
| `web/privacy.html` | `https://catchupcolumn.com/privacy` |
| `web/terms.html` | `https://catchupcolumn.com/terms` |
| `web/support.html` | `https://catchupcolumn.com/support` |
| `web/delete-account.html` | `https://catchupcolumn.com/delete-account` |

They deploy with the rest of `web/` — import the repo into Vercel with **Root
Directory `web`** and add the `catchupcolumn.com` domain (full steps in
`web/README.md`). Routing (clean URLs, `/start`, `/edition/*`) lives in
`web/vercel.json`. Remaining owner action: confirm the `support@catchupcolumn.com`
inbox actually exists/forwards, and keep the `.md` sources in `docs/` and the
`.html` pages in sync on future edits.

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

## 6. Store accounts, assets, and metadata **[owner]**

- Enroll in the **Apple Developer Program** ($99/yr) and **Google Play Console**
  ($25 one-time). Confirm the bundle ID `com.catchupcolumn.app` is final — it's
  immutable after first submission.
- Create the app records in App Store Connect and Play Console.
- **Screenshots:** iPhone 6.9" required (Home, an edition front page, the composer,
  a group). No iPad shots needed (iPad support is off). Android phone shots too.
- Paste the descriptions, keywords, and the privacy/data-safety answers from
  [STORE_LISTING.md](./STORE_LISTING.md). Enter the URLs from step 3.

## 7. Build & submit **[owner]**

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
