# BRAND.md — Catch Up Column visual system (v2, 2026-07-17)

This doc is the source of truth for the app's visual language. **v2 is a full redesign**, decided 2026-07-17: the direction is *"The New York Times' structure with HeyTea's charm"* — a serious, monochrome, hairline-ruled editorial frame, warmed exclusively by a hand-drawn monoline illustration world and one vermilion accent. Reference screenshots live in `screenshots/NYT/` and `screenshots/HeyTea/`.

The v2 migration has reached every screen, including the illustration phase (paperboy/dog/press set, doodle empty states, monoline loaders, the §11 ticket, splash/app icon). §14 maps what landed, what survives, and the remaining loose ends.

## 1. The idea

Two references, one split of responsibilities:

- **NYT owns structure.** Hierarchy, hairline rules, kickers, decks, small-caps metadata, edge-to-edge content columns, restraint. The edition — real family stories, real photos — is treated with the dignity of photojournalism.
- **HeyTea owns charm.** A recurring hand-drawn monoline character and his world carry all the warmth. Illustration lives in the app's *chrome* (splash, loading, empty states, celebrations, invites) and never competes with family content.

The two registers are kept deliberately separate. When they blur — doodles in the edition, bouncy buttons, colored surfaces — the design fails in both directions at once.

## 2. Color

Near-monochrome: black ink on warm paper, structure drawn with hairlines, **one accent**. Peach, yellow, and the v1 orange are fully retired.

| Token        | Value             | Use                                                        |
| ------------ | ----------------- | ---------------------------------------------------------- |
| `ink`        | `#1A1A1A`         | Headlines, body, primary buttons, icons. (Soft black — pure `#000` only inside illustration strokes.) |
| `inkSoft`    | `ink` @ 62%       | Secondary text, decks, metadata, inactive tabs             |
| `inkMuted`   | `ink` @ 38%       | Disabled text, placeholder                                 |
| `vermilion`  | `#E8442E`         | THE accent. Kickers, stamps, live moments, hand-lettered bits inside illustrations. See usage budget below. |
| `paper`      | `#FFFFFF`         | Elevated cards, modals, sheets                             |
| `paperWarm`  | `#FBF9F4`         | App background everywhere. A whisper of warmth — flatters family photos where clinical white doesn't. |
| `hairline`   | `ink` @ 14%       | Rules, dividers, outlined buttons, photo edges             |
| `rule`       | `ink` @ 100%, 2–3px | Masthead rules, section-opening rules (structural, not decorative) |
| `error`      | `#B3261E`         | Errors only. Deliberately darker/deader than vermilion so the two never read as the same voice. |

**The vermilion budget.** Vermilion is a rubber stamp, not a paint bucket — it works because it's scarce. Sanctioned uses: small-caps kickers, the stamp system (§11), hand-lettering inside illustrations, live/new moments (the NEW pill, "arriving Sunday" dateline accents), and links. It never fills a button, never tints a surface, never colors an icon set, and never appears in the tab bar. If a screen shows vermilion in more than ~2 places, remove one.

**Contrast.** `ink` on `paperWarm` is ~15:1. Vermilion on `paperWarm` is ~4.0:1 — passes AA for large/bold text only; fine for its sanctioned uses (kickers are small-caps bold + tracked, stamps are decorative), never body copy. `inkSoft` passes AA for body.

**Dark mode: out of scope for the redesign** (decided 2026-07-17). The paper-and-doodle language is inherently light; we design it once, well. Tokens stay semantic so a future "evening edition" is a token pass, not a redesign.

## 3. Typography

Two families, loaded via `@expo-google-fonts`, identical on every platform (the v1 iOS-Futura/Android-Jost split is retired — one metric reality).

