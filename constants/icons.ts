/**
 * Central registry for icons used across screens.
 *
 * Components reference icons by *semantic key* (e.g. `Icons.emptyInbox`)
 * rather than by raw glyph name. Swap an icon set or a specific glyph by
 * editing this one file — no screen edits required.
 *
 * After Phase 5 most empty/error icons are MaterialCommunityIcons outlines —
 * they have a softer, hand-drawn feel that matches the Figma wireframes
 * better than FontAwesome's heavier strokes. FontAwesome is still in the
 * mix for chevrons and a couple of legacy spots that haven't been touched.
 */

import type { ComponentProps } from 'react';
import type FontAwesome from '@expo/vector-icons/FontAwesome';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type FontAwesomeName = ComponentProps<typeof FontAwesome>['name'];
type MaterialCommunityName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type IconDescriptor =
  | { set: 'fontawesome'; name: FontAwesomeName }
  | { set: 'materialcommunity'; name: MaterialCommunityName };

const fa = (name: FontAwesomeName): IconDescriptor => ({ set: 'fontawesome', name });
const mci = (name: MaterialCommunityName): IconDescriptor => ({
  set: 'materialcommunity',
  name,
});

export const Icons = {
  // Brand / chrome
  brand: mci('newspaper-variant-outline'),
  chevronRight: fa('chevron-right'),
  chevronLeft: fa('chevron-left'),
  chevronDown: fa('chevron-down'),
  close: mci('close'),

  // Empty states — soft outlines that match the Figma wireframe sketches
  emptyInbox: mci('newspaper-variant-outline'),
  emptyGroups: mci('account-group-outline'),
  emptyPost: mci('pencil-outline'),
  emptyEdition: mci('file-document-outline'),
  emptyProfile: mci('account-outline'),
  emptyMail: mci('email-outline'),

  // Error states
  errorGeneric: mci('alert-circle-outline'),
  errorNetwork: mci('wifi-off'),

  // Invitations (join flow + the group screen's invite card)
  invite: mci('email-open-outline'),
  qr: mci('qrcode'),
  copy: mci('content-copy'),

  // Tab bar (kept here so a future redesign is one file)
  tabInbox: mci('newspaper-variant-outline'),
  tabPost: mci('pencil-outline'),
  tabGroups: mci('account-group-outline'),
  tabProfile: mci('account-outline'),
};
