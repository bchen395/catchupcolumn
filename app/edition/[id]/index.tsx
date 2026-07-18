import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EditionBriefColumn } from '@/components/edition-brief-column';
import { EditionBriefsGrid } from '@/components/edition-briefs-grid';
import { EditionColophon } from '@/components/edition-colophon';
import { EditionLead } from '@/components/edition-lead';
import { EditionSecondary } from '@/components/edition-secondary';
import { ErrorState } from '@/components/error-state';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { StoryArticle } from '@/components/story-article';
import { StoryReaderOverlay, type SectionFrame } from '@/components/story-reader-overlay';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { orderEdition } from '@/lib/edition-layout';
import { markEditionOpened } from '@/lib/edition-seen';
import { fetchEditionWithPosts, fetchGroupForEdition, fetchLatestEditionNumber } from '@/lib/editions';
import { nextPublishForGroup } from '@/lib/groups';
import type { EditionWithPosts, GroupRow } from '@/types';

type GroupSummary = Pick<
  GroupRow,
  'id' | 'name' | 'cover_image_url' | 'timezone' | 'publish_day' | 'publish_time'
>;

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

// For the overlay's non-interactive section snapshots.
const noop = () => {};

// The edition front page: a masthead, the curated lead story, a prominent
// second story, then an "in brief" two-column grid for everyone else — a
// classic newspaper front page. Tapping any story opens the reader.
const EditionFrontPage = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  const [edition, setEdition] = useState<EditionWithPosts | null>(null);
  const [group, setGroup] = useState<GroupSummary | null>(null);
  // Whether this is the Group's most-recent edition — gates the colophon's
  // forward-looking "next edition" line (never shown on an archived issue).
  const [isLatest, setIsLatest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState('');

  // The enlarge overlay: which story was tapped and where its section sits on
  // screen. The ref guards against a second tap landing while the first
  // section is still being measured.
  const [overlay, setOverlay] = useState<{ postId: string; frame: SectionFrame } | null>(null);
  const overlayOpenRef = useRef(false);
  const leadRef = useRef<View>(null);
  const secondaryRef = useRef<View>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchEditionWithPosts(id);
      setEdition(data);
      const g = await fetchGroupForEdition(data.group_id);
      setGroup(g);
      // Non-fatal: if we can't tell whether this is the latest edition, just
      // fall back to hiding the forward-looking colophon line.
      try {
        const latest = await fetchLatestEditionNumber(data.group_id);
        setIsLatest(latest === data.edition_number);
      } catch {
        setIsLatest(false);
      }
      setScreenError('');
    } catch (_err) {
      setScreenError(Strings.error.editionLoad);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Reaching the front page counts as "opened" — clears Home's NEW flag. Here
  // rather than on Home's tap so deep links and the inbox path count too.
  useEffect(() => {
    if (id) markEditionOpened(id);
  }, [id]);

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
  const { lead, secondary, briefs, ordered } = orderEdition(edition.posts);

  // A one-post edition is the degenerate thin case: the cover IS the story, so
  // it reads inline (full body, no teaser, no enlarge) rather than as a cover.
  const isSingle = edition.posts.length === 1;

  // The colophon's forward line, only on the Group's most-recent edition.
  const next = isLatest ? nextPublishForGroup(group) : null;
  const nextEditionLine = next ? Strings.colophon.nextEdition(next.dayLabel, next.timeLabel) : null;

  // Open a story by growing it out of its spot on the page. Falls back to the
  // plain reader route when Reduce Motion is on or the section couldn't be
  // measured. Taps are ignored mid-refresh so the overlay never opens against
  // shifting data.
  const openStory = (postId: string, frame: SectionFrame | null) => {
    if (overlayOpenRef.current || refreshing) return;
    if (reduceMotion || !frame || frame.width <= 0 || frame.height <= 0) {
      router.push(`/edition/${id}/${postId}`);
      return;
    }
    overlayOpenRef.current = true;
    setOverlay({ postId, frame });
  };

  const openMeasured = (postId: string, ref: RefObject<View | null>) => {
    const node = ref.current;
    if (!node) {
      openStory(postId, null);
      return;
    }
    node.measureInWindow((x, y, width, height) => openStory(postId, { x, y, width, height }));
  };

  // Re-render the tapped section's markup for the overlay's cross-fade.
  const snapshotFor = (postId: string) => () => {
    if (lead && postId === lead.id) return <EditionLead post={lead} onPress={noop} />;
    if (secondary && postId === secondary.id) {
      return <EditionSecondary post={secondary} onPress={noop} />;
    }
    const brief = briefs.find((b) => b.id === postId);
    return brief ? <EditionBriefColumn post={brief} onPress={noop} /> : null;
  };

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        scrollEnabled={!overlay}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.ink} />
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
                <Ionicons name="chevron-back" size={22} color={Colors.ink} />
              </Pressable>
            ),
          }}
        />

        {screenError ? (
          <StatusBanner variant="error" message={screenError} style={styles.banner} />
        ) : null}

        <View style={styles.masthead}>
          {/* Title case, not caps — uppercasing long family names hurts
              warmth (BRAND §6); the masthead is Lora Bold `display`. */}
          <ThemedText style={styles.mastheadTitle} numberOfLines={2}>
            {group.name}
          </ThemedText>
          {/* The dateline sits in a folio band — flanked by hairline rules. */}
          <View style={styles.datelineRow}>
            <View style={styles.datelineRule} />
            <ThemedText style={styles.mastheadDate}>{weekOf}</ThemedText>
            <View style={styles.datelineRule} />
          </View>
          <ThemedText style={styles.mastheadMeta}>
            Edition No. {edition.edition_number}
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
          // Rare: an already-published edition whose posts were all deleted.
          // Keep the masthead + colophon around a warm line so it still reads
          // as a page, not a broken screen.
          <View style={styles.emptyEdition}>
            <ThemedText variant="body" style={styles.emptyEditionText}>
              {Strings.empty.edition.body}
            </ThemedText>
          </View>
        ) : isSingle ? (
          // One-post edition: the cover is the whole story. Reuse the reader's
          // article so it reads exactly as enlarging it would have. No enlarge.
          <StoryArticle post={lead} />
        ) : (
          <>
            {/* Measurable wrappers give the enlarge overlay its launch frame. */}
            <View ref={leadRef} collapsable={false}>
              <EditionLead post={lead} onPress={() => openMeasured(lead.id, leadRef)} />
            </View>

            {secondary ? (
              <>
                <View style={styles.sectionRule} />
                <View ref={secondaryRef} collapsable={false}>
                  <EditionSecondary
                    post={secondary}
                    onPress={() => openMeasured(secondary.id, secondaryRef)}
                  />
                </View>
              </>
            ) : null}

            {/* A lone tertiary brief (3-post edition) drops the "IN BRIEF"
                label, so add a rule to separate it from the secondary. */}
            {briefs.length === 1 ? <View style={styles.sectionRule} /> : null}
            <EditionBriefsGrid briefs={briefs} onOpen={openStory} />
          </>
        )}

        <EditionColophon editionNumber={edition.edition_number} nextEditionLine={nextEditionLine} />
      </ScrollView>

      {overlay ? (
        <StoryReaderOverlay
          posts={ordered}
          initialIndex={Math.max(
            0,
            ordered.findIndex((p) => p.id === overlay.postId),
          )}
          originFrame={overlay.frame}
          renderSnapshot={snapshotFor(overlay.postId)}
          reduceMotion={reduceMotion}
          onClosed={() => {
            overlayOpenRef.current = false;
            setOverlay(null);
          }}
        />
      ) : null}
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
  // The masthead closes with a structural ink rule (BRAND §2).
  masthead: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    paddingBottom: Layout.padding.lg,
    alignItems: 'center',
    gap: Layout.padding.xs,
    borderBottomWidth: Layout.rule.heavy,
    borderBottomColor: Colors.ink,
  },
  mastheadTitle: {
    ...Typography.scale.display,
    color: Colors.ink,
    textAlign: 'center',
  },
  // The dateline's folio band: the italic "week of" line flanked by short ink
  // rules. Datelines are the Lora-italic voice (BRAND §3).
  datelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.md,
    marginVertical: Layout.padding.xs,
  },
  datelineRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.ink,
  },
  mastheadDate: {
    flexShrink: 1,
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.lg,
    color: Colors.ink,
    textAlign: 'center',
  },
  mastheadMeta: {
    ...Typography.scale.meta,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  // Hairline between the lead and the second story.
  sectionRule: {
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
    marginHorizontal: Layout.padding.lg,
  },
  emptyEdition: {
    padding: Layout.padding.xl,
    alignItems: 'center',
  },
  emptyEditionText: {
    ...Typography.scale.deck,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
});
