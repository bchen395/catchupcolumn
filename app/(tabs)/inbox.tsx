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
import { useAuth } from '@/hooks/use-auth';
import { fetchEditionsForUser, type EditionListItem } from '@/lib/editions';

type Section = {
  groupId: string;
  groupName: string;
  coverUrl: string | null;
  data: EditionListItem[];
};

const formatWeekOf = (publishedAt: string, timezone?: string | null): string => {
  const date = new Date(publishedAt);
  return date.toLocaleDateString('en-US', {
    timeZone: timezone || undefined,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
          <ThemedText variant="subheadline" style={styles.rowTitle}>
            Week of {formatWeekOf(item.published_at, item.group.timezone)}
          </ThemedText>
          <ThemedText variant="caption" style={styles.rowMeta}>
            Edition №{item.edition_number}
          </ThemedText>
        </View>
        <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
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
            <FontAwesome name="newspaper-o" size={16} color={Colors.textMuted} />
          </View>
        )}
        <ThemedText variant="label" style={styles.sectionLabel} numberOfLines={1}>
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
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} />
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
  listContent: {
    paddingBottom: Layout.padding.xl,
    backgroundColor: Colors.background,
  },
  banner: {
    margin: Layout.padding.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.lg,
    paddingBottom: Layout.padding.sm,
    backgroundColor: Colors.background,
  },
  sectionThumb: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.md,
  },
  sectionThumbPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.backgroundWarm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: Colors.accentNavy,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.touchTargetMin * 1.4,
    paddingVertical: Layout.padding.md,
    paddingHorizontal: Layout.padding.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderColor: Colors.border,
    gap: Layout.padding.md,
  },
  rowPressed: {
    backgroundColor: Colors.backgroundWarm,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: Colors.text,
  },
  rowMeta: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
