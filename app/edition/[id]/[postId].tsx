import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ErrorState } from '@/components/error-state';
import { PaperGrain } from '@/components/paper-grain';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StoryArticle } from '@/components/story-article';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { orderEdition } from '@/lib/edition-layout';
import { fetchEditionWithPosts } from '@/lib/editions';
import type { PostWithAuthor } from '@/types';

// The story reader: one contributor's full post at a time, with Next/Previous
// moving through the edition in front-page order (lead first, then briefs). A
// gentle slide+fade "page turn" accompanies each move unless Reduce Motion is
// on. Deep links open at a specific post; in-page moves are local (no refetch).
const StoryReader = () => {
  const { id, postId } = useLocalSearchParams<{ id: string; postId: string }>();
  const router = useRouter();

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState('');
  const [reduceMotion, setReduceMotion] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const edition = await fetchEditionWithPosts(id);
      const ordered = orderEdition(edition.posts).ordered;
      setPosts(ordered);
      const start = ordered.findIndex((p) => p.id === postId);
      setIndex(start >= 0 ? start : 0);
      setScreenError('');
    } catch (_err) {
      setScreenError(Strings.error.editionLoad);
    }
  }, [id, postId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Move to an adjacent story: swap content, snap to top, and play the page
  // turn from the side we're heading toward.
  const go = (next: number, direction: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (reduceMotion) return;
    slide.setValue(direction * 28);
    fade.setValue(0);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return <PrintingPressLoading message={Strings.loading.edition} />;
  }

  const current = posts[index];

  if (!current) {
    return (
      <ErrorState
        icon={Icons.errorGeneric}
        title={Strings.error.generic.title}
        body={screenError || 'Story not found.'}
        onRetry={() => {
          setLoading(true);
          load().finally(() => setLoading(false));
        }}
      />
    );
  }

  const isFirst = index === 0;
  const isLast = index === posts.length - 1;

  return (
    <View style={styles.flex}>
      <PaperGrain />
      <Stack.Screen
        options={{
          title: `${index + 1} of ${posts.length}`,
          headerStyle: { backgroundColor: Colors.paperWarm },
          headerShadowVisible: false,
          headerTintColor: Colors.ink,
          headerTitleStyle: {
            fontFamily: Typography.families.sansMedium,
            color: Colors.inkSoft,
            fontSize: Typography.sizes.sm,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to the front page"
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.orange} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateX: slide }] }}>
          <StoryArticle post={current} />
        </Animated.View>
      </ScrollView>

      {/* Reader footer: Previous on the left (hidden on the first story), and a
          Next that turns into "Front page" once you've reached the last one. */}
      <View style={styles.footer}>
        {isFirst ? (
          <View style={styles.navSpacer} />
        ) : (
          <Pressable
            onPress={() => go(index - 1, -1)}
            accessibilityRole="button"
            accessibilityLabel="Previous story"
            style={({ pressed }) => [styles.navButton, pressed && styles.navPressed]}
          >
            <Ionicons name="chevron-back" size={18} color={Colors.orange} />
            <ThemedText style={styles.navLabel}>Previous</ThemedText>
          </Pressable>
        )}

        {isLast ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to the front page"
            style={({ pressed }) => [styles.navButton, styles.navPrimary, pressed && styles.navPrimaryPressed]}
          >
            <ThemedText style={styles.navPrimaryLabel}>Front page</ThemedText>
            <Ionicons name="newspaper-outline" size={18} color={Colors.paper} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => go(index + 1, 1)}
            accessibilityRole="button"
            accessibilityLabel="Next story"
            style={({ pressed }) => [styles.navButton, styles.navPrimary, pressed && styles.navPrimaryPressed]}
          >
            <ThemedText style={styles.navPrimaryLabel}>Next story</ThemedText>
            <Ionicons name="chevron-forward" size={18} color={Colors.paper} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default StoryReader;

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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.md,
    paddingBottom: Layout.padding.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    backgroundColor: Colors.paperWarm,
    gap: Layout.padding.md,
  },
  navSpacer: {
    flex: 0,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.xs,
    minHeight: Layout.touchTargetMin,
    paddingHorizontal: Layout.padding.lg,
    borderRadius: Layout.borderRadius.full,
  },
  navPressed: {
    opacity: 0.6,
  },
  navLabel: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    color: Colors.orange,
  },
  navPrimary: {
    backgroundColor: Colors.orange,
  },
  navPrimaryPressed: {
    backgroundColor: Colors.orange + 'CC',
  },
  navPrimaryLabel: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.body,
    color: Colors.paper,
  },
});
