import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { LoadingConfig } from '@/constants/loading';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

import {
  PRESS_FLYWHEEL,
  PRESS_SHEET,
  PRESS_VIEWBOX,
  FlywheelSpokes,
  PressSheet,
  PrintingPressScene,
} from './illustrations/printing-press-scene';
import { PaperboyMark, RIDER_VIEWBOX, RIDER_WHEELS, WheelSpokes } from './illustrations/paperboy-mark';
import { ThemedText } from './themed-text';

/**
 * The branded loading screen (BRAND §4/§10): the paperboy rides while the app
 * fetches (`ride`, the default); the printing press runs for the long
 * compile/publish waits (`press`). Under Reduce Motion both park as static
 * scenes. Sizing, timing, and colors read from `constants/loading.ts` — to
 * retune the loader, edit that config, not this file.
 *
 * The splash screen (BRAND §12) is this screen's static twin: wordmark
 * masthead with the paperboy beneath. The dateline lives here, as live text,
 * because a baked splash PNG can't know today's date.
 */

interface PrintingPressLoadingProps {
  message?: string;
  caption?: string;
  variant?: 'ride' | 'press';
}

// The paperboy rides: the mark with its wheel spokes replaced by spinning
// overlays. One shared rotation drives both wheels.
const RideScene = () => {
  const height = LoadingConfig.riderHeight;
  const scale = height / RIDER_VIEWBOX.h;
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: LoadingConfig.wheelSpinMs, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(spin);
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  return (
    <View
      style={{ width: RIDER_VIEWBOX.w * scale, height }}
      aria-hidden
    >
      <PaperboyMark height={height} spokes={false} />
      {RIDER_WHEELS.map((wheel) => (
        <Animated.View
          key={wheel.cx}
          style={[
            styles.overlay,
            {
              left: (wheel.cx - wheel.r) * scale,
              top: (wheel.cy - wheel.r) * scale,
            },
            spinStyle,
          ]}
        >
          <WheelSpokes size={wheel.r * 2 * scale} />
        </Animated.View>
      ))}
    </View>
  );
};

// The press runs: flywheel turns while printed sheets slide out of the slot.
const PressRunScene = () => {
  const width = LoadingConfig.pressWidth;
  const scale = width / PRESS_VIEWBOX.w;
  const spin = useSharedValue(0);
  const feed = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: LoadingConfig.flywheelSpinMs, easing: Easing.linear }),
      -1,
      false,
    );
    feed.value = withRepeat(
      withTiming(1, { duration: LoadingConfig.sheetCycleMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(feed);
    };
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  // The sheet starts tucked at the slot and slides clear, fading at both ends
  // of the cycle so the loop never pops.
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(feed.value, [0, 1], [-10 * scale, 26 * scale]) }],
    opacity: interpolate(feed.value, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
  }));

  return (
    <View
      style={{ width, height: PRESS_VIEWBOX.h * scale }}
      aria-hidden
    >
      <PrintingPressScene width={width} spokes={false} sheet={false} />
      <Animated.View
        style={[
          styles.overlay,
          {
            left: (PRESS_FLYWHEEL.cx - PRESS_FLYWHEEL.r) * scale,
            top: (PRESS_FLYWHEEL.cy - PRESS_FLYWHEEL.r) * scale,
          },
          spinStyle,
        ]}
      >
        <FlywheelSpokes size={PRESS_FLYWHEEL.r * 2 * scale} />
      </Animated.View>
      <Animated.View
        style={[
          styles.overlay,
          { left: (PRESS_SHEET.x - 2) * scale, top: (PRESS_SHEET.y - 2) * scale },
          sheetStyle,
        ]}
      >
        <PressSheet width={(PRESS_SHEET.w + 4) * scale} />
      </Animated.View>
    </View>
  );
};

export const PrintingPressLoading = ({
  message = Strings.loading.default,
  caption,
  variant = 'ride',
}: PrintingPressLoadingProps) => {
  const reduceMotion = useReduceMotion();
  const mastheadOpacity = useSharedValue(0);

  useEffect(() => {
    mastheadOpacity.value = withTiming(1, { duration: LoadingConfig.mastheadFadeMs });
    return () => cancelAnimation(mastheadOpacity);
  }, []);

  const mastheadStyle = useAnimatedStyle(() => ({ opacity: mastheadOpacity.value }));

  // The splash's NYT dateline (BRAND §12), rendered live. `meta` uppercases.
  const dateline = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let scene;
  if (reduceMotion) {
    // Parked pose (BRAND §10): the full static scene, nothing moves.
    scene =
      variant === 'press' ? (
        <PrintingPressScene width={LoadingConfig.pressWidth} />
      ) : (
        <PaperboyMark height={LoadingConfig.riderHeight} />
      );
  } else {
    scene = variant === 'press' ? <PressRunScene /> : <RideScene />;
  }

  return (
    <View style={styles.container}>
      {scene}
      <Animated.View style={[styles.text, mastheadStyle]}>
        <ThemedText variant="label" style={styles.masthead}>
          {Strings.brand.masthead}
        </ThemedText>
        <ThemedText variant="meta">{dateline}</ThemedText>
        <ThemedText variant="caption" style={styles.message}>
          {message}
        </ThemedText>
        {caption ? (
          <ThemedText variant="caption" style={styles.message}>
            {caption}
          </ThemedText>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.paperWarm,
    padding: Layout.padding.xl,
  },
  overlay: {
    position: 'absolute',
  },
  text: {
    marginTop: LoadingConfig.spacingBetweenSceneAndText,
    alignItems: 'center',
    gap: Layout.padding.xs,
  },
  masthead: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.lg,
    letterSpacing: 2,
    color: LoadingConfig.mastheadColor,
  },
  message: {
    color: LoadingConfig.captionColor,
    textAlign: 'center',
  },
});
