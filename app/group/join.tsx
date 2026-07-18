import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    AccessibilityInfo,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { InviteHero } from '@/components/invite-hero';
import { PrintingPressLoading } from '@/components/printing-press-loading';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Motion } from '@/constants/motion';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import {
    fetchInvitePreview,
    fetchInvitePreviewDetails,
    joinGroupByInviteCode,
    publishCadenceParts,
} from '@/lib/groups';
import { savePendingInvite } from '@/lib/pending-invite';
import type { InvitePreview, InvitePreviewDetails } from '@/types';

// The join screen is the invite-link landing page (catchupcolumn://group/join
// ?code=X) and the manual "I was read a code over the phone" path. Two modes:
// code entry, and — once a code resolves — the invitation itself, rendered as
// a special edition of the Group's paper (InviteHero). Reachable logged-out
// on purpose: an invitee should see what they're joining before signup.
const JoinGroupScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const reduceMotion = useReduceMotion();
  const { code: rawCodeParam } = useLocalSearchParams<{ code?: string }>();
  // The type above is only an assertion — a malformed link with a duplicated
  // ?code= key delivers string[], which would crash .toUpperCase().
  const codeParam = Array.isArray(rawCodeParam) ? rawCodeParam[0] : rawCodeParam;

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [screenError, setScreenError] = useState('');
  const [preview, setPreview] = useState<InvitePreview | InvitePreviewDetails | null>(null);
  const [looking, setLooking] = useState(false);
  const [openingLink, setOpeningLink] = useState(Boolean(codeParam));
  const [joining, setJoining] = useState(false);

  // Details (cadence, faces, is_member) only exist for signed-in lookups.
  const details = preview && 'is_member' in preview ? preview : null;

  const lookup = async (rawCode: string): Promise<void> => {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      setCodeError(Strings.invite.errorEmptyCode);
      return;
    }
    Keyboard.dismiss();
    setCodeError('');
    setScreenError('');
    setPreview(null);

    try {
      setLooking(true);
      const found = user
        ? await fetchInvitePreviewDetails(trimmed)
        : await fetchInvitePreview(trimmed);
      if (!found) {
        setCodeError(Strings.invite.errorNotFound);
        return;
      }
      setPreview(found);
      AccessibilityInfo.announceForAccessibility(Strings.invite.a11yFound(found.name));
    } catch (_err) {
      setScreenError(Strings.invite.errorNetwork);
    } finally {
      setLooking(false);
      setOpeningLink(false);
    }
  };

  // Deep-link arrival: run the code straight into the invitation.
  const consumedParamRef = useRef<string | null>(null);
  useEffect(() => {
    if (!codeParam || consumedParamRef.current === codeParam) return;
    consumedParamRef.current = codeParam;
    setCode(codeParam.toUpperCase());
    void lookup(codeParam);
    // lookup is stable per render pass; re-running on codeParam only is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeParam]);

  const backToEntry = (fieldError?: string) => {
    setPreview(null);
    if (fieldError) setCodeError(fieldError);
    AccessibilityInfo.announceForAccessibility(Strings.invite.a11yBackToEntry);
  };

  const handleJoin = async () => {
    if (!preview || !user) return;
    setScreenError('');
    try {
      setJoining(true);
      const groupId = await joinGroupByInviteCode(code);
      router.replace({
        pathname: '/group/welcome',
        params: {
          groupId,
          groupName: preview.name,
          ...(details
            ? {
                publishDay: String(details.publish_day),
                publishTime: details.publish_time,
                timezone: details.timezone,
              }
            : {}),
        },
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'invalid_invite_code') {
        // The code stopped working between lookup and join.
        backToEntry(Strings.invite.errorRevoked);
      } else {
        setScreenError(Strings.invite.errorJoin);
      }
    } finally {
      setJoining(false);
    }
  };

  // Logged-out CTAs: remember the invite, then head into auth. The root
  // layout's use-auto-join-invite finishes the join after signup/sign-in.
  const handleCreateAccount = async () => {
    if (!preview) return;
    await savePendingInvite({ code: code.trim(), groupName: preview.name });
    router.push('/(auth)/signup');
  };

  const handleSignIn = async () => {
    if (!preview) return;
    await savePendingInvite({ code: code.trim(), groupName: preview.name });
    router.push('/(auth)/login');
  };

  const inInvitationMode = preview !== null;

  return (
    <>
      <Stack.Screen
        options={{
          title: inInvitationMode ? '' : 'Join a Group',
          headerLeft: () => (
            <Pressable
              onPress={() => {
                // On a cold deep-link start there may be nothing to pop.
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace(user ? '/(tabs)/home' : '/(auth)/login');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={26} color={Colors.ink} />
            </Pressable>
          ),
        }}
      />
      {openingLink ? (
        <PrintingPressLoading message={Strings.invite.loading} />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.flex}>
            <ScrollView
              style={styles.scrollFlex}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >
              {inInvitationMode ? (
                <Animated.View
                  key={preview.group_id}
                  entering={reduceMotion ? undefined : FadeInDown.duration(Motion.duration.settle)}
                  style={styles.invitation}
                >
                  <InviteHero
                    name={preview.name}
                    description={preview.description}
                    coverImageUrl={preview.cover_image_url}
                    memberCount={preview.member_count}
                    memberSample={details?.member_sample}
                    cadenceLine={
                      details
                        ? Strings.invite.cadence(
                            publishCadenceParts(details).dayName,
                            publishCadenceParts(details).daypart,
                          )
                        : null
                    }
                  />

                  {screenError ? <StatusBanner variant="error" message={screenError} /> : null}

                  <View style={styles.ctaBlock}>
                    {!user ? (
                      <>
                        <FormButton
                          title={Strings.invite.createAccountCta}
                          onPress={handleCreateAccount}
                        />
                        <FormButton
                          title={Strings.invite.signInCta}
                          variant="ghost"
                          onPress={handleSignIn}
                          style={styles.centeredGhost}
                        />
                      </>
                    ) : details?.is_member ? (
                      <>
                        <ThemedText style={styles.alreadyMember}>
                          {Strings.invite.alreadyMember}
                        </ThemedText>
                        <FormButton
                          title={Strings.invite.goToGroupCta}
                          onPress={() => router.replace(`/group/${preview.group_id}`)}
                        />
                      </>
                    ) : (
                      <FormButton
                        title={Strings.invite.joinCta}
                        onPress={handleJoin}
                        loading={joining}
                      />
                    )}
                    <FormButton
                      title={Strings.invite.notRightGroup}
                      variant="ghost"
                      onPress={() => backToEntry()}
                      style={styles.centeredGhost}
                    />
                  </View>

                  <ThemedText style={styles.folio}>{Strings.brand.masthead}</ThemedText>
                </Animated.View>
              ) : (
                <Animated.View
                  entering={reduceMotion ? undefined : FadeIn.duration(Motion.duration.settle)}
                  style={styles.entry}
                >
                  <ThemedText style={styles.intro}>{Strings.invite.introManual}</ThemedText>

                  {screenError ? <StatusBanner variant="error" message={screenError} /> : null}

                  <FormField
                    label={Strings.invite.codeLabel}
                    value={code}
                    onChangeText={(t) => {
                      setCode(t.toUpperCase());
                      if (codeError) setCodeError('');
                    }}
                    placeholder={Strings.invite.codePlaceholder}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={() => void lookup(code)}
                    error={codeError || null}
                    style={styles.codeInput}
                  />
                  <FormButton
                    title={Strings.invite.findCta}
                    onPress={() => void lookup(code)}
                    loading={looking}
                  />

                  {!user ? (
                    // A logged-out invitee (e.g. deep link with a bad code)
                    // must never be stranded without a way into their account.
                    <FormButton
                      title={Strings.invite.signInCta}
                      variant="ghost"
                      onPress={() => router.push('/(auth)/login')}
                      style={styles.centeredGhost}
                    />
                  ) : null}
                </Animated.View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      )}
    </>
  );
};

export default JoinGroupScreen;

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 4,
  },
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  scrollFlex: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: Layout.padding.xl,
  },
  entry: {
    padding: Layout.padding.lg,
    gap: Layout.padding.lg,
  },
  // The one editorial flourish in entry mode — the drama waits for the reveal.
  intro: {
    ...Typography.scale.deck,
    color: Colors.inkSoft,
  },
  codeInput: {
    fontFamily: Typography.families.sansBold,
    fontSize: Typography.sizes.lg,
    letterSpacing: 2,
    textAlign: 'center',
  },
  invitation: {
    paddingHorizontal: Layout.padding.lg,
    paddingTop: Layout.padding.xl,
    gap: Layout.padding.lg,
  },
  ctaBlock: {
    marginTop: Layout.padding.md,
    gap: Layout.padding.sm,
    alignItems: 'stretch',
  },
  centeredGhost: {
    alignSelf: 'center',
  },
  alreadyMember: {
    ...Typography.scale.deck,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  folio: {
    marginTop: Layout.padding.md,
    ...Typography.scale.meta,
    letterSpacing: 2,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
});
