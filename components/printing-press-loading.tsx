import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/colors';
import { LoadingConfig } from '@/constants/loading';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { ThemedText } from './themed-text';

/**
 * Spinning printing-press style loading indicator.
 *
 * All sizes, colors, and timing are read from `constants/loading.ts`. To retheme
 * the loader (different palette, faster spin, larger press) edit that config —
 * not this file.
 */

interface PrintingPressLoadingProps {
  message?: string;
  caption?: string;
}

const PAPER_OFFSCREEN_OFFSET = 60;

export const PrintingPressLoading = ({
  message = Strings.loading.default,
  caption,
}: PrintingPressLoadingProps) => {
  const rotation = useSharedValue(0);
  const paper1 = useSharedValue(0);
  const paper2 = useSharedValue(0);
  const paper3 = useSharedValue(0);
  const mastheadOpacity = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: LoadingConfig.cylinderRotationMs,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    const feed = (sv: typeof paper1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration: LoadingConfig.paperFeedMs,
            easing: Easing.inOut(Easing.quad),
          }),
          -1,
          false,
        ),
      );
    };

    feed(paper1, 0);
    feed(paper2, LoadingConfig.paperStaggerMs);
    feed(paper3, LoadingConfig.paperStaggerMs * 2);

    mastheadOpacity.value = withTiming(1, { duration: LoadingConfig.mastheadFadeMs });

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(paper1);
      cancelAnimation(paper2);
      cancelAnimation(paper3);
      cancelAnimation(mastheadOpacity);
    };
  }, []);

  const cylinderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const paper1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -PAPER_OFFSCREEN_OFFSET + paper1.value * (PAPER_OFFSCREEN_OFFSET * 2) },
    ],
    opacity: paper1.value < 0.05 || paper1.value > 0.95 ? 0 : 1,
  }));
  const paper2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -PAPER_OFFSCREEN_OFFSET + paper2.value * (PAPER_OFFSCREEN_OFFSET * 2) },
    ],
    opacity: paper2.value < 0.05 || paper2.value > 0.95 ? 0 : 1,
  }));
  const paper3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -PAPER_OFFSCREEN_OFFSET + paper3.value * (PAPER_OFFSCREEN_OFFSET * 2) },
    ],
    opacity: paper3.value < 0.05 || paper3.value > 0.95 ? 0 : 1,
  }));

  const mastheadStyle = useAnimatedStyle(() => ({ opacity: mastheadOpacity.value }));

  return (
    <View style={styles.container}>
      <View style={styles.press}>
        {/* Paper sheets feeding through (rendered behind the cylinder) */}
        <Animated.View style={[styles.paper, paper1Style]}>
          <PaperSheet />
        </Animated.View>
        <Animated.View style={[styles.paper, paper2Style]}>
          <PaperSheet />
        </Animated.View>
        <Animated.View style={[styles.paper, paper3Style]}>
          <PaperSheet />
        </Animated.View>

        {/* Spinning cylinder */}
        <Animated.View style={[styles.cylinder, cylinderStyle]}>
          <View style={styles.cylinderInner}>
            <FontAwesome
              name="cog"
              size={LoadingConfig.cylinderSize * 0.85}
              color={LoadingConfig.cylinderColor}
            />
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[styles.text, mastheadStyle]}>
        <ThemedText variant="label" style={styles.masthead}>
          {Strings.brand.masthead}
        </ThemedText>
        <ThemedText variant="caption" style={styles.message}>
          {message}
        </ThemedText>
        {caption ? (
          <ThemedText variant="caption" style={styles.caption}>
            {caption}
          </ThemedText>
        ) : null}
      </Animated.View>
    </View>
  );
};

const PaperSheet = () => (
  <View style={styles.paperSheet}>
    <View style={[styles.paperLine, { width: '70%' }]} />
    <View style={[styles.paperLine, { width: '90%' }]} />
    <View style={[styles.paperLine, { width: '60%' }]} />
    <View style={[styles.paperLine, { width: '80%' }]} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: Layout.padding.xl,
  },
  press: {
    width: LoadingConfig.pressSize,
    height: LoadingConfig.pressSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cylinder: {
    width: LoadingConfig.cylinderSize,
    height: LoadingConfig.cylinderSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cylinderInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  paperSheet: {
    width: LoadingConfig.paperWidth,
    height: LoadingConfig.paperHeight,
    backgroundColor: LoadingConfig.paperColor,
    borderWidth: 1,
    borderColor: LoadingConfig.paperBorderColor,
    borderRadius: Layout.borderRadius.sm,
    padding: Layout.padding.sm,
    gap: 6,
    justifyContent: 'flex-start',
  },
  paperLine: {
    height: 3,
    backgroundColor: LoadingConfig.paperLineColor,
    opacity: 0.5,
    borderRadius: 1.5,
  },
  text: {
    marginTop: LoadingConfig.spacingBetweenPressAndText,
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
  caption: {
    color: LoadingConfig.captionColor,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
