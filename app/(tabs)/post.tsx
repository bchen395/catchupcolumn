import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
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
import { ComposeActionBar } from '@/components/compose-action-bar';
import { useComposeSheet } from '@/components/compose-sheet-provider';
import { EmptyState } from '@/components/empty-state';
import { DogWithPaperScene } from '@/components/illustrations/dog-with-paper-scene';
import { InkStamp } from '@/components/ink-stamp';
import { Icon } from '@/components/icon';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useAuth } from '@/hooks/use-auth';
import { usePostImageUrl } from '@/hooks/use-post-image-url';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { nextPublishForGroup } from '@/lib/groups';
import { Haptics } from '@/lib/haptics';
import {
    createPost,
    deletePost,
    fetchCurrentPost,
    updatePost,
    uploadPostImage,
} from '@/lib/posts';
import type { PostRow } from '@/types';

// ---------------------------------------------------------------------------
// Auto-save
// ---------------------------------------------------------------------------

// Idle delay before a draft is quietly persisted. Long enough to avoid saving
// mid-word, short enough that a brief pause commits your work.
const AUTOSAVE_DELAY = 1200;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

const PostScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  // The Group to write for is chosen via the compose sheet (the + button or
  // the tappable masthead) and arrives as a route param.
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId?: string }>();
  const { groups, loadingGroups, openComposeSheet, reloadGroups } = useComposeSheet();

  // ── Post ──────────────────────────────────────────────────────────────────
  const [existingPost, setExistingPost] = useState<PostRow | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [screenError, setScreenError] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // The "filed" stamp shows once per explicit File/Update (never on autosave).
  const [stampVisible, setStampVisible] = useState(false);
  // Bumped on each save so FiledStamp remounts and replays its animation even
  // on rapid consecutive saves (a true→true flag flip would be a no-op).
  const [stampKey, setStampKey] = useState(0);
  // The bar's settled state after filing: "Filed for {day}'s edition" holds
  // until the next edit, so the reassurance outlives the stamp animation.
  const [filed, setFiled] = useState(false);
  const reduceMotion = useReduceMotion();

  const bodyInputRef = useRef<TextInput>(null);
  // Latched by loadPost when the week's page is blank; the effect below fires
  // once the body input has mounted (it doesn't exist while loadingPost).
  const shouldAutoFocusRef = useRef(false);
  // Resolves storage paths from the DB into signed URLs; passes local file://
  // URIs through unchanged for previewing freshly-picked images.
  const previewUri = usePostImageUrl(imageUri);

  // Trust the param (it's set by our own navigation); otherwise fall back to the
  // user's only group so direct visits still land on a writable page.
  const selectedGroupId = useMemo<string | null>(() => {
    if (groupIdParam) return groupIdParam;
    if (!loadingGroups && groups.length === 1) return groups[0].id;
    return null;
  }, [groupIdParam, groups, loadingGroups]);

  // ── Auto-save plumbing ──────────────────────────────────────────────────────
  // Refs hold the live values the debounced save reads, so the timer callback
  // never closes over a stale render. `lastSavedBody` is what's persisted in the
  // DB; we only write when the current text differs from it.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const lastSavedBodyRef = useRef('');
  const lastSavedTitleRef = useRef('');
  const bodyRef = useRef('');
  const titleRef = useRef('');
  const existingPostRef = useRef<PostRow | null>(null);
  // Points at the latest performAutoSave so the timer always runs current logic.
  const autoSaveRef = useRef<() => void>(() => {});

  // Keep existingPostRef in lockstep with state for the debounced save.
  useEffect(() => {
    existingPostRef.current = existingPost;
  }, [existingPost]);

  const clearAutoSaveTimer = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  const scheduleAutoSave = () => {
    clearAutoSaveTimer();
    saveTimerRef.current = setTimeout(() => autoSaveRef.current(), AUTOSAVE_DELAY);
  };

  const performAutoSave = async () => {
    if (!user || !selectedGroupId || loadingPost) return;
    const text = bodyRef.current.trim();
    const titleText = titleRef.current.trim();
    // Never auto-create or persist an empty draft; a headline alone isn't a
    // post. Clearing your text won't delete the post — deleting stays explicit.
    if (text === '') return;
    // Bail when nothing changed since the last save (body or headline).
    if (text === lastSavedBodyRef.current && titleText === lastSavedTitleRef.current) return;
    // A save is already in flight — try again once it settles.
    if (isSavingRef.current) {
      scheduleAutoSave();
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
      const titleValue = titleText === '' ? null : titleText;
      if (existingPostRef.current) {
        const updated = await updatePost(existingPostRef.current.id, { body: text, title: titleValue });
        existingPostRef.current = updated;
        setExistingPost(updated);
      } else {
        const created = await createPost({
          group_id: selectedGroupId,
          author_id: user.id,
          body: text,
          title: titleValue,
        });
        existingPostRef.current = created;
        setExistingPost(created);
      }
      lastSavedBodyRef.current = text;
      lastSavedTitleRef.current = titleText;
      setSaveStatus('saved');
      // Caught more typing while the request was out? Schedule a follow-up.
      // (Only on success — a failed save waits for the next keystroke or an
      // explicit Save, so a persistent error never becomes a retry storm.)
      const currentBody = bodyRef.current.trim();
      const currentTitle = titleRef.current.trim();
      if (
        currentBody !== '' &&
        (currentBody !== lastSavedBodyRef.current || currentTitle !== lastSavedTitleRef.current)
      ) {
        scheduleAutoSave();
      }
    } catch {
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  };
  autoSaveRef.current = performAutoSave;

  // Cancel any pending save when the screen unmounts.
  useEffect(() => clearAutoSaveTimer, []);

  const handleChangeBody = (text: string) => {
    setBody(text);
    bodyRef.current = text;
    setFiled(false);
    scheduleAutoSave();
  };

  const handleChangeTitle = (text: string) => {
    setTitle(text);
    titleRef.current = text;
    setFiled(false);
    scheduleAutoSave();
  };

  // ── Load existing post for selected group ─────────────────────────────────

  const loadPost = useCallback(async (groupId: string) => {
    if (!user) return;
    // Switching groups: drop any pending save for the previous group so its
    // draft never lands on the wrong post.
    clearAutoSaveTimer();
    setLoadingPost(true);
    setScreenError('');
    setSaveStatus('idle');
    setFiled(false);
    try {
      const post = await fetchCurrentPost(groupId, user.id);
      // Writing starts immediately on a fresh page; an existing story opens
      // calmly for reading first (no keyboard until the writer asks).
      shouldAutoFocusRef.current = post === null;
      const loadedBody = post?.body ?? '';
      const loadedTitle = post?.title ?? '';
      setExistingPost(post);
      setBody(loadedBody);
      setTitle(loadedTitle);
      setImageUri(post?.image_url ?? null);
      setImageChanged(false);
      // Seed the auto-save baseline so loading a post doesn't trigger a save.
      bodyRef.current = loadedBody;
      titleRef.current = loadedTitle;
      lastSavedBodyRef.current = loadedBody.trim();
      lastSavedTitleRef.current = loadedTitle.trim();
      existingPostRef.current = post;
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

  // Focus lands in the body on a fresh page. Deferred a beat so the input has
  // finished mounting after the loading gate drops.
  useEffect(() => {
    if (loadingPost || !shouldAutoFocusRef.current) return;
    shouldAutoFocusRef.current = false;
    const timer = setTimeout(() => bodyInputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [loadingPost]);

  // ── Refresh ───────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadGroups();
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
      setFiled(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
    setImageChanged(true);
    setFiled(false);
  };

  // The photo on the page is itself the control: tapping it offers the two
  // things you could want to do with it.
  const handlePressImage = () => {
    Alert.alert('Your photo', undefined, [
      { text: Strings.thisWeek.changePhoto, onPress: handlePickImage },
      { text: Strings.thisWeek.removePhoto, style: 'destructive', onPress: handleRemoveImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Save / Update ─────────────────────────────────────────────────────────
  // The explicit Save flushes the text and commits the photo (photos aren't
  // auto-uploaded on every keystroke — only here).

  const handleSave = async () => {
    if (!user || !selectedGroupId) return;
    if (body.trim() === '') {
      setScreenError('Please write something before filing your story.');
      return;
    }
    // Filing closes the writing moment — the keyboard drops so the stamp and
    // the settled bar are in full view.
    Keyboard.dismiss();
    clearAutoSaveTimer();
    setScreenError('');
    setSaving(true);
    setSaveStatus('saving');

    const titleValue = title.trim() === '' ? null : title.trim();

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
          title: titleValue,
          body: body.trim(),
          image_url: finalImageUrl,
        });
        setExistingPost(updated);
        setImageUri(updated.image_url);
        setImageChanged(false);
      } else {
        const created = await createPost({
          group_id: selectedGroupId,
          author_id: user.id,
          title: titleValue,
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
      }
      lastSavedBodyRef.current = body.trim();
      lastSavedTitleRef.current = title.trim();
      setSaveStatus('saved');
      setFiled(true);
      // The explicit File/Update is the "my story is in" moment — stamp the page.
      // Only when a group (and thus a publish date) is selected, since the
      // stamp prints that date; otherwise the flag would latch with nothing
      // ever rendering it to reset. Bump the key so each save replays it.
      Haptics.confirm();
      const groupForStamp = groups.find((g) => g.id === selectedGroupId) ?? null;
      if (groupForStamp) {
        setStampKey((k) => k + 1);
        setStampVisible(true);
      }
    } catch {
      setUploadingImage(false);
      setScreenError(Strings.error.postSave);
      setSaveStatus('error');
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
            clearAutoSaveTimer();
            setDeleting(true);
            setScreenError('');
            try {
              await deletePost(existingPost.id);
              setExistingPost(null);
              setBody('');
              setTitle('');
              setImageUri(null);
              setImageChanged(false);
              bodyRef.current = '';
              titleRef.current = '';
              lastSavedBodyRef.current = '';
              lastSavedTitleRef.current = '';
              existingPostRef.current = null;
              setSaveStatus('idle');
              setFiled(false);
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

  const isEditing = existingPost !== null;
  const isBusy = saving || deleting;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const canSwitchGroup = groups.length > 1;
  // Names the destination ("…will run in Sunday's edition") so writing feels
  // pointed at a real arrival, not dropped into a void.
  const nextPublish = selectedGroup ? nextPublishForGroup(selectedGroup) : null;
  const subtitle = nextPublish
    ? isEditing
      ? Strings.thisWeek.composerSubtitleEditing(nextPublish.dayLabel)
      : Strings.thisWeek.composerSubtitle(nextPublish.dayLabel)
    : isEditing
      ? 'Editing your entry for this week'
      : 'Your entry for this week';

  // The bar's quiet status line: an autosave error outranks everything, the
  // settled "Filed for…" reassurance outlives the stamp, and plain
  // saving/saved reassurance covers the in-between.
  const barStatusText =
    saveStatus === 'error'
      ? Strings.thisWeek.autosaveError
      : filed && nextPublish
        ? Strings.thisWeek.filedStamp(nextPublish.dayLabel)
        : saveStatus === 'saving'
          ? 'Saving…'
          : saveStatus === 'saved'
            ? 'Saved'
            : '';

  // No group selected yet: resolve quietly, then either send to Groups (none) or
  // prompt to choose one (several).
  if (!selectedGroupId) {
    if (loadingGroups) {
      return <View style={styles.flex} />;
    }
    if (groups.length === 0) {
      return (
        <EmptyState
          scene={<DogWithPaperScene />}
          title={Strings.empty.postNoGroups.title}
          body={Strings.empty.postNoGroups.body}
          ctaLabel={Strings.empty.postNoGroups.cta}
          onCtaPress={() => router.push('/groups')}
        />
      );
    }
    return (
      <EmptyState
        icon={Icons.emptyPost}
        title="Who are you writing for?"
        body="Choose a Group to start this week's entry."
        ctaLabel="Choose a Group"
        onCtaPress={openComposeSheet}
      />
    );
  }

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
            tintColor={Colors.ink}
          />
        }
      >
        {/* ── Error banner ── */}
        {screenError ? (
          <StatusBanner variant="error" message={screenError} style={styles.banner} />
        ) : null}

        {/* Masthead — names the publication you're writing for. With more than
            one Group it's tappable, reopening the menu to switch. */}
        <View style={styles.composeHeader}>
          {canSwitchGroup ? (
            <Pressable
              onPress={openComposeSheet}
              accessibilityRole="button"
              accessibilityLabel="Switch Group"
              style={({ pressed }) => [styles.titleChip, pressed && styles.titleChipPressed]}
            >
              <ThemedText variant="subheadline" style={styles.composeTitle} numberOfLines={1}>
                {selectedGroup ? selectedGroup.name : 'This week'}
              </ThemedText>
              <Icon icon={Icons.chevronDown} size={14} color={Colors.inkSoft} />
            </Pressable>
          ) : (
            <ThemedText variant="subheadline" style={styles.composeTitle}>
              {selectedGroup ? selectedGroup.name : 'This week'}
            </ThemedText>
          )}
          <ThemedText variant="caption" style={styles.composeSubtitle}>
            {subtitle}
          </ThemedText>
        </View>

        {!loadingPost ? (
          <>
            {/* The page — a white sheet lifted off the warm desk. Shadow deepens
                while focused so writing feels tactile. Tapping any blank paper
                puts the cursor in the body — the whole page is the input. */}
            <Pressable
              accessible={false}
              onPress={() => bodyInputRef.current?.focus()}
              style={[styles.composeCard, isFocused && styles.composeCardFocused]}
            >
              {/* Optional headline. A short serif title that becomes the story's
                  headline on the front page and in the email; left blank, the
                  post just runs under the author's name. */}
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={handleChangeTitle}
                placeholder={Strings.thisWeek.headlinePlaceholder}
                placeholderTextColor={Colors.inkMuted}
                selectionColor={Colors.vermilion}
                editable={!isBusy}
                maxLength={80}
                returnKeyType="next"
                onSubmitEditing={() => bodyInputRef.current?.focus()}
              />
              <View style={styles.titleRule} />
              <View style={styles.bodyWrap}>
                <TextInput
                  ref={bodyInputRef}
                  style={styles.bodyInput}
                  value={body}
                  onChangeText={handleChangeBody}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  multiline
                  selectionColor={Colors.vermilion}
                  editable={!isBusy}
                  textAlignVertical="top"
                />
                {/* Custom italic-serif placeholder. Overlaying it (rather than the
                    native placeholder) keeps the warm voice without italicizing
                    the upright serif body the user types. */}
                {body === '' ? (
                  <View style={styles.placeholderWrap} pointerEvents="none">
                    <ThemedText style={styles.placeholder}>
                      {Strings.thisWeek.bodyPlaceholder}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
              {/* The photo runs with the story, on the page — exactly where it
                  will appear in the edition. The photo itself is the control. */}
              {imageUri ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Your photo. Tap to change or remove it."
                  disabled={isBusy}
                  onPress={handlePressImage}
                  style={({ pressed }) => [styles.photoOnPage, pressed && styles.photoPressed]}
                >
                  <AppImage
                    source={previewUri ? { uri: previewUri } : undefined}
                    style={styles.imagePreview}
                  />
                </Pressable>
              ) : null}
              {stampVisible && nextPublish ? (
                // FILED owns −4°; JOINED owns +3° (BRAND §11). Overlaps the
                // page's top-right corner like a stamp that didn't quite line
                // up — deliberate.
                <InkStamp
                  key={stampKey}
                  label={Strings.thisWeek.filedStamp(nextPublish.dayLabel)}
                  tilt={-4}
                  behavior="moment"
                  reduceMotion={reduceMotion}
                  onDone={() => setStampVisible(false)}
                  style={styles.stamp}
                />
              ) : null}
            </Pressable>

            {/* Deleting is legitimate but never competes with writing — a
                quiet line below the page, only once a post exists. */}
            {isEditing ? (
              <Pressable
                accessibilityRole="button"
                disabled={isBusy}
                onPress={handleDelete}
                style={({ pressed }) => [styles.removeLink, pressed && styles.removeLinkPressed]}
              >
                <ThemedText variant="ui" style={styles.removeLinkText}>
                  {Strings.thisWeek.removePostLink}
                </ThemedText>
              </Pressable>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      {/* Pinned above the keyboard while writing; resting on the tab bar
          otherwise. Photo, reassurance, and the finishing action never require
          scrolling away from your words. */}
      {!loadingPost ? (
        <ComposeActionBar
          photoLabel={imageUri ? Strings.thisWeek.changePhoto : Strings.thisWeek.addPhoto}
          onPickPhoto={handlePickImage}
          statusText={barStatusText}
          statusTone={saveStatus === 'error' ? 'error' : 'quiet'}
          primaryLabel={isEditing ? Strings.thisWeek.updateCta : Strings.thisWeek.fileCta}
          onPrimary={handleSave}
          primaryLoading={saving || uploadingImage}
          disabled={isBusy}
        />
      ) : null}
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
  banner: {},
  // Overlaps the page's top-right corner (host is position: relative).
  stamp: {
    position: 'absolute',
    top: -10,
    right: 12,
  },
  // Masthead above the page.
  composeHeader: {
    gap: Layout.padding.xs,
  },
  // Tappable group switcher: name + down-caret.
  titleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.padding.sm,
    alignSelf: 'flex-start',
    paddingVertical: Layout.padding.xs,
  },
  titleChipPressed: {
    opacity: 0.6,
  },
  composeTitle: {
    color: Colors.ink,
  },
  composeSubtitle: {
    color: Colors.inkSoft,
  },
  // The page — a white sheet on the warm desk. The one content surface that
  // keeps its lift in v2: the sheet IS the composing metaphor, and it behaves
  // like a true overlay (a page laid on the desk, not a card in a feed).
  composeCard: {
    ...Layout.shadow.paper,
    position: 'relative',
    backgroundColor: Colors.paper,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    minHeight: 360,
    padding: Layout.padding.lg,
  },
  composeCardFocused: {
    ...Layout.shadow.paperRaised,
  },
  // Headline line at the top of the page — Lora Bold, sized between body and
  // a real headline so it reads as a title without dwarfing the writing area.
  titleInput: {
    color: Colors.ink,
    fontFamily: Typography.families.serifBold,
    fontSize: Typography.sizes.xl,
    lineHeight: 28,
    paddingVertical: Layout.padding.xs,
  },
  // Hairline separating the headline from the body, echoing the masthead rule.
  titleRule: {
    height: Layout.rule.hairline,
    backgroundColor: Colors.hairline,
    marginTop: Layout.padding.xs,
    marginBottom: Layout.padding.md,
  },
  bodyWrap: {
    position: 'relative',
  },
  bodyInput: {
    minHeight: 312,
    color: Colors.ink,
    fontFamily: Typography.families.serif,
    fontSize: Typography.sizes.lg,
    lineHeight: 30,
  },
  // Anchored to the body wrapper's origin so the italic placeholder sits
  // exactly where typed text begins, below the headline.
  placeholderWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  placeholder: {
    fontFamily: Typography.families.serifItalic,
    fontSize: Typography.sizes.lg,
    lineHeight: 30,
    color: Colors.inkSoft,
  },
  // The photo sits on the page under the writing, as it will run in print.
  photoOnPage: {
    marginTop: Layout.padding.md,
  },
  // Content-block press feedback (BRAND §9): opacity, never new colors.
  photoPressed: {
    opacity: 0.7,
  },
  // Flat editorial preview (BRAND §5): square corners, hairline edge.
  imagePreview: {
    width: '100%',
    height: 200,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
  },
  // The quiet delete affordance — danger in words, not a slab; centered under
  // the page with a full-height touch target.
  removeLink: {
    minHeight: Layout.touchTargetMin,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.md,
  },
  removeLinkPressed: {
    opacity: 0.7,
  },
  removeLinkText: {
    color: Colors.error,
  },
});
