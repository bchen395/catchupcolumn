/**
 * Central registry for user-facing copy.
 *
 * All text shown in empty states, error states, push notifications, and other
 * cross-screen UI lives here so it can be tweaked or localized in one place.
 * Per-screen copy that's only used once can stay inline; this file is for
 * strings that are reused, sensitive to tone, or might need translation later.
 */

export const Strings = {
  brand: {
    name: 'Catch Up Column',
    masthead: 'CATCH UP COLUMN',
    tagline: 'Your weekly newsletter, made together.',
  },

  loading: {
    default: 'Setting the type…',
    inbox: 'Pulling this week’s edition…',
    edition: 'Inking the page…',
  },

  empty: {
    inbox: {
      title: 'Nothing to read yet',
      body: 'No editions yet — write something for your Group this week!',
      cta: 'Write a post',
    },
    groups: {
      title: 'No Groups yet',
      body: 'Create a Group to start your family newsletter, or ask someone for their invite code to join theirs.',
    },
    postNoGroups: {
      title: 'No Groups yet',
      body: 'Join or create a Group before writing your first post.',
      cta: 'Go to Groups',
    },
    edition: {
      title: 'This edition is empty',
      body: 'No one wrote in this week. Check back next edition!',
    },
    profile: {
      title: 'Sign in to see your profile',
      body: 'Your profile shows your display name and avatar.',
    },
  },

  error: {
    generic: {
      title: 'Something went wrong',
      body: 'Please try again in a moment.',
      cta: 'Try again',
    },
    network: {
      title: 'Can’t reach the press',
      body: 'Check your connection and try again.',
      cta: 'Try again',
    },
    inboxLoad: 'We could not load your editions right now. Pull down to try again.',
    groupsLoad: 'Could not load your Groups. Pull down to try again.',
    postLoad: 'Could not load your post. Pull down to try again.',
    postSave: 'Something went wrong. Please try again.',
    postDelete: 'Could not delete your post. Please try again.',
    editionLoad: 'Could not load this edition. Try again in a moment.',
    profileLoad: 'Could not load your profile right now.',
    profileSave: 'Could not save your profile. Please try again.',
  },

  push: {
    editionReady: {
      title: 'Your Group is ready!',
      body: (groupName: string) => `This week’s ${groupName} edition just came off the press.`,
    },
  },
};

export type StringsType = typeof Strings;
