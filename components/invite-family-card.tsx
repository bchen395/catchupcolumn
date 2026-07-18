import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { buildInviteLink } from '@/lib/groups';
import { Haptics } from '@/lib/haptics';

import { FormButton } from './form-button';
import { InviteTicket } from './illustrations/invite-ticket';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

// How long "Copied!" rests before the hint returns — the stamp HOLD beat.
const COPIED_MS = 1600;

type Props = {
  groupName: string;
  inviteCode: string;
};

// The group screen's "Invite your family" card — the sender half of the
// acquisition funnel. Three paths, matched to how families actually invite:
// read the code out over the phone (big copyable code), text it (share sheet,
// code-first message), or hand your phone across the kitchen table (QR of the
// deep link for their camera).
export const InviteFamilyCard = ({ groupName, inviteCode }: Props) => {
  const reduceMotion = useReduceMotion();
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayCode = inviteCode.toUpperCase();
  const inviteLink = buildInviteLink(inviteCode);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const handleCopy = async () => {
    Haptics.tap();
    await Clipboard.setStringAsync(displayCode);
    AccessibilityInfo.announceForAccessibility(Strings.inviteCard.a11yCopied);
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: Strings.inviteCard.shareMessage(groupName, displayCode, inviteLink),
      });
    } catch (_err) {
      // User cancelled share; ignore
    }
  };

  return (
    <ThemedView variant="card" style={styles.card}>
      <ThemedText style={styles.title}>{Strings.inviteCard.title}</ThemedText>
      <ThemedText variant="caption" style={styles.body}>
        {Strings.inviteCard.body}
      </ThemedText>

      {/* The §11 ticket carries the code; tap-to-copy stays the whole-object
          gesture. Content block, so pressed = 0.7 opacity. */}
      <Pressable
        onPress={handleCopy}
        accessibilityRole="button"
        // Spaced characters so a screen reader spells the code out.
        accessibilityLabel={`Invite code ${displayCode.split('').join(' ')}. Double tap to copy.`}
        style={({ pressed }) => (pressed ? styles.ticketPressed : null)}
      >
        <InviteTicket code={displayCode} />
      </Pressable>
      <ThemedText variant="caption" style={[styles.hint, copied ? styles.hintCopied : null]}>
        {copied ? Strings.inviteCard.copied : Strings.inviteCard.copyHint}
      </ThemedText>

      <FormButton title={Strings.inviteCard.shareCta} onPress={handleShare} />
      <FormButton
        title={qrOpen ? Strings.inviteCard.qrHideCta : Strings.inviteCard.qrShowCta}
        variant="secondary"
        onPress={() => setQrOpen((open) => !open)}
      />

      {qrOpen ? (
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(Motion.duration.settle)}
          exiting={reduceMotion ? undefined : FadeOut.duration(Motion.duration.exit)}
          style={styles.qrCard}
          accessibilityLabel="A code to scan. If scanning doesn't work, share the invite code instead."
        >
          {/* Hard white on purpose — the QR's quiet zone needs true paper-
              white for scanner contrast, and nothing may texture the code. */}
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <QRCode
              value={inviteLink}
              size={200}
              color={Colors.ink}
              backgroundColor={Colors.paper}
            />
          </View>
          <ThemedText variant="caption" style={styles.qrCaption}>
            {Strings.inviteCard.qrCaption}
          </ThemedText>
        </Animated.View>
      ) : null}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Layout.padding.lg,
    gap: Layout.padding.md,
  },
  title: {
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.xl,
    color: Colors.ink,
  },
  body: {
    lineHeight: Typography.lineHeights.body,
  },
  ticketPressed: {
    opacity: 0.7,
  },
  hint: {
    textAlign: 'center',
    marginTop: -Layout.padding.sm,
  },
  // "Copied" is a live moment — a sanctioned vermilion flash (BRAND §2).
  hintCopied: {
    fontFamily: Typography.families.sansSemiBold,
    color: Colors.vermilion,
  },
  // A little paper card; the QR keeps its true-paper quiet zone (BRAND §11).
  qrCard: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: Layout.padding.md,
    backgroundColor: Colors.paper,
    padding: Layout.padding.lg,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: Layout.borderRadius.md,
    ...Layout.shadow.paper,
  },
  qrCaption: {
    textAlign: 'center',
    maxWidth: 200,
  },
});
