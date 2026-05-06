/**
 * Central registry for icons used across screens.
 *
 * Components reference icons by *semantic key* (e.g. `Icons.emptyInbox`)
 * rather than by raw FontAwesome name. Swap an icon set or a specific glyph
 * by editing this one file — no screen edits required.
 *
 * `name` matches the FontAwesome (v4) glyph set bundled with @expo/vector-icons.
 * `set` is reserved for future migration to other icon sets (Feather, Material).
 */

import type { ComponentProps } from 'react';
import type FontAwesome from '@expo/vector-icons/FontAwesome';

type FontAwesomeName = ComponentProps<typeof FontAwesome>['name'];

export type IconDescriptor = {
  set: 'fontawesome';
  name: FontAwesomeName;
};

const fa = (name: FontAwesomeName): IconDescriptor => ({ set: 'fontawesome', name });

export const Icons = {
  // Brand / chrome
  brand: fa('newspaper-o'),
  chevronRight: fa('chevron-right'),
  chevronLeft: fa('chevron-left'),
  close: fa('close'),

  // Empty states
  emptyInbox: fa('newspaper-o'),
  emptyGroups: fa('users'),
  emptyPost: fa('pencil'),
  emptyEdition: fa('file-text-o'),
  emptyProfile: fa('user'),

  // Error states
  errorGeneric: fa('exclamation-circle'),
  errorNetwork: fa('wifi'),

  // Tab bar (kept here so a future redesign is one file)
  tabInbox: fa('newspaper-o'),
  tabPost: fa('pencil'),
  tabGroups: fa('users'),
  tabProfile: fa('user'),
};
