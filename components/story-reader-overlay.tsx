import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import type { PostWithAuthor } from '@/types';

import { StoryReader } from './story-reader';
import { ThemedText } from './themed-text';

// Where the tapped section sits on screen (measureInWindow coordinates) — the
// frame the overlay grows out of and shrinks back into.
export type SectionFrame = { x: number; y: number; width: number; height: number };

type Props = {
  // Already in front-page order (orderEdition(...).ordered).
  posts: PostWithAuthor[];
  initialIndex: number;
  originFrame: SectionFrame;
  // Re-renders the tapped section's markup for the cross-fade — the page
  // appears to lift off and enlarge, no screenshotting involved.
  renderSnapshot: () => ReactNode;
  reduceMotion: boolean;
  // Called after the shrink-back completes; the host unmounts the overlay.
  onClosed: () => void;
};

// In family with the reader's page turn — a touch longer so the grow settles
// rather than snaps. No spring: predictability over bounce.
const GROW = { duration: Motion.duration.enlarge, easing: Motion.easing.settle };

// The "enlarge" reading experience: tapping a section on the front page grows
// it from its spot on the page into a full-screen reader, like bringing the
// newspaper closer to read. Rendered in a Modal so it covers the native
// header; Android hardware back arrives via onRequestClose.
export const StoryReaderOverlay = ({
  posts,
  initialIndex,
  originFrame,
  renderSnapshot,
  reduceMotion,
  onClosed,
}: Props) => {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);

  // Keep the launch frame at least partly on screen so the grow never starts
  // from an invisible spot (a section tapped while half scrolled away).
  const minVisible = Layout.touchTargetMin;
  const origin = {
    ...originFrame,
    y: Math.min(Math.max(originFrame.y, minVisible - originFrame.height), winH - minVisible),
  };

  const progress = useSharedValue(0);
  const closing = useRef(false);

  useEffect(() => {
    progress.value = withTiming(1, GROW);
    // Run the entrance once on mount; the origin frame never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    progress.value = withTiming(0, GROW, () => {
      runOnJS(onClosed)();
    });
  }, [onClosed, progress]);

  const frameStyle = useAnimatedStyle(() => ({
    left: interpolate(progress.value, [0, 1], [origin.x, 0]),
    top: interpolate(progress.value, [0, 1], [origin.y, 0]),
    width: interpolate(progress.value, [0, 1], [origin.width, winW]),
    height: interpolate(progress.value, [0, 1], [origin.height, winH]),
    borderRadius: interpolate(progress.value, [0, 1], [Layout.borderRadius.md, 0]),
    // Lift the page as it grows, then drop the shadow once it fills the screen.
    shadowOpacity: interpolate(progress.value, [0, 0.5, 1], [0.12, 0.18, 0]),
  }));

  const snapshotStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
  }));

  const readerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.25, 0.7], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[styles.page, frameStyle]}>
        {/* The real reader, laid out at full-screen size from the start so
            text never reflows mid-grow — the page reveals it as it enlarges. */}
        <Animated.View
          style={[styles.reader, { width: winW, height: winH, paddingTop: insets.top, paddingBottom: insets.bottom }, readerStyle]}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Back to the front page"
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.ink} />
            </Pressable>
            <ThemedText variant="meta" style={styles.topBarTitle}>
              {`${index + 1} of ${posts.length}`}
            </ThemedText>
            {/* Mirrors the back button so the title stays centered. */}
            <View style={styles.backButton} />
          </View>
          <StoryReader
            posts={posts}
            initialIndex={initialIndex}
            onExit={close}
            reduceMotion={reduceMotion}
            onIndexChange={setIndex}
          />
        </Animated.View>

        {/* The lifted section itself, fading out as the reader fades in. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.snapshot, { width: origin.width }, snapshotStyle]}
        >
          {renderSnapshot()}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  page: {
    position: 'absolute',
    backgroundColor: Colors.paperWarm,
    overflow: 'hidden',
    ...Layout.shadow.paperRaised,
  },
  reader: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  snapshot: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.padding.xs,
    backgroundColor: Colors.paperWarm,
  },
  // The "2 of 5" folio in the meta dress code.
  topBarTitle: {
    textAlign: 'center',
  },
  backButton: {
    width: Layout.touchTargetMin,
    height: Layout.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
