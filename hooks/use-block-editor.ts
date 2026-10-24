import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  AccessibilityInfo,
  PixelRatio,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type TextInput,
  type View,
} from 'react-native';

import { Strings } from '@/constants/strings';
import type { ComposerDraft, PickedAsset } from '@/hooks/use-composer-draft';
import {
  backspaceAtStart,
  photoPosition,
  textPiecesIn,
  type Caret,
  type ComposerBlock,
} from '@/lib/composer-blocks';

// The writing's line height (components/composer/composer-text-piece.tsx);
// the cursor-visibility estimate below counts in lines of it.
export const WRITING_LINE_HEIGHT = 30;

// A held key repeats faster than this; a fresh press comes slower. Only a
// fresh press may remove a photo (lib/composer-blocks.ts → backspaceAtStart).
const KEY_REPEAT_MS = 180;
// Room kept between the cursor and the edges of the visible page.
const CARET_MARGIN = 24;
// Long enough for the keyboard (and the bar riding it) to finish moving.
const REVEAL_DELAY_MS = 280;

type Selection = { start: number; end: number };
const NO_SELECTION: Selection = { start: -1, end: -1 };

type Args = {
  draft: Pick<
    ComposerDraft,
    'blocks' | 'freshPage' | 'loading' | 'setText' | 'insertPhotos' | 'removePhoto'
  >;
  // The visible page area (the ScrollView's wrapper) and the ScrollView.
  viewportRef: RefObject<View | null>;
  scrollRef: RefObject<ScrollView | null>;
  keyboardInset: number;
};

const lastTextPiece = (blocks: ComposerBlock[]) => {
  const pieces = textPiecesIn(blocks);
  return pieces[pieces.length - 1];
};

/**
 * The page's editing behaviour, apart from what gets saved: which piece has
 * the cursor and where, moving the cursor after a photo goes in or comes out,
 * backspace selecting the photo above, tap-to-select, and keeping the cursor
 * in view above the keyboard and the action bar.
 */
