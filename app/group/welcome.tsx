import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AccessibilityInfo, BackHandler, StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { JoinedStamp } from '@/components/joined-stamp';
import { PaperGrain } from '@/components/paper-grain';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { nextPublishForGroup } from '@/lib/groups';

// The moment after joining: a stamped date in the family record, a welcome,
// and one warm push toward the thing that actually makes them a member —
// their first post. Nothing here blocks or auto-navigates; the CTAs are
// visible from the first frame and the stamp is the only animated element.
const WelcomeScreen = () => {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const { groupId, groupName, publishDay, publishTime, timezone } = useLocalSearchParams<{
    groupId: string;
    groupName?: string;
    publishDay?: string;
    publishTime?: string;
    timezone?: string;
  }>();

  const name = groupName ?? 'your Group';

  // Forward line only when the join flow could pass the schedule — never a
  // broken sentence.
  const next =
    publishDay !== undefined && publishTime && timezone
      ? nextPublishForGroup({
          publish_day: Number(publishDay),
          publish_time: publishTime,
          timezone,
        })
      : null;

  const stampDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const goToGroup = () => router.replace(`/group/${groupId}`);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(Strings.welcome.a11yJoined(name));
  }, [name]);

  // Android hardware back reads as "look around first", not "un-join".
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goToGroup();
      return true;
    });
    return () => sub.remove();
    // goToGroup only closes over stable router/groupId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.flex}>
        <PaperGrain />
        <View style={styles.content}>
          <View style={styles.ornamentRow}>
            <View style={styles.ornamentRule} />
            <ThemedText style={styles.ornament}>◆</ThemedText>
            <View style={styles.ornamentRule} />
          </View>

          <JoinedStamp label={Strings.welcome.stamp(stampDate)} reduceMotion={reduceMotion} />

          <ThemedText variant="headline" accessibilityRole="header" style={styles.headline}>
            {Strings.welcome.headline}
          </ThemedText>
          <ThemedText style={styles.subline} numberOfLines={3}>
            {Strings.welcome.subline(name)}
          </ThemedText>
          {next ? (
            <ThemedText style={styles.forward}>
              {Strings.colophon.nextEdition(next.dayLabel, next.timeLabel)}
            </ThemedText>
          ) : null}

          <View style={styles.ctaBlock}>
            <FormButton
              title={Strings.welcome.introduceCta}
              onPress={() =>
                router.replace({ pathname: '/(tabs)/post', params: { groupId } })
              }
            />
            <FormButton
              title={Strings.welcome.lookAroundCta}
              variant="secondary"
              onPress={goToGroup}
            />
          </View>
        </View>

        <ThemedText style={styles.folio}>{Strings.brand.masthead}</ThemedText>
      </View>
    </>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.lg,
    gap: Layout.padding.lg,
  },
  ornamentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.xl,
  },
  ornamentRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  ornament: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.sm,
    color: Colors.inkMuted,
  },
  headline: {
    textAlign: 'center',
  },
  subline: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.xl,
    lineHeight: 30,
    color: Colors.ink,
    textAlign: 'center',
  },
  forward: {
    marginTop: -Layout.padding.sm,
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  ctaBlock: {
    marginTop: Layout.padding.md,
    gap: Layout.padding.sm,
    alignItems: 'stretch',
  },
  folio: {
    paddingBottom: Layout.padding.xl,
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
});
