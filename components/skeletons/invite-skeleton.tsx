import { PixelRatio, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';

import { Skeleton, SkeletonBar, SkeletonBlock, SkeletonCircle, SkeletonRule } from '../skeleton';

// The invitation arriving from a deep link (2026-10-03; it used to be the
// full-screen paperboy). Mirrors join.tsx's invitation mode and InviteHero,
// kicker band to folio. The band and masthead rules are drawn for real: they
// are the page's structure, not its data. It assumes a cover photo, the layout
// the hero is designed around; without one, everything below the rule rises.

// FormButton's `label` (Jost 16 on 22), and the dateline's Lora italic `lg` on
// ThemedText's default `body` line height.
const BUTTON_LABEL = { fontSize: Typography.sizes.body, lineHeight: 22 };
const DATELINE = { fontSize: Typography.sizes.lg, lineHeight: Typography.lineHeights.body };
const FACES = [0, 1, 2]; // of the avatar stack's five

type Props = {
  // Signed in: member faces, the cadence dateline, one "Join this Group".
  // Signed out: a member count and two ways in.
  signedIn: boolean;
};

// FormButton's height: 52 at least, else its label line plus padding — which
// grows with the reader's text size.
const buttonHeight = () => {
  const label = Math.round(BUTTON_LABEL.lineHeight * PixelRatio.getFontScale());
  return Math.max(Layout.buttonMinHeight, label + Layout.padding.md * 2);
};

const GhostButton = ({ width }: { width: `${number}%` }) => (
  <View style={styles.ghost}>
    <SkeletonBar variant="uiStrong" width={width} center {...BUTTON_LABEL} />
  </View>
);

export const InviteSkeleton = ({ signedIn }: Props) => (
  <Skeleton label={Strings.loading.invite} style={styles.page}>
    <View>
      <View style={styles.band}>
        <View style={styles.inkRule} />
        <SkeletonBar variant="kicker" width={124} />
        <View style={styles.inkRule} />
      </View>

      <View style={styles.masthead}>
        <SkeletonBar variant="display" width="86%" center />
        <SkeletonBar variant="display" width="52%" center />
      </View>
      <SkeletonRule weight="heavy" style={styles.mastheadRule} />

      <SkeletonBlock style={styles.cover} />

      <View style={styles.deck}>
        <SkeletonBar variant="deck" width="90%" center />
        <SkeletonBar variant="deck" width="62%" center />
      </View>

      <View style={styles.members}>
        {signedIn ? (
          <View style={styles.faces}>
            {FACES.map((i) => (
              <View key={i} style={[styles.faceRing, i > 0 && styles.overlap]}>
                <SkeletonCircle size={32} />
              </View>
            ))}
          </View>
        ) : null}
        <SkeletonBar variant="deck" width={signedIn ? '70%' : '56%'} center />
      </View>

      {signedIn ? (
        <View style={[styles.band, styles.dateline]}>
          <View style={styles.inkRule} />
          <SkeletonBar variant="deck" width={200} {...DATELINE} />
          <View style={styles.inkRule} />
        </View>
      ) : null}
    </View>

    <View style={styles.ctas}>
      <SkeletonBlock height={buttonHeight()} radius={Layout.borderRadius.full} />
      {signedIn ? null : <GhostButton width="78%" />}
      <GhostButton width="92%" />
    </View>

    <SkeletonBar variant="meta" width={132} center style={styles.folio} />
  </Skeleton>
);

const styles = StyleSheet.create({
  // join.tsx's `invitation` container.
  page: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    gap: Layout.padding.lg,
  },
  // InviteHero's kicker and dateline rows: ink hairlines either side.
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
  mastheadRule: {
    marginTop: Layout.padding.md,
  },
  cover: {
    marginTop: Layout.padding.lg,
    aspectRatio: 16 / 9,
  },
  deck: {
    marginTop: Layout.padding.lg,
  },
  members: {
    marginTop: Layout.padding.md,
    alignItems: 'center',
    gap: Layout.padding.sm,
  },
  faces: {
    flexDirection: 'row',
  },
  // AvatarStack's 36px face with its 2px paper ring, which hides the overlap.
  faceRing: {
    padding: 2,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.paperWarm,
  },
  overlap: {
    marginLeft: -10,
  },
  dateline: {
    marginTop: Layout.padding.lg,
  },
  // join.tsx's `ctaBlock`; its marginTop adds to the page gap, as it does live.
  ctas: {
    marginTop: Layout.padding.md,
    gap: Layout.padding.sm,
  },
  // A ghost FormButton: bare label, the same padding and minimum height.
  ghost: {
    minHeight: Layout.buttonMinHeight,
    paddingVertical: Layout.padding.md,
    justifyContent: 'center',
  },
  folio: {
    marginTop: Layout.padding.md,
  },
});