- **Serif: Lora** — every serif role. Headlines at 600–700, reading body at 400, true italics for decks, datelines, and bylines. Chosen over Superclarendon (too jolly — with doodles carrying warmth, cute-on-cute had nothing carrying the editorial register) and over Domine (no italics). Lora Bold has Cheltenham-adjacent authority; Lora italic is the deck voice.
- **Sans: Jost** — all UI chrome: tabs, buttons, metadata, captions, form labels. Jost is already HeyTea's register, including wide-tracked small-caps (`PICK UP`) and friendly lowercase.
- **Hand-lettering is not a font.** HeyTea-style handwriting appears only *baked into illustration assets* (ticket lettering, doodle captions, stamp faces). Never applied to live text — handwriting fonts on real copy read as cheap and hurt legibility.

Type scale:

| Token      | Spec                        | Use                                            |
| ---------- | --------------------------- | ---------------------------------------------- |
| `caption`  | Jost 12, +0.4 tracking      | Photo credits, microcopy, timestamps           |
| `meta`     | Jost 12 SemiBold, small caps, +1.2 tracking | `2 MIN READ`, folios, datelines — the NYT dress code |
| `kicker`   | Jost 13 SemiBold, small caps, +1.5 tracking, vermilion or ink | Section labels, `THIS WEEK`, `YOU'RE INVITED` |
| `ui`       | Jost 16                     | Default UI body, form fields                   |
| `uiStrong` | Jost 16 SemiBold            | Buttons, tab labels, row actions               |
| `deck`     | Lora 16 italic, `inkSoft`   | Decks under headlines, empty-state body. (16, not 15 — decks are sentence-length copy, so the reading floor applies; decided 2026-07-17.) |
| `read`     | Lora 17 / 26                | Edition story body (the reading floor)         |
| `rowTitle` | Lora 19 SemiBold            | List-row headlines (editions, groups)          |
| `title`    | Lora 24 Bold                | Screen titles, secondary story headlines       |
| `headline` | Lora 32 Bold, −0.5 tracking | Lead story headlines, mastheads                |
| `display`  | Lora 40 Bold                | Edition masthead, splash wordmark              |

Body text never below 16px; `meta`/`caption`/`kicker` are the only sub-16 sizes and are never sentence-length reading copy. Dynamic Type scales everything; only cover excerpts carry a scale cap (see v1 §6 rationale — decision survives).

## 4. Illustration system — the paperboy's world

The warmth engine, and the only place the app is allowed to be cute.

**Cast.** A **paperboy** — cap, bike, canvas bag of rolled papers — in HeyTea's monoline style. His **dog** runs alongside and catches the paper. Supporting objects: rolled newspapers, the **printing press**, a mailbox, a coffee mug, reading glasses, the ticket and stamp (§11). One world, one hand.

