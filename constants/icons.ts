/**
 * Central registry for icons used across screens.
 *
 * Components reference icons by *semantic key* (e.g. `Icons.emptyGroups`)
 * rather than by raw glyph name. Swap an icon set or a specific glyph by
 * editing this one file — no screen edits required.
 *
 * Empty- and error-state icons are MaterialCommunityIcons outlines: a softer,
 * hand-drawn stroke that sits closer to the v2 illustration world than
 * FontAwesome's heavier weights. FontAwesome survives only for the chevrons.
 *
 * Keep this list to glyphs that are actually referenced. Tab-bar icons are
 * deliberately *not* here — `custom-tab-bar.tsx` owns its own `TAB_META`
 * (a known inconsistency, noted in the `frontend-design` skill); duplicating
 * them here just left dead tokens behind.
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
  chevronDown: fa('chevron-down'),
  close: mci('close'),

  // Empty states — soft outlines that match the illustration world
  emptyGroups: mci('account-group-outline'),
  emptyPost: mci('pencil-outline'),
  emptyEdition: mci('file-document-outline'),

  // Error states
  errorGeneric: mci('alert-circle-outline'),
  errorNetwork: mci('wifi-off'),

  // Invitations (join flow + the group screen's invite card)
  invite: mci('email-open-outline'),
  copy: mci('content-copy'),
};
