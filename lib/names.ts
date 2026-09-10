// Display-name formatting shared by every surface that renders a person.
//
// This exists because `getInitials` was independently reimplemented in
// `avatar`, `avatar-picker`, and the profile screen, and the three drifted:
// only one of them had the emoji fix below. One copy, one behaviour.

/**
 * Up to two initials for an avatar chip — "Ruth Ellis" → "RE".
 *
 * Spreads each word to code points before taking the first character, so a
 * name that starts with an emoji or any other astral character ("🌸 Rose",
 * "李 Wei") yields that whole character instead of a broken surrogate half.
 *
 * `fallback` is returned for an empty/missing name; callers that render a
 * standalone chip pass a placeholder ("CU"), callers that render initials
 * inside other chrome pass nothing and get an empty string.
 */
export const getInitials = (value: string | null | undefined, fallback = ''): string => {
  const parts = (value ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return fallback;
  }

  const initials = parts.map((part) => [...part][0]?.toUpperCase() ?? '').join('');
  return initials || fallback;
};
