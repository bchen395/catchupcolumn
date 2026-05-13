import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';

import { AppImage } from '@/components/app-image';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { fetchEditionsForUser, type EditionListItem } from '@/lib/editions';

type Section = {
  groupId: string;
  groupName: string;
  coverUrl: string | null;
  data: EditionListItem[];
};

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
  // Editions already sorted newest-first by query; sections ordered by their newest edition
  return Array.from(map.values()).sort((a, b) =>
    b.data[0].published_at.localeCompare(a.data[0].published_at)
  );
};

const InboxScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [editions, setEditions] = useState<EditionListItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      load().finally(() => {
        if (!cancelled) setLoading(false);
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

  const renderItem = ({ item }: { item: EditionListItem }) => {
    return (
      <Pressable
        onPress={() => router.push(`/edition/${item.id}`)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
      >
        <View style={styles.rowContent}>
          <ThemedText style={styles.rowTitle}>
            {formatWeekOf(item.published_at, item.group.timezone)}
          </ThemedText>
          <ThemedText variant="caption" style={styles.rowMeta}>
            Edition #{item.edition_number}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => {
    return (
      <View style={styles.sectionHeader}>
        {section.coverUrl ? (
          <AppImage source={{ uri: section.coverUrl }} style={styles.sectionThumb} />
        ) : (
          <View style={styles.sectionThumbPlaceholder}>
            <FontAwesome name="newspaper-o" size={18} color={Colors.orange} />
          </View>
        )}
        <ThemedText style={styles.sectionLabel} numberOfLines={1}>
          {section.groupName}
        </ThemedText>
      </View>
    );
  };

  if (loading) {
    return <PrintingPressLoading message={Strings.loading.inbox} />;
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
        icon={Icons.emptyInbox}
        title={Strings.empty.inbox.title}
        body={Strings.empty.inbox.body}
        ctaLabel={Strings.empty.inbox.cta}
        onCtaPress={() => router.push('/(tabs)/post')}
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
      SectionSeparatorComponent={({ trailingItem }) =>
        trailingItem ? <View style={styles.rowSpacer} /> : null
      }
      ItemSeparatorComponent={() => <View style={styles.rowSpacer} />}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.orange} />
      }
      ListHeaderComponent={
        screenError ? (
          <StatusBanner variant="error" message={screenError} style={styles.banner} />
        ) : null
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingTop: Layout.padding.lg,
    paddingBottom: Layout.padding.sm,
  },
  sectionThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  sectionThumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.peach + '66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Section label is the group name in display serif — matches the masthead
  // styling on the edition reader so the inbox feels like a stack of papers.
  sectionLabel: {
    flex: 1,
    color: Colors.ink,
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.xl,
    lineHeight: 28,
  },
  // Row is a soft pill in `blueWash`, no chevron, generous height. Pressed
  // state deepens to `blueChipLight` for tactile feedback.
  row: {
    minHeight: Layout.touchTargetMin + 8,
    paddingVertical: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    backgroundColor: Colors.peach + '66',
    borderRadius: 999,
    gap: 2,
    justifyContent: 'center',
  },
  rowPressed: {
    backgroundColor: Colors.peach,
  },
  rowContent: {
    gap: 2,
  },
  rowTitle: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.lg,
    color: Colors.orange,
  },
  rowMeta: {
    color: Colors.inkSoft,
    fontStyle: 'italic',
  },
  rowSpacer: {
    height: Layout.padding.sm,
  },
});
