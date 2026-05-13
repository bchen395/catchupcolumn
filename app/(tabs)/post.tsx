import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';

import { AppImage } from '@/components/app-image';
import { EmptyState } from '@/components/empty-state';
import { FormButton } from '@/components/form-button';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { usePostImageUrl } from '@/hooks/use-post-image-url';
import { fetchUserGroups } from '@/lib/groups';
import {
    createPost,
    deletePost,
    fetchCurrentPost,
    updatePost,
    uploadPostImage,
} from '@/lib/posts';
import type { GroupWithMembers, PostRow } from '@/types';

// ---------------------------------------------------------------------------
// Word count helper
// ---------------------------------------------------------------------------

const countWords = (text: string): number =>
  text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const WORD_SOFT_MIN = 400;
const WORD_SOFT_MAX = 600;

const wordCountColor = (count: number): string => {
  if (count === 0) return Colors.inkSoft;
  if (count >= WORD_SOFT_MIN && count <= WORD_SOFT_MAX) return Colors.success;
  if (count > WORD_SOFT_MAX) return Colors.navy;
  return Colors.inkSoft;
};

const wordCountLabel = (count: number): string => {
  if (count < WORD_SOFT_MIN)
    return `${count} words — ~500 words makes a great read`;
  if (count <= WORD_SOFT_MAX) return `${count} words — looking good!`;
  return `${count} words`;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const PostScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  // ── Groups ────────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // ── Post ──────────────────────────────────────────────────────────────────
  const [existingPost, setExistingPost] = useState<PostRow | null>(null);
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const bodyInputRef = useRef<TextInput>(null);
  const wordCount = countWords(body);
  // Resolves storage paths from the DB into signed URLs; passes local file://
  // URIs through unchanged for previewing freshly-picked images.
  const previewUri = usePostImageUrl(imageUri);

  // ── Load groups ───────────────────────────────────────────────────────────

  const loadGroups = useCallback(async () => {
    if (!user) return;
    setScreenError('');
    try {
      const data = await fetchUserGroups(user.id);
      setGroups(data);
      if (data.length === 1 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch {
      setScreenError(Strings.error.groupsLoad);
    }
  }, [user, selectedGroupId]);

  useEffect(() => {
    setLoadingGroups(true);
    loadGroups().finally(() => setLoadingGroups(false));
  }, [loadGroups]);

  // ── Load existing post for selected group ─────────────────────────────────

  const loadPost = useCallback(async (groupId: string) => {
    if (!user) return;
    setLoadingPost(true);
    setScreenError('');
    try {
      const post = await fetchCurrentPost(groupId, user.id);
      setExistingPost(post);
      setBody(post?.body ?? '');
      setImageUri(post?.image_url ?? null);
      setImageChanged(false);
    } catch {
      setScreenError(Strings.error.postLoad);
    } finally {
      setLoadingPost(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroupId) {
      loadPost(selectedGroupId);
    }
  }, [selectedGroupId, loadPost]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    if (selectedGroupId) await loadPost(selectedGroupId);
    setRefreshing(false);
  };

  // ── Image picker ──────────────────────────────────────────────────────────

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageChanged(true);
  };

  // ── Save / Update ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user || !selectedGroupId) return;
    if (body.trim() === '') {
      setScreenError('Please write something before saving.');
      return;
    }
    setScreenError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      let finalImageUrl: string | null = existingPost?.image_url ?? null;

      if (existingPost) {
        if (imageChanged) {
          if (imageUri) {
            setUploadingImage(true);
            finalImageUrl = await uploadPostImage(user.id, existingPost.id, imageUri);
            setUploadingImage(false);
          } else {
            finalImageUrl = null;
          }
        }
        const updated = await updatePost(existingPost.id, {
          body: body.trim(),
          image_url: finalImageUrl,
        });
        setExistingPost(updated);
        setImageUri(updated.image_url);
        setImageChanged(false);
        setSuccessMessage('Your post has been updated.');
      } else {
        const created = await createPost({
          group_id: selectedGroupId,
          author_id: user.id,
          body: body.trim(),
        });

        if (imageUri && imageChanged) {
          setUploadingImage(true);
          finalImageUrl = await uploadPostImage(user.id, created.id, imageUri);
          setUploadingImage(false);
          const withImage = await updatePost(created.id, { image_url: finalImageUrl });
          setExistingPost(withImage);
          setImageUri(withImage.image_url);
        } else {
          setExistingPost(created);
        }
        setImageChanged(false);
        setSuccessMessage('Your post has been saved!');
      }
    } catch {
      setUploadingImage(false);
      setScreenError(Strings.error.postSave);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert(
      'Delete this post?',
      "This will remove your post for this week. You can always write a new one before the edition publishes.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!existingPost) return;
            setDeleting(true);
            setScreenError('');
            setSuccessMessage('');
            try {
              await deletePost(existingPost.id);
              setExistingPost(null);
              setBody('');
              setImageUri(null);
              setImageChanged(false);
            } catch {
              setScreenError(Strings.error.postDelete);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!loadingGroups && groups.length === 0) {
    return (
      <EmptyState
        icon={Icons.emptyGroups}
        title={Strings.empty.postNoGroups.title}
        body={Strings.empty.postNoGroups.body}
        ctaLabel={Strings.empty.postNoGroups.cta}
        onCtaPress={() => router.push('/groups')}
      />
    );
  }

  const isEditing = existingPost !== null;
  const isBusy = saving || deleting;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.navy}
          />
        }
      >
        {/* ── Group picker ── */}
        {groups.length > 1 && (
          <View style={styles.section}>
            <ThemedText variant="label" style={styles.sectionLabel}>
              Post to
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.groupPicker}
            >
              {groups.map((g) => (
                <Pressable
                  key={g.id}
                  accessibilityRole="button"
                  onPress={() => {
                    if (g.id !== selectedGroupId) {
                      setSelectedGroupId(g.id);
                    }
                  }}
                  style={[
                    styles.groupPill,
                    g.id === selectedGroupId && styles.groupPillSelected,
                  ]}
                >
                  <ThemedText
                    variant="label"
                    style={[
                      styles.groupPillText,
                      g.id === selectedGroupId && styles.groupPillTextSelected,
                    ]}
                  >
                    {g.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Banners ── */}
        {screenError ? (
          <StatusBanner variant="error" message={screenError} style={styles.banner} />
        ) : null}
        {successMessage ? (
          <StatusBanner variant="success" message={successMessage} style={styles.banner} />
        ) : null}

        {/* ── Composer ── */}
        {selectedGroupId && !loadingPost ? (
          <>
            {isEditing ? (
              <View style={styles.editingBadge}>
                <ThemedText variant="caption" style={styles.editingBadgeText}>
                  Editing this week's post
                </ThemedText>
              </View>
            ) : null}

            {/* Compose "card" — the main creative surface. Cream paper, no
                visible border on the input itself, sparkle anchored bottom-right
                as a decorative anchor (no behavior in v1; placeholder for the
                future "write for me" feature). */}
            <View style={styles.composeCard}>
              <TextInput
                ref={bodyInputRef}
                style={styles.bodyInput}
                value={body}
                onChangeText={setBody}
                placeholder="Write…"
                placeholderTextColor={Colors.inkSoft}
                multiline
                selectionColor={Colors.navy}
                editable={!isBusy}
                textAlignVertical="top"
              />
              <View style={styles.sparkleSlot} pointerEvents="none">
                <MaterialCommunityIcons
                  name="creation-outline"
                  size={22}
                  color={Colors.navySoft}
                />
              </View>
            </View>
            <ThemedText
              variant="caption"
              style={[styles.wordCount, { color: wordCountColor(wordCount) }]}
            >
              {wordCountLabel(wordCount)}
            </ThemedText>

            <View style={styles.section}>
              <ThemedText variant="label" style={styles.sectionLabel}>
                Photo
              </ThemedText>
              {imageUri ? (
                <View style={styles.imagePreviewWrapper}>
                  <AppImage
                    source={previewUri ? { uri: previewUri } : undefined}
                    style={styles.imagePreview}
                  />
                  <View style={styles.imageActions}>
                    <FormButton
                      title="Change photo"
                      variant="secondary"
                      onPress={handlePickImage}
                      disabled={isBusy}
                    />
                    <FormButton
                      title="Remove photo"
                      variant="ghost"
                      onPress={handleRemoveImage}
                      disabled={isBusy}
                    />
                  </View>
                </View>
              ) : (
                <FormButton
                  title="Add a photo"
                  variant="secondary"
                  onPress={handlePickImage}
                  disabled={isBusy}
                />
              )}
            </View>

            <View style={styles.actions}>
              <FormButton
                title={isEditing ? 'Update' : 'Save'}
                onPress={handleSave}
                loading={saving || uploadingImage}
                disabled={isBusy}
              />
              {isEditing ? (
                <FormButton
                  title="Delete this post"
                  variant="destructive"
                  onPress={handleDelete}
                  loading={deleting}
                  disabled={isBusy}
                />
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  scrollContent: {
    padding: Layout.padding.lg,
    gap: Layout.padding.lg,
    paddingBottom: Layout.padding.xl,
  },
  section: {
    gap: Layout.padding.sm,
  },
  sectionLabel: {
    color: Colors.navy,
  },
  banner: {},
  groupPicker: {
    gap: Layout.padding.sm,
    paddingVertical: Layout.padding.xs,
  },
  groupPill: {
    paddingHorizontal: Layout.padding.md,
    paddingVertical: Layout.padding.sm,
    borderRadius: 999,
    backgroundColor: Colors.blueWash,
    minHeight: Layout.touchTargetMin,
    justifyContent: 'center',
  },
  groupPillSelected: {
    backgroundColor: Colors.navy,
  },
  groupPillText: {
    color: Colors.navy,
    fontFamily: Typography.families.sansSemiBold,
  },
  groupPillTextSelected: {
    color: Colors.paper,
  },
  editingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paperCream,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: Layout.padding.xs,
  },
  editingBadgeText: {
    color: Colors.inkSoft,
  },
  // Compose card — cream paper background with a generous min-height. The
  // sparkle is positioned absolutely so it sits inside the card flow.
  composeCard: {
    position: 'relative',
    backgroundColor: Colors.paperCream,
    borderRadius: Layout.borderRadius.md,
    minHeight: 280,
    padding: Layout.padding.lg,
  },
  bodyInput: {
    minHeight: 240,
    color: Colors.ink,
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    lineHeight: 28,
  },
  sparkleSlot: {
    position: 'absolute',
    bottom: Layout.padding.md,
    right: Layout.padding.md,
  },
  wordCount: {
    alignSelf: 'flex-end',
  },
  imagePreviewWrapper: {
    gap: Layout.padding.sm,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.paperCream,
  },
  imageActions: {
    flexDirection: 'row',
    gap: Layout.padding.sm,
  },
  actions: {
    gap: Layout.padding.sm,
  },
});
