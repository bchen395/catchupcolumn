import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EditionPost } from '@/components/edition-post';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { fetchEditionWithPosts, fetchGroupForEdition } from '@/lib/editions';
import type { EditionWithPosts, GroupRow } from '@/types';

type GroupSummary = Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>;

const formatWeekOf = (publishedAt: string, timezone?: string | null): string => {
  const date = new Date(publishedAt);
  return date.toLocaleDateString('en-US', {
    timeZone: timezone || undefined,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const EditionScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [edition, setEdition] = useState<EditionWithPosts | null>(null);
  const [group, setGroup] = useState<GroupSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchEditionWithPosts(id);
      setEdition(data);
      const g = await fetchGroupForEdition(data.group_id);
      setGroup(g);
      setScreenError('');
    } catch (_err) {
      setScreenError('We could not load this edition right now. Pull down to try again.');
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText variant="body" style={styles.loadingText}>
          Loading…
        </ThemedText>
      </View>
    );
  }

  if (!edition || !group) {
    return (
      <View style={styles.loadingContainer}>
        <ThemedText variant="body" style={styles.loadingText}>
          {screenError || 'Edition not found.'}
        </ThemedText>
      </View>
    );
  }

  const weekOf = formatWeekOf(edition.published_at, group.timezone);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
      }
    >
      <Stack.Screen
        options={{
          title: group.name,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <FontAwesome name="chevron-left" size={16} color={Colors.accentNavy} />
            </Pressable>
          ),
        }}
      />

      {screenError ? (
        <StatusBanner variant="error" message={screenError} style={styles.banner} />
      ) : null}

      <View style={styles.masthead}>
        <ThemedText variant="caption" style={styles.mastheadKicker}>
          {group.name.toUpperCase()}
        </ThemedText>
        <View style={styles.mastheadRule} />
        <ThemedText variant="headline" style={styles.mastheadTitle}>
          Week of {weekOf}
        </ThemedText>
        <ThemedText variant="caption" style={styles.mastheadMeta}>
          Edition №{edition.edition_number}
        </ThemedText>
      </View>

      {edition.posts.length === 0 ? (
        <View style={styles.emptyEdition}>
          <ThemedText variant="body" style={styles.emptyEditionText}>
            This edition went out without any posts. Write something for next week!
          </ThemedText>
        </View>
      ) : (
        edition.posts.map((post) => <EditionPost key={post.id} post={post} />)
      )}
    </ScrollView>
  );
};

export default EditionScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: Layout.padding.xl,
  },
  backButton: {
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
    minWidth: Layout.touchTargetMin,
    minHeight: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.padding.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
  banner: {
    margin: Layout.padding.md,
  },
  masthead: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    paddingBottom: Layout.padding.lg,
    alignItems: 'center',
    gap: Layout.padding.sm,
    borderBottomWidth: 2,
    borderColor: Colors.text,
  },
  mastheadKicker: {
    letterSpacing: 3,
    color: Colors.accentNavy,
    fontFamily: Typography.families.sansSemiBold,
  },
  mastheadRule: {
    width: 64,
    height: 1,
    backgroundColor: Colors.border,
  },
  mastheadTitle: {
    textAlign: 'center',
    color: Colors.text,
  },
  mastheadMeta: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  emptyEdition: {
    padding: Layout.padding.xl,
    alignItems: 'center',
  },
  emptyEditionText: {
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
