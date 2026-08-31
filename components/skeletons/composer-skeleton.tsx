import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { Skeleton, SkeletonBar, SkeletonLines } from '../skeleton';

// The composer mid-load, filling what used to be a bare empty View while the
// draft resolved. The sheet itself is drawn for real — paper, radius, shadow,
// hairline rule — because the page you write on doesn't depend on the fetch;
// only the headline and body lines breathe.
const BODY = {
  fontSize: Typography.sizes.lg,
  lineHeight: 30,
};

type Props = {
  // Home and Post render the header themselves; pass true only when this
  // stands in for the header too (the pre-group-selection wait).
  withHeader?: boolean;
};

export const ComposerSkeleton = ({ withHeader = false }: Props) => (
  <Skeleton label={Strings.loading.composer} style={styles.wrap}>
    {withHeader ? (
      <View style={styles.header}>
        <SkeletonBar variant="title" width="58%" />
        <SkeletonBar variant="caption" width="72%" />
      </View>
    ) : null}

    <View style={styles.card}>
      <SkeletonBar variant="title" width="52%" />
      <View style={styles.titleRule} />
      <SkeletonLines variant="read" lines={6} {...BODY} />
    </View>
  </Skeleton>
);

const styles = StyleSheet.create({
  // Sits inside the composer's ScrollView, which owns padding and background.
  wrap: {
    flex: 0,
    backgroundColor: 'transparent',
    gap: Layout.padding.lg,
  },
  header: {
    gap: Layout.padding.xs,
  },
  // The real sheet: a page laid on the warm desk (BRAND §6 — the sanctioned
  // elevation, since the composer card is a true overlay surface).
  card: {
    ...Layout.shadow.paper,
    backgroundColor: Colors.paper,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    minHeight: 360,
    padding: Layout.padding.lg,
  },
  titleRule: {
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
});
