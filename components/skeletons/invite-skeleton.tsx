import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

import { Skeleton, SkeletonBar } from '../skeleton';

// The invitation arriving from a deep link (2026-10-03; it used to be the
// full-screen paperboy). Mirrors join.tsx's invitation container and the top
// of InviteHero: the kicker band and the masthead.
//
// It stops there on purpose (2026-10-24). Below the masthead, every slot's
// size depends on the Group: a cover is a 16:9 plate but no cover is a thin
// ornament row, a description runs from none to four lines, the member line
// may wrap, and the masthead rule sits wherever the name's last line ends.
// No one placeholder is right for every Group, and the old one guessed: it
// drew a cover, so a Group without one rose about 180pt when the page landed.
// So the skeleton draws only what lands where it was drawn, and the rest of
// the page arrives below it rather than moving. join.tsx fades the invitation
// in over it without the rise it uses after code entry, so the band and the
// masthead stay put too.
export const InviteSkeleton = () => (
  <Skeleton label={Strings.loading.invite} style={styles.page}>
    <View style={styles.band}>
      <View style={styles.inkRule} />
      <SkeletonBar variant="kicker" width={124} />
      <View style={styles.inkRule} />
    </View>

    {/* Two lines, the usual length of a name set this large. A shorter name
        lands on the first bar; a third line arrives below the second. */}
    <View style={styles.masthead}>
      <SkeletonBar variant="display" width="86%" center />
      <SkeletonBar variant="display" width="52%" center />
    </View>
  </Skeleton>
);

const styles = StyleSheet.create({
  // join.tsx's `invitation` container. No gap: InviteHero is its first child,
  // and the band and masthead sit inside it at InviteHero's own spacing.
  page: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
  },
  // InviteHero's kicker row: ink hairlines either side.
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.md,
    paddingHorizontal: Layout.padding.md,
  },
  inkRule: {
    flex: 1,
    height: Layout.rule.hairline,
    backgroundColor: Colors.ink,
  },
  masthead: {
    marginTop: Layout.padding.sm,
  },
});