export const useBlockEditor = ({ draft, viewportRef, scrollRef, keyboardInset }: Args) => {
  const { blocks } = draft;
  const inputs = useRef(new Map<string, TextInput>());
  const selections = useRef(new Map<string, Selection>());
  const focusedKey = useRef<string | null>(null);
  const pendingCaret = useRef<Caret | null>(null);
  const lastBackspaceAt = useRef(0);
  const scrollY = useRef(0);
  const blocksRef = useRef(blocks);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [caretTick, setCaretTick] = useState(0);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Scroll just enough that the cursor's line clears the top of the page
  // area and the bar at its foot. RN can't report the cursor's position, so
  // it's estimated from how far into its piece the cursor sits — exact at
  // either end of a piece, which is where a cursor usually is.
  const reveal = useCallback(
    (key?: string | null) => {
      const target = key ?? focusedKey.current;
      const input = target ? inputs.current.get(target) : undefined;
      const viewport = viewportRef.current;
      const scroll = scrollRef.current;
      if (!target || !input || !viewport || !scroll) return;
      const piece = blocksRef.current.find((b) => b.key === target);
      const length = piece?.kind === 'text' ? piece.text.length : 0;
      const caret = selections.current.get(target)?.end ?? length;
      const line = WRITING_LINE_HEIGHT * PixelRatio.getFontScale();

      viewport.measureInWindow((_vx, viewTop, _vw, viewHeight) => {
        input.measureInWindow((_ix, inputTop, _iw, inputHeight) => {
          const share = length > 0 ? Math.min(Math.max(caret, 0) / length, 1) : 0;
          const caretBottom =
            inputTop + Math.min(inputHeight, line + Math.max(inputHeight - line, 0) * share);
          const top = viewTop + CARET_MARGIN;
          const bottom = viewTop + viewHeight - CARET_MARGIN;
          let delta = 0;
          if (caretBottom > bottom) delta = caretBottom - bottom;
          else if (caretBottom - line < top) delta = caretBottom - line - top;
          if (Math.abs(delta) > 1) {
            scroll.scrollTo({ y: Math.max(0, scrollY.current + delta), animated: true });
          }
        });
      });
    },
    [scrollRef, viewportRef],
  );

  // Put the cursor where a pending caret says, once its piece is mounted.
  const applyCaret = useCallback(() => {
    const caret = pendingCaret.current;
    const input = caret ? inputs.current.get(caret.key) : undefined;
    if (!caret || !input) return;
    pendingCaret.current = null;
    selections.current.set(caret.key, { start: caret.position, end: caret.position });
    input.focus();
    input.setSelection(caret.position, caret.position);
    setTimeout(() => reveal(caret.key), REVEAL_DELAY_MS);
  }, [reveal]);

  const placeCaret = (caret: Caret) => {
    pendingCaret.current = caret;
    setCaretTick((n) => n + 1);
  };

  useEffect(() => {
    applyCaret();
  }, [applyCaret, caretTick, blocks, draft.loading]);

  // A blank page opens with the cursor in the writing, not the headline.
  useEffect(() => {
    if (draft.freshPage === 0) return;
    const first = textPiecesIn(blocksRef.current)[0];
    if (!first) return;
    pendingCaret.current = { key: first.key, position: 0 };
    applyCaret();
  }, [applyCaret, draft.freshPage]);

  // The keyboard (and the bar on it) just came up over the page.
  useEffect(() => {
    if (keyboardInset <= 0) return;
    const timer = setTimeout(() => reveal(), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [keyboardInset, reveal]);

  const registerInput = useCallback((key: string, input: TextInput | null) => {
    if (input) inputs.current.set(key, input);
    else inputs.current.delete(key);
  }, []);

  const onFocus = useCallback((key: string) => {
    focusedKey.current = key;
  }, []);

  const onBlur = useCallback((key: string) => {
    if (focusedKey.current === key) focusedKey.current = null;
  }, []);

  // The selected photo stays selected only while the cursor waits at the
  // very start of the piece just below it.
  const selected = blocks.some((b) => b.key === selectedPhoto) ? selectedPhoto : null;
  const belowSelected = selected ? blocks[blocks.findIndex((b) => b.key === selected) + 1]?.key : null;

  const onSelectionChange = (key: string, selection: Selection) => {
    selections.current.set(key, selection);
    const stillAtPhoto = key === belowSelected && selection.start === 0 && selection.end === 0;
    if (selected && !stillAtPhoto) setSelectedPhoto(null);
  };

  const onChangeText = (key: string, text: string) => {
    if (selected) setSelectedPhoto(null);
    draft.setText(key, text);
  };

  const onContentSizeChange = (key: string) => {
    if (key === focusedKey.current) reveal(key);
  };

  const removePhoto = (photoKey: string) => {
    const index = blocks.findIndex((b) => b.key === photoKey);
    const focused = focusedKey.current;
    // Keep whichever neighbouring piece holds the cursor mounted.
    const keep = focused && blocks[index - 1]?.key === focused ? 'above' : 'below';
    const caret = draft.removePhoto(photoKey, keep);
    setSelectedPhoto(null);
    AccessibilityInfo.announceForAccessibility(Strings.compose.a11yPhotoRemoved);
    // With the keyboard up the cursor moves to the join; with it down the
    // page just closes up — no keyboard by surprise.
    if (caret && focused) placeCaret(caret);
  };

  const onKeyPress = (key: string, keyName: string) => {
    if (keyName !== 'Backspace') {
      if (selected) setSelectedPhoto(null);
      return;
    }
    const now = Date.now();
    const repeat = now - lastBackspaceAt.current < KEY_REPEAT_MS;
    lastBackspaceAt.current = now;
    const result = backspaceAtStart(
      blocks,
      key,
      selections.current.get(key) ?? NO_SELECTION,
      selected,
      repeat,
    );
    if (result.action === 'none') {
      if (selected) setSelectedPhoto(null);
    } else if (result.action === 'remove') {
      removePhoto(result.photo.key);
    } else if (result.photo.key !== selected) {
      setSelectedPhoto(result.photo.key);
      const { number, total } = photoPosition(blocks, result.photo.key);
      AccessibilityInfo.announceForAccessibility(Strings.compose.a11yPhotoSelected(number, total));
    }
  };

  const onPressPhoto = (photoKey: string) => {
    setSelectedPhoto(selected === photoKey ? null : photoKey);
  };

  // Where "Add a photo" will put photos: the cursor's piece and offset, or
  // null (the end) when no piece is focused. Read before the picker opens —
  // it can take the focus away.
  const captureCaret = (): Caret | null => {
    const key = focusedKey.current;
    if (!key) return null;
    const selection = selections.current.get(key);
    const piece = blocks.find((b) => b.key === key);
    const fallback = piece?.kind === 'text' ? piece.text.length : 0;
    return { key, position: selection && selection.start >= 0 ? selection.start : fallback };
  };

  const insertPhotos = (at: Caret | null, assets: PickedAsset[]) => {
    const caret = draft.insertPhotos(at, assets);
    setSelectedPhoto(null);
    if (caret) placeCaret(caret);
  };

  // Tapping blank paper: the cursor goes to the end of the writing.
  const focusEnd = () => {
    const last = lastTextPiece(blocks);
    if (last) placeCaret({ key: last.key, position: last.text.length });
  };

  // Return in the headline continues into the writing.
  const focusStart = () => {
    const first = textPiecesIn(blocks)[0];
    if (first) placeCaret({ key: first.key, position: 0 });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  };

  return {
    selectedPhoto: selected,
    registerInput,
    onFocus,
    onBlur,
    onSelectionChange,
    onChangeText,
    onKeyPress,
    onContentSizeChange,
    onPressPhoto,
    removePhoto,
    captureCaret,
    insertPhotos,
    focusEnd,
    focusStart,
    onScroll,
  };
};

export type BlockEditor = ReturnType<typeof useBlockEditor>;
