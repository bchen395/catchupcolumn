import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar, SkeletonBlock, SkeletonRule } from '../skeleton';

// The Editions tab mid-load. Mirrors the SectionList in app/(tabs)/inbox.tsx:
// a section front per Group (heavy ink rule, title, cover thumb) over
// hairline-separated rows of headline + folio + lead-photo thumb.
//
// Row widths come from a fixed table so the ragged edge is irregular but
// stable across re-renders — same trick as GreekedLines.
const ROWS: { title: `${number}%`; meta: `${number}%`; thumb: boolean }[] = [
  { title: '88%', meta: '46%', thumb: true },
  { title: '62%', meta: '38%', thumb: false },
  { title: '80%', meta: '52%', thumb: true },
];

const SectionSkeleton = ({ nameWidth }: { nameWidth: `${number}%` }) => (
  <View>
    <View style={styles.sectionHeader}>
      <SkeletonRule weight="heavy" />
      <View style={styles.sectionTitleRow}>
        <SkeletonBar variant="title" width={nameWidth} style={styles.flex} />
        <SkeletonBlock width={40} height={40} />
      </View>
    </View>
    {ROWS.map((row, i) => (
      <View key={i}>
        {i > 0 ? <SkeletonRule /> : null}
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <SkeletonBar variant="rowTitle" width={row.title} />
            <SkeletonBar variant="meta" width={row.meta} />
          </View>
          {row.thumb ? <SkeletonBlock width={56} height={56} /> : null}
        </View>
      </View>
    ))}
  </View>
);

export const EditionsListSkeleton = () => (
  <Skeleton label={Strings.loading.inbox} style={styles.screen}>
    <SectionSkeleton nameWidth="72%" />
    <SectionSkeleton nameWidth="54%" />
  </Skeleton>
);

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: Layout.padding.lg,
    backgroundColor: Colors.paperWarm,
  },
  flex: {
    flex: 1,
  },
  sectionHeader: {
    paddingTop: Layout.padding.xl,
    gap: Layout.padding.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingBottom: Layout.padding.sm,
  },
  row: {
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
});
