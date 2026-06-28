import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppImage } from '@/components/app-image';
import { useComposeSheet } from '@/components/compose-sheet-provider';
import { ThemedText } from '@/components/themed-text';
import { ThisWeekStrip } from '@/components/this-week-strip';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { headlineFor, orderEdition } from '@/lib/edition-layout';
import { hasOpenedEdition } from '@/lib/edition-seen';
import { fetchEditionsForUser, type EditionListItem } from '@/lib/editions';
import { fetchThisWeeksBylines, type WeeklyByline } from '@/lib/posts';

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

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { openComposeSheet, groups } = useComposeSheet();
  const insets = useSafeAreaInsets();
  const [latest, setLatest] = useState<EditionListItem | null>(null);
  const [latestIsNew, setLatestIsNew] = useState(false);
  const [bylines, setBylines] = useState<WeeklyByline[]>([]);

  // Reuse the inbox query and pluck the newest edition. Keeps Home a thin
  // composition over data that's already cached on the inbox tab.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!user) return;
      fetchEditionsForUser(user.id)
        .then(async (data) => {
          const newest = data[0] ?? null;
          // Re-checked on every focus so reading the edition (which marks it
          // opened) clears the flag the moment you come back to Home.
          const isNew = newest ? !(await hasOpenedEdition(newest.id)) : false;
          if (!cancelled) {
            setLatest(newest);
            setLatestIsNew(isNew);
          }
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

  // Who has filed for the upcoming editions — feeds the dateline strip.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const groupIds = groups.map((g) => g.id);
      if (groupIds.length === 0) {
        setBylines([]);
        return;
      }
      fetchThisWeeksBylines(groupIds)
        .then((data) => {
          if (!cancelled) setBylines(data);
        })
        .catch(() => {
          // Degrade to the no-bylines line rather than blocking Home.
          if (!cancelled) setBylines([]);
        });
      return () => {
        cancelled = true;
      };
    }, [groups])
  );

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Layout.padding.lg }]}>
      <View style={styles.masthead}>
        <AppImage
          source={require('@/assets/brand/logo.png')}
          style={styles.brandmark}
          contentFit="contain"
        />
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
                color={Colors.orange}
              />
            </View>
          )}
          <View style={styles.featureBody}>
            <View style={styles.featureKickerRow}>
              <ThemedText style={styles.featureKicker}>HOT OFF THE PRESS</ThemedText>
              {latestIsNew ? (
                <View style={styles.newFlag}>
                  <ThemedText style={styles.newFlagText}>{Strings.thisWeek.newFlag}</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText style={styles.featureTitle} numberOfLines={2}>
              {latest.group.name}
            </ThemedText>
            {(() => {
              const lead = orderEdition(latest.posts ?? []).lead;
              return lead ? (
                <ThemedText style={styles.featureLead} numberOfLines={2}>
                  “{headlineFor(lead)}”
                </ThemedText>
              ) : null;
            })()}
            <ThemedText style={styles.featureMeta}>
              {formatWeekOf(latest.published_at, latest.group.timezone)} · Edition #{latest.edition_number}
            </ThemedText>
          </View>
        </Pressable>
      ) : null}

      <ThisWeekStrip groups={groups} bylines={bylines} currentUserId={user?.id ?? null} />

      <Pressable
        onPress={openComposeSheet}
        accessibilityRole="button"
        accessibilityLabel="Write your post for this week"
        style={({ pressed }) => [styles.writeCard, pressed && styles.writeCardPressed]}
      >
        <View style={styles.writeIcon}>
          <MaterialCommunityIcons name="pencil-outline" size={24} color={Colors.paper} />
        </View>
        <View style={styles.writeText}>
          <ThemedText style={styles.writeTitle}>Write for this week</ThemedText>
          <ThemedText style={styles.writeBody}>
            Add your note before this week's edition goes out.
          </ThemedText>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.orange} />
      </Pressable>
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
    alignItems: 'flex-start',
  },
  brandmark: {
    width: 160,
    aspectRatio: 315 / 266,
    backgroundColor: 'transparent',
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
    borderColor: Colors.borderSoft,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  featureCardPressed: {
    backgroundColor: Colors.peach,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.peach,
  },
  coverPlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.peachWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: {
    padding: Layout.padding.lg,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
  },
  featureKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.padding.sm,
  },
  featureKicker: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    color: Colors.orange,
    letterSpacing: 2,
  },
  // Yellow is the brand's sparing highlight (BRAND §2) — exactly right for a
  // once-a-week "fresh paper on the doorstep" flag. Clears once the edition
  // has been opened on this device.
  newFlag: {
    backgroundColor: Colors.yellow,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: 2,
  },
  newFlagText: {
    fontFamily: Typography.families.sansBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.ink,
  },
  featureTitle: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xxl,
    lineHeight: 32,
    color: Colors.ink,
  },
  // The lead story's headline — the reason to open this edition.
  featureLead: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.read,
    lineHeight: 24,
    color: Colors.ink,
    marginTop: 4,
  },
  featureMeta: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.body,
    color: Colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 2,
  },
  // Primary weekly action. Solid peach card with a raised orange icon badge
  // that echoes the compose "+" in the tab bar, so the main thing to *do* on
  // Home reads as deliberate, not just another wash pill.
  writeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    backgroundColor: Colors.peach,
    borderRadius: Layout.borderRadius.lg,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
  },
  writeCardPressed: {
    opacity: 0.92,
  },
  writeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeText: {
    flex: 1,
    gap: 2,
  },
  writeTitle: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.lg,
    color: Colors.ink,
  },
  writeBody: {
    fontFamily: Typography.families.sans,
    fontSize: Typography.sizes.body,
    lineHeight: 22,
    color: Colors.inkSoft,
  },
});
