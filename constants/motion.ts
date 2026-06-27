import { Easing } from 'react-native-reanimated';

// House motion style: animations read as a broadsheet being handled, not an
// app showing off. Short ease-out timing curves, no bounces or physics —
// predictability over spectacle for the older-adult audience. Anything that
// moves must respect Reduce Motion (see hooks/use-reduce-motion.ts): either
// skip the animation entirely or jump straight to the final state.
//
// The one sanctioned exception: the compose sheet settles with a gentle
// spring, because a bottom sheet that stops dead reads as broken, not calm.
//
// The printing-press loader keeps its own timing knobs in constants/loading.ts
// (it's a self-contained branded animation, retuned as a set) — everything
// else takes its durations from here.
export const Motion = {
  duration: {
    // Micro feedback: stamp pops, chip highlights, small fades.
    quick: 160,
    // Content transitions: the reader's page turn, section entrances.
    settle: 220,
    // The cover→reader enlarge. A touch longer than `settle` so the grow
    // lands rather than snaps.
    enlarge: 260,
    // Dismissals (sheet sliding away). Slightly faster than entrances —
    // leaving should feel lighter than arriving.
    exit: 200,
  },
  easing: {
    // The default curve for entrances and content moves (Reanimated consumers;
    // core-Animated callers keep their default ease and share durations only).
    settle: Easing.out(Easing.cubic),
  },
};
