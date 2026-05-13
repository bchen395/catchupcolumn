import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage } from '@/components/app-image';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { fetchEditionsForUser, type EditionListItem } from '@/lib/editions';

const formatWeekOf = (publishedAt: string, timezone?: string | null): string => {
  const tz = timezone || undefined;
  const end = new Date(publishedAt);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const startMonth = start.toLocaleDateString('en-US', { timeZone: tz, month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { timeZone: tz, month: 'long' });
  const startDay = start.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
  const endDay = end.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
  const year = end.toLocaleDateString('en-US', { timeZone: tz, year: 'numeric' });
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}\u2013${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}, ${year}`;
};

type Pill = {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
};

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [latest, setLatest] = useState<EditionListItem | null>(null);

  // Reuse the inbox query and pluck the newest edition. Keeps Home a thin
  // composition over data that's already cached on the inbox tab.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) return;
      fetchEditionsForUser(user.id)
        .then((data) => {
          if (!cancelled) setLatest(data[0] ?? null);
        })
        .catch(() => {
          // Home gracefully degrades: missing latest edition just hides the card.
          if (!cancelled) setLatest(null);
        });
      return () => {
        cancelled = true;
      };
    }, [user])
  );

  const pills: Pill[] = [
    {
      label: 'My Groups',
      icon: 'account-group-outline',
      onPress: () => router.push('/groups'),
    },
  ];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Layout.padding.lg }]}>
      <View style={styles.masthead}>
        <View style={styles.wordmarkBlock}>
          <ThemedText style={styles.wordmarkLine}>CATCH UP</ThemedText>
          <ThemedText style={styles.wordmarkLine}>COLUMN</ThemedText>
        </View>
        {/* The World's Page badge will live here once the asset lands at
            assets/images/worlds-page-logo.png. */}
        <View style={styles.logoSlot} />
      </View>

      <ThemedText style={styles.tagline}>{Strings.brand.tagline}</ThemedText>

      {latest ? (
        <Pressable
          onPress={() => router.push(`/edition/${latest.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open the latest ${latest.group.name} edition`}
          style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
        >
          {latest.group.cover_image_url ? (
            <AppImage source={{ uri: latest.group.cover_image_url }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <MaterialCommunityIcons
                name="newspaper-variant-outline"
                size={32}
                color={Colors.navy}
              />
            </View>
          )}
          <View style={styles.featureBody}>
            <ThemedText style={styles.featureKicker}>HOT OFF THE PRESS</ThemedText>
            <ThemedText style={styles.featureTitle} numberOfLines={2}>
              {latest.group.name}
            </ThemedText>
            <ThemedText style={styles.featureMeta}>
              {formatWeekOf(latest.published_at, latest.group.timezone)} · Edition #{latest.edition_number}
            </ThemedText>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.pills}>
        {pills.map((pill) => (
          <Pressable
            key={pill.label}
            onPress={pill.onPress}
            accessibilityRole="button"
            accessibilityLabel={pill.label}
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
          >
            <MaterialCommunityIcons name={pill.icon} size={22} color={Colors.navy} />
            <ThemedText style={styles.pillLabel}>{pill.label}</ThemedText>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={Colors.navySoft}
            />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.paperWarm },
  scroll: {
    paddingHorizontal: Layout.padding.lg,
    paddingBottom: Layout.padding.xl,
    gap: Layout.padding.lg,
  },
  masthead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wordmarkBlock: {
    flexShrink: 1,
  },
  wordmarkLine: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.wordmark,
    lineHeight: Typography.lineHeights.wordmark,
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  logoSlot: {
    width: 56,
    height: 56,
  },
  tagline: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    color: Colors.inkSoft,
    fontStyle: 'italic',
  },
  // Feature card mimics a folded broadsheet: paper background, hairline border,
  // cover image at the top, masthead-style copy below. Tap = open edition.
  featureCard: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  featureCardPressed: {
    backgroundColor: Colors.paperCream,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.paperCream,
  },
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.blueWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    padding: Layout.padding.lg,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMid,
  },
  featureKicker: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    color: Colors.navy,
    letterSpacing: 2,
  },
  featureTitle: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: 32,
    color: Colors.ink,
  },
  featureMeta: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 2,
  },
  pills: {
    gap: Layout.padding.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.md,
    minHeight: Layout.touchTargetMin + 8,
    borderRadius: 999,
    backgroundColor: Colors.blueWash,
  },
  pillPressed: {
    backgroundColor: Colors.blueChipLight,
  },
  pillLabel: {
    flex: 1,
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    color: Colors.navy,
  },
});
