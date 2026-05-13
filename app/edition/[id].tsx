import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EditionPost } from '@/components/edition-post';
import { ErrorState } from '@/components/error-state';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { fetchEditionWithPosts, fetchGroupForEdition } from '@/lib/editions';
import type { EditionWithPosts, GroupRow } from '@/types';

type GroupSummary = Pick<GroupRow, 'id' | 'name' | 'cover_image_url' | 'timezone'>;

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

// Centered ornamental rule between posts. Three asterisks is the classic
// newspaper section break ("dinkus") — easy to render in any serif font and
// reads as a visual pause without looking like a card boundary.
const OrnamentalRule = () => (
  <View style={ornamentStyles.wrap} accessibilityRole="none">
    <ThemedText style={ornamentStyles.glyph}>* * *</ThemedText>
  </View>
);

const ornamentStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: Layout.padding.lg,
  },
  glyph: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    letterSpacing: 8,
    color: Colors.inkSoft,
  },
});

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
      setScreenError(Strings.error.editionLoad);
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
    return <PrintingPressLoading message={Strings.loading.edition} />;
  }

  if (!edition || !group) {
    return (
      <ErrorState
        icon={Icons.errorGeneric}
        title={Strings.error.generic.title}
        body={screenError || 'Edition not found.'}
        onRetry={() => {
          setLoading(true);
          load().finally(() => setLoading(false));
        }}
      />
    );
  }

  const weekOf = formatWeekOf(edition.published_at, group.timezone);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.navy} />
      }
    >
      <Stack.Screen
        options={{
          title: group.name,
          headerStyle: { backgroundColor: Colors.paperCream },
          headerTintColor: Colors.ink,
          headerTitleStyle: {
            fontFamily: Typography.families.serifBold,
            color: Colors.ink,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <FontAwesome name="chevron-left" size={16} color={Colors.navy} />
            </Pressable>
          ),
        }}
      />

      {screenError ? (
        <StatusBanner variant="error" message={screenError} style={styles.banner} />
      ) : null}

      <View style={styles.masthead}>
        <ThemedText style={styles.mastheadTitle} numberOfLines={2}>
          {group.name.toUpperCase()}
        </ThemedText>
        <View style={styles.mastheadRule} />
        <ThemedText style={styles.mastheadDate}>{weekOf}</ThemedText>
        <ThemedText style={styles.mastheadMeta}>Edition #{edition.edition_number}</ThemedText>
      </View>

      {edition.posts.length === 0 ? (
        <View style={styles.emptyEdition}>
          <ThemedText variant="body" style={styles.emptyEditionText}>
            {Strings.empty.edition.body}
          </ThemedText>
        </View>
      ) : (
        edition.posts.map((post, idx) => (
          <Fragment key={post.id}>
            {idx > 0 ? <OrnamentalRule /> : null}
            <EditionPost post={post} />
          </Fragment>
        ))
      )}
    </ScrollView>
  );
};

export default EditionScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    // Switching to paperCream gives the whole screen a single, warm,
    // newsprint-feeling surface from masthead to last post — no card seams.
    backgroundColor: Colors.paperCream,
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
  banner: {
    margin: Layout.padding.md,
  },
  // Masthead: heavy serif group name, thin rule below, italic week-of, edition
  // number in soft ink. Bottom border is a thicker double-strike newspaper rule.
  masthead: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    paddingBottom: Layout.padding.lg,
    alignItems: 'center',
    gap: Layout.padding.xs,
    borderBottomWidth: 3,
    borderBottomColor: Colors.ink,
  },
  mastheadTitle: {
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.headline,
    lineHeight: Typography.lineHeights.headline,
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: 1,
  },
  mastheadRule: {
    width: 80,
    height: 1,
    backgroundColor: Colors.ink,
    marginVertical: Layout.padding.xs,
  },
  mastheadDate: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    fontStyle: 'italic',
    color: Colors.ink,
  },
  mastheadMeta: {
    fontFamily: Typography.families.sansMedium,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.inkSoft,
    textTransform: 'uppercase',
  },
  emptyEdition: {
    padding: Layout.padding.xl,
    alignItems: 'center',
  },
  emptyEditionText: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    color: Colors.inkSoft,
    textAlign: 'center',
  },
});
