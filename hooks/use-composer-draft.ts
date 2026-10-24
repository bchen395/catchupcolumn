import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { Strings } from '@/constants/strings';
import { useAuth } from '@/hooks/use-auth';
import {
  blocksToSave,
  composerBlocksFrom,
  insertPhotos as insertInto,
  photosIn,
  pickedPhoto,
  removePhoto as removeFrom,
  setPieceText,
  updatePhoto,
  type Caret,
  type ComposerBlock,
} from '@/lib/composer-blocks';
import { MAX_POST_PHOTOS, photoBlocksOf, postBlocksOf, toPostFields } from '@/lib/post-blocks';
import {
  createPost,
  deletePost,
  deletePostPhotoFiles,
  fetchCurrentPost,
  updatePost,
  uploadPostPhoto,
} from '@/lib/posts';
import type { PostBlock, PostPhotoBlock, PostRow } from '@/types';

// Idle delay before a draft is quietly persisted. Long enough to avoid saving
// mid-word, short enough that a brief pause commits your work.
const AUTOSAVE_DELAY = 1200;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type PickedAsset = { uri: string; width?: number; height?: number };

// One Group's page for one sitting. A new object whenever the page is
// (re)loaded or the post is removed, so async work that finishes after the
// page moved on can tell, and leave the new page alone.
type Session = { groupId: string; userId: string };

type Fields = Pick<PostRow, 'blocks' | 'body' | 'image_url' | 'title'>;

const snapshotOf = (fields: Fields) => JSON.stringify([fields.title, fields.blocks]);

const warn = (what: string) => (err: unknown) => console.warn(what, err);

/**
 * The composer's draft: loading this week's post, the 1.2s autosave, the
 * explicit "File my story", removal, and the photo uploads. Every save writes
 * `toPostFields` of the editor's blocks (lib/composer-blocks.ts →
 * blocksToSave), so `body` and `image_url` never drift from `blocks`.
 */
