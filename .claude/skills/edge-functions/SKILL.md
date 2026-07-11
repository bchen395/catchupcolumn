---
name: edge-functions
description: Use when adding or editing a Supabase Edge Function in `supabase/functions/` (Deno) — the cron compiler, manual publish, unsubscribe, account deletion, or the shared email/push dispatch helpers. Catches the session up on the Deno/esm.sh setup, the two client patterns (service-role vs caller-scoped), CORS, the claim/lease delivery model, and deploy/config.
---

# Edge functions & delivery — Catch Up Column

These are Deno functions that run server-side with elevated privileges: edition compilation (cron), moderator immediate-publish, unsubscribe, and account deletion. They call SQL RPCs defined in `supabase/migrations/` and deliver editions via Resend (email) and Expo (push). This is **not** React Native — it's Deno, ESM-only, with its own runtime and types. SQL bodies live in **`db-migrations`**; app-side calls into these functions live in **`data-layer`** (`supabase.functions.invoke` / `lib/editions.ts`).

## Read first (sources of truth, in order)

1. **`supabase/functions/_shared/edition-dispatch.ts`** — the reusable email + push engine. Read this before touching any delivery path; it owns the claim/lease idempotency.
2. **`supabase/functions/_shared/edition-email.ts`** — the email subject/HTML/plain-text renderers (table-based, email-safe, full brand treatment). Design decisions (photos, full content, colophon, subject chain) are documented in the file header; preview fixtures live in `_shared/preview/render-email-fixtures.ts` (dev-only, `deno run --allow-write`).
3. **A function that matches your trigger model:**
   - `compile-editions/index.ts` — cron + manual, `CRON_SECRET` auth, sweeps all pending editions.
   - `publish-edition-now/index.ts` — caller-JWT auth, single edition, then service-role dispatch.
   - `unsubscribe/index.ts` — public GET (human click → HTML page) **and** POST (RFC 8058 one-click from the `List-Unsubscribe` header → plain text), token-based.
   - `delete-account/index.ts` — caller-verified then service-role cleanup + auth deletion.
4. **`supabase/functions/deno.json`** and **`supabase/config.toml`** (`[edge_runtime]`, per-function `verify_jwt`).

## Hard rules

- **Deno, not Node.** Imports are ESM URLs (`import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`); the import map is `supabase/functions/deno.json`. Shared code is imported with explicit `.ts` extensions (`'../_shared/edition-dispatch.ts'`). Env is `Deno.env.get(...)`. The entrypoint is `Deno.serve(async (req) => …)`.
- **Pick the right client — this is the most common mistake:**
  - **Service-role client** (`createClient(url, SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })`) — bypasses RLS; required for the dispatch RPCs granted only `to service_role` (`claim_edition_for_email`, `get_edition_*`, `mark_*`). Use for all worker/cron/dispatch work.
  - **Caller-scoped client** (anon key + `global: { headers: { Authorization: authHeader } }`) — preserves the user's identity so `auth.uid()` resolves inside the RPC. Required when an RPC enforces a per-user check (e.g. `publish_edition_now`'s moderator gate). `publish-edition-now` uses the caller client for the RPC, then a service-role client for dispatch.
  - Using the wrong key fails as a *permissions* error, often silently — verify before debugging anything else.
- **Validate env up front, fail with 500.** Every function reads its env (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, optional `FUNCTIONS_PUBLIC_URL`/`EMAIL_FROM`/`WEB_BASE_URL`) and returns a clear 500 if a required one is missing. `SUPABASE_*` are auto-injected; `RESEND_API_KEY` and `CRON_SECRET` are manual secrets. `WEB_BASE_URL` (default `https://catchupcolumn.com`) is the base for every link in the edition email — links are https on purpose (Gmail blocks `catchupcolumn://` deep links); the web pages hand off to the app.
- **Edition-email photos are signed at send time.** `sendEditionEmail` batch-signs each post's `image_url` from the private `post-images` bucket (`createSignedUrls`, 1-year TTL — deliberate: emails are re-read and forwarded) and attaches `image_signed_url`. Photo failures are logged and skipped; a send never fails over a photo. The payload RPC returns the raw stored value (path or legacy public URL) — normalization lives in `toStoragePath` (mirrors `lib/posts.ts`).
- **CORS + response helpers are boilerplate — copy them.** Handle `OPTIONS` → `corsHeaders`; reject non-target methods with `json(405, …)`; wrap JSON responses in the `json(status, body)` helper (spreads `corsHeaders` + `Content-Type`). `unsubscribe` returns HTML via its `html()`/`page()` helpers instead.
- **Authenticate per the trigger model:**
  - Cron/manual-internal (`compile-editions`) → match `Authorization: Bearer <CRON_SECRET>`; `verify_jwt = false` in `config.toml`.
  - User action (`publish-edition-now`, `delete-account`) → require the `Authorization` header, `getUser()` on the caller client, let the RPC enforce the role.
  - Public link (`unsubscribe`) → no auth, opaque UUID token only; `verify_jwt = false`.
