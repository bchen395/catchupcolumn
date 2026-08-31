import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar, SkeletonBlock, SkeletonRule } from '../skeleton';

// Home's data-dependent slots only. Deliberately partial: the masthead
// (greeting, folio date, motto) and the "Write for this week" CTA are computed
// locally, so they render instantly and must never sit behind a placeholder.
// This covers just the hero and the dateline strip beneath it.
//
// Not a full-screen wrapper — it's dropped into Home's ScrollView in place of
// those two blocks, so `Skeleton` here wraps content rather than a page.
export const HomeHeroSkeleton = () => (
  <Skeleton label={Strings.loading.home} style={styles.wrap}>
    {/* Hero — section rule, kicker, cover plate, headline, deck, folio. */}
    <View style={styles.hero}>
      <SkeletonRule weight="heavy" style={styles.heroRule} />
      <SkeletonBar variant="kicker" width={116} />
      <SkeletonBlock style={styles.cover} />
      <SkeletonBar variant="title" width="88%" />
      <SkeletonBar variant="deck" width="70%" />
      <SkeletonBar variant="meta" width="54%" />
    </View>

    {/* This-week strip — hairline rules around the dateline and bylines. */}
    <View style={styles.strip}>
      <SkeletonRule style={styles.stretch} />
      <SkeletonBar variant="kicker" width={168} center />
      <SkeletonBar variant="deck" width="76%" center />
      <SkeletonRule style={styles.stretch} />
    </View>
  </Skeleton>
);

const styles = StyleSheet.create({
  // Sits inside Home's ScrollView, which owns the page background and padding.
  wrap: {
    flex: 0,
    backgroundColor: 'transparent',
    gap: Layout.padding.xl,
  },
  hero: {
    gap: Layout.padding.sm,
  },
  heroRule: {
    marginBottom: Layout.padding.xs,
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderColor: Colors.hairline,
    marginTop: Layout.padding.xs,
  },
  strip: {
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  stretch: {
    alignSelf: 'stretch',
  },
});
