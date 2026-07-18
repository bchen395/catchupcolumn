import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
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
import { Haptics } from '@/lib/haptics';

import { ThemedText } from './themed-text';

// How long a 'moment' stamp rests on the page before fading. Long enough to
// read, short enough that it never needs a dismiss button.
const HOLD_MS = 1600;

// A 'record' stamp lands a beat after the page settles, so it reads as an
// action happening to the page (BRAND §11's press-in beat).
const PRESS_DELAY_MS = 350;

type InkStampProps = {
  /** e.g. "Filed for Sunday's edition" / "Joined · July 10, 2026". */
  label: string;
  /**
   * Slight tilt in degrees. Each face owns an angle so no two stamps share
   * one: FILED −4°, JOINED +3° (BRAND §11).
   */
  tilt: number;
  /**
   * 'moment': presses on, rests, fades — the host unmounts it via onDone
   * (FILED). 'record': presses once after a beat and stays put, with the
   * confirm() haptic (JOINED — a date stamped in the family record).
   */
  behavior: 'moment' | 'record';
  reduceMotion: boolean;
  /** 'moment' only: fade finished — host unmounts the stamp. */
  onDone?: () => void;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

// The stamp system (BRAND §11): one recipe — vermilion ink, small caps,
// slight tilt, a press-in (oversized settling down, never a bounce), screen-
// reader announced. The sanctioned use of vermilion-as-celebration; never two
// stamps on one screen.
export const InkStamp = ({
  label,
  tilt,
  behavior,
  reduceMotion,
  onDone,
  size = 'sm',
  style,
}: InkStampProps) => {
  const delay = behavior === 'record' ? PRESS_DELAY_MS : 0;
  const opacity = useSharedValue(reduceMotion && behavior === 'record' ? 1 : 0);
  const scale = useSharedValue(reduceMotion ? 1 : 1.12);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(label);

    if (behavior === 'record') {
      // The moment keeps its haptic under Reduce Motion — it mutes movement,
      // not meaning. ('moment' hosts own their save haptic instead.)
      if (reduceMotion) {
        Haptics.confirm();
        return;
      }
      const timer = setTimeout(() => Haptics.confirm(), delay);
      opacity.value = withDelay(
        delay,
        withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle }),
      );
      scale.value = withDelay(
        delay,
        withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle }),
      );
      return () => clearTimeout(timer);
    }

    if (reduceMotion) {
      opacity.value = 1;
      const timer = setTimeout(() => onDone?.(), HOLD_MS);
      return () => clearTimeout(timer);
    }
    scale.value = withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle });
    opacity.value = withSequence(
      withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle }),
      withDelay(
        HOLD_MS,
        withTiming(0, { duration: Motion.duration.settle }, (finished) => {
          if (finished && onDone) runOnJS(onDone)();
        }),
      ),
    );
    // Plays once on mount; hosts remount for each new stamping.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${tilt}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.stamp, animatedStyle, style]}>
      <ThemedText style={[styles.text, size === 'md' && styles.textMd]}>{label}</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // paperWarm fill so the stamp stays legible where it overlaps an edge —
  // it reads as pressed onto the page, not floating above it.
  stamp: {
    borderWidth: 2,
    borderColor: Colors.vermilion,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.paperWarm,
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.xs,
  },
  text: {
    fontFamily: Typography.families.sansBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.vermilion,
  },
  textMd: {
    fontSize: 14,
  },
});
