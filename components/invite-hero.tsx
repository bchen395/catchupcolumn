import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import type { InvitePreviewMember } from '@/types';

import { AppImage } from './app-image';
import { AvatarStack } from './avatar-stack';
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
// paper: kicker band, the group name set as a masthead, the cover as a taped
// polaroid, the description as an italic deck, the members as a byline, and
// the publish rhythm as a dateline. Flat on paperWarm like the edition front
// page — a page being handed over, not a card floating on one. CTAs belong
// to the host screen.
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
        <ThemedText style={styles.kicker}>{Strings.invite.kicker.toUpperCase()}</ThemedText>
        <View style={styles.kickerRule} />
      </View>

      <ThemedText
        accessibilityRole="header"
        style={styles.masthead}
        numberOfLines={3}
      >
        {name.toUpperCase()}
      </ThemedText>
      <View style={styles.mastheadRule} />

      {coverImageUrl ? (
        // The group cover as a taped polaroid. Frame recipe matches
        // polaroid-photo.tsx exactly, but rendered here around a plain
        // AppImage — covers are public URLs, not post-storage paths, so they
        // must not go through Polaroid's usePostImageUrl signing.
        <View style={styles.polaroidWrap}>
          <View style={styles.tape} />
          <View style={styles.polaroidFrame}>
            <AppImage
              source={{ uri: coverImageUrl }}
              style={styles.coverPhoto}
              accessibilityIgnoresInvertColors
              accessibilityLabel={Strings.invite.a11yCover(name)}
            />
          </View>
        </View>
      ) : (
        // No cover — the colophon's ornament seats the space so the page
        // still reads composed.
        <View style={styles.ornamentRow}>
          <View style={styles.ornamentRule} />
          <ThemedText style={styles.ornament}>◆</ThemedText>
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
  // "YOU'RE INVITED" between ink hairlines — the edition dateline band
  // promoted to a kicker. Orange at 12px small caps is the affordance
  // register (same as the front page's "LEAD STORY"), never body copy.
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.md,
  },
  kickerRule: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.ink,
  },
  kicker: {
    fontFamily: Typography.families.sansSemiBold,
    fontSize: Typography.sizes.xs,
    letterSpacing: 2,
    color: Colors.orange,
  },
  // The group name set exactly like an edition masthead — this IS their paper.
  masthead: {
    marginTop: Layout.padding.sm,
    fontFamily: Typography.families.serifBlack,
    fontSize: Typography.sizes.headline,
    lineHeight: Typography.lineHeights.headline,
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: 1,
  },
  mastheadRule: {
    marginTop: Layout.padding.md,
    height: 3,
    backgroundColor: Colors.ink,
  },
  // Polaroid recipe copied from polaroid-photo.tsx — keep the two in step.
  polaroidWrap: {
    ...Layout.shadow.paper,
    marginTop: Layout.padding.lg,
    // Bleed slightly past the page padding for front-page weight, the
    // edition-lead trick.
    marginHorizontal: -Layout.padding.sm,
    transform: [{ rotate: '-2deg' }],
  },
  tape: {
    position: 'absolute',
    top: -9,
    left: '50%',
    width: 58,
    height: 20,
    backgroundColor: 'rgba(250,247,242,0.7)',
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    transform: [{ translateX: -29 }, { rotate: '-4deg' }],
    zIndex: 2,
  },
  polaroidFrame: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Layout.borderRadius.sm,
    paddingTop: Layout.padding.sm,
    paddingHorizontal: Layout.padding.sm,
    paddingBottom: Layout.padding.md,
  },
  coverPhoto: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.peachWash,
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
    height: 1,
    backgroundColor: Colors.borderSoft,
  },
  ornament: {
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.sm,
    color: Colors.inkMuted,
  },
  // The description as an italic serif deck under the masthead.
  deck: {
    marginTop: Layout.padding.lg,
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  membersBlock: {
    marginTop: Layout.padding.md,
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  membersLine: {
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.body,
    lineHeight: Typography.lineHeights.body,
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
    height: 1,
    backgroundColor: Colors.ink,
  },
  dateline: {
    flexShrink: 1,
    fontFamily: Typography.families.serif,
    fontStyle: 'italic',
    fontSize: Typography.sizes.lg,
    color: Colors.ink,
    textAlign: 'center',
  },
});
