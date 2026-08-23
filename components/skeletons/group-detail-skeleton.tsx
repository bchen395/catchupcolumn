import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar, SkeletonBlock, SkeletonCircle } from '../skeleton';

// A Group's detail screen mid-load. Mirrors app/group/[id].tsx: cover plate,
// the identity header (name, description, publish schedule), then the members
// section. The hairline section borders are drawn for real — the screen's
// division into bands doesn't depend on the fetch.
const MEMBERS: `${number}%`[] = ['46%', '62%', '38%'];

export const GroupDetailSkeleton = () => (
  <Skeleton label={Strings.loading.group}>
    <SkeletonBlock height={180} style={styles.cover} />

    <View style={styles.header}>
      <SkeletonBar variant="headline" width="74%" />
      <SkeletonBar variant="ui" width="96%" />
      <SkeletonBar variant="ui" width="58%" />
      <SkeletonBar variant="caption" width="52%" style={styles.schedule} />
    </View>

    <View style={styles.section}>
      <SkeletonBar variant="meta" width={124} />
      {MEMBERS.map((width, i) => (
        <View key={i} style={styles.memberRow}>
          <SkeletonCircle size={44} />
          <View style={styles.memberInfo}>
            <SkeletonBar variant="ui" width={width} />
            <SkeletonBlock width={84} height={22} radius={Layout.borderRadius.full} outlined />
          </View>
        </View>
      ))}
    </View>
  </Skeleton>
);

const styles = StyleSheet.create({
  // The live cover has no border of its own; the header's rule closes the band.
  cover: {
    borderWidth: 0,
  },
  header: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    gap: Layout.padding.sm,
  },
  schedule: {
    marginTop: Layout.padding.xs,
  },
  section: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    gap: Layout.padding.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
});
