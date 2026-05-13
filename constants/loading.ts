/**
 * Configuration for the printing-press loading animation.
 *
 * All visual and timing knobs live here. To restyle the loader, change values
 * in this file — the component itself reads everything from here.
 */

import { Colors } from './colors';

export const LoadingConfig = {
  // Press dimensions (in dp)
  pressSize: 140,
  cylinderSize: 96,
  paperWidth: 80,
  paperHeight: 110,

  // Timing
  cylinderRotationMs: 1800,    // one full rotation
  paperFeedMs: 1400,           // one paper feed cycle
  paperStaggerMs: 400,         // delay between successive paper sheets
  mastheadFadeMs: 600,

  // Visuals
  cylinderColor: Colors.navy,
  cylinderAccent: Colors.navy,
  paperColor: Colors.paper,
  paperBorderColor: Colors.borderMid,
  paperLineColor: Colors.inkSoft,
  mastheadColor: Colors.ink,
  captionColor: Colors.inkSoft,

  // Layout
  spacingBetweenPressAndText: 32,
};

export type LoadingConfigType = typeof LoadingConfig;
