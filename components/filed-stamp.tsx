import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Typography } from '@/constants/typography';

import { ThemedText } from './themed-text';

// How long the stamp rests on the page before fading. Long enough to read,
// short enough that it never needs a dismiss button.
const HOLD_MS = 1600;

type FiledStampProps = {
  /** e.g. "Filed for Sunday's edition" — Strings.thisWeek.filedStamp(day). */
  label: string;
  reduceMotion: boolean;
  /** Fade finished — host unmounts the stamp. */
  onDone: () => void;
};

// A rubber-stamp confirmation for the explicit Save: presses onto the top-right
// corner of the compose card (its host must be position: relative), rests, and
// fades. Fires once per save — a moment, not chrome; autosaves stay quiet.
export const FiledStamp = ({ label, reduceMotion, onDone }: FiledStampProps) => {
  const opacity = useSharedValue(0);
  // Starts slightly oversized and settles — the press of a stamp, not a bounce.
  const scale = useSharedValue(1.12);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(label);
    if (reduceMotion) {
      opacity.value = 1;
      scale.value = 1;
      const timer = setTimeout(onDone, HOLD_MS);
      return () => clearTimeout(timer);
    }
    scale.value = withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle });
    opacity.value = withSequence(
      withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle }),
      withDelay(
        HOLD_MS,
        withTiming(0, { duration: Motion.duration.settle }, (finished) => {
          if (finished) runOnJS(onDone)();
        }),
      ),
    );
    // Plays once on mount; the host remounts for each save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: '-4deg' }, { scale: scale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.stamp, animatedStyle]}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Overlaps the card's top-right corner like a stamp that didn't quite line
  // up with the page — deliberate, in family with the polaroids' tilt.
  stamp: {
    position: 'absolute',
    top: -10,
    right: 12,
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.paperWarm,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.xs,
  },
  text: {
    fontFamily: Typography.families.sansBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.orange,
  },
});
