# DESIGN.md — Catch Up Column visual system

This doc captures the target visual language for the app: brand, colors, typography, components, and screen-level intent. It is the source of truth for UI work — update as decisions evolve.

## 1. Brand

Catch Up Column's identity is built around a friendly, slightly hand-drawn brandmark: an open cardboard box with a paper bag inside, set on overlapping peach + yellow discs, with "Catch Up Column" in a heavy slab serif laid across the bag. The mood is warm, paperish, slightly nostalgic — newsprint reimagined as something you'd find on a kitchen counter.

Three approved logo variations (see `assets/brand/`):

- **Brandmark** — full illustrated lockup (box + bag + overlapping discs + serif title). Used on splash, hero, marketing surfaces, and as a small decorative anchor on Home and Edition headers. **Default app logo.**
- **Logotype** — "Catch Up Column" set in the heavy slab serif on yellow (`#F4E33A`), stacked on two lines, with a soft white outline/shadow. Used in headers where the illustration would be too busy.
- **Submark** — "Catch | Column" two-word lockup separated by a vertical rule, mixed weights. Used for favicon, app icon, tight navigation contexts, and any square crop.

**Assets to commit:**
- `assets/brand/brandmark.png` — ≥ 1024×1024, square, transparent background.
- `assets/brand/logotype.png` — wordmark on transparent, two-line stacked.
- `assets/brand/submark.png` — square, transparent, for icon use.
- `assets/brand/brandmark.svg` (optional, later) — once we install `react-native-svg`. For v1 stick to PNG; the existing illustration is raster-feel anyway and scaling artifacts read as intentional texture.

Don'ts: don't recolor the brandmark, don't separate the bag from the discs, don't set the wordmark in any font other than the approved slab serif (or its fallback — see §3).

These are not in the project repo yet, we can defer. 

## 2. Color palette

Four-color core palette pulled from the brand sheet, plus a small set of neutrals derived for UI surfaces. Names are semantic — pick a token, don't sprinkle raw hex through styles.

| Token            | Hex       | Use                                                            |
| ---------------- | --------- | -------------------------------------------------------------- |
| `orange`         | `#FF7237` | Primary action color, active tab tint, key accents             |
| `orangeSoft`     | `#FF7237` @ 80% | Pressed state on `orange` (apply as opacity, not a new token) |
| `peach`          | `#FFD3C2` | Soft surface, list-row backgrounds, brandmark disc, chips      |
| `peachWash`      | `#FFD3C2` @ 40% | Hover/secondary surface tint                              |
| `yellow`         | `#F4E33A` | Highlight accents, logotype background, sparing use            |
| `ink`            | `#000000` | Headlines, body text on light surfaces                         |
| `inkSoft`        | `#000000` @ 60% | Secondary text, metadata, inactive tab labels             |
| `inkMuted`       | `#000000` @ 38% | Disabled text, hairline borders on dark surfaces          |
| `paper`          | `#FFFFFF` | Pure white surface (cards, modals)                             |
| `paperWarm`      | `#FAF7F2` | App background — warm off-white that complements peach         |
| `borderSoft`     | `#000000` @ 12% | Standard hairline borders, dividers                       |

**Notes:**
- The previous burgundy/navy/blueChip palette is fully retired. Any usage of `accent`, `backgroundWarm`, `navy`, `blueChip`, `blueWash`, or `paperCream` in the codebase should be swept in a single rename pass.
- Represent opacity-based variants as `base color + alpha at point of use` (e.g. `rgba(0,0,0,0.6)` or `Colors.ink + '99'`), not as separate tokens — keeps the token list honest.
- `error` and `success` aren't in the brand palette — keep the existing semantic values, but if they clash with the orange-forward UI, prefer a deeper red for error (`#C7361B`) and reuse `orange` itself sparingly for success-adjacent confirmations.

## 3. Typography

- **Display serif: Superclarendon.** Heavy slab serif used for the logotype, edition headlines, group mastheads, and any "newspaper voice" moment. Superclarendon ships with macOS/iOS but is **not** a free webfont and not bundled with Android. Embed it natively on iOS where available; on Android and web, fall back to **Roboto Slab (700/900)** loaded via `@expo-google-fonts/roboto-slab`. Roboto Slab at 900 weight is the closest free analog and reads as the same family at a glance.
- **Body sans: Futura.** Geometric sans used for tab labels, buttons, body chrome, metadata. Futura is fully commercial; fall back to **Jost** (loaded via `@expo-google-fonts/jost`) — it's a near-exact open-source revival of Futura and renders cleanly at every size we use.
- **Reading body (newspaper columns):** Superclarendon Regular at 17px with 26px line-height, on `paperWarm`. Slab serifs hold up at body size where high-contrast didones don't — this is intentional.

