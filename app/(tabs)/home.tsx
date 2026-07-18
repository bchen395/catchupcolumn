import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useComposeSheet } from '@/components/compose-sheet-provider';
import { FirstEditionHero, HomeHero } from '@/components/home-hero';
import { ThemedText } from '@/components/themed-text';
import { ThisWeekStrip } from '@/components/this-week-strip';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { dailyPick, Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import { firstName } from '@/lib/edition-layout';
import { hasOpenedEdition } from '@/lib/edition-seen';
import { fetchEditionsForUser, type EditionListItem } from '@/lib/editions';
import { fetchThisWeeksBylines, type WeeklyByline } from '@/lib/posts';

// Time-aware greeting per BRAND §8. Hour boundaries are the plain-spoken
// ones: morning until noon, afternoon until 6pm, evening after.
const greetingFor = (name: string, now: Date): string => {
  const hour = now.getHours();
  if (hour < 12) return Strings.greeting.morning(name);
  if (hour < 18) return Strings.greeting.afternoon(name);
  return Strings.greeting.evening(name);
};

// The masthead's folio date — a daily paper prints its date (BRAND §8).
const mastheadDate = (now: Date): string =>
  now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
          // Home gracefully degrades: a failed fetch just hides the hero.
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
  const now = new Date();

  return (
    <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Layout.padding.lg }]}>
      {/* The greeting IS Home's masthead (BRAND §8): folio date, greeting,
          and the day's rotating motto — freshly typeset every morning. */}
      <View style={styles.masthead}>
        <ThemedText variant="meta">{mastheadDate(now)}</ThemedText>
        <ThemedText variant="headline" numberOfLines={1}>
          {greetingFor(displayName ? firstName(displayName) : '', now)}
        </ThemedText>
        <ThemedText variant="deck">{dailyPick(Strings.home.deckLines, now)}</ThemedText>
      </View>

      {latest ? (
        <HomeHero
          edition={latest}
          isNew={latestIsNew}
          onPress={() => router.push(`/edition/${latest.id}`)}
        />
      ) : groups.length > 0 ? (
        // No edition yet — the first-week coming-soon front (BRAND §8), so
        // the hero slot is alive exactly when first impressions form.
        <FirstEditionHero />
      ) : null}

      <ThisWeekStrip groups={groups} bylines={bylines} currentUserId={user?.id ?? null} />

      {/* The main thing to DO on Home — dressed as a big secondary button
          (hairline outline, ink), not a tinted slab. The CTA is constant;
          only the warmth beneath it rotates. */}
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
            {dailyPick(Strings.home.writeLines, now)}
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
  masthead: {
    gap: Layout.padding.xs,
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
