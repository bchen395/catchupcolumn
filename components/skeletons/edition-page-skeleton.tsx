import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { Skeleton, SkeletonBar, SkeletonBlock, SkeletonCircle, SkeletonLines, SkeletonRule } from '../skeleton';

// The edition front page mid-load — the app's longest wait (three round trips
// before first paint) and its richest layout, so it earns the most faithful
// placeholder. Mirrors app/edition/[id]/index.tsx: masthead, lead, secondary,
// briefs grid.
//
// The masthead's rules and the section rules are drawn for real: the page's
// structure is known before the data is, so it shouldn't look like it's still
// arriving.

// The front page's newsprint excerpt is still set from the legacy metrics.
const EXCERPT = {
  fontSize: Typography.sizes.excerpt,
  lineHeight: Typography.lineHeights.excerpt,
};

const BylineRow = () => (
  <View style={styles.bylineRow}>
    <SkeletonCircle size={28} />
    <SkeletonBar variant="ui" width="42%" style={styles.flex} />
  </View>
);

export const EditionPageSkeleton = () => (
  <Skeleton label={Strings.loading.edition}>
    {/* Masthead — group name, dateline folio band, edition meta. */}
    <View style={styles.masthead}>
      <SkeletonBar variant="display" width="80%" center />
      <View style={styles.datelineRow}>
        <View style={styles.datelineRule} />
        <SkeletonBar variant="ui" width={132} center />
        <View style={styles.datelineRule} />
      </View>
      <SkeletonBar variant="meta" width="58%" center />
    </View>

    {/* Lead story — kicker, two headline lines, byline, photo, excerpt. */}
    <View style={styles.story}>
      <SkeletonBar variant="kicker" width={96} />
      <SkeletonBar variant="headline" width="100%" />
      <SkeletonBar variant="headline" width="64%" />
      <BylineRow />
      <SkeletonBlock height={220} style={styles.photo} />
      <SkeletonLines variant="caption" lines={3} {...EXCERPT} />
    </View>

    <SkeletonRule style={styles.sectionRule} />

    {/* Secondary story — photo above a shorter headline. */}
    <View style={styles.story}>
      <SkeletonBlock height={168} />
      <SkeletonBar variant="title" width="92%" />
      <SkeletonBar variant="title" width="48%" />
      <BylineRow />
      <SkeletonLines variant="caption" lines={2} {...EXCERPT} />
    </View>

    {/* In Brief — the two-column grid of short columns. */}
    <View style={styles.briefsHeader}>
      <SkeletonRule style={styles.flex} />
      <SkeletonBar variant="kicker" width={72} />
      <SkeletonRule style={styles.flex} />
    </View>
    <View style={styles.briefsRow}>
      {[0, 1].map((i) => (
        <View key={i} style={styles.briefColumn}>
          <SkeletonBlock height={96} />
          <SkeletonBar variant="rowTitle" width="94%" />
          <SkeletonBar variant="rowTitle" width="56%" />
          <SkeletonLines variant="caption" lines={2} {...EXCERPT} />
        </View>
      ))}
    </View>
  </Skeleton>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  masthead: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    paddingBottom: Layout.padding.lg,
    alignItems: 'center',
    gap: Layout.padding.xs,
    borderBottomWidth: Layout.rule.heavy,
    borderBottomColor: Colors.ink,
  },
  datelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.md,
    marginVertical: Layout.padding.xs,
  },
  // Real rule, full-strength ink — matches the live masthead's folio band.
  datelineRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.ink,
  },
  story: {
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
    gap: Layout.padding.sm,
  },
  photo: {
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.xs,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    marginTop: Layout.padding.xs,
  },
  sectionRule: {
    marginHorizontal: Layout.padding.lg,
  },
  briefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    marginHorizontal: Layout.padding.lg,
    marginTop: Layout.padding.lg,
  },
  briefsRow: {
    flexDirection: 'row',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.md,
  },
  briefColumn: {
    flex: 1,
    gap: Layout.padding.sm,
  },
});
