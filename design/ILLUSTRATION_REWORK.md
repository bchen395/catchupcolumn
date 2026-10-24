# Illustration rework — working document

**Status (2026-10-03): commissioned; round 1 is being briefed.** An outside
artist is redrawing the illustration set. The brief the artist reads is a
separate shareable doc. This file is the repo-side record: the decisions, the
file spec the delivery must meet, the export contracts the integration must
keep, and how to verify. Tracked as `docs/LAUNCH.md` step 6b.

**It is required before App Store submission.** The owner decided on
2026-09-25 that the app does not ship to the store with the current drawings.
**It does not block TestFlight.** `app.json` uses the `fingerprint` runtime
policy, so the SVG components, which are JS, reach an installed build by OTA
update. The **app icon and splash** (`assets/images/icon.png`,
`splash-icon.png`) are native and need a new build: about 10 minutes on EAS
plus an upload. The Group Zero run is the natural window for the work
(`docs/POSITIONING.md` §8).

This is a working document. When the art lands, fold the outcomes into
`design/BRAND.md` §4 (including the agreed line treatment) and §11, then
delete this file.

## Decisions (2026-10-03)

1. **The style is described in our own terms, and HeyTea is a "don't."** The
   cast stays: the paperboy, his dog, the printing press, the mailbox, rolled
   papers, the mug. So do the constraints: a monoline ink line, flat `#000`
   ink, at most one vermilion `#E8442E` spot per scene, drawings in app chrome
   only (editions stay illustration-free), and every drawing decorative and
   hidden from screen readers. Within those, the goal is the artist's own
   hand. BRAND §1, §4 and §11 were rewritten so they no longer define the
   style as HeyTea's. HeyTea is named only as what to stay away from. Nothing
   else in the app changes for HeyTea reasons: the stamps, the small caps and
   the raised "+" stay.
2. **The invite ticket is replaced by a drawn press pass.** It is a newspaper
   staff card. The Group's name is its masthead, and the invite code is the
   credential number, as live text (Jost Bold, tracked, vermilion, the pass's
   one accent). The framing is *you're joining the staff*, because everyone
   in a Group writes. The artist draws it in round 1. `invite-ticket` stays
   in the app until the art lands. BRAND §11.
3. **The deliverable is vector SVG plus source files.** Full spec below.
4. **Line weight is the artist's call.** There is no rule up front. The artist
   proposes the line treatment in the sketch round. Once it's agreed, it is
   fixed for the whole set and written into BRAND §4. The one hard
   requirement is that every drawing stays legible at its rendered size. The
   smallest are the mug at 40 pt, the sleeping dog at 84 × 38.5 pt, the Home
   rider at 48 pt tall, and the colophon glyph at 14 pt. This supersedes this file's
   earlier "uniform vs two-tier: pick one" question. It also drops the earlier
   suggestion to put stroke-scale tokens in `constants/` before redrawing. The
   stroke table stays below as a record of the drafts' defect.
5. **Round 1** redraws the 8 existing drawings and adds the press pass (which
   replaces the ticket), the app icon and the splash. **Round 2 comes after
   Group Zero**, chosen from what testers show. It covers new moments: the
   welcome screen where the dog catches the paper, art for the sign-in
   screen, and art for error states.
6. **The owner negotiates rights, fee and dates separately.** They are not
   recorded here. See "Owner to-dos."
7. **Integration after delivery is agent work.** That covers converting the
   SVGs into the existing components, building a review screen, and
   regenerating the icon and splash. See "Integration."

## Scope

### Round 1 — this commission

| # | Deliverable | Replaces | Notes |
| --- | --- | --- | --- |
| 1 | `mug-doodle` | the draft | The warm-up |
| 2 | `sleeping-dog-doodle` | the draft | The smallest character drawing |
| 3 | `rolled-paper-glyph` | the draft | **The most constrained.** It is the only mark on editorial surfaces and must read as a typographic ornament at 14 pt |
| 4 | `dog-with-paper-scene` | the draft | Will appear in screenshots. Its one vermilion spot is the wrap band |
| 5 | `paperboy-mailbox-scene` | the draft | Will appear in screenshots. Its one vermilion spot is the cap |
| 6 | **press pass** (new) | `invite-ticket` | Has live text areas. It carries no vermilion, because the live code is its accent |
| 7 | `printing-press-scene` | the draft | Animated: flywheel and sheet |
| 8 | `paperboy-mark` | the draft | **Highest stakes.** Animated: both wheels. It is also the brand mark |
| 9 | App icon | `assets/images/icon.png` | Drawn from the redrawn rider |
| 10 | Splash | `assets/images/splash-icon.png` | Drawn from the redrawn rider |

