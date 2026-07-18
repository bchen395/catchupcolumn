import type { TextStyle } from 'react-native';

// v2 typography (BRAND.md §3): two families, loaded via @expo-google-fonts in
// app/_layout.tsx, identical on every platform — the v1 iOS-Superclarendon /
// Futura split is retired so there is one metric reality.
//
// - Lora carries every serif role: headlines at 600–700, reading body at 400,
//   true italics for decks, datelines, and bylines.
// - Jost carries all UI chrome: tabs, buttons, metadata, captions, labels —
//   including the wide-tracked small-caps "NYT dress code" (done with
//   uppercase + tracking, never a smallcaps font feature).
// - Hand-lettering is not a font (BRAND §3) — it exists only baked into
//   illustration assets.
export const Typography = {
  families: {
    serif: 'Lora_400Regular',
    serifItalic: 'Lora_400Regular_Italic',
    serifSemiBold: 'Lora_600SemiBold',
    serifBold: 'Lora_700Bold',
    sans: 'Jost_400Regular',
    sansMedium: 'Jost_500Medium',
    sansSemiBold: 'Jost_600SemiBold',
    sansBold: 'Jost_700Bold',
  },

  // The v2 type scale (BRAND §3), one entry per token. ThemedText exposes
  // these as variants — reach for a variant before composing styles by hand.
  // `meta`/`caption`/`kicker` are the only sub-16 sizes and never carry
  // sentence-length copy.
  scale: {
    caption: {
      fontFamily: 'Jost_400Regular',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    meta: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    kicker: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    ui: {
      fontFamily: 'Jost_400Regular',
      fontSize: 16,
      lineHeight: 24,
    },
    uiStrong: {
      fontFamily: 'Jost_600SemiBold',
      fontSize: 16,
      lineHeight: 24,
    },
    deck: {
      // 16, not the drafted 15: decks are sentence-length copy, so they honor
      // the 16px reading floor (decided 2026-07-17; BRAND §3).
      fontFamily: 'Lora_400Regular_Italic',
      fontSize: 16,
      lineHeight: 23,
    },
    read: {
      fontFamily: 'Lora_400Regular',
      fontSize: 17,
      lineHeight: 26,
    },
    rowTitle: {
      fontFamily: 'Lora_600SemiBold',
      fontSize: 19,
      lineHeight: 26,
    },
    title: {
      fontFamily: 'Lora_700Bold',
      fontSize: 24,
      lineHeight: 30,
    },
    headline: {
      fontFamily: 'Lora_700Bold',
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.5,
    },
    display: {
      fontFamily: 'Lora_700Bold',
      fontSize: 40,
      lineHeight: 46,
    },
  } satisfies Record<string, TextStyle>,

  // ── v1 legacy sizing — kept so unmigrated screens compile unchanged ──────
  // New/migrated code uses `scale` (via ThemedText variants) instead. Delete
  // entries as their last usages migrate.
  sizes: {
    xs: 12,
    sm: 14,
    body: 16,
    lg: 18,
    read: 17,
    xl: 22,
    xxl: 28,
    headline: 36,
    wordmark: 32,
    // Cover teaser text on the edition front page. Intentionally below the
    // 16px reading floor: excerpts are scannable newsprint that invites a tap
    // to enlarge — real reading always happens in the 17px story reader.
    // (Decision survives into v2 — BRAND §3.)
    excerpt: 14,
  },
  lineHeights: {
    body: 24,
    read: 26,
    headline: 44,
    wordmark: 36,
    // Tight leading for multi-line cover excerpts in narrow columns.
    excerpt: 20,
  },
};
