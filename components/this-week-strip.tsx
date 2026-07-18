import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { soonestPublish } from '@/lib/groups';
import type { WeeklyByline } from '@/lib/posts';
import type { GroupWithMembers } from '@/types';

import { ThemedText } from './themed-text';

// Beyond three names the line stops being a byline and starts being a roster.
const MAX_NAMED = 3;

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
// invites; it never names who hasn't written.
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

  const { next } = soonest;

  return (
    <View style={styles.strip}>
      <View style={styles.rule} />
      <ThemedText variant="kicker" style={styles.dateline}>
        {Strings.thisWeek.dateline(next.dayLabel, next.timeLabel)}
      </ThemedText>
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
  bylines: {
    textAlign: 'center',
  },
});
