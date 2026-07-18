import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

// The hand-drawn border (BRAND §11): HeyTea's wobbly rectangle, for special
// announcements only — a new edition banner, a birthday-adjacent moment.
// Never regular list content, never twice on a screen. It measures itself
// and redraws the wobble to fit, so callers just wrap their announcement.

const INSET = 3; // half stroke + wobble room
const WOBBLE = 1.6;
const CORNER = 9;

// A deterministic hand wobble: each edge bows through offset midpoints. No
// randomness — the same frame always draws the same way (and re-renders
// cheaply).
const buildPath = (w: number, h: number): string => {
  const rX = w - INSET;
  const bY = h - INSET;
  return [
    `M${CORNER} ${INSET}`,
    `Q${w * 0.28} ${INSET - WOBBLE} ${w * 0.52} ${INSET + 0.4}`,
    `T${w - CORNER} ${INSET}`,
    `Q${rX} ${INSET} ${rX} ${CORNER}`,
    `Q${rX + WOBBLE} ${h * 0.3} ${rX - 0.4} ${h * 0.55}`,
    `T${rX} ${h - CORNER}`,
    `Q${rX} ${bY} ${w - CORNER} ${bY}`,
    `Q${w * 0.6} ${bY + WOBBLE} ${w * 0.45} ${bY - 0.4}`,
    `T${CORNER} ${bY}`,
    `Q${INSET} ${bY} ${INSET} ${h - CORNER}`,
    `Q${INSET - WOBBLE} ${h * 0.62} ${INSET + 0.4} ${h * 0.4}`,
    `T${INSET} ${CORNER}`,
    `Q${INSET} ${INSET} ${CORNER} ${INSET}`,
    'Z',
  ].join(' ');
};

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export const SketchBorder = ({ children, style }: Props) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: Math.round(width), h: Math.round(height) });
  };

  return (
    <View style={style} onLayout={handleLayout}>
      {size && size.w > CORNER * 3 && size.h > CORNER * 3 ? (
        // aria-hidden on the wrapping View — cross-platform in RN core;
        // react-native-svg would leak a11y props into the web DOM.
        <View
          style={StyleSheet.absoluteFill}
          aria-hidden
        >
          <Svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} fill="none">
          <Path
            d={buildPath(size.w, size.h)}
            stroke={Colors.illustrationInk}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          </Svg>
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: Layout.padding.md,
  },
});
