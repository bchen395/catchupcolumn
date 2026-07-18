import { Text, TextProps, StyleSheet } from 'react-native';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

// v2 variants map 1:1 onto the BRAND §3 type scale. The v1 variants below
// them survive only for unmigrated screens — new/migrated code picks from the
// scale. `caption` still carries its v1 (16px) definition until the last v1
// caption usage migrates; most of those become `meta` in v2 dress. Once they
// do, redefine `caption` to Typography.scale.caption (Jost 12, +0.4).
type Variant =
  // v2 scale
  | 'meta'
  | 'kicker'
  | 'ui'
  | 'uiStrong'
  | 'deck'
  | 'read'
  | 'rowTitle'
  | 'title'
  | 'headline'
  | 'display'
  // v1 legacy — migrate, then delete
  | 'subheadline'
  | 'body'
  | 'serifBody'
  | 'caption'
  | 'label';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
}

export const ThemedText = ({ variant = 'body', style, ...props }: ThemedTextProps) => {
  return <Text style={[styles.base, variantStyles[variant], style]} {...props} />;
};

const styles = StyleSheet.create({
  base: {
    color: Colors.ink,
  },
});

const variantStyles = StyleSheet.create({
  // ── v2 scale (BRAND §3) ───────────────────────────────────────────────
  // Metadata dress code defaults to inkSoft; decks are the italic inkSoft
  // voice. Kickers default to ink — apply vermilion per use, within the
  // budget (BRAND §2).
  meta: { ...Typography.scale.meta, color: Colors.inkSoft },
  kicker: Typography.scale.kicker,
  ui: Typography.scale.ui,
  uiStrong: Typography.scale.uiStrong,
  deck: { ...Typography.scale.deck, color: Colors.inkSoft },
  read: Typography.scale.read,
  rowTitle: Typography.scale.rowTitle,
  title: Typography.scale.title,
  headline: Typography.scale.headline,
  display: Typography.scale.display,

  // ── v1 legacy ─────────────────────────────────────────────────────────
  subheadline: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.xl,
    lineHeight: 30,
  },
  body: {
    // Same spec as `ui` — kept as a separate name so v1 call sites read
    // unchanged; new code says `ui`.
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
  },
  serifBody: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    lineHeight: 28,
  },
  caption: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    lineHeight: 22,
    color: Colors.inkSoft,
  },
  label: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    lineHeight: 22,
  },
});
