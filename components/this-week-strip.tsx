import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { soonestPublish } from '@/lib/groups';
import type { WeeklyByline } from '@/lib/posts';
import type { GroupWithMembers } from '@/types';

import { Avatar } from './avatar';
import { PaperboyMark } from './illustrations/paperboy-mark';
import { ThemedText } from './themed-text';

// Beyond three names the line stops being a byline and starts being a roster.
const MAX_NAMED = 3;

// Matches avatar-stack's idiom: a short row of small faces, paper-ringed like
// photos laid on top of each other, capped before it becomes a roster.
const MAX_FACES = 5;
const FACE_SIZE = 36;

// The strip's ritual scene: the paperboy rides the top rule (BRAND §8). His
// wheels sit ~14/190 of the viewBox above its bottom edge, so pull him down
// by that much to seat the tires on the line.
const RIDER_HEIGHT = 48;
const RIDER_SEAT = Math.round((RIDER_HEIGHT * 14) / 190);

const joinNames = (names: string[]): string => {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
};

type ThisWeekStripProps = {
  groups: GroupWithMembers[];
  bylines: WeeklyByline[];
  currentUserId: string | null;
};

// Home's dateline: when the presses next roll, and who has written so far.
// A newspaper device, not a widget — framed by rules, centered, no buttons
// (the write card below is the call to action). It announces and gently
// invites; it never names who hasn't written. The face row is decorative
// (avatar-stack's rule): the names sentence carries the meaning.
export const ThisWeekStrip = ({ groups, bylines, currentUserId }: ThisWeekStripProps) => {
  const soonest = soonestPublish(groups);
  if (!soonest) return null;

  const youWrote = currentUserId != null && bylines.some((b) => b.authorId === currentUserId);
  const others = bylines
    .filter((b) => b.authorId !== currentUserId)
    .map((b) => b.firstName);

  let sentence: string;
  if (bylines.length === 0) {
    sentence = Strings.thisWeek.noBylines;
  } else if (youWrote && others.length === 0) {
    sentence = Strings.thisWeek.bylinesYouOnly;
  } else {
    const named = others.slice(0, MAX_NAMED);
    const extra = others.length - named.length;
    const parts = [
      ...(youWrote ? ['You'] : []),
      ...named,
      ...(extra > 0 ? [`${extra} ${extra === 1 ? 'other' : 'others'}`] : []),
    ];
    // Singular only for a lone "Ruth has written"; any list (or "2 others")
    // reads plural.
    const plural = parts.length > 1 || extra > 0;
    sentence =
      Strings.thisWeek.bylines(joinNames(parts), plural) +
      (youWrote ? '.' : Strings.thisWeek.bylinesAddYours);
  }

  const faces = bylines.slice(0, MAX_FACES);
  const { next } = soonest;

  return (
    <View style={styles.strip}>
      <View style={styles.riderRow}>
        <PaperboyMark height={RIDER_HEIGHT} />
      </View>
      <View style={styles.rule} />
      <ThemedText variant="kicker" style={styles.dateline}>
        {Strings.thisWeek.dateline(next.dayLabel, next.timeLabel)}
      </ThemedText>
      {faces.length > 0 ? (
        <View
          style={styles.faceRow}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {faces.map((byline, index) => (
            <Avatar
              key={byline.authorId}
              uri={byline.avatarUrl}
              name={byline.displayName}
              size={FACE_SIZE}
              // A paper ring separates overlapping faces the way white
              // borders separate photos laid on top of each other.
              style={[styles.face, index > 0 && styles.overlapping]}
            />
          ))}
        </View>
      ) : null}
      <ThemedText variant="deck" style={styles.bylines}>
        {sentence}
      </ThemedText>
      <View style={styles.rule} />
    </View>
  );
};

const styles = StyleSheet.create({
  strip: {
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  // The paperboy rides in along the strip's top rule, headed off the page —
  // Home's one doodle (BRAND §4: chrome only), static and decorative. The
  // negative margin swallows the strip's own gap plus the SVG's under-wheel
  // padding so the tires sit exactly on the rule.
  riderRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    paddingRight: Layout.padding.md,
    marginBottom: -(RIDER_SEAT + Layout.padding.sm),
  },
  rule: {
    alignSelf: 'stretch',
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
  },
  // The "arriving Sunday" dateline accent — a sanctioned vermilion moment
  // (BRAND §2); Home's only other vermilion is the NEW pill, and the two
  // never both demand attention (the pill clears once the edition is read).
  dateline: {
    color: Colors.vermilion,
    textAlign: 'center',
  },
  faceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  face: {
    borderWidth: 2,
    borderColor: Colors.paper,
  },
  overlapping: {
    marginLeft: -10,
  },
  bylines: {
    textAlign: 'center',
  },
});
