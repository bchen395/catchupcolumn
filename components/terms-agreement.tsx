import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';

// The Terms open in the in-app browser, the same call Profile makes. The
// sign-up form stays mounted underneath, so closing the browser returns to the
// form with the email still typed in. A second tap while the browser is
// opening rejects, and there's nothing to tell anyone about it.
const openTerms = () => {
  WebBrowser.openBrowserAsync(Strings.legal.termsUrl).catch(() => {});
};

// The sign-up agreement (BRAND §9, App Review Guideline 1.2): a note saying
// what tapping Agree accepts, then a way to read the whole Terms first. The
// Agree button stays with the screen's form, directly below, so a screen reader
// hears the note, then the link, then the button.
export const TermsAgreement = () => (
  <View>
    <ThemedText variant="ui" style={styles.note}>
      {Strings.terms.note}
    </ThemedText>
    <Pressable
      onPress={openTerms}
      accessibilityRole="link"
      accessibilityHint={Strings.terms.readLinkHint}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <ThemedText variant="uiStrong">{Strings.terms.readLink}</ThemedText>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  // Quiet by color, never by size: Jost 16 in inkSoft, the reading floor.
  note: {
    color: Colors.inkSoft,
  },
  // Tertiary: bare ink text, SemiBold (BRAND §9). The 48px box is the target.
  link: {
    alignSelf: 'flex-start',
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
  },
  // A bare text control: a 92% dip would be invisible without a fill.
  pressed: {
    opacity: 0.7,
  },
});
