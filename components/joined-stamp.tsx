import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Typography } from '@/constants/typography';
import { Haptics } from '@/lib/haptics';

import { ThemedText } from './themed-text';

// The welcome screen's content is visible from the first frame; the stamp
// lands a beat later so it reads as an action happening to the page.
const PRESS_DELAY_MS = 350;

type JoinedStampProps = {
  /** e.g. "Joined · July 10, 2026" — Strings.welcome.stamp(date). */
  label: string;
  reduceMotion: boolean;
};

// The join celebration's rubber stamp — the same press as FiledStamp (BRAND
// §11: stamps, not confetti), but it lands once and stays put: a date stamped
// in the family record, not a passing confirmation. Tilted +3° so it doesn't
// share an angle with FiledStamp's −4°.
export const JoinedStamp = ({ label, reduceMotion }: JoinedStampProps) => {
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  // Slightly oversized settling down — a stamp pressing, not a bounce.
  const scale = useSharedValue(reduceMotion ? 1 : 1.12);

  useEffect(() => {
    if (reduceMotion) {
      // The moment still deserves its haptic — Reduce Motion mutes movement,
      // not meaning.
      Haptics.confirm();
      return;
    }
    const timer = setTimeout(() => Haptics.confirm(), PRESS_DELAY_MS);
    opacity.value = withDelay(
      PRESS_DELAY_MS,
      withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle }),
    );
    scale.value = withDelay(
      PRESS_DELAY_MS,
      withTiming(1, { duration: Motion.duration.quick, easing: Motion.easing.settle }),
    );
    return () => clearTimeout(timer);
    // Plays once on mount, like FiledStamp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: '3deg' }, { scale: scale.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.stamp, animatedStyle]}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  stamp: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Colors.orange,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.paperWarm,
    paddingHorizontal: Layout.padding.lg,
    paddingVertical: Layout.padding.sm,
  },
  text: {
    fontFamily: Typography.families.sansBold,
    fontSize: Typography.sizes.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.orange,
  },
});
