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

  // Hosted legal/support pages (also entered in App Store Connect / Play Console).
  legal: {
    privacyUrl: 'https://catchupcolumn.com/privacy',
    termsUrl: 'https://catchupcolumn.com/terms',
    supportUrl: 'https://catchupcolumn.com/support',
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

  // The weekly-ritual voice. Home's dateline strip, the composer's
  // anticipation line, and the filed stamp all talk about the same upcoming
  // edition, so their copy lives together — keep the phrasing in one register
  // (warm, concrete, never urgent).
  thisWeek: {
    dateline: (day: string, time: string) => `Next edition · ${day} at ${time}`,
    noBylines: 'No stories yet this week — yours could be the first.',
    bylinesYouOnly: 'Your story is in for this week.',
    bylines: (names: string, plural: boolean) =>
      `${names} ${plural ? 'have' : 'has'} written this week`,
    bylinesAddYours: ' — there’s still time to add yours.',
    // day arrives as "today", "tomorrow", or a weekday name.
    composerSubtitle: (day: string) => `Your story will run in ${day}’s edition.`,
    composerSubtitleEditing: (day: string) => `Editing your story for ${day}’s edition.`,
    filedStamp: (day: string) => `Filed for ${day}’s edition`,
    newFlag: 'New',
  },

  // The edition's closing folio — a newspaper's "end of the page, on purpose"
  // mark. `brand` and `folio` print on every edition; `nextEdition` is the
  // forward-looking loop line shown only on a Group's most-recent edition (the
  // same day/time facts as Home's dateline, in a warmer register). Printing it
  // under an archived edition would be wrong, so the screen gates it.
  colophon: {
    brand: 'Catch Up Column',
    folio: (n: number) => `No. ${n}`,
    // day arrives as "today"/"tomorrow"/weekday; time as "9 AM" / "9:30 AM".
    nextEdition: (day: string, time: string) => `The next edition arrives ${day} at ${time}.`,
  },

  push: {
    editionReady: {
      title: 'Your Group is ready!',
      body: (groupName: string) => `This week’s ${groupName} edition just came off the press.`,
    },
  },

  // The invitation moment — the join screen's two modes (code entry and the
  // "special edition" invitation) plus the auth screens' pending-invite
  // banner. This whole flow is a first impression for someone who may not
  // have the app yet, so every line stays warm and person-to-person.
  invite: {
    kicker: 'You’re invited',
    loading: 'Opening your invitation…',
    introManual: 'Someone saving you a seat? Ask them for the invite code on their Group’s page.',
    codeLabel: 'Invite code',
    codePlaceholder: 'e.g. A1B2C3',
    findCta: 'Find my Group',
    // names arrives pre-joined ("Martha, Dave and 2 others"); plural picks
    // is/are. The joining logic lives with the avatar byline in invite-hero.
    membersLine: (names: string, plural: boolean) =>
      `${names} ${plural ? 'are' : 'is'} already here.`,
    membersCountOnly: (count: number) =>
      count === 1 ? 'One person is already here.' : `${count} people are already here.`,
    // dayName is a weekday ("Sunday"); daypart is morning/afternoon/evening.
    cadence: (dayName: string, daypart: string) => `A new edition every ${dayName} ${daypart}.`,
    joinCta: 'Join this Group',
    alreadyMember: 'Good news — you’re already a member.',
    goToGroupCta: 'Go to your Group',
    createAccountCta: 'Create an account to join',
    signInCta: 'Already have an account? Sign in',
    notRightGroup: 'Not the right Group? Enter a different code',
    joiningBannerSignup: (name: string) => `Joining ${name} — create your account to continue.`,
    joiningBannerLogin: (name: string) => `Joining ${name} — sign in to continue.`,
    errorNotFound: 'We couldn’t find a Group with that code. Double-check it with whoever invited you.',
    errorEmptyCode: 'Enter an invite code to find a Group.',
    errorRevoked: 'That invitation isn’t active anymore. Ask your family for a fresh code.',
    errorJoin: 'We couldn’t get you in just now. Please try again.',
    errorNetwork: 'Can’t reach the press — check your connection and try again.',
    a11yFound: (name: string) => `Invitation found. ${name}.`,
    a11yBackToEntry: 'Back to code entry.',
    a11yCover: (name: string) => `Cover photo of ${name}`,
  },

  // The post-join celebration screen.
  welcome: {
    headline: 'You’re in!',
    subline: (name: string) => `Welcome to ${name}.`,
    // date arrives as "July 10, 2026"; the stamp style uppercases it.
    stamp: (date: string) => `Joined · ${date}`,
    introduceCta: 'Introduce yourself in this week’s edition',
    lookAroundCta: 'Look around first',
    a11yJoined: (name: string) => `You’re in. Welcome to ${name}.`,
  },

  // The sender side: the group screen's "Invite your family" card.
  inviteCard: {
    title: 'Invite your family',
    body: 'Anyone with this code can join. Read it out over the phone, text it, or show the code below to scan.',
    copyHint: 'Tap the code to copy it',
    copied: 'Copied!',
    a11yCopied: 'Code copied.',
    shareCta: 'Share an invitation',
    qrShowCta: 'Show a code to scan',
    qrHideCta: 'Hide the code',
    qrCaption: 'Have them point their phone camera here.',
    // Code-first on purpose: custom-scheme links aren't tappable in iMessage,
    // so the code must carry the invite on its own; the link is a bonus for
    // places that do linkify it.
    shareMessage: (name: string, code: string, link: string) =>
      `You’re invited to “${name}” on Catch Up Column! Open the app and enter code ${code}. Or tap this link: ${link}`,
  },
};

export type StringsType = typeof Strings;
