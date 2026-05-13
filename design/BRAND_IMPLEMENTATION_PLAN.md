# Brand implementation plan

A phased rollout of the new visual system defined in [BRAND.md](BRAND.md). Scope is intentionally narrowed to **colors and typography** plus the styling-only component touch-ups that fall out of those changes. Structural redesigns (5-tab bar with raised "+", peach pill list rows, edition-reader masthead/drop-caps, brand-asset PNGs) are deferred and called out at the end.

Resolved decisions:
- **Display serif:** platform-conditional — Superclarendon on iOS, Roboto Slab elsewhere (Android/web).
- **Body sans:** platform-conditional — Futura on iOS, Jost elsewhere.
- **Opacity tokens (`inkSoft`, `inkMuted`):** kept as named tokens, just re-pointed at the new palette. We do *not* sweep ~70 call sites to inline `rgba(...)` strings.

## 0. Open questions

All resolved.

- Edition reader body restyle (Phase 5) is **in scope** under typography.
- Error red **bumps to `#C7361B`**.

## 1. Phase 1 — Color token replacement (`constants/colors.ts`)

Single-file change. No call-site edits yet — every existing token name keeps working by being re-pointed at the new palette where there's a sensible mapping, and new tokens are added alongside.

**Rewrite [constants/colors.ts](constants/colors.ts):**
- Add new tokens: `orange` `#FF7237`, `peach` `#FFD3C2`, `yellow` `#F4E33A`.
- Re-point existing tokens:
  - `paper` `#FFFFFF` (unchanged)
  - `paperWarm` `#F5F5F5` → `#FAF7F2` (warmer, per BRAND)
  - `ink` `#1D1B20` → `#000000`
  - `inkSoft` stays as a token, value becomes `rgba(0,0,0,0.6)` (or hex equivalent `#666666` if rgba doesn't lint cleanly in our StyleSheet usage — verify)
  - `borderSoft` stays as a token, value becomes `rgba(0,0,0,0.12)` (or `#E0E0E0`)
- Retire (mark deprecated, delete in Phase 3): `navy`, `navySoft`, `blueChip`, `blueChipLight`, `blueWash`, `paperCream`, `borderMid`, `inkBlack`, `divider`.
- Add `inkMuted` `rgba(0,0,0,0.38)` for disabled states.
- Update `error` to `#C7361B` (pending §0 decision).

**Verification:** app should still build with no call-site edits. Visual diffs will show the new warm background and black text everywhere; navy/blue elements will still render their old hex (because nothing renamed them yet) — that's intentional, they get swept in Phase 3.

## 2. Phase 2 — Typography token replacement (`constants/typography.ts` + `app/_layout.tsx`)

Platform-conditional fonts. iOS uses bundled system fonts (Superclarendon, Futura) referenced by PostScript name — no loading needed. Android and web load Roboto Slab + Jost via Expo Google Fonts.

**Install:**
```
npx expo install @expo-google-fonts/roboto-slab @expo-google-fonts/jost
```

**Edit [app/_layout.tsx](app/_layout.tsx:38-46):** wrap the `useFonts` call so it loads Roboto Slab + Jost only on non-iOS platforms (on iOS the loader can be a no-op since system fonts are always available). Simplest pattern:

```ts
import { Platform } from 'react-native';
// ...
const [fontsLoaded, fontError] = useFonts(
  Platform.OS === 'ios'
    ? {}
    : {
        RobotoSlab_400Regular,
        RobotoSlab_700Bold,
        RobotoSlab_900Black,
        Jost_400Regular,
        Jost_500Medium,
        Jost_600SemiBold,
        Jost_700Bold,
      }
);
```

Drop the existing Playfair Display + Inter imports. Once Phase 3 confirms zero references, remove `@expo-google-fonts/playfair-display` and `@expo-google-fonts/inter` from [package.json](package.json).

**Rewrite [constants/typography.ts](constants/typography.ts):** keep the existing token keys (`serif`, `serifBold`, `serifBlack`, `sans`, `sansMedium`, `sansSemiBold`, `sansBold`) so call sites don't need to change. Each value becomes a `Platform.select(...)` expression:

```ts
import { Platform } from 'react-native';

const pick = (ios: string, other: string) => Platform.select({ ios, default: other })!;

export const Typography = {
  families: {
    serif:      pick('Superclarendon',       'RobotoSlab_400Regular'),
    serifBold:  pick('Superclarendon-Bold',  'RobotoSlab_700Bold'),
    serifBlack: pick('Superclarendon-Black', 'RobotoSlab_900Black'),
    sans:       pick('Futura',               'Jost_400Regular'),
    sansMedium: pick('Futura-Medium',        'Jost_500Medium'),
    sansSemiBold: pick('Futura-Medium',      'Jost_600SemiBold'), // see note below
    sansBold:   pick('Futura-Bold',          'Jost_700Bold'),
  },
  // sizes / lineHeights unchanged plus:
  // sizes.read = 17
  // lineHeights.read = 26
};
```

**Caveats to confirm during implementation:**
- **Futura ships no SemiBold on iOS** — only Regular / Medium / Bold (PostScript: `Futura`, `Futura-Medium`, `Futura-Bold`). Mapping `sansSemiBold` to `Futura-Medium` on iOS will look slightly lighter than `Jost_600SemiBold` on Android. Acceptable as long as we don't try to set them side-by-side; flag if it reads wrong in headers.
- **Superclarendon Heavy/Black** — iOS bundles `Superclarendon-Black`. Verify the exact PostScript name on a real device (it's `Superclarendon-Black` per Apple's font book, but worth a quick check).
- **Iconography (BRAND §7)** — switch the tab-bar icon set to Material Community `*-outline` variants is a separate component-level change tracked in Phase 4, but worth noting now since `@expo/vector-icons` already exposes them.

Add new size token: `read: 17` and matching `lineHeights.read: 26` for the edition reader body (BRAND §3, §6).

**Verification:** every screen renders on both iOS simulator and an Android emulator (or web). Headlines should look chunkier on Android (Roboto Slab Heavy) and slightly more refined on iOS (Superclarendon). Body should feel geometric on both.

## 3. Phase 3 — Sweep retired color tokens

A find-and-replace pass. Use the BRAND palette to assign each retired token to its new home, then delete the deprecated entries from `colors.ts`.

Mapping (proposed — confirm before sweeping):

| Retired token       | Replace with                | Rationale                                            |
| ------------------- | --------------------------- | ---------------------------------------------------- |
| `Colors.navy` (63)  | `Colors.orange`             | Primary action / accent color — old navy was the brand accent |
| `Colors.navySoft` (8) | `Colors.orange` + 0.8 opacity | Pressed state (BRAND §2 — `orangeSoft` is just opacity) |
| `Colors.blueChip` (1) | `Colors.peach`            | Chips/tags use peach in new system                   |
| `Colors.blueChipLight` (3) | `Colors.peach`       | Same                                                 |
| `Colors.blueWash` (8) | `Colors.peach` + 0.4 opacity | Hover/secondary surface (BRAND §2 — `peachWash`)   |
| `Colors.paperCream` (20) | `Colors.peach`          | Soft surface — peach is the warm-surface token now   |
| `Colors.borderMid` (26) | `Colors.borderSoft`      | One border token, not two                            |
| `Colors.divider`    | `Colors.borderSoft`         | Same                                                 |
| `Colors.inkBlack`   | `Colors.ink`                | `ink` is now `#000000`                               |

After the sweep, delete the retired entries from [constants/colors.ts](constants/colors.ts). TypeScript will catch any stragglers.

**Verification:** grep for retired names should return zero hits. Run the app, click through every screen.

## 4. Phase 4 — Component-level styling refinements

These are the styling tweaks that fall out of having the right tokens but don't require structural changes. Each is a small, isolated edit.

- **[components/custom-tab-bar.tsx](components/custom-tab-bar.tsx):** active icon/label tint = `Colors.orange`, inactive = `Colors.inkSoft`. Tab bar background = `Colors.paper`, hairline top border = `Colors.borderSoft`. (The raised "+" center button is deferred.)
- **[components/form-button.tsx](components/form-button.tsx):**
  - Primary: `Colors.orange` fill, white `Typography.families.sansSemiBold` label, radius 12, no shadow.
  - Secondary: transparent fill, 1px `Colors.orange` border, `Colors.orange` `sansSemiBold` label.
  - Tertiary: `Colors.ink` `sansSemiBold`, no chrome.
- **[components/status-banner.tsx](components/status-banner.tsx):** info → `Colors.peach` bg, warning → `Colors.yellow` bg, error → `Colors.error` bg. Headline `sansSemiBold`, body `sans`.
- **[components/themed-text.tsx](components/themed-text.tsx) + [components/themed-view.tsx](components/themed-view.tsx):** confirm default text color is `Colors.ink`, default view background is `Colors.paperWarm`.
- **Chips/tags** (wherever they appear — likely `components/group-card.tsx`, edition meta): `Colors.peach` fill, `Colors.ink` `sansSemiBold` `sm`, radius 999, padding 8/12.
- **Empty/error states** ([components/empty-state.tsx](components/empty-state.tsx), [components/error-state.tsx](components/error-state.tsx)): swap headline to `serifBold`, body to `sans`, background `paperWarm`.

**Accessibility check (BRAND §9):** scan StyleSheet usages where `Colors.orange` is set on `color` — any body-size text (16px or smaller, non-bold) on white must be flagged and switched to `Colors.ink`. Orange is for headings, links, and interactive elements at 18px+ or sufficient weight.

**Verification:** load each tab and component variant in Expo Go (or simulator) and eyeball.

## 5. Phase 5 — Edition reader typography pass

Pending §0 confirmation that "reader body switches to Superclarendon/Roboto Slab Regular 17/26" is in scope under "typography."

- **[app/edition/[id].tsx](app/edition/[id].tsx)** + **[components/edition-post.tsx](components/edition-post.tsx):** post body uses `Typography.families.serif` at `read` (17) with `lineHeights.read` (26), on `Colors.paperWarm`.
- Byline: `serifBold` at `xl` (22), prefixed "From {author}".
- Drop cap (first post only, nice-to-have): oversized `serifBlack` first letter in `Colors.orange`, ~3 lines tall, floated left.

Other reader structural elements (masthead, ornamental rules between posts, single continuous surface) belong to the deferred reader-redesign work (BRAND §6).

**Verification:** open an existing edition, confirm body type feels like a newspaper column at arm's-length reading distance.

## 6. Deferred — explicitly out of this scope

These appear in BRAND.md but are not pure color/typography changes. Track separately.

- Brand assets (`brandmark.png`, `logotype.png`, `submark.png`) — not in repo yet.
- 5-tab bar with raised "+" center button (BRAND §4) — structural nav change.
- Peach pill list rows for Groups/Drafts (BRAND §4) — component restructure.
- Edition reader continuous-newspaper layout, ornamental rules, masthead-with-italic-week-line (BRAND §6) — layout work beyond typography.
- Mail tab content beyond the existing stub (BRAND §5) — new screen.
- My Groups demotion from tab to Home button (BRAND §5) — already partially done (Groups is no longer in tab bar per current `app/(tabs)/` listing) but flow needs verification.

## Suggested execution order

Phase 1 → Phase 2 (these two unblock everything else; can ship as a single commit because nothing else has changed) → Phase 3 (the visible "redesign moment") → Phase 4 (polish) → Phase 5 (reader).

Phases 1–3 should land together to avoid a half-themed UI; Phase 4 and 5 can land incrementally.
