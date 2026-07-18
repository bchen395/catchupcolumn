/**
 * Configuration for the branded loading screens (BRAND §4/§10).
 *
 * Two scenes, both monoline illustrations: the paperboy rides (wheels spin)
 * for ordinary waits, and the printing press runs (flywheel turns, sheets
 * come off) for the long compile/publish waits. All visual and timing knobs
 * live here — the component reads everything from this file. Illustration
 * motion is ambient (BRAND §10): it loops on linear time, never blocks, and
 * parks as a static scene under Reduce Motion.
 */

import { Colors } from './colors';

export const LoadingConfig = {
  // Scene sizes (in dp): the rider's height / the press's width.
  riderHeight: 150,
  pressWidth: 220,

  // Timing
  wheelSpinMs: 900, // one wheel revolution — a brisk, cheerful ride
  flywheelSpinMs: 1400, // one flywheel turn — the press works at its own pace
  sheetCycleMs: 1400, // one printed sheet sliding out (synced to the wheel)
  mastheadFadeMs: 600,

  // Text under the scene
  mastheadColor: Colors.ink,
  captionColor: Colors.inkSoft,

  // Layout
  spacingBetweenSceneAndText: 32,
};

export type LoadingConfigType = typeof LoadingConfig;
