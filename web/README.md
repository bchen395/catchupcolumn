# catchupcolumn.com — static pages

The link targets for the edition email (`WEB_BASE_URL` in the edge functions):

| URL | File | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Pitch page — where "Start one for your people →" lands (via the `/start` redirect). |
| `/start` | `_redirects` → `/` | Stable colophon URL from sent emails; never change it. |
| `/edition/{id}` | `edition/index.html` | Deep-link bouncer: tries `catchupcolumn://edition/{id}`, falls back to get-the-app buttons. |

`config.js` holds the app scheme and store URLs. Store URLs are empty until
the listings are live — the pages show a "coming soon" line instead of dead
buttons. Fill them in when the App Store / Play listings publish.

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo
   (or `wrangler pages deploy web` for direct upload).
2. Build settings: no build command, output directory `web`.
3. Custom domain: add `catchupcolumn.com` (and `www`) — Cloudflare handles DNS
   if the domain is on Cloudflare; otherwise CNAME per their instructions.

The `_redirects` file is Cloudflare Pages syntax (Netlify-compatible). For
plain S3/nginx hosting, replicate the two rules in the server config.

## Later: universal links

When ready, add `associatedDomains` (iOS) / `intentFilters` (Android) to
`app.json` plus `/.well-known/apple-app-site-association` and
`/.well-known/assetlinks.json` here. The email's `https://catchupcolumn.com/edition/{id}`
links then open the app directly and this bouncer becomes the no-app fallback —
no email or edge-function changes needed.
