import { StyleSheet, View } from 'react-native';

import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar, SkeletonCircle } from '../skeleton';

// The profile byline hero mid-load. Replaces the old treatment, where the hero
// rendered immediately with `??` fallbacks ("Your account", "No email
// available") under a "Loading your account details…" caption — so real values
// visibly displaced placeholder text field by field.
//
// Partial by design: the buttons and legal links below the hero need no data
// and stay live, so this covers only the identity block.
export const ProfileHeroSkeleton = () => (
  <Skeleton label={Strings.loading.profile} style={styles.wrap}>
    <View style={styles.avatarWrap}>
      <SkeletonCircle size={112} />
    </View>
    <SkeletonBar variant="kicker" width={124} center style={styles.kicker} />
    <SkeletonBar variant="title" width="56%" center />
    <SkeletonBar variant="ui" width="44%" center />
    <SkeletonBar variant="ui" width="62%" center />
  </Skeleton>
);

const styles = StyleSheet.create({
  // Sits inside Profile's ScrollView, which owns the page background.
  wrap: {
    flex: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    gap: 4,
  },
  avatarWrap: {
    marginBottom: Layout.padding.sm,
  },
  kicker: {
    marginTop: Layout.padding.xs,
  },
});
