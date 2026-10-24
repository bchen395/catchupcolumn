import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar } from '../skeleton';

// The "Write for…" sheet's Group list on its first open, before the Groups
// arrive (2026-10-03; it was a bare system spinner). Mirrors the sheet's own
// rows: name over member count, hairline under each. The sheet's paper,
// header, and padding are already live around it.
const ROWS: { name: `${number}%`; members: `${number}%` }[] = [
  { name: '62%', members: '26%' },
  { name: '46%', members: '22%' },
];

export const ComposeSheetSkeleton = () => (
  <Skeleton label={Strings.loading.groups} style={styles.wrap}>
    {ROWS.map((row, i) => (
      <View key={i} style={styles.row}>
        <SkeletonBar variant="uiStrong" width={row.name} />
        <SkeletonBar variant="meta" width={row.members} />
      </View>
    ))}
  </Skeleton>
);

const styles = StyleSheet.create({
  // Sits on the sheet's paper, in place of its ScrollView (and its
  // listContent padding).
  wrap: {
    flex: 0,
    backgroundColor: 'transparent',
    paddingBottom: Layout.padding.sm,
  },
  // compose-group-sheet's `row` and `rowText`, including the bottom hairline.
  row: {
    justifyContent: 'center',
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.sm,
    borderBottomWidth: Layout.rule.hairline,
    borderBottomColor: Colors.hairline,
    gap: 2,
  },
});
