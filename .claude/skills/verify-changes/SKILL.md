---
name: verify-changes
description: Use before declaring a change done in Catch Up Column — the project-specific checklist for confirming a change is sound. There is no automated test suite, so verification is typecheck + lint + targeted manual QA. Covers what to run (`npm run typecheck`, `npm run lint`, `deno check`, `supabase db push`) and how to exercise each surface.
---

# Verify a change — Catch Up Column

Be honest about what this repo can and can't do: **there is no test runner.** There is a typecheck and a lint gate, but nothing that exercises behaviour. So "verified" here means *typechecked, linted, and manually exercised on the right surface* — not "tests pass." State clearly what you checked and what you didn't.

For *launching* the app, defer to the built-in **`run`** / **`verify`** skills and the patterns below. This skill is the project-specific checklist that wraps them.

## CI runs the static half for you

`.github/workflows/ci.yml` runs on every PR and every push to `main`. **Each job runs only when its surface changed** (a `changes` job sorts the diff), so a docs-only PR builds nothing and goes green in seconds. A change under `.github/`, or a manual run, checks everything.

| Job | Runs when | Gate |
| --- | --- | --- |
| `app` | app code, dependencies or Expo config changed | `npm run typecheck`, `npm run lint`. **Only when `package.json`, the lockfile, `app.json`, `eas.json` or `.nvmrc` changed:** `npx expo-doctor`, `npx expo install --check` |
| `bundle` | same | a real `expo export` Metro bundle for **iOS and Android** — catches bad imports, missing native modules, and config-plugin errors that typecheck can't see. Prints bundle size to the run summary. |
| `fingerprint` | same, PRs only | computes the expo-updates runtime fingerprint for the base and the PR, both platforms. **Warns, never fails**, when it moved, and lists what moved in the run summary. A moved fingerprint means an OTA from that PR can't reach existing builds. |
| `edge-functions` | `supabase/functions/` or `scripts/group-zero/` changed | `deno check` on every function file, plus the edition-email fixture render, which **fails if a fixture would hit Gmail's ~102KB clip limit**. Uploads the rendered emails as an artifact so you can eyeball them from the PR. |
| `migrations` | `supabase/migrations/` or `config.toml` changed | Refuses any edit to an already-merged migration, then applies the whole history from scratch against a real Postgres and runs `supabase db lint`. The lint only *reports*: without `--fail-on error` it can't fail the job, and it currently shows two known `PGRST301` errors (todo.md). Read its output rather than trusting the green tick. |
| `deploy-reminder` | a push to `main` changed functions or migrations | Not a gate. Writes the by-hand `db push` / `functions deploy` commands for that merge into the run summary, because merging deploys nothing. |
| `ci-passed` | always | The one check to require in branch protection: green when every job above passed or was skipped as not applicable. |

Two more workflows sit beside it:

- **`dependency-health.yml`** — Mondays, and on demand. `expo-doctor`, `expo install --check`, and `npm audit --omit=dev --audit-level=high`. These fail because of what was published that day, not because of a diff, so they no longer run on unrelated PRs (19 of the 20 failed CI runs before 2026-11-13 were the expo-doctor step, mostly on docs PRs). A red run here is the signal; the file's header says what to do about each.
- **`codeql.yml`** — CodeQL on the TypeScript and on the workflow files, on PRs that touch code, on `main`, and weekly. Findings land under Security → Code scanning. It does not read SQL: RLS and the RPCs are still reviewed by hand (`db-migrations` skill).

Actions are pinned to commit SHAs; `.github/dependabot.yml` opens a weekly PR to move them. Dependabot does **not** manage npm — version bumps of Expo packages move the fingerprint.

So you don't have to run the baseline locally to be safe — but running it locally is still faster than waiting for a red build. **CI cannot replace the manual QA below**: it never renders a screen, never sends a push, and never touches a device.

## The baseline check (always)

```bash
npm run typecheck          # strict mode. Covers app code (app/, components/, lib/, hooks/, types/).
npm run lint               # eslint-config-expo. Must be 0 errors; warnings are informational.
```

- `tsconfig.json` is `strict: true` and **excludes `supabase/functions/**` and `scripts/group-zero/**`**. So `npm run typecheck` does **not** check edge functions or the operator script.
- For both (Deno), use `find supabase/functions scripts/group-zero -name '*.ts' -print0 | xargs -0 deno check` — what CI runs (a bare `**/*.ts` glob skips `_shared/` in non-globstar shells).
- `eslint.config.js` also skips `supabase/functions/**` (Deno's `https://` imports don't resolve under the Node resolver), plus `.expo/**` and `.claude/worktrees/**`.
- **Warnings are expected and are not a failure.** Three React-Compiler-era rules
  (`react-hooks/refs`, `set-state-in-effect`, `immutability`) are downgraded to
  warnings because they can't distinguish a real bug from the standard
  Reanimated / RN `Animated` idioms and the deliberate "reset state when the
  signed-in user changes" pattern. Read them; don't chase them to zero.
- There is no formatter — match surrounding style by hand (see `frontend-design` for the UI house style).

## Pick verification by surface

| You changed… | Static checks | Then exercise by… |
| --- | --- | --- |
| **UI** (`components/`, `constants/`, `app/` screens) | `npm run typecheck` + `npm run lint` | Run the app (below) and look at the screen. Check the 16px/48px floors and larger system font sizes (see `frontend-design`). |
| **Data layer** (`lib/`, `types/`) | `npm run typecheck` + `npm run lint` | Run the app and exercise the flow that calls the function (post, join, publish). Watch the Metro console for thrown errors. |
| **Migrations / RLS / RPC** (`supabase/migrations/`) | — | `npx supabase db push` against a local `supabase start` stack; then call the RPC/flow as a real (non-moderator and moderator) user. Confirm a forbidden action actually fails. |
| **Edge functions** (`supabase/functions/`) | `deno check …` | `npx supabase start`, `curl` the function; for email check **Mailpit** (local mail catcher, `[local_smtp]`, port 54324); for push you hit live Expo. **Then deploy it** — merging doesn't (see `edge-functions`). |

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

0. If the work is pushed, **CI is the authority** on the static checks — read the run, don't re-derive it.
1. `npm run typecheck` clean and `npm run lint` at 0 errors (and `deno check` if functions changed).
2. The specific surface exercised in the running app or against the local Supabase stack.
3. Negative/authorization paths checked when relevant.
4. Report plainly what you verified and what you did **not** (e.g. "typechecked and ran on web; did not test push on a physical device").
5. If the change touches `supabase/migrations/` or `supabase/functions/`, say whether it has been **applied/deployed** to production — a merged-but-undeployed backend change is not done. For read-only production checks without Docker, `npx supabase db query --read-only "<SQL>" --remote` works (CLI v3: `--read-only` skips the confirmation a hosted query otherwise needs).

## Keep this skill alive (self-maintenance)

If the project gains real verification infrastructure, update this skill instead of letting it drift:

- A **test runner** (Jest/Detox/Maestro) is added → add it to the baseline and to the CI table above, and replace the matching "manual QA" rows with it.
- The **CI jobs change** → update the table above in the same commit; a stale table is worse than none, because it tells you a gate exists that doesn't.
- Until then, keep this skill's honesty: don't imply tests exist when they don't. `typecheck`, `lint`, `deno check`, a two-platform bundle, the email clip-limit check, and migration application are wired **and automated**; a behaviour/UI suite is not.