The order runs from lowest risk to highest, so the drawing hand is warm
before it reaches the brand mark. It is a suggestion; the artist can work in
any order.

### Round 2 — after Group Zero (not briefed yet)

New moments, picked from what Group Zero testers show:

- **The welcome-screen dog catch.** BRAND §4 has always promised "the dog
  catches the paper on the welcome screen," and BRAND §10 licenses a single
  leap. It was never built: `app/group/welcome.tsx` shows only a 14 pt
  `RolledPaperGlyph`. This is new work with its own Reduce Motion handling,
  not a redraw.
- **Sign-in screen art.** The auth screens have none today.
- **Error-state art.** Error states currently use the quiet `error`-coloured
  icon (`ErrorState`), not a scene.

### Out of scope

- **The concept and cast.** No new characters and no new premise.
- **Screen changes for HeyTea reasons.** The stamps, the small caps and the
  raised "+" stay. The press pass changes exactly one call site,
  `invite-card.tsx`.
- **Illustrations in editions.** Editions stay illustration-free, as BRAND §4
  has always said. `rolled-paper-glyph` is the only mark allowed on an
  editorial surface.
- **Stroke tokens in `constants/`.** Dropped (decision 4).

## The style — what's fixed, what's the artist's

**Fixed** (BRAND §4):

- **The cast.**
- **The ink line.** A monoline line holds an even weight along its length:
  no brush swell, no taper, no hatching, and no mechanical "sketchy" filter.
- **Three colours, all flat.** Fills are `#000` ink and paper white. At most
  one element per scene is vermilion; the press pass has none.
- **No colour effects.** No gradients, no grey shading, no tints, no texture.
- **No container.** Each drawing sits straight on `paperWarm` `#FBF9F4`. The
  press pass is the exception: it sits on the invite card's `paper`
  `#FFFFFF`. There is never a frame or a shadow.
- **Chrome only.** Every drawing is decorative.
- **Legibility at its rendered size.** See the per-asset table.

**The artist's call:**

- **Line treatment.** One weight or a contour/detail pair, plus line ends and
  joins. Agreed in the sketch round, then fixed for the whole set.
- **Proportions, faces, poses and character design.** The test is that each
  one reads at the size it's drawn.
- **Composition**, inside the artboard constraints below.

**A "don't":** HeyTea. The drafts leaned on its boy. If a sketch reads as
HeyTea, it's off-brief.

## File spec — the deliverable

- **One SVG per asset, plus the source file** from whatever vector tool the
  artist uses. The source keeps its layers and the names below.
- **Colours.** `#000000` ink. `#FFFFFF` paper fill inside closed shapes, so
  they hide the lines behind them; it reads a touch brighter than the
  `#FBF9F4` background, as it does today. `#E8442E` vermilion, on at most one
  element per scene. Nothing else, and no opacity: `rolled-paper-glyph` is
  delivered in `#000` and the app tints it.
