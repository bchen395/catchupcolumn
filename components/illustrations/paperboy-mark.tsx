import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { Colors } from '@/constants/colors';

// The paperboy on his bike — the app's anchor character and brand mark
// (BRAND §12). Monoline #000 strokes at ~2.5% of asset height, round
// caps/joins, flat fills only, one vermilion spot: the cap.
//
// The wheel spokes can be omitted (`spokes={false}`) so the loading screen
// can overlay its own spinning copies — `WheelSpokes` and the geometry
// exports below exist for that. Keep them in lockstep with the drawing.

export const RIDER_VIEWBOX = { w: 220, h: 190 };
export const RIDER_WHEELS = [
  { cx: 56, cy: 152, r: 24 },
  { cx: 164, cy: 152, r: 24 },
];

const STROKE = 4;

type MarkProps = {
  // Height in px; width follows the 220:190 viewBox.
  height?: number;
  spokes?: boolean;
};

// One wheel's spokes + hub, drawn alone so a loader can spin it. `size` is
// the rendered wheel diameter; the viewBox spans one wheel (r=24 → 48).
// Callers hide it from screen readers along with the rest of their scene.
export const WheelSpokes = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <G stroke={Colors.illustrationInk} strokeWidth={STROKE} strokeLinecap="round">
      <Path d="M8 24 H40 M16 10.1 L32 37.9 M32 10.1 L16 37.9" />
      <Circle cx="24" cy="24" r="2.6" fill={Colors.illustrationInk} stroke="none" />
    </G>
  </Svg>
);

export const PaperboyMark = ({ height = 152, spokes = true }: MarkProps) => {
  const width = (height * RIDER_VIEWBOX.w) / RIDER_VIEWBOX.h;
  // aria-hidden lives on a wrapping View — cross-platform in RN core, and
  // react-native-svg would leak a11y props into the web DOM.
  return (
    <View aria-hidden>
      <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${RIDER_VIEWBOX.w} ${RIDER_VIEWBOX.h}`}
      fill="none"
    >
      <G
        stroke={Colors.illustrationInk}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Canvas bag over the rear wheel, a rolled paper poking out */}
        <Path
          d="M52 94 Q46 94 46 100 L46 116 Q46 122 52 122 L72 122 Q78 122 78 116 L78 100 Q78 94 72 94 Z"
          fill={Colors.paper}
        />
        <Circle cx="56" cy="87" r="5.5" fill={Colors.paper} />
        <Path d="M60 83 L74 78 M61 91 L75 87" />
        {/* Wheels */}
        <Circle cx="56" cy="152" r="24" />
        <Circle cx="164" cy="152" r="24" />
        {spokes ? (
          <>
            <Path d="M40 152 H72 M48 138.1 L64 165.9 M64 138.1 L48 165.9" />
            <Circle cx="56" cy="152" r="2.6" fill={Colors.illustrationInk} stroke="none" />
            <Path d="M148 152 H180 M156 138.1 L172 165.9 M172 138.1 L156 165.9" />
            <Circle cx="164" cy="152" r="2.6" fill={Colors.illustrationInk} stroke="none" />
          </>
        ) : null}
        {/* Frame, saddle, bars */}
        <Path d="M56 152 L104 152 L88 106 L56 152" />
        <Path d="M88 106 L142 102 L104 152" />
        <Path d="M142 102 L164 152" />
        <Path d="M88 106 L87 100" />
        <Path d="M80 100 L102 100" />
        <Path d="M142 102 L148 82 Q149 75 141 76" />
        {/* Cranks + pedals */}
        <Path d="M104 152 L114 162 M109 163 L121 161" />
        {/* The boy: far leg, torso, strap, near leg */}
        <Path d="M86 98 L90 122 L94 140 M89 143 L100 141" />
        <Path d="M86 98 L113 62" />
        <Path d="M106 68 L80 96" />
        <Path d="M86 98 L112 128 L114 158 M108 160 L121 158" />
        {/* Head, hair, arm, cap (the one vermilion spot), face */}
        <Circle cx="124" cy="40" r="20" fill={Colors.paper} />
        <Path
          d="M106 34 C103 42 105 52 111 57 C107 47 107 39 109 35 Z"
          fill={Colors.illustrationInk}
          strokeWidth={2}
        />
        <Path d="M110 66 Q128 70 145 82" />
        <Path
          d="M105 36 C105 18 116 11 127 13 C138 15 144 23 144 31 L159 33 C162 34 162 38 158 38 L110 40 C105 40 104 38 105 36 Z"
          fill={Colors.vermilion}
        />
        <Circle cx="134" cy="43" r="2.4" fill={Colors.illustrationInk} stroke="none" />
        <Path d="M142 47 L146 51 L141 53" strokeWidth={3.4} />
      </G>
      </Svg>
    </View>
  );
};