export const useComposerDraft = () => {
  const { user } = useAuth();

  // True until the first load lands, so the page never flashes blank first.
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState('');
  const [existingPost, setExistingPost] = useState<PostRow | null>(null);
  const [openedWithPost, setOpenedWithPost] = useState(false);
  const [blocks, setBlocks] = useState<ComposerBlock[]>(() => composerBlocksFrom(null));
  const [title, setTitleState] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [filing, setFiling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // "Filed for Sunday's edition" holds from a successful File until the next
  // edit.
  const [filed, setFiled] = useState(false);
  // Bumped when a blank page has loaded, so the editor can put the cursor in.
  const [freshPage, setFreshPage] = useState(0);

  // Refs hold the live values that timers and uploads read, so a callback
  // never closes over a stale render.
  const sessionRef = useRef<Session | null>(null);
  const existingPostRef = useRef<PostRow | null>(null);
  const blocksRef = useRef(blocks);
  const titleRef = useRef('');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  // What's in the database, so autosave only writes real changes.
  const savedSnapshotRef = useRef('');
  // Photo files this page knows exist in storage — loaded with the post or
  // uploaded since — so a photo that leaves the post also leaves storage.
  const knownFilesRef = useRef(new Map<string, PostPhotoBlock>());
  const uploadsRef = useRef(new Set<Promise<void>>());
  const autoSaveRef = useRef<() => void>(() => {});

  const commit = useCallback((next: ComposerBlock[]) => {
    blocksRef.current = next;
    setBlocks(next);
  }, []);

  const fieldsNow = useCallback((): Fields => {
    const titleText = titleRef.current.trim();
    return { ...toPostFields(blocksToSave(blocksRef.current)), title: titleText || null };
  }, []);

  const clearTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const scheduleAutoSave = useCallback(() => {
    clearTimer();
    saveTimerRef.current = setTimeout(() => autoSaveRef.current(), AUTOSAVE_DELAY);
  }, [clearTimer]);

  // A debounced autosave can still be out when someone taps File, removes the
  // post, or leaves the page. If it's a *create*, a second write would insert
  // a second post for the same edition (bugs.md, resolved 2026-09-10) — so
  // every writer waits out the one in flight, then claims the slot
  // (isSavingRef) and reads existingPostRef, which that save keeps current.
  const waitForIdle = useCallback(async () => {
    for (let waited = 0; isSavingRef.current && waited < 10000; waited += 50) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }, []);

  // Once a save no longer references a photo, and the page doesn't either,
  // its files go too. Never earlier: a stored post must not point at a
  // deleted file.
  const dropOrphans = useCallback((saved: PostBlock[]) => {
    const keep = new Set([
      ...photoBlocksOf(saved).map((p) => p.id),
      ...photosIn(blocksRef.current).map((p) => p.id),
    ]);
    const orphans = [...knownFilesRef.current.values()].filter((p) => !keep.has(p.id));
    if (orphans.length === 0) return;
    orphans.forEach((p) => knownFilesRef.current.delete(p.id));
    deletePostPhotoFiles(orphans).catch(warn('Could not delete removed photos'));
  }, []);

  const uploadPhoto = useCallback(
    (key: string) => {
      const session = sessionRef.current;
      const post = existingPostRef.current;
      const photo = photosIn(blocksRef.current).find((p) => p.key === key);
      const localUri = photo?.localUri;
      // No row yet: the photo waits for the first save (which needs words).
      if (!session || !post || !photo || !localUri) return;
      if (photo.upload === 'uploading' || photo.upload === 'done') return;

      commit(updatePhoto(blocksRef.current, key, { upload: 'uploading' }));
      const task = (async () => {
        try {
          const stored = await uploadPostPhoto(session.userId, post.id, photo.id, localUri);
          const stillHere =
            sessionRef.current === session && photosIn(blocksRef.current).some((p) => p.key === key);
          if (!stillHere) {
            // Removed (or the page moved on) mid-upload — never saved anywhere.
            deletePostPhotoFiles([stored]).catch(warn('Could not delete an abandoned photo'));
            return;
          }
          knownFilesRef.current.set(stored.id, stored);
          commit(updatePhoto(blocksRef.current, key, { upload: 'done', stored }));
          scheduleAutoSave();
        } catch (err) {
          console.warn('Photo upload failed', err);
          if (sessionRef.current === session) {
            commit(updatePhoto(blocksRef.current, key, { upload: 'failed' }));
          }
        }
      })();
      uploadsRef.current.add(task);
      task.finally(() => uploadsRef.current.delete(task));
    },
    [commit, scheduleAutoSave],
  );

  // The one place a draft is written. Callers hold the save slot.
  const write = useCallback(
    async (session: Session, fields: Fields) => {
      const existing = existingPostRef.current;
      const row = existing
        ? await updatePost(existing.id, fields)
        : await createPost({ group_id: session.groupId, author_id: session.userId, ...fields });
      if (sessionRef.current !== session) return;
      existingPostRef.current = row;
      setExistingPost(row);
      savedSnapshotRef.current = snapshotOf(fields);
      dropOrphans(fields.blocks ?? []);
      // The row exists now: photos picked before it can upload.
      if (!existing) {
        photosIn(blocksRef.current)
          .filter((p) => p.upload === 'waiting')
          .forEach((p) => uploadPhoto(p.key));
      }
    },
    [dropOrphans, uploadPhoto],
  );

  const isDirty = useCallback(() => {
    const fields = fieldsNow();
    return fields.body !== '' && snapshotOf(fields) !== savedSnapshotRef.current;
  }, [fieldsNow]);

  const performAutoSave = useCallback(async () => {
    const session = sessionRef.current;
    // Never auto-create or persist a draft without words — a headline or a
    // photo alone isn't a post. Clearing your words won't delete the post
    // either; removing it stays explicit.
    if (!session || !isDirty()) return;
    if (isSavingRef.current) {
      scheduleAutoSave();
      return;
    }
    isSavingRef.current = true;
    setSaveStatus('saving');
    try {
      await write(session, fieldsNow());
      if (sessionRef.current !== session) return;
      setSaveStatus('saved');
      // Caught more typing while the request was out? Go again. (Only on
      // success — a failing save waits for the next edit or File, so a
      // persistent error never becomes a retry storm.)
      if (isDirty()) scheduleAutoSave();
    } catch {
      if (sessionRef.current === session) setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [fieldsNow, isDirty, scheduleAutoSave, write]);

  useEffect(() => {
    autoSaveRef.current = performAutoSave;
  }, [performAutoSave]);

  // Land what's pending before the page changes underneath it (another Group,
  // a refresh, leaving): started uploads finish into the blocks, then one
  // last save. Resolves false if that save failed.
  const flush = useCallback(async (): Promise<boolean> => {
    clearTimer();
    if (uploadsRef.current.size > 0) await Promise.allSettled([...uploadsRef.current]);
    const session = sessionRef.current;
    if (!session || !isDirty()) return true;
    await waitForIdle();
    isSavingRef.current = true;
    try {
      await write(session, fieldsNow());
      return true;
    } catch {
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [clearTimer, fieldsNow, isDirty, waitForIdle, write]);

  const startSession = useCallback(
    (session: Session, post: PostRow | null, focus: boolean) => {
      sessionRef.current = session;
      existingPostRef.current = post;
      setExistingPost(post);
      setOpenedWithPost(post !== null);
      commit(composerBlocksFrom(post));
      titleRef.current = post?.title ?? '';
      setTitleState(titleRef.current);
      knownFilesRef.current = new Map(
        post ? photoBlocksOf(postBlocksOf(post)).map((p) => [p.id, p]) : [],
      );
      // Seed the baseline so opening a post doesn't save it.
      savedSnapshotRef.current = post ? snapshotOf(fieldsNow()) : '';
      setSaveStatus('idle');
      setFiled(false);
      if (focus && !post) setFreshPage((n) => n + 1);
    },
    [commit, fieldsNow],
  );

  // Load this week's post for a Group. A refresh of the same page never
  // throws away words it couldn't save first.
  const load = useCallback(
    async (groupId: string) => {
      if (!user) return;
      // The skeleton covers the page while it settles, so nothing typed now
      // can land on the wrong post.
      setLoading(true);
      const saved = await flush();
      if (!saved && sessionRef.current?.groupId === groupId) {
        setSaveStatus('error');
        setLoading(false);
        return;
      }
      sessionRef.current = null;
      setLoadFailed(false);
      setError('');
      try {
        const post = await fetchCurrentPost(groupId, user.id);
        startSession({ groupId, userId: user.id }, post, true);
      } catch {
        setLoadFailed(true);
        setError(Strings.error.postLoad);
      } finally {
        setLoading(false);
      }
    },
    [flush, startSession, user],
  );

  // Leaving the screen, or the app going to the background: don't let the
  // debounce sit on someone's words.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && saveTimerRef.current) {
        clearTimer();
        autoSaveRef.current();
      }
    });
    return () => {
      sub.remove();
      if (saveTimerRef.current) {
        clearTimer();
        autoSaveRef.current();
      }
    };
  }, [clearTimer]);

  // ── Edits ──────────────────────────────────────────────────────────────

  const edited = useCallback(() => {
    setFiled(false);
    setError('');
    scheduleAutoSave();
  }, [scheduleAutoSave]);

  const setTitle = useCallback(
    (text: string) => {
      titleRef.current = text;
      setTitleState(text);
      edited();
    },
    [edited],
  );

  const setText = useCallback(
    (key: string, text: string) => {
      commit(setPieceText(blocksRef.current, key, text));
      edited();
    },
    [commit, edited],
  );

  // Returns where the cursor should go, or null if nothing went in (the
  // post already has all its photos).
  const insertPhotos = useCallback(
    (at: Caret | null, assets: PickedAsset[]): Caret | null => {
      const room = MAX_POST_PHOTOS - photosIn(blocksRef.current).length;
      const picked = assets.slice(0, Math.max(room, 0)).map(pickedPhoto);
      if (picked.length === 0) return null;
      const result = insertInto(blocksRef.current, at, picked);
      commit(result.blocks);
      picked.forEach((p) => uploadPhoto(p.key));
      edited();
      return result.caret;
    },
    [commit, edited, uploadPhoto],
  );

  const removePhoto = useCallback(
    (photoKey: string, keep: 'above' | 'below'): Caret | null => {
      const result = removeFrom(blocksRef.current, photoKey, keep);
      if (!result) return null;
      commit(result.blocks);
      edited();
      return result.caret;
    },
    [commit, edited],
  );

  const retryPhoto = useCallback((key: string) => uploadPhoto(key), [uploadPhoto]);

  // ── File / remove ──────────────────────────────────────────────────────

  // The explicit "File my story". Doesn't wait on photo uploads: each photo
  // has been uploading since it went in, and any still going join the post
  // on their own (an autosave follows each upload). Resolves to the filed
  // post's id, or null if it wasn't filed.
  const file = useCallback(async (): Promise<string | null> => {
    const session = sessionRef.current;
    if (!session) return null;
    if (fieldsNow().body === '') {
      setError(Strings.compose.needsWords);
      return null;
    }
    clearTimer();
    setError('');
    setFiling(true);
    setSaveStatus('saving');
    await waitForIdle();
    isSavingRef.current = true;
    try {
      await write(session, fieldsNow());
      setSaveStatus('saved');
      setFiled(true);
      return existingPostRef.current?.id ?? null;
    } catch {
      setError(Strings.error.postSave);
      setSaveStatus('error');
      return null;
    } finally {
      isSavingRef.current = false;
      setFiling(false);
    }
  }, [clearTimer, fieldsNow, waitForIdle, write]);

  const removePost = useCallback(async () => {
    const session = sessionRef.current;
    const post = existingPostRef.current;
    if (!session || !post) return;
    clearTimer();
    setError('');
    setDeleting(true);
    await waitForIdle();
    isSavingRef.current = true;
    try {
      await deletePost(post.id);
      const files = [...knownFilesRef.current.values()];
      // A fresh session: uploads still out for the old post clean up after
      // themselves when they land.
      startSession({ ...session }, null, false);
      if (files.length > 0) deletePostPhotoFiles(files).catch(warn('Could not delete photos'));
    } catch {
      setError(Strings.error.postDelete);
    } finally {
      isSavingRef.current = false;
      setDeleting(false);
    }
  }, [clearTimer, startSession, waitForIdle]);

  return {
    loading,
    loadFailed,
    error,
    existingPost,
    openedWithPost,
    blocks,
    title,
    saveStatus,
    filing,
    deleting,
    filed,
    freshPage,
    load,
    setTitle,
    setText,
    insertPhotos,
    removePhoto,
    retryPhoto,
    file,
    removePost,
  };
};

export type ComposerDraft = ReturnType<typeof useComposerDraft>;