Type scale:

| Token       | px  | Family              | Use                                              |
| ----------- | --- | ------------------- | ------------------------------------------------ |
| `xs`        | 12  | Futura              | Microcopy, timestamps, compose meta              |
| `sm`        | 14  | Futura              | Tab labels, captions                             |
| `body`      | 16  | Futura              | Default UI body                                  |
| `lg`        | 18  | Futura SemiBold     | Section headers, list row titles                 |
| `read`      | 17  | Superclarendon Reg  | Edition reader body                              |
| `xl`        | 22  | Superclarendon Bold | Group masthead subhead                           |
| `xxl`       | 28  | Superclarendon Bold | Card "Headline" in compose preview               |
| `headline`  | 36  | Superclarendon Heavy| Edition headline                                 |
| `wordmark`  | 32  | Superclarendon Heavy| "Catch Up Column" two-line wordmark              |

## 4. Layout & component idioms

- **App background:** `paperWarm` everywhere by default. Pure `paper` (white) is reserved for elevated cards and modals. Avoid stacking white-on-white surfaces — the warmth of the off-white is what makes the orange feel grounded.
- **Top bar (Home / Discover screens):** logotype or brandmark left-aligned (logotype on most screens, brandmark only on Home), no bottom border, generous vertical padding (~20px). No shadow.
- **Bottom tab bar:** flat `paper` background, hairline top border of `borderSoft`, **5 slots** with the center "+" raised in a ~64px `orange` circle that overlaps above the bar by ~24px. Hand-drawn-feel line icons; active tint = `orange`, inactive = `inkSoft`. Labels in Futura `sm`.
- **List rows (Groups, Drafts, Templates):** `peach` rounded pill containers (radius 16), ~56px tall, avatar/icon left + label in Futura `lg`, no chevron. Generous vertical gap (12–16px) between rows.
- **Cards (newspaper covers in Inbox grids):** raw image, ~3:4 aspect, no rounded corners on the paper itself, sometimes set on a `peachWash` mat. Thin `borderSoft` hairline on the image edge.
- **Buttons:**
  - Primary: `orange` fill, white Futura SemiBold, radius 12, no shadow.
  - Secondary: transparent fill, 1px `orange` border, `orange` Futura SemiBold label.
  - Tertiary / text: `ink` Futura SemiBold, no chrome.
- **Chips & tags:** `peach` fill, `ink` Futura `sm`, radius 999 (full pill), 8/12 vertical/horizontal padding.
- **Edition reader page:** masthead (group name in Superclarendon Heavy, thin rule, "Delivery date" small caps in Futura) → optional "Prompt for the week" italic line → flowing single-column body with inline images. See §6.
- **Compose card:** big `paper` rectangle with "Write…" placeholder in Superclarendon italic, sparkle icon bottom-right (future AI hook — decorative only for now), images grid below (3 slots), tags row below that. Card sits on `paperWarm`.
- **Profile:** avatar + 3-stat strip (Following / Followers / Posts) at top, then "Personal" / "Public" sections each rendering newspaper cover thumbnails in a horizontal row.
- **Settings:** flat list with section headings in Superclarendon Bold (Account, Support, About) and quiet underlined link rows in Futura.

## 5. Navigation mapping (current → target)

The shipped design uses a 5-slot bar with a raised center button: Home, Editions, +, Groups, Profile.

| Slot | Icon         | Maps to (MVP)                  | Notes                                                |
| ---- | ------------ | ------------------------------ | ---------------------------------------------------- |
| 1    | Home         | Home (`/(tabs)/home`)          | Brandmark + most-recent edition card + this-week strip. Uses Inbox data, no separate query. |
| 2    | Newspaper    | Editions (`/(tabs)/inbox`)     | List of editions, restyled. (File is `inbox.tsx`; the label reads "Editions".) |
| 3    | + (raised)   | Compose (`/(tabs)/post`)       | The composer, opened via the center "+" sheet.       |
| 4    | Account group| Groups (`/(tabs)/groups`)      | List of Groups you belong to.                        |
| 5    | Profile      | Profile (`/(tabs)/profile`)    | Profile + settings.                                  |

