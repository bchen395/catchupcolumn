import { createContext, useContext, useEffect, type ReactNode } from 'react';
import {
  PixelRatio,
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { SkeletonConfig } from '@/constants/loading';
import { Typography } from '@/constants/typography';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

/**
 * Skeleton placeholders (BRAND §9/§10) — the affordance for ordinary in-app
 * waits, where we already know the shape of the page we're about to draw. The
 * illustrated loaders (`PrintingPressLoading`) stay for cold starts and the
 * long publish job; see BRAND §10 for the boundary.
 *
 * Two rules make these read as editorial rather than bolted-on:
 *
 * 1. Structure is drawn for real; only data-shaped slots pulse. Rules, gaps,
 *    and chrome don't depend on the fetch, so they render at full strength —
 *    use `SkeletonRule`, not a pulsing bar, for a divider.
 * 2. Bars occupy the real type rhythm. A bar sits in a box of its variant's
 *    `lineHeight`, so content lands with no layout shift when it arrives.
 *
 * Not to be confused with `GreekedLines`, which is static decorative
 * continuation art inside real editions ("the story goes on below the fold").
 * Skeleton bars are taller, squared, and breathing; greeked lines are 7px
 * pills, static, and dissolve down the column.
 */

type TypeVariant = keyof typeof Typography.scale;

// One pulse drives every bar on the screen — same trick as the loader's two
// wheels sharing a rotation. `null` means "park static" (Reduce Motion).
//
// The shared value is a 0→1 linear ramp rather than the opacity itself, and the
// breath is derived from it with `interpolate` — the same shape PressRunScene
// uses for its sheet feed, so the loaders and the skeletons drive their loops
// the same way.
const PulseContext = createContext<SharedValue<number> | null>(null);

type SkeletonProps = {
  // Announced once by the screen reader in place of the whole placeholder
  // tree — e.g. Strings.loading.inbox.
  label: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Skeleton = ({ label, children, style }: SkeletonProps) => {
  const reduceMotion = useReduceMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 0;
      return;
    }
    // One full breath per cycle: out on the first half, back on the second.
    pulse.value = withRepeat(
      withTiming(1, { duration: SkeletonConfig.pulseMs, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [reduceMotion]);

  return (
    <PulseContext.Provider value={reduceMotion ? null : pulse}>
      {/* One View, not a wrapper around an inner one: `accessible` already
          groups the whole tree into a single element, so the wait is one
          announcement rather than a hundred empty views — and the caller's
          layout style (gap, alignItems) still applies to the placeholders
          themselves. */}
      <View
        style={[styles.screen, style]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
      >
        {children}
      </View>
    </PulseContext.Provider>
  );
};

// The breathing fill every placeholder shape is made of.
const Pulsing = ({ style }: { style: StyleProp<ViewStyle> }) => {
  const pulse = useContext(PulseContext);
  const animated = useAnimatedStyle(() => {
    if (!pulse) return { opacity: 1 };
    return {
      opacity: interpolate(
        pulse.value,
        [0, 0.5, 1],
        [1, SkeletonConfig.pulseMinOpacity, 1],
      ),
    };
  });
  return <Animated.View style={[style, animated]} />;
};

type Metrics = {
  // Override the variant's metrics for the few roles still set from the legacy
  // Typography.sizes/lineHeights pairs (the front page's newsprint excerpt).
  fontSize?: number;
  lineHeight?: number;
};

type BarProps = Metrics & {
  variant: TypeVariant;
  width?: DimensionValue;
  // Center the bar in its box, for the centered blocks (an edition masthead,
  // the profile byline hero).
  center?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A stand-in for one line of type. The outer box takes the real lineHeight so
// the bar sits where the text's x-height will be — scaled by the reader's text
// size, since ThemedText scales freely and a fixed box would let large type
// shove the page around on arrival.
//
// The box stretches to the parent's width on purpose: inside a container that
// centers its children it would otherwise shrink to fit, and a percentage
// `width` on the bar would resolve against nothing and vanish.
export const SkeletonBar = ({
  variant,
  width = '100%',
  center = false,
  style,
  ...metrics
}: BarProps) => {
  const scale = Typography.scale[variant];
  const textScale = PixelRatio.getFontScale();
  const fontSize = (metrics.fontSize ?? scale.fontSize) * textScale;
  const lineHeight = (metrics.lineHeight ?? scale.lineHeight) * textScale;
  return (
    <View
      style={[
        styles.barBox,
        { height: Math.round(lineHeight) },
        center ? styles.centered : null,
        style,
      ]}
    >
      <Pulsing
        style={[styles.bar, { width, height: Math.round(fontSize * SkeletonConfig.barHeightRatio) }]}
      />
    </View>
  );
};

type LinesProps = Metrics & {
  variant: TypeVariant;
  lines?: number;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A paragraph's worth of bars. The last line is short so the block reads as
// prose that ran out rather than a solid slab.
export const SkeletonLines = ({ variant, lines = 3, center, style, ...metrics }: LinesProps) => (
  <View style={[styles.linesBox, style]}>
    {Array.from({ length: lines }, (_, i) => (
      <SkeletonBar
        key={i}
        variant={variant}
        width={i === lines - 1 ? '58%' : '100%'}
        center={center}
        {...metrics}
      />
    ))}
  </View>
);

type BlockProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  // Photos are flat and square-cornered (BRAND §7); `radius` is for the rare
  // rounded slot (a role chip standing in for text).
  radius?: number;
  // Outline only, no fill — for standing in for something that is itself an
  // outlined shape (the §9 role chips), which never carry a fill.
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
};

// A stand-in for a photo, cover, or thumbnail — hairline-edged like the real
// editorial photo, so the frame doesn't move when the image lands.
export const SkeletonBlock = ({
  width = '100%',
  height,
  radius = 0,
  outlined = false,
  style,
}: BlockProps) => (
  <Pulsing
    style={[
      styles.block,
      outlined ? styles.outlined : null,
      { width, height, borderRadius: radius },
      style,
    ]}
  />
);

// A stand-in for an avatar — the only round photo in the system.
export const SkeletonCircle = ({ size }: { size: number }) => (
  <Pulsing style={[styles.block, { width: size, height: size, borderRadius: size / 2 }]} />
);

type RuleProps = {
  weight?: keyof typeof Layout.rule;
  style?: StyleProp<ViewStyle>;
};

// A real rule, drawn at full strength and never pulsed — the page's structure
// is known before the data arrives, so it shouldn't look like it's loading.
export const SkeletonRule = ({ weight = 'hairline', style }: RuleProps) => (
  <View
    style={[
      { height: Layout.rule[weight], backgroundColor: weight === 'heavy' ? Colors.ink : Colors.hairline },
      style,
    ]}
  />
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
    // Placeholders are never targets; the screen underneath owns interaction.
    pointerEvents: 'none',
  },
  barBox: {
    justifyContent: 'center',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
  },
  centered: {
    alignItems: 'center',
  },
  linesBox: {
    alignSelf: 'stretch',
  },
  bar: {
    backgroundColor: SkeletonConfig.fill,
    // Squared, not pilled — the pill shape belongs to GreekedLines.
    borderRadius: Layout.borderRadius.sm,
  },
  block: {
    backgroundColor: SkeletonConfig.fill,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
});
