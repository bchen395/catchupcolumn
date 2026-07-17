# catchupcolumn.com — static pages

The link targets for the edition email (`WEB_BASE_URL` in the edge functions):

| URL | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Pitch page — where "Start one for your people →" lands (via the `/start` redirect). |
| `/start` | `vercel.json` redirect → `/` | Stable colophon URL from sent emails; never change it. |
| `/edition/{id}` | `vercel.json` rewrite → `edition/index.html` | Deep-link bouncer: tries `catchupcolumn://edition/{id}`, falls back to get-the-app buttons. |
| `/privacy` | `privacy.html` | Privacy Policy — App Store Connect / Play Console privacy URL, and the in-app `privacyUrl` (`constants/strings.ts`). |
| `/terms` | `terms.html` | Terms of Service — in-app `termsUrl`. |
| `/support` | `support.html` | Support page — App Store Connect Support URL, and the in-app `supportUrl`. |
| `/delete-account` | `delete-account.html` | Web-accessible account-deletion path (required by Google Play's Data safety form). |

The four document pages are hand-authored HTML kept in sync with their Markdown
sources in `docs/` (`PRIVACY.md`, `TERMS.md`, `SUPPORT.md`, `DATA_DELETION.md`).
When you edit a policy, update both the `.md` source and its `.html` page. Clean
URLs (`/privacy` → `privacy.html`) come from `cleanUrls` in `vercel.json`.

`config.js` holds the app scheme and store URLs. Store URLs are empty until
the listings are live — the pages show a "coming soon" line instead of dead
buttons. Fill them in when the App Store / Play listings publish.

## Deploy (Vercel)

This folder is a plain static site — no build step, no framework. `vercel.json`
holds all routing (`cleanUrls`, the `/start` redirect, the `/edition/*` rewrite);
Vercel reads it from the project's **Root Directory**.

**Git integration (recommended):**

1. Vercel dashboard → Add New → Project → import this repo.
2. **Root Directory: `web`** (this is the key setting — it makes Vercel deploy
   only this folder, not the Expo app at the repo root). Click "Edit" next to
   Root Directory and pick `web`.
3. Framework Preset: **Other**. Build Command: **none / empty**. Output Directory:
   leave blank (files are served from the root of `web`).
4. Deploy, then Settings → Domains → add `catchupcolumn.com` (and `www`) and
   follow Vercel's DNS instructions (A/CNAME or nameservers).

Every push to the default branch redeploys automatically. Because there's no
build, pushes that only touch the app are a no-op redeploy of identical files.

**CLI (one-off / preview):** from the repo root, `vercel --cwd web` (or `cd web &&
vercel`). `vercel --cwd web --prod` promotes to production.

Any static host works — the only host-specific file is `vercel.json`. On
Netlify/Cloudflare Pages the equivalent rules go in a `_redirects` file instead.

## Universal / app links

The association files live at `.well-known/` and ship with this site:

| File | Platform | Content-type |
| --- | --- | --- |
| `.well-known/apple-app-site-association` | iOS (no extension — served as `application/json` via the `headers` rule in `vercel.json`) | `application/json` |
| `.well-known/assetlinks.json` | Android | `application/json` (automatic) |

Both scope app-opening to `/edition/*` only — the marketing and legal pages (`/`,
`/privacy`, `/terms`, `/support`, `/delete-account`) intentionally stay in the
browser. To route more paths into the app later (e.g. https invite links), add
entries to the AASA `components` array and Android needs no path list.

**Two owner values must be filled before this activates** (until then the files are
harmless — links just fall through to the `/edition/{id}` bouncer):

1. **Apple Team ID** — replace `TEAMID` in `apple-app-site-association` with your
   10-char Team ID (`TEAMID.com.catchupcolumn.app`). Find it in the Apple Developer
   portal → Membership, or via `eas credentials`.
2. **Android signing SHA-256** — replace `REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT`
   in `assetlinks.json` with your app-signing cert's SHA-256 (colon-separated hex).
   Get it from `eas credentials` (Android) or Play Console → App integrity.

Then wire the app side in `app.json`:

```jsonc
"ios":     { "associatedDomains": ["applinks:catchupcolumn.com"] },
"android": { "intentFilters": [{
  "action": "VIEW", "autoVerify": true,
  "data": [{ "scheme": "https", "host": "catchupcolumn.com", "pathPrefix": "/edition" }],
  "category": ["BROWSABLE", "DEFAULT"]
}] }
```

The email's `https://catchupcolumn.com/edition/{id}` links then open the app
directly, and the bouncer becomes the no-app fallback — no email or edge-function
changes needed.

**Verify after deploy** (Apple/Google fetch over HTTPS with no redirects):

```bash
curl -sI https://catchupcolumn.com/.well-known/apple-app-site-association | grep -i content-type
# → content-type: application/json
curl -s https://catchupcolumn.com/.well-known/assetlinks.json | head
```