The earlier plan put a **Mail** stub in slot 4 and kept Groups off-tab; that was dropped — Groups now owns slot 4, and the Group **create/join/detail** flow lives off-tab under `app/group/`, reached from the Groups tab and Home.

## 6. Edition: front page + enlarge-to-read

The edition opens to a **classic newspaper front page** — a mixed-editorial cover where every story is visible at once — and tapping any section **enlarges it** into a full-screen single-story reader. This replaced the earlier continuous-scroll reader: the cover-then-enlarge model reads as "picking up a section of the Sunday paper" and gives older readers one big obvious tap target per story.

**This screen is the product's payoff and its best marketing asset**, and the common early-group case is a *thin* edition (1–3 posts). A truly empty (zero-post) edition can never occur — both the cron compiler and manual publish skip/reject groups with no posts — so **1 post is the floor**, and the front page is composed *for the post count* rather than being the full template with pieces missing (see "Thin editions adapt" below). Shareability is by **screenshot, not an in-app share button**: the masthead brands the top, the colophon brands the bottom, and the header is page-colored and shadowless so a capture reads as a clean broadsheet, not a screenshot of an app.

### 6.1 Front page (cover)

Top to bottom (`app/edition/[id]/index.tsx`):

1. **Masthead**: group name in Superclarendon Black all-caps; the italic "Week of …" dateline **flanked by short hairline rules** (a folio band, not a lone centered rule); an `EDITION NO. N · stories · writers` folio line in Futura `xs` small caps. 3px `ink` rule below. Kept compact so the masthead **and** the lead's kicker+headline clear the fold — a no-scroll screenshot already reads as a newspaper. (Honest folio: `NO. N` only — there is no volume concept, so no fabricated "VOL.")
2. **Lead story** (`edition-lead`): "LEAD STORY" kicker in `orange`, 36px Black headline, an **avatar byline** (the writer's face beside "By …" — faces are the fastest recognition for the older-adult audience), then the photo (tilt −1.5°, run a touch wider than the text column for front-page weight, no caption) and a **newsprint teaser**: a short 14px excerpt dissolving into greeked lines (see below), with an orange `READ THE STORY →` cue. Headline-first, photo second — the inverse of the secondary's silhouette.
3. **Secondary story** (`edition-secondary`): hairline rule above; photo-first for landscape/square (tilt **+1.5°** — never matching the lead's angle); 28px Bold headline; italic 14px avatar byline; a 2-line 14px excerpt + 2 greeked lines; orange read cue.
4. **"IN BRIEF" grid** (`edition-briefs-grid` + `edition-brief-column`): centered small-caps label flanked by rules, then briefs paired into **two columns** with a 1px `borderSoft` vertical rule between them and horizontal rules between rows. A brief with a photo opens with a **small square untaped thumb** (≤150px, deterministic tilt from the post id) — a third photo post is visible on the cover, not buried. 18px Bold headlines, 3-line 14px excerpts + 2 greeked lines. **An odd final brief runs the full measure** — no dangling half-column or lonely rule. The label + grid appear **only at ≥2 briefs (4+ posts)**; at exactly one brief the lone item runs the full measure with **no label** and a hairline rule above it (see thin editions).

**Thin editions adapt by post count** — the front page is composed *for the count*, not the full template minus pieces:

- **1 post**: the cover *is* the story. It renders the reader's `story-article` inline (`masthead → story-article → colophon`) — the full body at 17/26 with the drop cap and the taped polaroid. No teaser, no greeked lines, no `READ THE STORY →` cue, and **no enlarge**: with one story there is nothing to grow into, and the "continues below the fold" device would be a lie. Reusing `story-article` means the one-story edition reads exactly as enlarging that story would have, with zero new styling to maintain.
- **2 posts**: lead + secondary, no grid, no label.
- **3 posts**: lead + secondary + a third story run **full-measure with no "IN BRIEF" label** (a section head over one item reads thin), separated from the secondary by a hairline rule. The label + grid return at 4+ posts.
- **4+ posts**: the full lead + secondary + "IN BRIEF" grid, unchanged.

The slot rule (`orderEdition`, most-visual-wins) is untouched — only the *rendering* branches on count. `ordered` (lead → secondary → briefs) already matches, so the enlarge reader's Next/Prev sequence is unaffected.

**Closing colophon** (`edition-colophon`): every edition ends with a folio — a small centered ornament flanked by hairlines, `CATCH UP COLUMN · NO. N` in small caps, and, **on the Group's most-recent edition only**, a warm forward line ("The next edition arrives Sunday at 9 AM." — same publish math as Home's dateline via `nextPublishForGroup`). It seats the bottom of even a one-story page so a short edition never reads as cut off, and it brands a bottom-of-page screenshot. The forward line is **suppressed on archived editions** — pointing ahead under an old issue would be wrong (the screen compares the edition's `edition_number` to the Group's max via `fetchLatestEditionNumber`). The rare all-deleted edition (every post removed post-publish) keeps the masthead + colophon around a warm line rather than collapsing to a bare sentence.

**Byline avatars** are drawn by a single shared `Avatar` component (initials on a warm paper chip when there's no photo), used by both the front-page bylines and the reader's `story-article` byline so the two never drift.

**Photo shapes are orientation-aware** (`use-image-orientation`): each photo's natural ratio is learned from the image as it loads (no extra fetch), cached by raw URL so the cover, the enlarge snapshot, and the reader always agree, and snapped to a newspaper crop bucket — landscape **4:3**, portrait **4:5**, square **1:1** (±15% of square reads as square). On the cover, landscape/square photos run the full measure with text below; a **portrait photo holds its own column with the teaser running beside it** (46% width on the lead, 42% on the secondary) — the classic text-wrap move, and the page's main source of asymmetry. Until the shape is known, blocks lay out as landscape (the common case) and adapt once, when the image reports its size.

**Greeked continuation lines** (`greeked-lines`): after each cover excerpt, 2–3 thin rounded ink bars (~16% black, 7px on the excerpt's 20px rhythm, irregular ragged-right widths from a fixed pattern table) fade out line by line — the printer's device for "the column continues below the fold." They are decoration, not content: hidden from screen readers (the real excerpt carries the meaning), stable across re-renders so the enlarge overlay's snapshot matches, and always *after* real text so they read as a dissolving column rather than a skeleton loader.

**Slot assignment is by rule, no human editor** (`lib/edition-layout.ts`): most-visual-wins picks the lead (photo posts first, longest body among them), then the same rule picks the secondary from the remainder. Everyone else is a brief in written order. The reader's Next/Previous follows this exact order, so cover and reader always agree.

**Posts have optional titles**; `headlineFor` falls back to a warm byline headline ("From Ruth" — first name only).

**The 14px excerpt decision**: cover excerpts — including the lead's — are set at `sizes.excerpt` (14/20), deliberately below the 16px reading floor. (The 1-post cover is the exception: it reads at 17px because there the cover *is* the whole story, not a teaser.) They are *teasers*, newsprint you tap to enlarge, not reading copy; the full story is always available at 17px in the reader. Excerpts use `inkSoft` and carry `maxFontSizeMultiplier={1.6}` (the codebase's only font-scale cap) so the largest accessibility sizes still grow them to ~22px without wrecking the column layouts — everything else on the page scales freely. (Earlier drafts kept the lead at 17px reading type; that made the cover read like a blog post rather than a dense front page, so the lead now sets newsprint like everything else and lets its 36px headline and photo do the selling.)

The `READ THE STORY →` cue is an affordance label (Futura SemiBold 12px, `orange`) inside the already-pressable block — orange is fine here because it is not body copy. Brief cells omit the cue; at half-column width it's clutter, and the whole cell is the tap target.

### 6.2 Enlarge transition (cover → reader)

Tapping a section makes it **grow from its spot on the page into the full-screen reader** (`story-reader-overlay`): a 260ms ease-out frame interpolation from the section's measured frame to full screen, cross-fading the re-rendered section markup into the reader. Rendered in a transparent `Modal` (the app's established overlay idiom) so it covers the native header; warm-brown shadow lifts the "page" mid-flight. Closing reverses the shrink back into the origin frame — front-page scroll position is preserved because nothing ever navigates.

- **Reduce Motion bypasses the overlay entirely**: the tap pushes the plain `/edition/[id]/[postId]` route instead. That route is kept as the deep-link/fallback path and renders the same shared `story-reader` component.
- **A 1-post edition has no enlarge at all** — the cover already renders the full story inline (see thin editions), so there is nothing to tap into.
- No gestures — explicit buttons only (chevron, footer "Front page", Android hardware back via `onRequestClose`). Predictability over spectacle for the older-adult audience.

### 6.3 Story reader

One contributor's full post at a time (`story-reader` + `story-article`): 36px Black headline, avatar byline, taped polaroid, body in Superclarendon Regular at 17/26 with an **inline lettrine drop cap** (orange Black serif raised initial — RN has no float; skipped when the body opens on punctuation). Footer pages Next/Previous through the edition in cover order with a gentle 220ms slide+fade page turn (instant under Reduce Motion).

**Photos are polaroids everywhere** — the taped, tilted white-frame treatment (`polaroid-photo`) at every size, with rotation varied per slot so no two frames sit at the same angle. The earlier squared-off full-width inline photo treatment is retired. The reader's photo uses the same orientation buckets as the cover; a portrait photo renders tall at a **78% centered measure** (a full-width 4:5 would tower over the page).

Future iteration paths: drop caps on every post, "jump to author" anchor nav, printable PDF export.

## 7. Iconography

Line icons with a slightly hand-drawn feel — prefer Material Community Icons `*-outline` variants over FontAwesome for the tab bar and primary nav. Stroke weight should read as friendly, not technical. Icons inherit `orange` when active, `inkSoft` when inactive.

Recommended set:
- Home → `home-outline`
- Newspaper → `newspaper-variant-outline`
- Compose (+) → `plus` (white, on the raised orange circle)
- Groups → `account-group-outline` (filled `account-group` when active)
- Profile → `account-outline`

## 8. Empty states & status

Empty states use a small illustrated motif (cropped from the brandmark — the bag, the box, the discs) on `paperWarm`, with a Superclarendon Bold headline and a Futura body line beneath. Tone is warm and slightly playful, never apologetic.

Status banners: `peach` background for info, `yellow` background for warnings, deeper red for errors. All use Futura SemiBold for the headline and Futura Regular for the body.

## 9. Accessibility

- Body text minimum 16px; reader body 17px.
- All Futura body text on `paperWarm` must clear WCAG AA (4.5:1) at `ink` — verified.
- `orange` on `paper` clears AA for large text (18px+) but **not** for body text — never set body copy in `orange` on white. Use `ink` for body, reserve `orange` for headings, links, and interactive elements at 18px+ or with sufficient weight.
- Dynamic type scaling must continue to satisfy the 16px floor.
- Hit targets: 44×44pt minimum, including the raised "+" button.

## 10. The weekly ritual

The product's engagement loop is a ritual — write → anticipate → read → write again — and the UI expresses it with newspaper devices, never gamification (no streaks, badges, counters, or confetti; rejected on principle for this audience).

- **Home dateline strip** (`this-week-strip`): between the latest-edition card and the write card. A rule-framed, centered dateline — "NEXT EDITION · SUNDAY AT 9 AM" in kicker register (orange small caps) — over an italic serif byline sentence: "Ruth and Sam have written this week — there's still time to add yours." It aggregates the user's Groups (soonest publish wins the dateline) and **never names who hasn't written** — absence is invisible, presence is celebrated. Not pressable: the write card below is the call to action.
- **Publish math** lives in `lib/groups.ts` (`nextPublishForGroup`, `soonestPublish`): day-and-time display computed as the Group's own wall clock via `Intl`, deliberately not exact-instant math (no DST wrestling). Day labels come back as "today"/"tomorrow"/weekday for warm copy reuse.
- **NEW flag**: a yellow pill (`yellow` is the sparing highlight per §2) on Home's feature-card kicker row when the latest edition hasn't been opened **on this device**. Seen-tracking is AsyncStorage-local (`lib/edition-seen.ts`), not synced — "have I read this week's paper" is a per-device feeling, and a schema change wasn't warranted. The edition front page marks itself opened so deep links and the inbox path count.
- **Composer anticipation line**: the compose masthead subtitle names the destination — "Your story will run in Sunday's edition." (editing: "Editing your story for Sunday's edition.").
- **Filed stamp** (`filed-stamp`): on explicit Save success (never autosave), a rubber-stamp chip — orange border, small caps, −4° tilt, in family with the polaroids — presses onto the compose card's top-right corner, rests ~1.6s, fades. Paired with the `confirm()` haptic and a screen-reader announcement. Autosave stays quiet ("Saved") on purpose: the stamp marks a moment, the status row gives reassurance.
- Ritual copy lives together in `Strings.thisWeek` — one register: warm, concrete, never urgent.

## 11. Motion & haptics

- **Motion tokens** (`constants/motion.ts`): durations `quick` 160 / `settle` 220 / `enlarge` 260 / `exit` 200, easing `settle` = ease-out cubic. House style: animations read as a broadsheet being handled — short ease-out timing, no bounces or physics, Reduce Motion always respected. Sanctioned exception: the compose sheet settles with a gentle spring (a sheet that stops dead reads as broken). The printing-press loader keeps its own knobs in `constants/loading.ts`; everything else takes durations from Motion.
- **Haptics** (`lib/haptics.ts`): three semantic verbs, chosen by meaning — `tap()` light impact for key actions (filled buttons, the raised "+", page turns, a sheet drag that "took"), `select()` for value changes while choosing (day picker, time wheel — fires on change, never on re-pressing the current value), `confirm()` success notification reserved for moments the user cares about (post filed). Sparse on purpose: a haptic on everything is a haptic on nothing. Secondary/ghost buttons stay silent so the tactile layer keeps a hierarchy too. Haptics fire even under Reduce Motion (they aren't motion); all calls are fire-and-forget and no-op on web.
## 12. The invitation (join flow)

The join flow is the acquisition funnel — a group product grows by invitation, so the moment a curious invitee previews a Group is designed as a gift, not a form.

- **Concept: "a special edition, printed for you."** The invitation (`invite-hero`, hosted by `app/group/join.tsx`) renders as a one-page edition of the Group's own paper, flat on `paperWarm` with `PaperGrain` — the same broadsheet language as the edition front page, never a floating card. Top to bottom: a kicker band ("YOU'RE INVITED", orange small caps between ink hairlines — the dateline band promoted to a kicker), the Group name set as a masthead with the 3px ink rule, the cover photo as a taped polaroid (frame recipe copied from `polaroid-photo` but rendered around a plain `AppImage` — covers are public URLs, not signed post paths; no cover → the colophon's ◆ ornament seats the space), the description as an italic serif deck, the members as an avatar-stack byline ("Martha, Dave and 4 others are already here"), and the publish rhythm as a dateline ("A new edition every Sunday morning."). Rejected: torn-paper edges (kitsch risk; tape + rules already carry print) and card elevation for the hero.
- **One screen, two modes.** `join.tsx` is both the manual code-entry path and the deep-link landing page (`catchupcolumn://group/join?code=X`). A found code swaps entry → invitation as one whole block (fade/settle, no stagger — a page is handed over whole); Reduce Motion swaps instantly, and both paths announce the result to screen readers. The screen is reachable logged-out on purpose: anonymous invitees see a minimal preview (name, description, cover, member count — no faces; see `get_invite_preview` vs `get_invite_preview_details` in `db-migrations`), because motivation must come before the signup friction.
- **Pending invite through auth.** A logged-out invitee's accepted invite persists locally (`lib/pending-invite.ts`), the auth screens carry a peach "Joining {name}" strip (`pending-invite-banner`) so the goal stays visible through the forms, and after signup + onboarding the app auto-joins (`use-auto-join-invite`) and lands on the welcome screen.
- **Celebration = a stamp, not confetti** (§10 stands). `app/group/welcome.tsx` opens on "You're in!" with a persistent `joined-stamp` — the filed-stamp recipe at +3° tilt (FiledStamp owns −4°), "JOINED · {date}", pressing in ~350ms after mount with the `confirm()` haptic — a date stamped in the family record. Primary CTA pushes activation ("Introduce yourself in this week's edition" → composer preselected); secondary "Look around first". Nothing blocks or auto-navigates; CTAs are tappable from the first frame.
- **Sender side** (`invite-family-card` on the group screen): three invite paths matched to how families actually do it — read the code out (big ink-on-white tap-to-copy chip; the code is content, not chrome, so it's ink, not orange), text it (code-first share message — custom-scheme links aren't tappable in iMessage, so the code must carry the invite; the link is a bonus), or hand the phone across the table ("Show a code to scan": a QR of the deep link on a hard-white paper card — the quiet zone must be true `paper` white and nothing may texture the code).
- **Link format** has one seam: `buildInviteLink` in `lib/groups.ts`. A future https universal link changes only that function.
- Invitation copy lives in `Strings.invite` / `Strings.welcome` / `Strings.inviteCard` — same warm register as §10; errors stay person-to-person ("Double-check it with whoever invited you"), never technical.
