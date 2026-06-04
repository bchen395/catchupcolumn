export const Colors = {
  // Brand palette (BRAND.md §2)
  orange: '#FF7237',
  peach: '#FFD3C2',
  yellow: '#F4E33A',

  // Surfaces
  paper: '#FFFFFF',
  paperWarm: '#FAF7F2',
  // Soft peach wash for pill rows, chips, and icon bubbles. This is the single
  // source of truth for what used to be written inline as `peach + '66'`
  // (0x66 ≈ 40% alpha) across many screens — keep it tokenized so the soft
  // surface stays identical everywhere.
  peachWash: 'rgba(255,211,194,0.4)',
  // Soft yellow tint behind the moderator badge — reads as the on-brand
  // "highlight / lead role" color (replaces a retired cool blue-grey).
  badgeMod: 'rgba(244,227,58,0.35)',

  // Text & borders. Opacity-on-black per BRAND §2; kept as named tokens.
  ink: '#000000',
  inkSoft: 'rgba(0,0,0,0.6)',
  inkMuted: 'rgba(0,0,0,0.38)',
  borderSoft: 'rgba(0,0,0,0.12)',

  // Scrims. `scrim` dims the screen behind modals; `coverOverlay` darkens the
  // bottom of cover photos so white caption text stays legible.
  scrim: 'rgba(0,0,0,0.45)',
  coverOverlay: 'rgba(0,0,0,0.4)',

  // Semantic
  error: '#C7361B',
  success: '#2E7D32',
};
