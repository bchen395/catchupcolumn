import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar, SkeletonBlock } from '../skeleton';

// The Groups tab mid-load. Mirrors GroupCard exactly — square cover thumb,
// name, description, member count — so the list doesn't shift when it lands.
// Renders below the Create/Join action bar, which needs no data and stays live.
const ROWS: { name: `${number}%`; description: `${number}%`; members: `${number}%` }[] = [
  { name: '68%', description: '92%', members: '34%' },
  { name: '52%', description: '74%', members: '28%' },
  { name: '76%', description: '86%', members: '38%' },
];

export const GroupsListSkeleton = () => (
  <Skeleton label={Strings.loading.groups}>
    {ROWS.map((row, i) => (
      <View key={i} style={styles.row}>
        <View style={styles.content}>
          <SkeletonBar variant="rowTitle" width={row.name} />
          <SkeletonBar variant="ui" width={row.description} />
          <SkeletonBar variant="meta" width={row.members} />
        </View>
        <SkeletonBlock width={56} height={56} />
      </View>
    ))}
  </Skeleton>
);

const styles = StyleSheet.create({
  // GroupCard's own metrics, including its bottom hairline.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.rowMinHeight,
    paddingVertical: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    borderBottomWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    gap: Layout.padding.md,
  },
  content: {
    flex: 1,
    gap: 4,
  },
});
