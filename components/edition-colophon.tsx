import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { RolledPaperGlyph } from './illustrations/rolled-paper-glyph';
import { ThemedText } from './themed-text';

type Props = {
  editionNumber: number;
  // The warm forward line ("The next edition arrives Sunday at 9 AM."), passed
  // only for a Group's most-recent edition — printing it under an archived
  // edition would be wrong, so the host decides and passes null otherwise.
  nextEditionLine?: string | null;
};

// The edition's closing folio: a newspaper's "this is the end of the page, on
// purpose" mark. The rolled-paper glyph (the one sanctioned inked mark on
// editorial surfaces, BRAND §4) flanked by hairlines, the brand + edition
// folio in small caps, and — on the latest edition only — a warm line
// pointing at next week. It seats the bottom of even a one-story page so a
// thin edition never reads as cut off, and it brands a bottom-of-page
// screenshot.
export const EditionColophon = ({ editionNumber, nextEditionLine }: Props) => (
  <View style={styles.wrap}>
    <View style={styles.ornamentRow}>
      <View style={styles.rule} />
      <RolledPaperGlyph size={14} />
      <View style={styles.rule} />
    </View>
    <ThemedText variant="meta" style={styles.folio}>
      {`${Strings.colophon.brand}  ·  ${Strings.colophon.folio(editionNumber)}`}
    </ThemedText>
    {nextEditionLine ? (
      <ThemedText variant="deck" style={styles.next}>
        {nextEditionLine}
      </ThemedText>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    paddingBottom: Layout.padding.xl,
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  // Short ornament between two hairlines — a section-end device, not a border.
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    alignSelf: 'stretch',
    paddingHorizontal: Layout.padding.xl,
  },
  rule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
  },
  // A touch wider tracking than stock `meta` — folio dress.
  folio: {
    letterSpacing: 2,
    textAlign: 'center',
  },
  next: {
    ...Typography.scale.deck,
    textAlign: 'center',
    marginTop: Layout.padding.xs,
  },
});
