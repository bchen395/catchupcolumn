# Composer redesign — working scope

**Status:** designed 2026-07-18, decision recorded 2026-08-05, **not landed**.
Unfinished code preserved on branch `composer-redesign-wip` (commit `c2d3527`).

This is a working document, following `design/ILLUSTRATION_REWORK.md`. When the
redesign lands, fold the decision below into `design/BRAND.md` §9 and delete
this file.

## Why this document exists

The redesign was built in an in-repo git worktree that was then abandoned with
the work uncommitted. The 2026-09-10 audit found it and had to answer whether it
was newer or older than the shipped composer. It is **newer** — nothing on main
supersedes it:

- Main has no composer-layout work at all: no `ComposeActionBar`, no "File my
  story", no BRAND §9 composer paragraph.
- The only later change to `app/(tabs)/post.tsx` on main is `3773684`
  (2026-08-23), the loading pass, which added `ComposerSkeleton`. That is an
  orthogonal loading affordance, not a layout decision.
- The design half (the BRAND §9 paragraph and the `Strings.thisWeek`
  additions) was written **2026-08-05**, five minutes after the worktree's base
  commit and *after* the 2026-07-18 code — the author came back and formalised
  the decision. It is the latest composer thinking in the repo.

So the design stands. The **code** does not: see "Why it can't just be
replayed" below.

## The decision (verbatim, as written for BRAND §9)

> **The composer (redesigned 2026-07-18, benchmarked against are.na and
> Substack Notes):** the full-screen "page on the desk" stays — the white sheet
> with headline rule and serif body IS the product's writing metaphor; a sheet
> composer (are.na) and a full-bleed feed composer (Substack) were both
> considered and rejected as off-voice. What the references taught us is
> structural, and is now law for this screen:
>
> - **Actions live at the thumbs.** A pinned action bar (`compose-action-bar`:
>   `paper`, hairline top rule) rides above the keyboard and rests on the tab
>   bar — the photo affordance, a quiet save-status line, and the one finishing
>   action never require scrolling away from your words.
> - **One finishing action: "File my story"** (editing: "Update my story").
>   Autosave is the silent safety net; filing uploads the photo, drops the
>   keyboard, plays the FILED stamp + `confirm()`, and the bar settles into
>   "Filed for {day}'s edition" until the next edit. No auto-navigation
>   afterward — reassurance stays on screen.
> - **The photo runs on the page**, under the writing, exactly as it will print
>   — flat §5 treatment. The photo itself is the control (tap → change/remove).
>   The bar's photo button is always labeled, never icon-only (rejected:
>   Substack's icon toolbar, too opaque for the audience).
> - **The headline stays but never blocks writing:** placeholder "Add a
>   headline", and focus lands in the body on a fresh page (tapping blank paper
>   also focuses the body). An existing story opens with no keyboard.
> - **Deleting is demoted** to a quiet `error`-colored text line below the page
>   ("Remove this week's post"), only once a post exists.

## Why it can't just be replayed

The preserved `post.tsx` is a 227-line diff against a **2026-08-05** tree and
predates two later changes to the same screen. Applying it wholesale would
silently revert both:

1. **`3773684` (2026-08-23) — the skeleton pass.** The composer's page is one
   of the three screens that pass gave a skeleton (BRAND §9/§10). The preserved
   `post.tsx` has no `ComposerSkeleton` reference, so replaying it drops the
   composer back to showing nothing while loading.
2. **The 2026-09-10 audit's duplicate-post fix.** `handleSave` now waits out an
   in-flight autosave and reads `existingPostRef` rather than the
   `existingPost` state; without it, tapping Save inside autosave's 1200ms
   debounce filed two posts for one edition. See `bugs.md`.

The screen therefore has to be **rewritten against current main**, not
cherry-picked.

## What to reuse when picking this up

On `composer-redesign-wip` (`git show composer-redesign-wip`):

| Piece | Reusable? |
| --- | --- |
| `components/compose-action-bar.tsx` (97 lines) | **Yes, close to as-is** — self-contained, props-driven, no coupling to the old screen. |
| `constants/strings.ts` → `Strings.thisWeek` additions (`fileCta`, `updateCta`, `headlinePlaceholder`, `bodyPlaceholder`, `addPhoto`/`changePhoto`/`removePhoto`, `removePostLink`, `autosaveError`) | **Yes** — copy verbatim. |
| `constants/icons.ts` → `photo: mci('image-outline')` | **Yes.** |
| The BRAND §9 paragraph above | **Yes** — this is the decision. |
| `app/(tabs)/post.tsx` | **No.** Read it for intent, then re-implement on current main. |

These were deliberately **not** merged into the audit branch: an unwired
component and unreferenced string/icon tokens are exactly the dead code that
pass was removing (ten dead icon tokens and an orphaned illustration were
deleted in it). They stay on the branch until the screen that uses them exists.

## Open questions the design doesn't settle

- **The keyboard-avoidance interaction.** The bar "rides above the keyboard and
  rests on the tab bar", but the screen is inside a tab navigator with a raised
  center button. Whether the bar sits above or replaces the tab bar while the
  keyboard is up is unspecified, and it's the fiddliest part on both platforms.
- **Reduce Motion.** The FILED stamp already respects it (`ink-stamp`), but the
  "bar settles into 'Filed for …'" transition is undefined.
- **Where autosave status goes when the bar is off-screen** — the design puts
  save status *in* the pinned bar, so a scrolled-away state needs an answer.
