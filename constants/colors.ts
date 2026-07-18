export const Colors = {
  // ── v2 palette (BRAND.md §2) ──────────────────────────────────────────────
  // Near-monochrome: black ink on warm paper, structure drawn with hairlines,
  // one vermilion accent. Soft black — pure #000 lives only inside
  // illustration strokes (BRAND §4).
  ink: '#1A1A1A',
  inkSoft: 'rgba(26,26,26,0.62)',
  inkMuted: 'rgba(26,26,26,0.38)',
  // THE accent. A rubber stamp, not a paint bucket: kickers, stamps, live/new
  // moments, links, hand-lettering inside illustrations. Never fills a button,
  // never tints a surface, never in the tab bar. Max ~2 appearances per screen.
  vermilion: '#E8442E',
  paper: '#FFFFFF',
  paperWarm: '#FBF9F4',
  // Illustration strokes only (BRAND §4): the monoline world draws in true
  // black so it sits a hair darker than text ink — never for text or UI.
  illustrationInk: '#000000',
  // Rules, dividers, outlined buttons, photo edges (1px). Structural rules
  // (masthead, section-opening) are full-strength ink at Layout.rule.heavy.
  hairline: 'rgba(26,26,26,0.14)',
  // Errors only. Deliberately darker/deader than vermilion so the two never
  // read as the same voice.
  error: '#B3261E',

  // Scrims. `scrim` dims the screen behind modals; `coverOverlay` darkens the
  // bottom of cover photos so white caption text stays legible.
  scrim: 'rgba(0,0,0,0.45)',
  coverOverlay: 'rgba(0,0,0,0.4)',

  // v1's orange/peach/yellow, green success, and `borderSoft` are deleted —
  // the v2 migration reached every screen (BRAND §14). Success banners speak
  // in the info voice; celebrations belong to the stamp system (§11).
};
