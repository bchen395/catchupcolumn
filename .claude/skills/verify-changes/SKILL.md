---
name: verify-changes
description: Use before declaring a change done in Catch Up Column — the project-specific checklist for confirming a change is sound. There is no automated test suite, so verification is typecheck + targeted manual QA. Covers what to run (`npm run typecheck`, `deno check`, `supabase db push`) and how to exercise each surface.
---

# Verify a change — Catch Up Column

Be honest about what this repo can and can't do: **there is no test runner, no ESLint, and no `typecheck` npm script.** `react-test-renderer` is present but unused. So "verified" here means *typechecked + manually exercised on the right surface* — not "tests pass." State clearly what you checked and what you didn't.

For *launching* the app, defer to the built-in **`run`** / **`verify`** skills and the patterns below. This skill is the project-specific checklist that wraps them.

## The baseline check (always)

```bash
npm run typecheck          # strict mode; the de-facto gate. Covers app code (app/, components/, lib/, hooks/, types/).
```

- `tsconfig.json` is `strict: true` and **excludes `supabase/functions/**`**. So `npm run typecheck` does **not** check edge functions.
- For edge functions (Deno), use `deno check supabase/functions/**/*.ts`.
- There is no lint/format step — match surrounding style by hand (see `frontend-design` for the UI house style).

## Pick verification by surface

| You changed… | Typecheck | Then exercise by… |
| --- | --- | --- |
| **UI** (`components/`, `constants/`, `app/` screens) | `npm run typecheck` | Run the app (below) and look at the screen. Check the 16px/48px floors and larger system font sizes (see `frontend-design`). |
| **Data layer** (`lib/`, `types/`) | `npm run typecheck` | Run the app and exercise the flow that calls the function (post, join, publish). Watch the Metro console for thrown errors. |
| **Migrations / RLS / RPC** (`supabase/migrations/`) | — | `npx supabase db push` against a local `supabase start` stack; then call the RPC/flow as a real (non-moderator and moderator) user. Confirm a forbidden action actually fails. |
| **Edge functions** (`supabase/functions/`) | `deno check …` | `npx supabase start`, `curl` the function; for email check **inbucket** (local mail catcher); for push you hit live Expo. |

## Running the app

```bash
npm start            # Expo dev server (then press i / a, or scan)
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # web
npm run start:tunnel # tunnel mode when the device isn't on the LAN
```

- A VS Code debug config (`expo-web`) exists in `.claude/launch.json` for web debugging.
- Env: a working `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` is required — `lib/supabase.ts` throws at load if they're missing.

## Manual QA notes

- The audience is older adults and Gen Z friend groups — sanity-check warmth and readability, not just function (large tap targets, plain-spoken copy, no raw errors surfaced).
- For auth/role logic, **test the negative path**: a contributor must *not* be able to do moderator-only actions; RLS should reject it, not the UI alone.
- For delivery changes, verify idempotency: re-running compile/dispatch must not double-send (see the claim/lease model in `edge-functions`).

## Before saying "done"

1. `npm run typecheck` clean (and `deno check` if functions changed).
2. The specific surface exercised in the running app or against the local Supabase stack.
3. Negative/authorization paths checked when relevant.
4. Report plainly what you verified and what you did **not** (e.g. "typechecked and ran on web; did not test push on a physical device").

## Keep this skill alive (self-maintenance)

If the project gains real verification infrastructure, update this skill instead of letting it drift:

- A `lint` or `test` npm script is added → add it to the baseline check (typecheck is already wired as `npm run typecheck`).
- A test runner (Jest/Detox/Maestro) or CI is added → replace "manual QA" with "run the suite," and note the CI gate.
- Until then, keep this skill's honesty: don't imply tests exist when they don't.