**Style spec (binding for every asset):**
- Monoline ink stroke, uniform weight (~2.5% of the asset's height — reads as ~2px at 80px), round caps and joins, `#000` strokes.
- Minimal fills: flat black for hair/cap-band-type masses (like HeyTea's boy), paper-white elsewhere. No gradients, no gray shading, no outlines-around-fills.
- Vermilion appears only as a deliberate spot: the cap, a stamped `EXTRA!`, hand-lettering on a ticket. At most one vermilion element per scene.
- Wobble is honest: lines drawn by hand (or convincingly so), not a mechanical "sketchy" filter. Proportions are HeyTea's — big heads, simple hands, no faces beyond a line-nose and dot-eye.
- Every asset sits directly on `paperWarm`/`paper` — never in a colored container, never with a drop shadow.

**Where doodles live (and don't).** Chrome only; **editions stay editorial** (decided 2026-07-17):
- **Splash/loading:** the paperboy rides; wheels spin (§10). Long waits (compile, publish) get the printing press running.
- **Empty states:** scene + Lora Bold headline + Jost body, warm and never apologetic. (Empty editions list: paperboy waiting at a mailbox. No groups: dog holding a rolled paper, "Start your family's paper.")
- **Onboarding, invite, welcome:** the dog catches the paper on the welcome screen; the ticket carries the invite (§11).
- **Profile/settings flourishes and hidden corners:** small easter-egg doodles in quiet corners — the dog asleep under the final hairline of the editions list, a mug by the settings footer. Delight, zero function.
- **The edition front page and story reader get none of this.** Family photos never share a page with cartoons. The single sanctioned mark: a tiny inked ornament (rolled-paper glyph) in the masthead/colophon where v1 used ◆.

**Pipeline.** `react-native-svg` components, one file per asset, strokes/fills bound to tokens. Motion (wheel spin, press cycle, dog leap) is Reanimated transforms on SVG groups — no Lottie dependency. Draft assets may be AI-assisted or self-drawn *to this spec*; a commissioned illustrator can later redraw to the same spec without touching call sites. (Decided 2026-07-17: the full set — characters included — ships as in-house drafts to spec; commissioning is a later, optional upgrade.)

## 5. Photography

Flat editorial. **The polaroid (tape, tilt, white frame) is fully retired** — with doodles carrying warmth, photos get to be dignified.

- Square corners, no rotation, no frames. A `hairline` edge on photos that touch `paperWarm` (newsprint photos have edges).
- Sizes: full-measure or column-width per layout — orientation buckets from v1 (`use-image-orientation`: 4:3 / 4:5 / 1:1, portrait holds a text-wrapped column) survive unchanged; only the skin changes.
- Captions/credits: `caption` Jost in `inkSoft` below the photo, left-aligned, NYT-style ("Photo by Ruth").
- Avatars stay round (bylines, member stacks) — the one curved photo shape, and it reads as a byline convention, not a card.

## 6. Layout & density

**NYT structure at comfortable scale.** The idiom is the newspaper section front: one content column, edge-to-edge, structure drawn with rules — **no cards, no pills, no floating containers** for content. Elevation exists only for true overlays (sheets, modals).

- **Grouped-list section fronts** (decided 2026-07-17, set by the Editions list): a `rule`-weight ink rule, then the group's name as a Lora Bold `title` with its square hairline-edged cover thumb — never a small-caps kicker (uppercasing long family names hurts warmth), never placeholder art when there's no cover.
- **Lists (editions, groups, drafts):** hairline-separated rows. Headline in `rowTitle` left, square thumbnail (56–64px, hairline edge) right, `meta` line below the headline (`FEB 9 · 6 STORIES · 4 WRITERS`, `2 MIN READ`). Row vertical padding 16–20px; whole row is the target (≥56px); no chevrons.
- **Scale floor (the grandparent clause):** base sizes one notch above NYT's — 19px row headlines, 16px UI body, ≥56px targets. Density comes from removing chrome, not shrinking type.
- **Section tabs:** where a screen needs horizontal sections (e.g. Groups filter), the NYT device: Jost labels in a row, active = ink + 2px ink underline, inactive = `inkSoft`. No segmented-control capsules.
- **Screen headers:** quiet — screen title or masthead, no bottom border, no shadow. Content rules do the separating.
- **Spacing rhythm:** 4px base grid; section gaps 32–40; the page should feel *set*, not padded. Hairlines close ranks — a rule always has content within 16–20px on both sides.

## 7. Navigation

5-slot bottom bar, structure unchanged from v1, re-inked (HeyTea's bar validated the layout):

- `paper` background, `hairline` top rule, no shadow.
- Center slot: **ink-black raised circle** (~64px, overlapping ~24px above the bar) with a white `+`. It is the only black-filled object on most screens — THE button. Vermilion stays out of the bar entirely.
- Tabs: Home, Editions, +, Groups, Profile. Active = `ink` icon + SemiBold label; inactive = `inkSoft`. Icons: simple outline set, consistent stroke weight with the illustration world.

## 8. Editorial conventions & voice

**NYT dressing, warm words.** The metadata dress code is adopted wholesale; the language inside it stays the kitchen-table register (CLAUDE.md's tone rule stands).

- **Kickers:** small-caps vermilion above headlines — `THIS WEEK`, `FROM YOUR FAMILY`, `YOU'RE INVITED`, `NEW EDITION`. Warm words in newspaper dress; never `BREAKING`, never urgency.
- **Metadata:** `meta` small caps in `inkSoft` — `2 MIN READ` on stories, `EDITION NO. 12 · 6 STORIES · 4 WRITERS` folios, `SUNDAY AT 9 AM` datelines.
- **Decks:** Lora italic `deck` under headlines — one warm sentence, not a summary.
- **Greeting:** Home opens `Good morning, Ruth` (Lora, time-aware) over a `deck`-style line — NYT's "You" hub warmth, no engagement mechanics.
- **Home is a front page** (decided 2026-07-18, "make it pop" pass): the masthead prints today's date as a `meta` folio over the greeting, and the hero block (`home-hero`) treats the latest edition as a miniature section front where the **lead story leads** — its photo is the hero image (fresh weekly; the static group cover went invisible), its headline is the headline, and the group name demotes to a folio line (`GROUP · WEEK OF · N STORIES`). Fallback chain: lead photo → group cover → type-only front. Landscape keeps the 4:3 plate; portrait/square crops to 1:1 so the hero never becomes a poster. Pre-first-edition, the slot shows a coming-soon front (`YOUR FIRST EDITION` + the mailbox scene — sanctioned illustration: no family photos exist yet). The dateline strip gains a decorative face row of this week's writers (avatar-stack idiom; the names sentence still carries the meaning and still never names who hasn't written) and the paperboy riding its top rule — Home's one doodle.
- **Rotating editorial copy** (decided 2026-07-18): Home's greeting deck and the write block's subline rotate daily through small curated sets (`Strings.home`, day-seeded via `dailyPick` — deterministic per calendar day, never random per render). This is the paper's own voice staying freshly typeset; it is **not** a writing-prompts feature (still out of scope): the CTA text never changes, only the warmth around it.
- **No gamification** — v1's rule survives verbatim: no streaks, badges, counters, confetti. The ritual devices (dateline strip, NEW pill, stamps) express the weekly rhythm; presence is celebrated, absence is invisible.

## 9. Components

- **Buttons:** Primary = ink fill, `paper` Jost SemiBold label, full-round pill, ≥52px tall. Secondary = `hairline`-outlined pill, ink label (HeyTea's `Get`). Tertiary = bare ink text, SemiBold. Destructive = the secondary shape with the label in `error` — danger reads in words, not a slab (decided 2026-07-17). Vermilion never fills a button. Pressed = 92% opacity, no motion.
- **Forms:** fields as ruled lines on the page (hairline underline, Jost 16) rather than boxed inputs where possible; boxed only in sheets/modals on `paper`.
- **Chips/tags:** outlined hairline pills, Jost `meta`, ink text. No filled chips.
- **Status/banners:** text-first on a hairline-ruled band: `kicker` + one Jost line. Info = ink kicker; warning = vermilion kicker; error = `error` kicker. No tinted background slabs. **There is no success color** (v1 green retired, decided 2026-07-17): success banners use the info voice — the warm words carry it — and true celebration moments belong to the stamp system (§11).
- **Sheets/modals:** `paper`, top-rounded 20, grab handle, hairline header rule. The compose sheet keeps its sanctioned spring (§10).
- **Empty states:** doodle scene (§4) + Lora Bold headline + Jost body + one primary action.

## 10. Motion & interaction feel

**Two registers, strictly separated** (decided 2026-07-17):

1. **UI motion is editorial.** v1's system survives verbatim: durations `quick` 160 / `settle` 220 / `enlarge` 260 / `exit` 200, ease-out cubic, no bounces or physics — "a broadsheet being handled." The enlarge-to-read transition and the reader's page turn survive as-is. Sanctioned exception: the compose sheet's gentle spring. Reduce Motion always respected.
2. **Playfulness is licensed only inside illustrations.** The paperboy's wheels spin while loading; the press cycles during compile waits; the dog leaps once on the welcome screen. Illustration motion is ambient — it never delays, blocks, or decorates a functional interaction, and it parks (static pose) under Reduce Motion.

**Haptics:** v1 system survives verbatim — `tap()` / `select()` / `confirm()`, sparse on purpose, secondary buttons silent.

## 11. Artifacts — the HeyTea devices

Physical-print objects rendered as monoline drawings. All four are in the component library; each has a strict scope.

- **The ticket** (`invite-ticket`): invite codes render as a hand-drawn perforated ticket — wobbly outline, dashed tear line, the dog on the stub. **The code is live text** (Jost Bold, tracked, vermilion — the ticket's one accent), not the baked hand-lettering originally sketched here: codes are per-Group dynamic, so hand-lettering can't carry them (decided 2026-07-17; §3's rule stands — hand-lettering remains for static words baked into art only). Used for the sender's invite card. Replaces the plain code chip. The QR variant keeps a true-`paper` quiet zone (nothing may texture the code).
- **The stamp system** (`ink-stamp`): one recipe, a family of faces — `FILED` (compose save, −4°), `JOINED · {date}` (welcome, +3°), `DELIVERED` (edition email/push moments). Vermilion ink, small caps, slight tilt, 350ms press-in + `confirm()` haptic, screen-reader announced. The sanctioned use of vermilion-as-celebration; never two stamps on one screen.
- **The hand-drawn border** (`sketch-border`): HeyTea's wobbly rectangle, one SVG component. Frames *special announcements only* — a new edition banner, a birthday-adjacent moment. Never regular list content, never twice on a screen.
- **Hidden corner doodles:** tiny, functionless, tucked into quiet corners (list ends, settings footer, error screens). The rule: below the fold of function, small (≤48px), and never animated.

## 12. Brand & identity

- **Wordmark:** "Catch Up Column" set as a masthead in Lora Bold, ink on paper. No container, no yellow, no outline.
- **Mark:** the paperboy-on-bike monoline doodle — the app's anchor character (§4).
- **Splash:** NYT-style — masthead wordmark with the paperboy riding beneath; his wheels are the loading spinner. **The dateline renders live in the loading screen** (the splash's animated twin), not in the splash PNG — a baked image can't know today's date (decided 2026-07-17). The splash/icon PNGs are generated from the same rider geometry as `paperboy-mark.tsx` — keep them in lockstep when the mark changes.
- **App icon:** paperboy mark, ink on `paperWarm`, vermilion cap — the icon's single accent.
- The v1 brandmark (cardboard box + paper bag + peach/yellow discs) and the yellow logotype **retired**; `assets/brand/` was removed with the splash/icon regeneration (2026-07-17).

## 13. Accessibility

- Body ≥16px; reading body 17/26; `meta`/`caption`/`kicker` are the only smaller styles and never carry sentences.
- All body/UI text is `ink` or `inkSoft` on `paper`/`paperWarm` — AA everywhere. Vermilion text only in bold small-caps ≥12px kicker/stamp roles, never body.
- Targets ≥44pt (rows ≥56px); whole rows tappable; no gesture-only paths (explicit buttons survive from v1).
- Illustration is always decorative: hidden from screen readers, meaning carried by adjacent real text. Illustration motion parks under Reduce Motion.
- Dynamic Type scales freely (cover-excerpt cap is the sole exception, inherited from v1).

## 14. Migration map (v1 → v2)

Screen-by-screen mapping is in progress; this table is the contract for it.

**Landed (2026-07-17): every screen.** Tokens/fonts/ThemedText, tab bar, buttons, Editions list, the full edition surface (masthead in `display` title case, vermilion lead kicker as the cover's single accent, credited flat photos via `editorial-photo`, ink lettrine and nav, rolled-paper colophon glyph), Home (time-aware greeting replaces the v1 brandmark; section-front latest-edition block; vermilion NEW pill + dateline accent), Groups + rows, compose (ruled §9 forms, vermilion caret, stamp system), profile, auth shell (wordmark masthead, no card box), group detail (outlined role chips), invite hero (flat cover, vermilion YOU'RE INVITED), join/welcome. The stamp system (§11) is one `ink-stamp` component (FILED −4° moment / JOINED +3° record). **Deleted:** all v1 color tokens (orange/peach/yellow/washes/green/borderSoft), `serifBlack`, `polaroid-photo`, `paper-grain`, `filed-stamp`/`joined-stamp`, Roboto Slab.

**Landed (illustration phase, 2026-07-17):** the monoline SVG set under `components/illustrations/` — the paperboy mark (rider), mailbox and dog-with-paper empty-state scenes (wired via `EmptyState`'s `scene` prop; error states keep the quiet icon), the press scene, the §11 ticket (live-text code) in the invite card, the sketch-border, and the sleeping-dog/mug corner doodles (editions-list end, profile footer). The loader is monoline with two variants: `ride` (wheels spin; default) and `press` (flywheel + sheets; wired to publish-now — the one true compile wait). Splash + app icon regenerated from the rider (assets/brand/ removed); `Colors.illustrationInk` (#000) added for illustration strokes.

**Landed (Home front-page pass, 2026-07-18):** the §8 "Home is a front page" set — `home-hero` (story-led hero + first-edition variant), masthead date folio, rotating `Strings.home` copy via `dailyPick`, face row + rule-riding paperboy on the dateline strip, `WeeklyByline` extended with avatars.

**Landed (edition-email pass, 2026-07-21):** the weekly edition email (`supabase/functions/_shared/edition-email.ts`) reskinned to v2 — ink `#1A1A1A` on `paperWarm`, hairline rules, Lora + Jost webfonts (Roboto Slab retired), title-case Lora masthead under a single vermilion `NEW EDITION` kicker, flat §5 photos with a "Photo by {name}" credit (the taped-polaroid stand-in + peach wash + warm shadow retired), and an ink-fill pill CTA (vermilion left to the kicker and the two links, never the button). Alpha tokens are pre-composited to opaque hex since email needs solids. Preview via the fixtures harness (edge-functions skill).

**Still pending:** redefining `caption` to the 12px spec once the last v1 caption usages migrate.

**Survives unchanged (logic and largely skin):** edition slot rules (`lib/edition-layout.ts`), thin-edition composition, orientation buckets, publish math + dateline strip concept, seen-tracking/NEW moment, haptics, motion tokens, enlarge/page-turn transitions, join-flow architecture (pending invite, two-mode screen, anonymous preview), no-gamification principle, warm copy in `Strings`.

**Reskinned (same bones, new dress):** every screen — colors → §2, type → §3 (Superclarendon/Futura → Lora/Jost), list rows → §6, buttons → §9, tab bar → §7, edition masthead/kickers/folios keep their structure in the new tokens, invite hero keeps its "special edition" concept minus polaroid/tape, filed/joined stamps fold into the §11 system.

**Retired:** peach/yellow/orange (#FF7237) everywhere, polaroid/tape/tilt photo treatment, paper-grain texture, peach pill list rows, box-and-bag brandmark + yellow logotype, iOS Futura / Superclarendon platform fonts, greeked lines' 16%-black bars get re-derived from `hairline` (device survives, value re-tokened).

**New builds:** paperboy/dog/press SVG asset set + style spec (§4), `react-native-svg` install, spinning-wheel loader + press-wait animation, ticket / sketch-border components, Lora + Jost font loading, token rewrite in `constants/`.

**Doc debts during mapping:** update CLAUDE.md's design bullets, the `frontend-design` skill, and `constants/` in the same change that migrates the first screen — this file leads, those follow.
