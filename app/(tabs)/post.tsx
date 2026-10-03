import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useComposeSheet } from '@/components/compose-sheet-provider';
import { ComposeActionBar } from '@/components/composer/compose-action-bar';
import { ComposerMasthead } from '@/components/composer/composer-masthead';
import { ComposerPage } from '@/components/composer/composer-page';
import { composerStatus } from '@/components/composer/composer-status';
import { RAISED_LIFT } from '@/components/custom-tab-bar';
import { EmptyState } from '@/components/empty-state';
import { DogWithPaperScene } from '@/components/illustrations/dog-with-paper-scene';
import { InkStamp } from '@/components/ink-stamp';
import { ComposerSkeleton } from '@/components/skeletons/composer-skeleton';
import { StatusBanner } from '@/components/status-banner';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { useBlockEditor } from '@/hooks/use-block-editor';
import { useComposerDraft } from '@/hooks/use-composer-draft';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { photosIn } from '@/lib/composer-blocks';
import { nextPublishForGroup } from '@/lib/groups';
import { Haptics } from '@/lib/haptics';
import { MAX_POST_PHOTOS } from '@/lib/post-blocks';

// The composer (BRAND §9): this week's page for one Group — a headline, one
// flow of writing with photos set into it, and a pinned bar to add a photo
// and file the story. The draft (lib + hooks/use-composer-draft) and the
// editing behaviour (hooks/use-block-editor) live apart from this layout.
const PostScreen = () => {
  const router = useRouter();
  // The Group arrives as a route param from the compose sheet (the "+" or
  // the tappable masthead).
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId?: string }>();
  const { groups, loadingGroups, openComposeSheet, reloadGroups } = useComposeSheet();
  const reduceMotion = useReduceMotion();
  const draft = useComposerDraft();
  const screenRef = useRef<View>(null);
  const viewportRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { inset: keyboardInset, onLayout: onScreenLayout } = useKeyboardInset(screenRef);
  const editor = useBlockEditor({ draft, viewportRef, scrollRef, keyboardInset });
  const [refreshing, setRefreshing] = useState(false);
  // The FILED stamp: bumped per filing so it replays; unmounts when done.
  const [stampKey, setStampKey] = useState(0);
  const [stampVisible, setStampVisible] = useState(false);
  // The post filed from this page — it reads "Update my story" from then on.
  const [filedPostId, setFiledPostId] = useState<string | null>(null);

  // Trust the param (our own navigation sets it); otherwise fall back to the
  // user's only Group so a direct visit still lands on a writable page.
  const selectedGroupId = useMemo<string | null>(() => {
    if (groupIdParam) return groupIdParam;
    if (!loadingGroups && groups.length === 1) return groups[0].id;
    return null;
  }, [groupIdParam, groups, loadingGroups]);

  const { load } = draft;
  useEffect(() => {
    if (selectedGroupId) load(selectedGroupId);
  }, [selectedGroupId, load]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? null;
  const nextPublish = selectedGroup ? nextPublishForGroup(selectedGroup) : null;
  const post = draft.existingPost;
  const filedBefore = post !== null && (draft.openedWithPost || filedPostId === post.id);
  const photoCount = photosIn(draft.blocks).length;
  const editable = !draft.filing && !draft.deleting;
  const status = composerStatus({
    blocks: draft.blocks,
    saveStatus: draft.saveStatus,
    filed: draft.filed,
    dayLabel: nextPublish?.dayLabel ?? null,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await reloadGroups();
    if (selectedGroupId) await draft.load(selectedGroupId);
    setRefreshing(false);
  };

  const handleAddPhoto = async () => {
    // Where the photos go is read before the picker can take the focus.
    const at = editor.captureCaret();
    const room = MAX_POST_PHOTOS - photoCount;
    if (room <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: room,
      orderedSelection: true,
      // Quality 1 = no compression here: lib/posts.ts makes the print master
      // and the display copy from the original, so nothing is compressed twice.
      quality: 1,
    });
    if (result.canceled || result.assets.length === 0) return;
    editor.insertPhotos(
      at,
      result.assets.map(({ uri, width, height }) => ({ uri, width, height })),
    );
  };

  // Filing closes the writing moment: the keyboard drops so the stamp and
  // the settled bar are in full view. No navigation afterwards — the
  // reassurance stays on screen.
  const handleFile = async () => {
    Keyboard.dismiss();
    const filedId = await draft.file();
    if (!filedId) return;
    setFiledPostId(filedId);
    Haptics.confirm();
    if (nextPublish) {
      setStampKey((k) => k + 1);
      setStampVisible(true);
    }
  };

  const handleRemovePost = () => {
    Alert.alert(Strings.compose.removePostTitle, Strings.compose.removePostBody, [
      { text: Strings.compose.cancel, style: 'cancel' },
      { text: Strings.compose.removePostCta, style: 'destructive', onPress: draft.removePost },
    ]);
  };

  // No Group yet: resolve quietly, then send to Groups (none) or ask which.
  if (!selectedGroupId) {
    if (loadingGroups) {
      return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <ComposerSkeleton withHeader />
        </ScrollView>
      );
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

  const showPage = !draft.loading && !draft.loadFailed;
  const subtitle = nextPublish
    ? draft.openedWithPost
      ? Strings.thisWeek.composerSubtitleEditing(nextPublish.dayLabel)
      : Strings.thisWeek.composerSubtitle(nextPublish.dayLabel)
    : 'Your entry for this week';

  return (
    // Ends at the keyboard's top edge while it's up (`inset`), so the bar
    // rides it; otherwise at the tab bar.
    <View
      ref={screenRef}
      onLayout={onScreenLayout}
      style={[styles.screen, { paddingBottom: keyboardInset }]}
    >
      <View ref={viewportRef} style={styles.viewport}>
        <ScrollView
          ref={scrollRef}
          style={styles.viewport}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScroll={editor.onScroll}
          scrollEventThrottle={32}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.ink} />
          }
        >
          {draft.error ? <StatusBanner variant="error" message={draft.error} /> : null}
          <ComposerMasthead
            groupName={selectedGroup ? selectedGroup.name : 'This week'}
            subtitle={subtitle}
            onSwitchGroup={groups.length > 1 ? openComposeSheet : null}
          />
          {draft.loading ? <ComposerSkeleton /> : null}
          {showPage ? (
            <ComposerPage
              title={draft.title}
              onChangeTitle={draft.setTitle}
              blocks={draft.blocks}
              editable={editable}
              editor={editor}
              onRetryPhoto={draft.retryPhoto}
            />
          ) : null}
          {/* Removing is legitimate but never competes with writing — a
              quiet line below the page, once there's a post to remove. */}
          {showPage && post ? (
            <Pressable
              accessibilityRole="button"
              disabled={!editable}
              onPress={handleRemovePost}
              style={({ pressed }) => [styles.removeLink, pressed && styles.pressed]}
            >
              <ThemedText variant="ui" style={styles.removeLinkText}>
                {Strings.compose.removePostLink}
              </ThemedText>
            </Pressable>
          ) : null}
        </ScrollView>
        {stampVisible && nextPublish ? (
          // FILED owns −4° (BRAND §11). Pressed onto the page just above the
          // bar, where "Filed for …" then settles in.
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
      </View>

      {showPage ? (
        <ComposeActionBar
          onAddPhoto={handleAddPhoto}
          photoLimitNote={photoCount >= MAX_POST_PHOTOS ? Strings.compose.photoLimit(MAX_POST_PHOTOS) : null}
          statusText={status.text}
          statusTone={status.tone}
          settleStatus={status.settle}
          reduceMotion={reduceMotion}
          primaryLabel={filedBefore ? Strings.compose.updateCta : Strings.compose.fileCta}
          onPrimary={handleFile}
          primaryLoading={draft.filing}
          disabled={!editable}
          // Resting on the tab bar, leave the raised "+" its room; on the
          // keyboard, the tab bar is under it.
          clearance={keyboardInset > 0 ? 0 : RAISED_LIFT}
        />
      ) : null}
    </View>
  );
};

export default PostScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  viewport: {
    flex: 1,
  },
  content: {
    padding: Layout.padding.lg,
    gap: Layout.padding.lg,
    paddingBottom: Layout.padding.xl,
  },
  stamp: {
    position: 'absolute',
    right: Layout.padding.lg,
    bottom: Layout.padding.md,
  },
  // Danger in words, not a slab; centered under the page at a full target.
  removeLink: {
    minHeight: Layout.touchTargetMin,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.padding.md,
  },
  pressed: {
    opacity: 0.7,
  },
  removeLinkText: {
    color: Colors.error,
  },
});
