import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/colors';

// The printing press (BRAND §4) — the long-wait scene: it "runs" while an
// edition compiles or publishes. Monoline #000, one vermilion spot (the
// lever knob). The flywheel spokes and the printed sheet can be omitted so
// the loading screen can animate its own copies (`FlywheelSpokes`,
// `PressSheet`); keep the geometry exports in lockstep with the drawing.

export const PRESS_VIEWBOX = { w: 240, h: 170 };
export const PRESS_FLYWHEEL = { cx: 56, cy: 96, r: 26 };
// Where the printed sheet rests in the static scene (its top-left corner).
export const PRESS_SHEET = { x: 198, y: 86, w: 34, h: 26 };

const STROKE = 4;

// The flywheel's spokes + hub, drawn alone so a loader can spin it.
// `size` is the rendered flywheel diameter (viewBox spans r=26 → 52).
export const FlywheelSpokes = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 52 52" fill="none">
    <G stroke={Colors.illustrationInk} strokeWidth={STROKE} strokeLinecap="round">
      <Path d="M10 26 H42 M18 12.1 L34 39.9 M34 12.1 L18 39.9" />
      <Circle cx="26" cy="26" r="3" fill={Colors.illustrationInk} stroke="none" />
    </G>
  </Svg>
);

// The freshly printed sheet, drawn alone so a loader can slide it out of the
// press. `width` is the rendered sheet width (viewBox 34×26 + stroke room).
export const PressSheet = ({ width }: { width: number }) => {
  const height = (width * 30) / 38;
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 38 30"
      fill="none"
    >
      <G stroke={Colors.illustrationInk} strokeLinecap="round" strokeLinejoin="round">
        <Rect x="2" y="2" width="34" height="26" rx="2" fill={Colors.paper} strokeWidth={3} />
        <Path d="M8 9 L28 9 M8 15 L22 15 M8 21 L26 21" strokeWidth={2.4} />
      </G>
    </Svg>
  );
};

type SceneProps = {
  // Width in px; height follows the 240:170 viewBox.
  width?: number;
  spokes?: boolean;
  sheet?: boolean;
};

export const PrintingPressScene = ({ width = 220, spokes = true, sheet = true }: SceneProps) => {
  const height = (width * PRESS_VIEWBOX.h) / PRESS_VIEWBOX.w;
  // aria-hidden lives on a wrapping View — cross-platform in RN core, and
  // react-native-svg would leak a11y props into the web DOM.
  return (
    <View aria-hidden>
      <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${PRESS_VIEWBOX.w} ${PRESS_VIEWBOX.h}`}
      fill="none"
    >
      <G
        stroke={Colors.illustrationInk}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Machine body with paper hopper on top */}
        <Path
          d="M92 58 L188 58 Q196 58 196 66 L196 116 Q196 124 188 124 L92 124 Q84 124 84 116 L84 66 Q84 58 92 58 Z"
          fill={Colors.paper}
        />
        <Path d="M124 58 L130 36 L152 36 L158 58" fill={Colors.paper} />
        <Path d="M133 43 L149 43" strokeWidth={2.4} />
        {/* Legs */}
        <Path d="M96 124 L96 148 M184 124 L184 148" />
        <Path d="M88 148 L104 148 M176 148 L192 148" />
        {/* Flywheel */}
        <Circle cx="56" cy="96" r="26" fill={Colors.paper} />
        {spokes ? (
          <>
            <Path d="M40 96 H72 M48 82.1 L64 109.9 M64 82.1 L48 109.9" />
            <Circle cx="56" cy="96" r="3" fill={Colors.illustrationInk} stroke="none" />
          </>
        ) : null}
        <Path d="M82 96 L88 96" />
        {/* Lever with vermilion knob — the one vermilion spot */}
        <Path d="M180 58 L188 42" />
        <Circle cx="189" cy="39" r="5" fill={Colors.vermilion} strokeWidth={3} />
        {/* Output slot + the printed sheet */}
        <Path d="M196 100 L204 100" />
        {sheet ? (
          <>
            <Rect x="198" y="86" width="34" height="26" rx="2" fill={Colors.paper} strokeWidth={3} />
            <Path d="M204 93 L224 93 M204 99 L218 99 M204 105 L222 105" strokeWidth={2.4} />
          </>
        ) : null}
        {/* Panel detail */}
        <Path d="M100 74 L128 74 M100 84 L120 84" strokeWidth={2.4} />
      </G>
      </Svg>
    </View>
  );
};