- **Delivery is idempotent via claim/lease — never bypass it.** Claim before sending (`claim_edition_for_email` / `claim_edition_for_push`), do the work, then `mark_*` on success or `release_*` on failure. A 5-minute stale claim auto-recovers a crashed worker. **Email sends at most once** (`mark_edition_emailed` after the first attempt; per-recipient failures are logged, *not* retried, to avoid duplicates). **Push retries up to `MAX_PUSH_ATTEMPTS` (3)**, then is marked pushed despite failures.
- **Trust delivery-provider payloads, not just HTTP status:**
  - **Resend** — non-2xx is a hard fail; one POST per recipient.
  - **Expo push** — a 200 can still contain per-ticket errors. Batch ≤ 100 and inspect the `data[]` ticket array (`status: 'ok' | 'error'`), don't assume success from the HTTP code.
- **Reuse `_shared`, don't re-implement.** New delivery logic extends `edition-dispatch.ts`; new email markup extends `edition-email.ts`. Both `compile-editions` and `publish-edition-now` already depend on them.
- **Map RPC exceptions to stable codes.** When an RPC can `raise exception` (e.g. `publish_edition_now`), parse `error.message` for the known codes and return a stable `{ code, status }` (see `mapRpcError` in `publish-edition-now`). The app switches on these.

## `_shared/` inventory

| Export (file) | Use |
| --- | --- |
| `dispatchPendingEmails` (`edition-dispatch.ts`) | Cron sweep: claim + email up to 50 unsent editions. |
| `dispatchPendingPushes` (`edition-dispatch.ts`) | Cron sweep: claim + push editions under the retry cap. |
| `sendEditionEmail` (`edition-dispatch.ts`) | Email one edition to all recipients (mark-once). |
| `pushEdition` (`edition-dispatch.ts`) | Push one edition (batch ≤100, ticket inspection, retry accounting). |
| `dispatchSingleEdition` (`edition-dispatch.ts`) | Email + push one edition with the same claim/lease — used by manual publish. |
| `renderEditionEmailHtml` / `renderEditionEmailText` / `renderEditionEmailSubject` (`edition-email.ts`) | Brand-styled email HTML + plain-text part + content-led subject (first titled post → names fallback). |
| `MAX_PUSH_ATTEMPTS`, `EMAIL_FROM` (`edition-dispatch.ts`) | Shared constants. |

## Deploy & local test

```bash
# Local: brings up the API + a hot-reloading functions runtime; inbucket captures email.
npx supabase start
curl -X POST http://localhost:54321/functions/v1/compile-editions \
  -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json"

# Deploy
npx supabase functions deploy <name>
npx supabase functions deploy unsubscribe --no-verify-jwt   # public/cron fns skip JWT
```

- **`config.toml` gotcha:** any function not verifying a Supabase JWT needs `[functions.<name>] verify_jwt = false` (set for `compile-editions` and `unsubscribe`). Forgetting it makes cron/public calls 401.
- **Secrets:** set `RESEND_API_KEY` and `CRON_SECRET` (and `EMAIL_FROM`/`FUNCTIONS_PUBLIC_URL`/`WEB_BASE_URL` if overriding) in the Supabase dashboard / `supabase secrets set`. They are *not* in `.env`.
- **Email preview:** `deno run --allow-write=preview-out supabase/functions/_shared/preview/render-email-fixtures.ts preview-out` renders fixture editions (thin/full/untitled/long) to HTML+text with byte sizes (Gmail clips at ~102KB). Eyeball in a browser at 600px and ~375px before shipping renderer changes.
- **Typecheck:** `npm run typecheck` does **not** cover these (`tsconfig.json` excludes `supabase/functions/**`). Use `deno check supabase/functions/**/*.ts` if you want type checking.

## Workflow for a function change

1. Read `_shared/edition-dispatch.ts` and the closest existing function for the trigger model.
2. Choose the client(s): caller-scoped for identity checks, service-role for dispatch. Often both, in that order.
3. Reuse `_shared` for delivery; copy the CORS/`json`/env-validation boilerplate.
4. If adding RPCs, define them in a migration first (`db-migrations`) with the right `grant` (`service_role` for workers).
5. Preserve claim/lease idempotency and stable error codes.
6. Set `verify_jwt` in `config.toml` and ensure secrets exist before deploy; smoke-test with `curl` against the local stack.

## Keep this skill alive (self-maintenance)

Before finishing a session that changed how functions are structured or how delivery works — without being asked:

- Update the `_shared/` inventory and hard rules here if helpers, the client patterns, or the claim/lease model changed.
- If a new function is added, note its trigger model and whether it needs `verify_jwt = false`.
- Keep the secrets/env list and the RPC-grant expectations consistent with the `db-migrations` skill.
