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

/**
 * Configuration for the skeleton placeholders (BRAND §9/§10).
 *
 * Skeletons cover the ordinary in-app waits — navigating to a screen whose
 * layout we already know. The illustrated loaders above are reserved for cold
 * starts (no layout to preview) and the long compile/publish job.
 *
 * `barHeightRatio` is what keeps content from jumping: a placeholder bar sits
 * inside a box of the real variant's `lineHeight`, drawn at a fraction of its
 * `fontSize`, so type lands on the baseline the bar occupied.
 */
export const SkeletonConfig = {
  // One breath. Deliberately slower than any Motion.duration — those are
  // one-shot UI transitions; this is an ambient loop, so it lives here beside
  // the loader's own loop timings rather than in constants/motion.ts.
  pulseMs: 1100,
  // Shallow on purpose: the fill is already only 14% ink, so a deep trough
  // would fade the bars to near-invisible — the opposite of what an
  // older-adult audience needs from a loading affordance.
  pulseMinOpacity: 0.6,

  // `hairline` is the system's only sanctioned subtle fill (BRAND §2), and
  // AppImage already uses it for an unloaded photo — so a placeholder block
  // and a loading photo read as the same material.
  fill: Colors.hairline,

  // Bar height as a fraction of the type size it stands in for — roughly a
  // lowercase x-height, so a row of bars reads as set type, not as slabs.
  barHeightRatio: 0.62,
};

export type SkeletonConfigType = typeof SkeletonConfig;
