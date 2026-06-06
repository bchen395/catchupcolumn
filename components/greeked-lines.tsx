import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Layout } from '@/constants/layout';

type Props = {
  // How many dummy lines to draw.
  lines?: number;
  style?: StyleProp<ViewStyle>;
};

// "Greeked" text — the printer's dummy lines that stand in for a column that
// keeps going. Drawn after a real excerpt on the edition front page so the
// story visibly continues below the fold and invites the tap to enlarge.
// Purely decorative: hidden from screen readers (the excerpt carries the
// meaning), and faded line by line so it reads as a column dissolving into
// the fold — not a skeleton loader stuck mid-load.
//
// Each line is a few rounded bars with word-gap breaks; widths come from a
// fixed pattern table so the ragged right edge is irregular but stable across
// renders (the enlarge overlay re-renders this markup for its cross-fade).
const SEGMENT_PATTERNS: number[][] = [
  [0.58, 0.34],
  [0.3, 0.22, 0.38],
  [0.66, 0.18],
  [0.42, 0.44],
  [0.52, 0.2, 0.16],
];

export const GreekedLines = ({ lines = 3, style }: Props) => (
  <View
    style={[styles.wrap, style]}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    pointerEvents="none"
  >
    {Array.from({ length: lines }, (_, i) => {
      const segments = SEGMENT_PATTERNS[i % SEGMENT_PATTERNS.length];
      // Dissolve toward the bottom — the last line is the faintest.
      const opacity = 1 - (i / Math.max(lines, 2)) * 0.7;
      return (
        <View key={i} style={[styles.line, { opacity }]}>
          {segments.map((flexWidth, j) => (
            <View key={j} style={[styles.segment, { flex: flexWidth }]} />
          ))}
          {/* Ragged right edge — lines stop short like real type. */}
          <View style={{ flex: Math.max(0, 1 - segments.reduce((a, b) => a + b, 0)) }} />
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  // 7px bars on a 20px pitch — matches the excerpt's line rhythm.
  wrap: {
    gap: 13,
  },
  line: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    height: 7,
    borderRadius: Layout.borderRadius.full,
    // Ink at ~16% — darker than a hairline, lighter than secondary text, so it
    // reads as distant type rather than a border or a loading state.
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
});