- **Strokes or outlined fills.** Either is acceptable.
- **Not allowed:** gradients, filters (blur, drop shadow), masks, patterns,
  embedded raster images, or live `<text>` (convert any lettering to
  outlines). Clip paths only if they're essential, because react-native-svg
  is the renderer. Styles go on the elements as presentation attributes, not
  in a `<style>` block or CSS classes. (In Illustrator, choose "Styling:
  Presentation Attributes" when exporting.)
- **Artboard = viewBox.** One artboard per asset, origin at the top left.
  Keep all ink inside the artboard, because the app clips at its edge.

| Asset | Artboard today | Aspect ratio |
| --- | --- | --- |
| `paperboy-mark` | 220 × 190 | **Keep.** The app sizes it from its height |
| `printing-press-scene` | 240 × 170 | **Keep.** The app sizes it from its width |
| `paperboy-mailbox-scene` | 220 × 160 | May change. Height follows width, so a change makes the screens taller or shorter |
| `dog-with-paper-scene` | 200 × 160 | May change, the same way |
| `sleeping-dog-doodle` | 96 × 44 | May change. Keep it at or under 48 pt tall where it's rendered (BRAND §11) |
| `mug-doodle` | 48 × 48 | **Keep it square.** The component takes one `size` |
| `rolled-paper-glyph` | 28 × 16 | May change. The 7:4 ratio is hard-coded in the component, which is a one-line edit |
| press pass (new) | — | The artist's choice, landscape, to fit a card 277–342 pt wide. Today's ticket is 340 × 120 |

The same artboard dimensions are easiest. The rider and the press must at
least keep their aspect ratios. If either changes, the call sites listed under
"Export contracts" must change too.

### Animated parts — named groups, registered to the artboard

Export each group **in place, on the full artboard**, not moved to a separate
artboard. Its position in the SVG is the measurement the code uses.

| Group | Asset | What goes in it | Motion |
| --- | --- | --- | --- |
| `rider-wheel-rear-spokes` | `paperboy-mark` | The rear wheel's spokes and hub: everything that turns | Spins around the hub, one turn every 900 ms |
| `rider-wheel-front-spokes` | `paperboy-mark` | The front wheel's spokes and hub | Spins with the rear wheel, at the same speed |
| `press-flywheel-spokes` | `printing-press-scene` | The flywheel's spokes and hub | Spins around the hub, one turn every 1400 ms |
| `press-sheet` | `printing-press-scene` | The printed sheet at rest, just out of the slot | Slides from about 10 units left of its rest position (inside the slot) to about 26 units right of it, fading in and out, on a 1400 ms loop |

- **The hub is the centre of rotation.** Put it at the exact centre of the
  tyre or rim. Everything in a spinning group must stay inside the rim's
  inner edge at every angle.
- **Only what turns goes in the group.** The tyres and the rim stay static.
  If a hand-drawn tyre wobbles and spins, the wobble visibly rotates.
- **The scene must look complete both ways.** With the groups in place it is
  the static drawing (Home's rider, the icon, the splash, Reduce Motion).
  The loader removes the groups and overlays turning copies.
- **The two wheels.** With equal radii and identical spokes, one
  `WheelSpokes` drawing serves both wheels and the code doesn't change.
  Different wheels are fine, but they mean a small loader change, so say so
  at delivery.
- **The sheet must read on its own.** It is drawn separately, over the
  scene. Leave clear space to the right of where it rests.

### Press pass — live-text areas

Put two **named rectangles** on a non-printing layer, with no fill and no
stroke:

- `pass-masthead-area` — the Group's name. Live Lora Bold set as a masthead,
  up to two lines. **There is no length limit on Group names.** Examples:
  "Dorm 4B", "The Williams Family Weekly".
- `pass-code-area` — the invite code. Live Jost Bold, tracked, vermilion, on
  one line, under a small-caps label. Codes are **6–12 characters,
  uppercase**. The app generates 12 characters of `0–9`/`A–F` (for example
  `3F9A0C7B21DE`), so design for 12. Today's ticket fits the code to its
  panel at 14–22 pt.

The drawing has **no vermilion**, because the code is the pass's accent. It
doesn't animate. Words that never change, drawn into the art (such as
`PRESS`), are allowed by BRAND §3 and must be ink. Everything else on the
card is the artist's.

### App icon

- A **1024 × 1024 PNG**, opaque, with no transparency and no alpha channel.
- **Square corners**, because iOS applies its own mask.
- Background `#FBF9F4`.
- Drawn from the redrawn rider, delivered with its vector source.
- Leave a margin: the icon also shows at 60 pt on the home screen and smaller
  in Spotlight and Settings. Today's rider fills about 50% of the canvas.
- Dark and tinted variants aren't configured and haven't been requested.

### Splash

The config is in `app.json`, under the `expo-splash-screen` plugin:
`image: ./assets/images/splash-icon.png`, `backgroundColor: "#FBF9F4"`,
`resizeMode: "contain"`, `enableFullScreenImage_legacy: true`.

With the legacy full-screen flag on iOS, the image is pinned to all four
screen edges and scaled to fit, at its own resolution. Today's file is a
1242 × 1242 opaque square, so it spans the full screen width, centred top to
bottom.

The new splash needs to be:

- **Square.** Keep it 1242 × 1242.
- **On a background of exactly `#FBF9F4`, or transparent,** so there's no
  visible edge against the splash colour.
- **Inside the centre ~75% of the width.** On a 393 pt iPhone the square is
  about 393 pt wide.

Today it holds the **wordmark "Catch Up Column", typeset in Lora Bold** (not
hand-lettered, BRAND §3/§12), with the rider below it, about 112 pt tall on
screen. The date can't be in the splash, because a fixed image can't know
today's date. It appears on the loading screen that follows (BRAND §12).

Two Android notes (Android is on hold). The plugin scales the image down to
100 dp wide there, so revisit this when Android resumes. The Android adaptive
icon, the notification icon and the web favicon are derived assets: an agent
regenerates them, and they aren't part of the brief.

## Export contracts — must survive the redraw

Typecheck catches a broken component signature. **It does not catch broken
geometry.** `printing-press-loading.tsx` overlays animated copies at the
exported coordinates. If the art moves and the constants don't, the loader
still compiles and simply looks wrong: spokes spinning beside a wheel
instead of inside it.

| Asset | Exports that are consumed elsewhere |
| --- | --- |
| `paperboy-mark` | `RIDER_VIEWBOX {w:220,h:190}`, `RIDER_WHEELS[]` (`{cx:56,cy:152,r:24}`, `{cx:164,cy:152,r:24}`), `WheelSpokes({size})`, `PaperboyMark({height=152, spokes=true})` |
| `printing-press-scene` | `PRESS_VIEWBOX {w:240,h:170}`, `PRESS_FLYWHEEL {cx:56,cy:96,r:26}`, `PRESS_SHEET {x:198,y:86,w:34,h:26}`, `FlywheelSpokes({size})`, `PressSheet({width})`, `PrintingPressScene({width=220, spokes, sheet})` |
| `invite-ticket` → **`press-pass`** | **Today:** `InviteTicket({code})`. It positions live text over the drawing, using `TEAR_X` and `codeArea`. **When the art lands:** `components/illustrations/press-pass.tsx` replaces it, exporting `PressPass({groupName, code})` with its two text areas as constants. The one call site, `invite-card.tsx`, already has `groupName`. Delete `invite-ticket.tsx` in the same commit. **The ticket stays until then** |
| `rolled-paper-glyph` | `RolledPaperGlyph({size=16, color=Colors.inkMuted})` |
| `dog-with-paper-scene` | `DogWithPaperScene({width=180})` |
| `paperboy-mailbox-scene` | `PaperboyMailboxScene({width=200})` |
| `sleeping-dog-doodle` | `SleepingDogDoodle({width=96})` |
| `mug-doodle` | `MugDoodle({size=40})` |

Some geometry lives **outside the illustration files**, where a redraw can
silently break it:

- **`components/this-week-strip.tsx`:** `RIDER_SEAT = round(48 × 14/190)`.
  This is the gap under the rider's wheels (190 − (152 + 24)). It seats his
  tyres on Home's rule.
- **`components/printing-press-loading.tsx`:**
  - The rider is scaled from its height and the press from its width.
  - The sheet's travel is `[-10, 26]` viewBox units.
  - The overlays add stroke padding: `PRESS_SHEET.x − 2`, `w + 4`.
- **The spinning copies' own viewBoxes:**
  - `WheelSpokes` uses `0 0 48 48`, which is 2r. `FlywheelSpokes` uses
    `0 0 52 52`.
  - `PressSheet` uses 38 × 30.
  - Derive all three from the re-measured numbers.
- **`rolled-paper-glyph`:** `width = size × 28 / 16`.

**Rules that follow:**

- **Keep both aspect ratios** for the rider and the press, or update every
  site listed above in the same change.
- **Re-measure `RIDER_WHEELS`, `PRESS_FLYWHEEL`, `PRESS_SHEET` and
  `RIDER_SEAT` from the delivered groups in the same commit.** These are the
  numbers in the set that can be wrong without failing a build.
- **The press pass's text areas become constants in its component**, the way
  `TEAR_X` works today, so the live text stays on its rectangles.
- **`rolled-paper-glyph` is the deliberate exception to the `#000` rule.** It
  keeps its `color` prop (default `Colors.inkMuted`), because it sits on
  editorial surfaces as a typographic ornament. **Don't "correct" it to
  `illustrationInk`.**
  - The current glyph colours each stroke separately, so the 38% ink doubles
    up into darker spots where strokes overlap. Render the new glyph so the
    whole thing takes one even tint: one compound shape, or opaque ink under
    a group opacity.

## Per-asset list — call sites and rendered sizes

Sizes are in points, measured from the code on 2026-10-03. The app runs on
iPhone only, portrait, on screens 375–440 pt wide.

| Asset | Where it appears (the moment) | Rendered size (pt) | Animated |
| --- | --- | --- | --- |
| `mug-doodle` | Profile footer, under the legal links | 40 × 40 | No |
| `sleeping-dog-doodle` | Editions list, under the last row's hairline | 84 × 38.5 | No |
| `rolled-paper-glyph` | Edition colophon; welcome screen (`app/group/welcome.tsx`); invitation page with no cover (`invite-hero`) | 24.5 × 14 | No |
| `dog-with-paper-scene` | Groups tab with no Groups; Compose with no Groups | 180 × 144 | No |
| `paperboy-mailbox-scene` | Editions tab, empty: 200 × 145.5. Home, before the first edition (`home-hero` `FirstEditionHero`): 180 × 130.9 | 200 / 180 wide | No |
| press pass (replaces `invite-ticket`) | Group screen → `invite-card`, on a white `paper` card | Full card width: the screen width minus 98 pt, so 277–342 pt (295 on a 393 pt iPhone). The ticket is 98–121 pt tall | No. The whole pass is the tap-to-copy target |
| `printing-press-scene` | Loader `press` variant: a moderator's "publish now" (`app/group/[id].tsx`) | 220 × 155.8 (`LoadingConfig.pressWidth`) | Flywheel and sheet |
| `paperboy-mark` | Loader `ride` variant (cold boot, auto-join, opening an invite link): 173.7 × 150 (`LoadingConfig.riderHeight`). Home's dateline strip, riding the top rule and facing right: 55.6 × 48 | 150 / 48 tall | Wheels, in the loader only |
| App icon | Home screen at 60 pt; App Store at 1024 px | 1024 × 1024 px | — |
| Splash | Cold start, before the loader | About 393 pt square on a 393 pt iPhone | — |

**In week one, Home shows two paperboys:** the mailbox scene in the hero
slot and the 48 pt rider on the dateline strip below it.

## Integration — agent work after delivery

1. **Convert each SVG into its existing component file.**
   - Use JSX with `Colors.illustrationInk` / `Colors.paper` /
     `Colors.vermilion`.
   - Keep the `aria-hidden` wrapper `View`.
   - Keep the file's props and exports.
   - Screens don't change.
2. **Re-measure the animation geometry in the same commit.**
   - `RIDER_WHEELS`, `PRESS_FLYWHEEL`, `PRESS_SHEET` and `RIDER_SEAT`.
   - The spinning copies' viewBoxes.
   - The sheet's travel, if the slot moved.
3. **The press pass.**
   - Build `press-pass.tsx` like today's ticket: the drawing in an
     absolute-fill `Svg`, with the live text positioned from the two named
     rectangles as fractions of the artboard.
   - Size the code from its rectangle **and from the phone's text-size
     setting**. Today's ticket ignores that setting, so at large text sizes
     a 12-character code can overflow its one line.
   - Swap it into `invite-card.tsx` and update the copy:
     `Strings.inviteCard.ticketLabel` and `copyHint` ("Tap the ticket…").
   - Delete `invite-ticket.tsx`.
   - Update BRAND §11/§14 and the `frontend-design` inventory.
4. **Build a review screen when the art arrives** (HANDOFF §7's idea). It is
   dev-only and shows every asset at its rendered sizes, both loader
   variants, and Reduce Motion on.
5. **Regenerate the icon and splash.**
   - From the delivered files: `icon.png` and `splash-icon.png`.
   - Derived from the new rider and glyph: `adaptive-icon.png`,
     `notification-icon.png` and `favicon.png`.
   - `scripts/generate-placeholder-icons.py` is stale: it still draws the
     retired v1 orange "C". Replace it or delete it.
   - The icon and splash need a new native build. The SVGs ship by OTA.
6. **Close out.**
   - Fold this file into BRAND §4, with the agreed line treatment, and
     delete it.
   - Update `docs/LAUNCH.md` step 6b.

## Verification

Follow the `verify-changes` skill, plus these checks specific to this work:

- **`npm run typecheck`.** It catches signature breaks, **not** geometry
  drift.
- **Watch the loader in both variants.** In `ride`, the spokes stay inside
  the wheels. In `press`, the flywheel stays centred and the sheet feeds from
  the slot. This is the only place geometry regressions show up. The review
  screen makes it one visit.
- **Turn Reduce Motion on.** Every animated scene must park in a static pose.
  `hooks/use-reduce-motion.ts` already handles this, via
  `printing-press-loading.tsx`; don't regress it.
- **Test large system text sizes.** Drawings sit beside text that grows. For
  the press pass, try a 12-character code at the largest size and a long
  Group name.
- **Test the narrowest and widest phones (375 and 440 pt).** This matters for
  the press pass and the empty states.
- **Check the Home strip.** The rider's tyres must sit on the rule
  (`RIDER_SEAT`).
- **Count vermilion.** Each scene has at most one spot, and the press pass
  drawing has none.
- **Check the icon and splash on a device** after any `paperboy-mark` change.
  An unsigned simulator build is enough and needs no Apple enrollment:
  `npx eas-cli build --platform ios --profile preview`.
- **Every asset stays `aria-hidden` / decorative.** Illustrations are never
  announced.

## Owner to-dos

- Negotiate rights, fee and dates with the artist. They are deliberately not
  recorded in the repo.
- Approve the sketch round, including the line treatment. Whatever is agreed
  goes into BRAND §4.
- After Group Zero, pick the round-2 moments.

## Record: the drafts' stroke problem (2026-08-22)

This is kept as a record of why the drafts read as wiry. Decision 4 replaces
the rule it measured against. BRAND §4 used to require *"monoline ink stroke,
uniform weight (~2.5% of the asset's height)."* No draft met it, and stroke
weight was never tokenized.

| Asset | viewBox h | Old 2.5% target | Actual weights |
| --- | --- | --- | --- |
| `paperboy-mark` | 190 | 4.75 | `STROKE`=4, 2, 3.4 |
| `printing-press-scene` | 170 | 4.25 | `STROKE`=4, 2.4, 3 |
| `dog-with-paper-scene` | 160 | 4.0 | 4, 2.8, 2 |
| `paperboy-mailbox-scene` | 160 | 4.0 | 4, 3.4, 2 |
| `invite-ticket` | 120 | 3.0 | 3.4, 3, 1.8, 1.4 |
| `mug-doodle` | 48 | 1.2 | 2.4 (uniform) |
| `sleeping-dog-doodle` | 44 | 1.1 | 2.4, 1.8, 1.2 |
| `rolled-paper-glyph` | 16 | n/a | 1.6 (uniform) |

What it showed:

- **Every multi-figure draft mixed 2–4 weights, without saying so.**
- **The two hero drawings ran thin.** The rider was 4 against a 4.75 target.
- **The percentage rule fails at small sizes.** It would have made the
  corner doodles' lines vanish. That is why decision 4 sets legibility at the
  rendered size as the only hard rule.

Also closed, on 2026-09-10: `sketch-border` was deleted, as dead code that
was never imported (BRAND §11). That left 8 drawings to redraw, not 9.
