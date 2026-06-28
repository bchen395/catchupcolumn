import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Typography } from '@/constants/typography';
import { Haptics } from '@/lib/haptics';
import type { PostWithAuthor } from '@/types';

import { StoryArticle } from './story-article';
import { ThemedText } from './themed-text';

type Props = {
  // Already in front-page order (orderEdition(...).ordered).
  posts: PostWithAuthor[];
  initialIndex: number;
  // What "back to the front page" does — router.back() on the route, a
  // shrink animation in the enlarge overlay.
  onExit: () => void;
  reduceMotion: boolean;
  // Lets the host mirror the position ("2 of 5") in its own chrome.
  onIndexChange?: (index: number) => void;
};

// The story reader body: one contributor's full post at a time, with
// Next/Previous moving through the edition in front-page order. A gentle
// slide+fade "page turn" accompanies each move unless Reduce Motion is on.
// Host-agnostic — the route shell and the enlarge overlay both render it and
// provide their own chrome (header/top bar) and data.
export const StoryReader = ({ posts, initialIndex, onExit, reduceMotion, onIndexChange }: Props) => {
  const [index, setIndex] = useState(initialIndex);

  const scrollRef = useRef<ScrollView>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Move to an adjacent story: swap content, snap to top, and play the page
  // turn from the side we're heading toward. The light tick fires even under
  // Reduce Motion — haptics aren't motion, and the turn still happened.
  const go = (next: number, direction: number) => {
    Haptics.tap();
    setIndex(next);
    onIndexChange?.(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (reduceMotion) return;
    slide.setValue(direction * 28);
    fade.setValue(0);
    Animated.parallel([
      Animated.timing(slide, { toValue: 0, duration: Motion.duration.settle, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: Motion.duration.settle, useNativeDriver: true }),
    ]).start();
  };

  const current = posts[index];
  if (!current) return null;

  const isFirst = index === 0;
  const isLast = index === posts.length - 1;

  return (
    <View style={styles.flex}>
      <ScrollView ref={scrollRef} style={styles.scrollFlex} contentContainerStyle={styles.scroll}>
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
            onPress={onExit}
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
