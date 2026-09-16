# Illustration rework — working scope

**Status:** scoped 2026-08-22, not started, **no longer a launch gate**
(2026-09-16). Tracked as `docs/LAUNCH.md` step 6b.

It was the gate on the reasoning that screenshots freeze the final look.
`docs/POSITIONING.md` §8 supersedes that: Group Zero is the long pole, it needs a
TestFlight build rather than finished art, and it produces real friend-group
screenshot content as a by-product. The four-week Group Zero run is the natural
window for this work — it just isn't blocking anything upstream of it any more.

A **execution-quality redraw of all 8 illustration assets** (9 until `sketch-border`
was deleted 2026-09-10), inside BRAND §4's
existing style spec. This is the upgrade §4 anticipated when it shipped the set as
in-house drafts: *"a commissioned illustrator can later redraw to the same spec
without touching call sites."*

This is a working document. When the rework lands, fold the outcomes into
`design/BRAND.md` §4 and delete this file.

## Goal

One confident visual voice across the whole paperboy-and-dog world, at a standard
that holds up in App Store screenshots.

## Non-goals — explicitly out of scope

Naming these so the work can't sprawl; each was considered and set aside:

- **The concept and cast.** The paperboy, his dog, and the supporting objects stay.
  No new characters, no re-premise. Changing this would cascade into BRAND §4/§11/§12,
  the app icon, and the splash.
- **BRAND.md's style spec.** §4 stays binding as written, with one clarification noted
  under "The stroke problem" below.
- **Call sites and screen code.** No screen changes. Every asset keeps its current
  props and exports (see "Export contracts").
