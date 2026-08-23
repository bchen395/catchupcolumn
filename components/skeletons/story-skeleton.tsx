import { StyleSheet, View } from 'react-native';

import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { Skeleton, SkeletonBar, SkeletonBlock, SkeletonCircle, SkeletonLines } from '../skeleton';

// The story reader mid-load. Mirrors StoryArticle: headline, byline block
// (48px avatar + "BY" + author), the photo plate, then reading copy set on the
// 17/26 `read` rhythm so the body lands exactly where the bars sat.
const BODY = {
  fontSize: Typography.sizes.read,
  lineHeight: Typography.lineHeights.read,
};

export const StorySkeleton = () => (
  <Skeleton label={Strings.loading.story}>
    <View style={styles.article}>
      <SkeletonBar variant="headline" width="100%" />
      <SkeletonBar variant="headline" width="58%" />

      <View style={styles.byline}>
        <SkeletonCircle size={48} />
        <View style={styles.bylineText}>
          <SkeletonBar variant="meta" width={28} />
          <SkeletonBar variant="title" width="52%" />
        </View>
      </View>

      <SkeletonBlock height={240} style={styles.photo} />

      <SkeletonLines variant="read" lines={8} {...BODY} />
    </View>
  </Skeleton>
);

const styles = StyleSheet.create({
  article: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
  },
  bylineText: {
    flex: 1,
    gap: 2,
  },
  photo: {
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
});
