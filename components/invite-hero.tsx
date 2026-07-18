import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import type { InvitePreviewMember } from '@/types';

import { AppImage } from './app-image';
import { AvatarStack } from './avatar-stack';
import { RolledPaperGlyph } from './illustrations/rolled-paper-glyph';
import { ThemedText } from './themed-text';

type Props = {
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  memberCount: number;
  // Signed-in invitees get faces + names; anon previews pass undefined and
  // fall back to the count-only line.
  memberSample?: InvitePreviewMember[];
  // "A new edition every Sunday morning." — omitted for anon previews.
  cadenceLine?: string | null;
};

const firstName = (displayName: string) => displayName.trim().split(/\s+/)[0] ?? displayName;

// "Martha", "Martha and Dave", "Martha, Dave and Ruth", or
// "Martha, Dave and 4 others" — plus whether the line takes "are".
const memberByline = (
  sample: InvitePreviewMember[],
  total: number,
): { names: string; plural: boolean } => {
  const names = sample.map((m) => firstName(m.display_name));
  if (total === 1) return { names: names[0], plural: false };
  if (total === 2) return { names: `${names[0]} and ${names[1]}`, plural: true };
  if (total === 3 && names.length >= 3) {
    return { names: `${names[0]}, ${names[1]} and ${names[2]}`, plural: true };
  }
  return { names: `${names[0]}, ${names[1]} and ${total - 2} others`, plural: true };
};

// The invitation rendered as a one-page special edition of the Group's own
// paper: kicker band, the group name set as a masthead, the cover as a flat
// editorial photo, the description as an italic deck, the members as a
// byline, and the publish rhythm as a dateline. Flat on paperWarm like the
// edition front page — a page being handed over, not a card floating on one.
// CTAs belong to the host screen.
export const InviteHero = ({
  name,
  description,
  coverImageUrl,
  memberCount,
  memberSample,
  cadenceLine,
}: Props) => {
  const byline =
    memberSample && memberSample.length > 0 ? memberByline(memberSample, memberCount) : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.kickerRow}>
        <View style={styles.kickerRule} />
        <ThemedText variant="kicker" style={styles.kicker}>
          {Strings.invite.kicker}
        </ThemedText>
        <View style={styles.kickerRule} />
      </View>

      {/* Title case, not caps — uppercasing long family names hurts warmth
          (BRAND §6); set exactly like an edition masthead. */}
      <ThemedText accessibilityRole="header" style={styles.masthead} numberOfLines={3}>
        {name}
      </ThemedText>
      <View style={styles.mastheadRule} />

      {coverImageUrl ? (
        // The cover as a flat editorial photo (BRAND §5). Rendered around a
        // plain AppImage — covers are public URLs, not post-storage paths,
        // so no usePostImageUrl signing.
        <AppImage
          source={{ uri: coverImageUrl }}
          style={styles.coverPhoto}
          accessibilityIgnoresInvertColors
          accessibilityLabel={Strings.invite.a11yCover(name)}
        />
      ) : (
        // No cover — the colophon's ornament seats the space so the page
        // still reads composed.
        <View style={styles.ornamentRow}>
          <View style={styles.ornamentRule} />
          <RolledPaperGlyph size={14} />
          <View style={styles.ornamentRule} />
        </View>
      )}

      {description ? (
        <ThemedText style={styles.deck} numberOfLines={4}>
          {description}
        </ThemedText>
      ) : null}

      {byline ? (
        <View style={styles.membersBlock}>
          <AvatarStack members={memberSample ?? []} />
          <ThemedText style={styles.membersLine}>
            {Strings.invite.membersLine(byline.names, byline.plural)}
          </ThemedText>
        </View>
      ) : memberCount > 0 ? (
        <View style={styles.membersBlock}>
          <ThemedText style={styles.membersLine}>
            {Strings.invite.membersCountOnly(memberCount)}
          </ThemedText>
        </View>
      ) : null}

      {cadenceLine ? (
        <View style={styles.datelineRow}>
          <View style={styles.datelineRule} />
          <ThemedText style={styles.dateline}>{cadenceLine}</ThemedText>
          <View style={styles.datelineRule} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'stretch',
  },
  // "YOU'RE INVITED" between ink hairlines — a sanctioned vermilion kicker
  // (BRAND §8's own example), the page's single accent.
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.md,
  },
  kickerRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.ink,
  },
  kicker: {
    color: Colors.vermilion,
  },
  // The group name set exactly like an edition masthead — this IS their paper.
  masthead: {
    marginTop: Layout.padding.sm,
    ...Typography.scale.display,
    color: Colors.ink,
    textAlign: 'center',
  },
  mastheadRule: {
    marginTop: Layout.padding.md,
    height: Layout.rule.heavy,
    backgroundColor: Colors.ink,
  },
  coverPhoto: {
    marginTop: Layout.padding.lg,
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  ornamentRow: {
    marginTop: Layout.padding.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.xl,
  },
  ornamentRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
  },
  // The description as the Lora-italic deck under the masthead.
  deck: {
    marginTop: Layout.padding.lg,
    ...Typography.scale.deck,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  membersBlock: {
    marginTop: Layout.padding.md,
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  membersLine: {
    ...Typography.scale.deck,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  // The cadence line in the edition dateline register: italic serif between
  // ink hairlines.
  datelineRow: {
    marginTop: Layout.padding.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.md,
  },
  datelineRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.ink,
  },
  dateline: {
    flexShrink: 1,
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.lg,
    color: Colors.ink,
    textAlign: 'center',
  },
});