- **New illustration moments.** The unbuilt welcome-screen dog catch (promised in §4)
  is a real gap, but it is *new work*, not a redraw. Tracked separately below.
  (`sketch-border`'s gap was closed 2026-09-10 — deleted, see below.)
- **Editions stay illustration-free.** §4's hard line. The only mark allowed on an
  editorial surface is `rolled-paper-glyph`.

## The stroke problem — the measurable defect

BRAND §4 binds every asset to *"monoline ink stroke, uniform weight (~2.5% of the
asset's height)."* **No asset currently satisfies this**, and stroke weight is the only
design dimension in this codebase that was never tokenized — there is no stroke entry
in `constants/`, unlike color, type, spacing, radii, and motion.

| Asset | viewBox h | §4 target | Actual weights |
| --- | --- | --- | --- |
| `paperboy-mark` | 190 | 4.75 | `STROKE`=4, 2, 3.4 |
| `printing-press-scene` | 170 | 4.25 | `STROKE`=4, 2.4, 3 |
| `dog-with-paper-scene` | 160 | 4.0 | 4, 2.8, 2 |
| `paperboy-mailbox-scene` | 160 | 4.0 | 4, 3.4, 2 |
| `invite-ticket` | 120 | 3.0 | 3.4, 3, 1.8, 1.4 |
| `mug-doodle` | 48 | 1.2 | 2.4 (uniform) |
| `sleeping-dog-doodle` | 44 | 1.1 | 2.4, 1.8, 1.2 |
| `rolled-paper-glyph` | n/a | n/a | filled shape, no stroke |

Three distinct problems, in priority order:

1. **Stroke weight isn't tokenized.** Only `paperboy-mark` and `printing-press-scene`
   define a stroke constant, each a *separate local* `const STROKE = 4`. The other
   seven hardcode every value inline. Both constant-holders then bypass their own
   constant with hardcoded paths (`paperboy-mark.tsx:95` uses `2`, `:103` uses `3.4`).
2. **Nothing is actually monoline.** Every multi-figure asset mixes 2–4 weights.
   Heavier contour + lighter interior detail is a legitimate illustration technique,
   but it is *undeclared* — §4 says "uniform," so either the art becomes truly
   single-weight or §4 gains an explicit two-tier rule. **Pick one and write it down.**
3. **The two hero assets run thin.** The rider is 4 against its own 4.75 target
   (~16% under). Thin strokes are most of why the drafts read wiry rather than
   confident-HeyTea-chunky. This is the highest-leverage single fix.

**§4 clarification needed (the one doc change this scope allows).** The 2.5% rule
assumes a ~80px render and breaks down on the corner doodles: it demands 1.1–1.2px for
`sleeping-dog-doodle` and `mug-doodle`, which render near 1:1 at 44–48px and would
disappear. Those two are *correctly* ignoring the percentage. §4 should state a
**minimum optical weight (~2px as rendered)** that overrides the percentage at small
sizes, rather than leaving the doodles silently off-spec.

**Suggested first deliverable:** a stroke scale in `constants/` (with a comment
explaining the derivation, per this codebase's token convention), consumed by all 9
assets. Do this before redrawing — it makes every subsequent redraw measurable.

## Export contracts — must survive the redraw

Typecheck will catch a broken component signature. **It will not catch broken
geometry**, which is the real hazard: `printing-press-loading.tsx` overlays animated
SVG groups onto these assets using the exported coordinates. If the art moves and the
constants don't (or vice versa), the loader still compiles and simply looks wrong —
spokes spinning beside a wheel instead of inside it.

| Asset | Exports that are consumed elsewhere |
| --- | --- |
| `paperboy-mark` | `RIDER_VIEWBOX {w:220,h:190}`, `RIDER_WHEELS[]`, `WheelSpokes({size})`, `PaperboyMark({height=152, spokes=true})` |
| `printing-press-scene` | `PRESS_VIEWBOX {w:240,h:170}`, `PRESS_FLYWHEEL {cx:56,cy:96,r:26}`, `PRESS_SHEET {x:198,y:86,w:34,h:26}`, `FlywheelSpokes({size})`, `PressSheet({width})`, `PrintingPressScene({width, spokes, sheet})` |
| `invite-ticket` | `InviteTicket({code})` — positions **live text** over the drawn ticket |
| `rolled-paper-glyph` | `RolledPaperGlyph({size=16, color=Colors.inkMuted})` |
| `dog-with-paper-scene` | `DogWithPaperScene({width=180})` |
| `paperboy-mailbox-scene` | `PaperboyMailboxScene({width=200})` |
| `sleeping-dog-doodle` | `SleepingDogDoodle({width=96})` |
| `mug-doodle` | `MugDoodle({size=40})` |

**Rules that follow from the table:**

- **Keep both viewBox aspect ratios.** The two are scaled on *different* axes — the
  rider from its height (`scale = height / RIDER_VIEWBOX.h`,
  `printing-press-loading.tsx:53`) and the press from its width
  (`width / PRESS_VIEWBOX.w`, `:97`). Either way, changing an aspect ratio silently
  re-crops the art at every call site.
- **`RIDER_WHEELS`, `PRESS_FLYWHEEL`, and `PRESS_SHEET` must be re-measured against the
  new art in the same commit.** These are the only numbers in the set that can be
  wrong without failing a build.
- **`invite-ticket`'s `codeArea` must stay aligned** with the drawn stub/tear line, or
  the invite code renders off its plate.
- **`rolled-paper-glyph` is the deliberate exception to §4's `#000` stroke rule** — it
  defaults to `Colors.inkMuted` and takes a `color` prop because it sits on editorial
  surfaces as a typographic dingbat, not a cartoon. **Do not "correct" it to
  `illustrationInk`.**

## Per-asset work list

Ordered lowest-risk first, so the drawing hand is warm before it reaches the
high-stakes assets.

| # | Asset | Call sites | Notes |
| --- | --- | --- | --- |
| 1 | `mug-doodle` | profile footer | 28 lines, already uniform. Warm-up. |
| 2 | `sleeping-dog-doodle` | editions-list end | ≤48px, never animated. Needs the optical-minimum rule. |
| 3 | `rolled-paper-glyph` | welcome, invite-hero, edition-colophon | **Most constrained** — the only mark on an editorial surface. Must read as a dingbat at 14–16px. |
| 5 | `dog-with-paper-scene` | composer, groups | **In screenshots.** Keep the vermilion wrap band (§4's one-spot rule). |
| 6 | `paperboy-mailbox-scene` | inbox, home-hero | **In screenshots.** |
| 7 | `invite-ticket` | invite-family-card | Live-text alignment; vermilion is the code itself. |
| 8 | `printing-press-scene` | loader (`press`) | Animated. Re-measure `PRESS_FLYWHEEL` + `PRESS_SHEET`. |
| 9 | `paperboy-mark` | loader (`ride`), this-week-strip | **Highest stakes** — see below. |

### `paperboy-mark` is three deliverables, not one

1. The SVG component, with `RIDER_WHEELS` re-measured so the loader's spinning spokes
   still register.
2. **`assets/images/icon.png`** — regenerated from the new rider geometry. This is the
   App Store icon, and it is immutable-ish once submitted.
3. **`assets/images/splash-icon.png`** — same geometry. BRAND §12/§13 call the splash
   the loader's "static twin."

Nothing enforces this lockstep. A redrawn mark shipping against the old icon is the
most likely visible mistake in this whole rework.

## Adjacent gaps — decide, don't drift

Neither is in scope as a redraw, but both need a call before screenshots:

- ~~**`sketch-border` is dead code.**~~ **Decided 2026-09-10: deleted.** 83 lines,
  documented in BRAND §11 and claimed as landed in §14, imported nowhere. Rather
  than carry an undecided asset through a redraw, the audit took the second
  option this section offered: the component is gone, §11 records the rule and
  the deletion, and §14 is annotated. One asset fewer to redraw — the table
  above is now 8, not 9. Recover with
  `git show 5c44dd9:components/illustrations/sketch-border.tsx` if an
  announcement moment ever earns it.
- **The welcome-screen dog catch was never built.** §4 promises "the dog catches the
  paper on the welcome screen"; `app/group/welcome.tsx:74` has only a 14px
  `RolledPaperGlyph`. Onboarding's emotional peak currently has the least warmth in
  the app. Worth building — but as its own change, with Reduce Motion handling.

## Verification

Per the `verify-changes` skill, plus what's specific to this work:

- `npm run typecheck` — catches signature breaks, **not** geometry drift.
- **Watch the loader in both variants.** `ride` (spokes inside the wheels) and `press`
  (flywheel centered, sheet feeding from the right). This is the only way geometry
  regressions surface.
- **Reduce Motion on** — every animated scene must park in a static pose. Already
  correctly handled via `hooks/use-reduce-motion.ts`
  (`printing-press-loading.tsx:184`); don't regress it.
- **Large system font sizes** — illustrations sit beside text that grows.
- **Icon + splash on device** after any `paperboy-mark` change. An unsigned simulator
  build is enough and needs no Apple enrollment:
  `npx eas-cli build --platform ios --profile preview`.
- Every asset stays `aria-hidden` / decorative — illustrations are never announced.
