import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import { FormButton } from '@/components/form-button';
import { FormField } from '@/components/form-field';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { isGroupMember, joinGroupByInviteCode, lookupGroupByInviteCode } from '@/lib/groups';
import type { GroupRow } from '@/types';

const JoinGroupScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [screenError, setScreenError] = useState('');
  const [preview, setPreview] = useState<GroupRow | null>(null);
  const [looking, setLooking] = useState(false);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  const inputRef = useRef(null);

  const handleFindGroup = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setCodeError('Enter an invite code to find a Group.');
      return;
    }
    setCodeError('');
    setScreenError('');
    setPreview(null);
    setAlreadyMember(false);

    try {
      setLooking(true);
      const found = await lookupGroupByInviteCode(trimmedCode);
      if (!found) {
        setCodeError('That code does not match any Group. Check the spelling and try again.');
        return;
      }
      setPreview(found);
      if (user) {
        const member = await isGroupMember(found.id, user.id);
        setAlreadyMember(member);
      }
    } catch (_err) {
      setScreenError('Something went wrong. Please try again.');
    } finally {
      setLooking(false);
    }
  };

  const handleJoin = async () => {
    if (!preview || !user) return;
    setScreenError('');

    try {
      setJoining(true);
      const groupId = await joinGroupByInviteCode(code);
      router.replace(`/group/${groupId}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'invalid_invite_code') {
        setCodeError('That code does not match any Group. Check the spelling and try again.');
        setPreview(null);
      } else {
        setScreenError('Something went wrong joining the Group. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  const handleViewGroup = () => {
    if (preview) {
      router.replace(`/group/${preview.id}`);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Join a Group',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <Ionicons name="chevron-back" size={26} color={Colors.accentNavy} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <ThemedText variant="body" style={styles.intro}>
            Ask a family member for their Group's invite code, then enter it below.
          </ThemedText>

          {screenError ? (
            <StatusBanner variant="error" message={screenError} />
          ) : null}

          <View style={styles.inputRow}>
            <FormField
              ref={inputRef}
              label="Invite code"
              value={code}
              onChangeText={(t) => {
                setCode(t.toUpperCase());
                if (codeError) setCodeError('');
                if (preview) setPreview(null);
                if (alreadyMember) setAlreadyMember(false);
              }}
              placeholder="e.g. A1B2C3D4E5F6"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleFindGroup}
              error={codeError || null}
              style={styles.codeInput}
            />
            <FormButton
              title="Find Group"
              onPress={handleFindGroup}
              loading={looking}
              style={styles.findButton}
            />
          </View>

          {preview ? (
            <ThemedView variant="card" style={styles.previewCard}>
              <ThemedText variant="subheadline" style={styles.previewName}>
                {preview.name}
              </ThemedText>
              {preview.description ? (
                <ThemedText variant="body" style={styles.previewDescription}>
                  {preview.description}
                </ThemedText>
              ) : null}

              {alreadyMember ? (
                <>
                  <StatusBanner
                    variant="info"
                    message="You're already a member of this Group."
                    style={styles.alreadyBanner}
                  />
                  <FormButton
                    title="Go to Group"
                    onPress={handleViewGroup}
                    style={styles.joinButton}
                  />
                </>
              ) : (
                <FormButton
                  title={`Join "${preview.name}"`}
                  onPress={handleJoin}
                  loading={joining}
                  style={styles.joinButton}
                />
              )}
            </ThemedView>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  inner: {
    padding: Layout.padding.lg,
    gap: Layout.padding.lg,
  },
  intro: {
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.body,
  },
  inputRow: {
    gap: Layout.padding.sm,
  },
  codeInput: {
    fontFamily: Typography.families.sansMedium,
    letterSpacing: 1,
  },
  findButton: {
    alignSelf: 'stretch',
  },
  previewCard: {
    gap: Layout.padding.md,
  },
  previewName: {
    fontFamily: Typography.families.serifBold,
    color: Colors.text,
  },
  previewDescription: {
    color: Colors.textMuted,
    lineHeight: Typography.lineHeights.body,
  },
  alreadyBanner: {
    marginTop: 0,
  },
  joinButton: {
    marginTop: Layout.padding.xs,
  },
});
