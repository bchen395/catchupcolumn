import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, View } from 'react-native';

import { AppImage } from '@/components/app-image';
import { useComposeSheet } from '@/components/compose-sheet-provider';
import { EditionRow } from '@/components/edition-row';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PaperboyMailboxScene } from '@/components/illustrations/paperboy-mailbox-scene';
import { SleepingDogDoodle } from '@/components/illustrations/sleeping-dog-doodle';
import { EditionsListSkeleton } from '@/components/skeletons/editions-list-skeleton';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import { formatWeekOf, headlineFor, orderEdition } from '@/lib/edition-layout';
import { fetchEditionsForUser, type EditionListItem } from '@/lib/editions';

type Section = {
  groupId: string;
  groupName: string;
  coverUrl: string | null;
  data: EditionListItem[];
};

// The row's folio line, in the NYT metadata dress (BRAND §6/§8):
// `FEB 9 · 6 STORIES · 4 WRITERS`. The meta variant does the uppercasing.
const folioFor = (item: EditionListItem): string => {
  const date = new Date(item.published_at).toLocaleDateString('en-US', {
    timeZone: item.group.timezone || undefined,
    month: 'short',
    day: 'numeric',
  });
  const posts = item.posts ?? [];
  if (posts.length === 0) {
    return `${date} · Edition No. ${item.edition_number}`;
  }
  const writers = new Set(posts.map((p) => p.author?.display_name)).size;
  const stories = `${posts.length} ${posts.length === 1 ? 'story' : 'stories'}`;
  const bylines = `${writers} ${writers === 1 ? 'writer' : 'writers'}`;
  return `${date} · ${stories} · ${bylines}`;
};

const buildSections = (editions: EditionListItem[]): Section[] => {
  const map = new Map<string, Section>();
  for (const e of editions) {
    const existing = map.get(e.group_id);
    if (existing) {
      existing.data.push(e);
    } else {
      map.set(e.group_id, {
        groupId: e.group_id,
        groupName: e.group.name,
        coverUrl: e.group.cover_image_url,
        data: [e],
      });
    }
  }
  // Editions already sorted newest-first by query; sections ordered by their
  // newest edition. Compared as instants rather than strings — see the same
  // note on `fetchEditionWithPosts`.
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.data[0].published_at).getTime() - new Date(a.data[0].published_at).getTime(),
  );
};

const InboxScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { openComposeSheet } = useComposeSheet();
  const [editions, setEditions] = useState<EditionListItem[]>([]);
  // Monotonic per account: the skeleton shows until the first load settles and
  // never again, so returning to the tab revalidates silently behind the list
  // instead of blanking it.
  const [hydrated, setHydrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchEditionsForUser(user.id);
      setEditions(data);
      setScreenError('');
    } catch (_err) {
      setScreenError(Strings.error.inboxLoad);
    }
  }, [user]);

  // A different account must not see the previous one's editions.
  useEffect(() => {
    setHydrated(false);
    setEditions([]);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load().finally(() => {
        if (!cancelled) setHydrated(true);
      });
      return () => {
        cancelled = true;
      };
    }, [load])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sections = useMemo(() => buildSections(editions), [editions]);

  const renderItem = useCallback(
    ({ item }: { item: EditionListItem }) => {
      // Lead with the edition's lead-story headline when there is one — it
      // sells the issue far better than a bare date. Fall back to the date.
      const lead = orderEdition(item.posts ?? []).lead;
      return (
        <EditionRow
          headline={lead ? headlineFor(lead) : formatWeekOf(item.published_at, item.group.timezone)}
          folio={folioFor(item)}
          leadImageUrl={lead?.image_url ?? null}
          onPress={() => router.push(`/edition/${item.id}`)}
        />
      );
    },
    [router],
  );

  // Each Group opens like a newspaper section front: a heavy ink rule, then
  // the section title (BRAND §6). No placeholder art when a Group has no
  // cover — the rule carries the structure.
  const renderSectionHeader = useCallback(({ section }: { section: Section }) => {
    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionRule} />
        <View style={styles.sectionTitleRow}>
          <ThemedText variant="title" style={styles.sectionLabel} numberOfLines={1}>
            {section.groupName}
          </ThemedText>
          {section.coverUrl ? (
            <AppImage source={{ uri: section.coverUrl }} style={styles.sectionThumb} />
          ) : null}
        </View>
      </View>
    );
  }, []);

  if (!hydrated) {
    return <EditionsListSkeleton />;
  }

  if (sections.length === 0) {
    if (screenError) {
      return (
        <ErrorState
          icon={Icons.errorNetwork}
          title={Strings.error.network.title}
          body={screenError}
          onRetry={load}
        />
      );
    }
    return (
      <EmptyState
        scene={<PaperboyMailboxScene />}
        title={Strings.empty.inbox.title}
        body={Strings.empty.inbox.body}
        ctaLabel={Strings.empty.inbox.cta}
        onCtaPress={openComposeSheet}
      />
    );
  }

  return (
    <SectionList
      style={styles.listBackground}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ItemSeparatorComponent={() => <View style={styles.rowRule} />}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.ink} />
      }
      ListHeaderComponent={
        screenError ? (
          <StatusBanner variant="error" message={screenError} style={styles.banner} />
        ) : null
      }
      ListFooterComponent={
        // Hidden corner doodle (BRAND §11): the dog asleep under the list's
        // final hairline. Delight, zero function.
        <View style={styles.listFooter}>
          <View style={styles.rowRule} />
          <SleepingDogDoodle width={84} />
        </View>
      }
    />
  );
};

export default InboxScreen;

const styles = StyleSheet.create({
  listBackground: {
    backgroundColor: Colors.paperWarm,
  },
  listContent: {
    paddingHorizontal: Layout.padding.lg,
    paddingBottom: Layout.padding.xl,
    backgroundColor: Colors.paperWarm,
  },
  banner: {
    marginBottom: Layout.padding.md,
  },
  sectionHeader: {
    paddingTop: Layout.padding.xl,
    gap: Layout.padding.md,
  },
  // Section-opening rule: full-strength ink, structural (BRAND §2).
  sectionRule: {
    height: Layout.rule.heavy,
    backgroundColor: Colors.ink,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingBottom: Layout.padding.sm,
  },
  sectionLabel: {
    flex: 1,
  },
  // Group covers are photos, so they take the square, hairline-edged
  // treatment (BRAND §5) — round shapes stay reserved for byline avatars.
  sectionThumb: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  rowRule: {
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
  },
  listFooter: {
    marginTop: Layout.padding.lg,
    gap: Layout.padding.sm,
    alignItems: 'flex-start',
  },
});
