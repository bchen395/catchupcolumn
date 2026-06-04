import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EditionBrief } from '@/components/edition-brief';
import { EditionLead } from '@/components/edition-lead';
import { ErrorState } from '@/components/error-state';
import { PaperGrain } from '@/components/paper-grain';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { orderEdition } from '@/lib/edition-layout';
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
    return `${startMonth} ${startDay}–${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
};

const countContributors = (edition: EditionWithPosts): number =>
  new Set(edition.posts.map((p) => p.author_id)).size;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The edition front page: a masthead, the curated lead story, then "also in
// this edition" briefs for everyone else. Tapping any story opens the reader.
const EditionFrontPage = () => {
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
  const { lead, briefs } = orderEdition(edition.posts);
  const openStory = (postId: string) => router.push(`/edition/${id}/${postId}`);

  return (
    <View style={styles.flex}>
      <PaperGrain />
      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.orange} />
        }
      >
        <Stack.Screen
          options={{
            title: '',
            headerStyle: { backgroundColor: Colors.paperWarm },
            headerShadowVisible: false,
            headerTintColor: Colors.ink,
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={22} color={Colors.orange} />
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
          <ThemedText style={styles.mastheadMeta}>
            Edition #{edition.edition_number}
            {edition.posts.length > 0
              ? `  ·  ${plural(edition.posts.length, 'story', 'stories')}  ·  ${plural(
                  countContributors(edition),
                  'writer',
                  'writers',
                )}`
              : ''}
          </ThemedText>
        </View>

        {!lead ? (
          <View style={styles.emptyEdition}>
            <ThemedText variant="body" style={styles.emptyEditionText}>
              {Strings.empty.edition.body}
            </ThemedText>
          </View>
        ) : (
          <>
            <EditionLead post={lead} onPress={() => openStory(lead.id)} />

            {briefs.length > 0 ? (
              <View style={styles.briefsSection}>
                <View style={styles.briefsHeader}>
                  <View style={styles.briefsRule} />
                  <ThemedText style={styles.briefsLabel}>ALSO IN THIS EDITION</ThemedText>
                  <View style={styles.briefsRule} />
                </View>
                {briefs.map((post, idx) => (
                  <Fragment key={post.id}>
                    {idx > 0 ? <View style={styles.briefDivider} /> : null}
                    <EditionBrief post={post} onPress={() => openStory(post.id)} />
                  </Fragment>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default EditionFrontPage;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  scrollFlex: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    paddingBottom: Layout.padding.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    margin: Layout.padding.md,
  },
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
    letterSpacing: 1,
    color: Colors.inkSoft,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  briefsSection: {
    paddingTop: Layout.padding.sm,
  },
  // Centered "also in this edition" label flanked by short rules — a section
  // head, not a card boundary.
  briefsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.md,
    paddingBottom: Layout.padding.sm,
  },
  briefsRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  briefsLabel: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.inkSoft,
  },
  briefDivider: {
    height: 1,
    backgroundColor: Colors.borderSoft,
    marginHorizontal: Layout.padding.lg,
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
