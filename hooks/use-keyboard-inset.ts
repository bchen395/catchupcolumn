import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import {
  Dimensions,
  Keyboard,
  LayoutAnimation,
  Platform,
  type KeyboardEvent,
  type View,
} from 'react-native';

/**
 * How much of a view the software keyboard covers — so a screen can end its
 * content, and pin a bar, right on top of the keyboard.
 *
 * Measured against the view's real place in the window rather than a guessed
 * header height (what `KeyboardAvoidingView`'s `keyboardVerticalOffset`
 * needs), so it stays right whether or not a tab bar sits under the view, and
 * on Android whether the window resizes for the keyboard or not. Moves with
 * the keyboard's own animation, like `KeyboardAvoidingView` does.
 *
 * Pass the ref of the view that should end at the keyboard, attach `onLayout`
 * to that view, and pad its bottom by `inset`.
 */
export const useKeyboardInset = (viewRef: RefObject<View | null>) => {
  const eventRef = useRef<KeyboardEvent | null>(null);
  const insetRef = useRef(0);
  const [inset, setInset] = useState(0);

  const apply = useCallback((next: number, event: KeyboardEvent | null) => {
    if (next === insetRef.current) return;
    insetRef.current = next;
    if (event?.duration) {
      const duration = Math.max(event.duration, 10);
      LayoutAnimation.configureNext({
        duration,
        update: { duration, type: LayoutAnimation.Types[event.easing] ?? LayoutAnimation.Types.keyboard },
      });
    }
    setInset(next);
  }, []);

  const measure = useCallback(() => {
    const event = eventRef.current;
    const view = viewRef.current;
    if (!event || !view) {
      apply(0, null);
      return;
    }
    const { screenY, height } = event.endCoordinates;
    // With "Prefer Cross-Fade Transitions" iOS reports a zero origin; the
    // keyboard still rises from the bottom edge.
    const keyboardTop = screenY > 0 ? screenY : Dimensions.get('window').height - height;
    view.measureInWindow((_x, y, _width, viewHeight) => {
      apply(Math.max(0, Math.round(y + viewHeight - keyboardTop)), event);
    });
  }, [apply, viewRef]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      eventRef.current = event;
      measure();
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (event) => {
      eventRef.current = null;
      apply(0, event);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [apply, measure]);

  // Re-measure when the view itself moves or resizes under a raised keyboard.
  return { inset, onLayout: measure };
};
