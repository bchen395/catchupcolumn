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
import { firstName, headlineFor, orderEdition } from '@/lib/edition-layout';
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

// Time-aware greeting per BRAND §8. Hour boundaries are the plain-spoken
// ones: morning until noon, afternoon until 6pm, evening after.
const greetingFor = (name: string, now: Date): string => {
  const hour = now.getHours();
  if (hour < 12) return Strings.greeting.morning(name);
  if (hour < 18) return Strings.greeting.afternoon(name);
  return Strings.greeting.evening(name);
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

  const displayName = (user?.user_metadata?.display_name as string | undefined) ?? '';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Layout.padding.lg }]}>
      {/* The greeting IS Home's masthead (BRAND §8) — the v1 brandmark
          retired with the box-and-bag identity (§12). */}
      <View>
        <ThemedText variant="headline" numberOfLines={1}>
          {greetingFor(displayName ? firstName(displayName) : '', new Date())}
        </ThemedText>
        <ThemedText variant="deck">{Strings.brand.tagline}</ThemedText>
      </View>

      {latest ? (
        <Pressable
          onPress={() => router.push(`/edition/${latest.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open the latest ${latest.group.name} edition`}
          style={({ pressed }) => [styles.feature, pressed && styles.featurePressed]}
        >
          {/* A section front, not a card: heavy rule, kicker, title, the
              cover as a flat hairline-edged photo (BRAND §6). */}
          <View style={styles.featureRule} />
          <View style={styles.featureKickerRow}>
            <ThemedText variant="kicker">Hot off the press</ThemedText>
            {latestIsNew ? (
              // The NEW pill — a sanctioned vermilion live-moment (BRAND §2),
              // outlined per §9's chip rule, never filled.
              <View style={styles.newFlag}>
                <ThemedText style={styles.newFlagText}>{Strings.thisWeek.newFlag}</ThemedText>
              </View>
            ) : null}
          </View>
          <ThemedText variant="title" numberOfLines={2}>
            {latest.group.name}
          </ThemedText>
          {(() => {
            const lead = orderEdition(latest.posts ?? []).lead;
            return lead ? (
              <ThemedText variant="deck" numberOfLines={2}>
                “{headlineFor(lead)}”
              </ThemedText>
            ) : null;
          })()}
          {latest.group.cover_image_url ? (
            <AppImage source={{ uri: latest.group.cover_image_url }} style={styles.coverImage} />
          ) : null}
          <ThemedText variant="meta">
            {formatWeekOf(latest.published_at, latest.group.timezone)}
          </ThemedText>
        </Pressable>
      ) : null}

      <ThisWeekStrip groups={groups} bylines={bylines} currentUserId={user?.id ?? null} />

      {/* The main thing to DO on Home — dressed as a big secondary button
          (hairline outline, ink), not a tinted slab. */}
      <Pressable
        onPress={openComposeSheet}
        accessibilityRole="button"
        accessibilityLabel="Write your post for this week"
        style={({ pressed }) => [styles.writeBlock, pressed && styles.writeBlockPressed]}
      >
        <MaterialCommunityIcons name="pencil-outline" size={26} color={Colors.ink} />
        <View style={styles.writeText}>
          <ThemedText variant="uiStrong">Write for this week</ThemedText>
          <ThemedText variant="ui" style={styles.writeBody}>
            Add your note before this week's edition goes out.
          </ThemedText>
        </View>
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
    gap: Layout.padding.xl,
  },
  feature: {
    gap: Layout.padding.sm,
  },
  featurePressed: {
    opacity: 0.7,
  },
  featureRule: {
    height: Layout.rule.heavy,
    backgroundColor: Colors.ink,
    marginBottom: Layout.padding.xs,
  },
  featureKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.padding.sm,
  },
  newFlag: {
    borderWidth: 1,
    borderColor: Colors.vermilion,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: 2,
  },
  newFlagText: {
    ...Typography.scale.meta,
    color: Colors.vermilion,
  },
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    marginTop: Layout.padding.xs,
  },
  writeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.lg,
  },
  writeBlockPressed: {
    opacity: 0.7,
  },
  writeText: {
    flex: 1,
    gap: 2,
  },
  writeBody: {
    color: Colors.inkSoft,
  },
});
