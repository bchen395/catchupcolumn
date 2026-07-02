import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { ThemedText } from './themed-text';

type Props = {
  editionNumber: number;
  // The warm forward line ("The next edition arrives Sunday at 9 AM."), passed
  // only for a Group's most-recent edition — printing it under an archived
  // edition would be wrong, so the host decides and passes null otherwise.
  nextEditionLine?: string | null;
};

// The edition's closing folio: a newspaper's "this is the end of the page, on
// purpose" mark. A small centered ornament flanked by hairlines, the brand +
// edition folio in small caps, and — on the latest edition only — a warm line
// pointing at next week. It seats the bottom of even a one-story page so a thin
// edition never reads as cut off, and it brands a bottom-of-page screenshot.
export const EditionColophon = ({ editionNumber, nextEditionLine }: Props) => (
  <View style={styles.wrap}>
    <View style={styles.ornamentRow}>
      <View style={styles.rule} />
      <ThemedText style={styles.ornament}>◆</ThemedText>
      <View style={styles.rule} />
    </View>
    <ThemedText style={styles.folio}>
      {`${Strings.colophon.brand.toUpperCase()}  ·  ${Strings.colophon.folio(editionNumber).toUpperCase()}`}
    </ThemedText>
    {nextEditionLine ? <ThemedText style={styles.next}>{nextEditionLine}</ThemedText> : null}
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
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  ornament: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.sm,
    color: Colors.inkMuted,
  },
  folio: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  next: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
    textAlign: 'center',
    marginTop: Layout.padding.xs,
  },
});
