import type { Href, ImperativeRouter } from 'expo-router';

// Back that never dead-ends. A screen a link can open may be the only screen
// in the stack: an invite's auto-join replaces the auth screens with the Group,
// and an edition email's link can open the app cold on the edition. There,
// router.back() does nothing and the back button looks broken. So when there's
// nothing to pop, go where back would have led — the tab the screen belongs
// to, or a story's front page. Replace rather than push, so the stranded
// screen doesn't stay underneath.
export const goBackOr = (router: ImperativeRouter, fallback: Href) => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
};
