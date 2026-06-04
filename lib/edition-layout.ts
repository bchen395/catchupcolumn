// Front-page layout for an edition.
//
// An edition has no human editor, so the "lead story" is chosen by rule:
// MOST VISUAL WINS — a post with a photo leads; among several photo posts the
// longest one leads; with no photos at all, the longest post leads. Everyone
// else becomes a "brief" in the order they were written. The same ordering
// (lead first, then briefs) drives Next/Previous on the story reader so the
// front page and the reader agree on sequence.

// Structural minimum the layout needs — satisfied by PostWithAuthor and by the
// trimmed post shape nested into the inbox query.
export type LeadPostLike = {
  title: string | null;
  body: string;
  image_url: string | null;
  author: { display_name: string };
};

export type EditionOrder<T extends LeadPostLike> = {
  lead: T | null;
  briefs: T[];
  // Lead first, then briefs — the canonical reading sequence.
  ordered: T[];
};

export const orderEdition = <T extends LeadPostLike>(posts: T[]): EditionOrder<T> => {
  if (posts.length === 0) {
    return { lead: null, briefs: [], ordered: [] };
  }

  // Prefer photo posts for the lead; fall back to the whole set when none have
  // a photo. Within the pool, the longest body wins — the meatiest read.
  const photoPosts = posts.filter((p) => !!p.image_url);
  const pool = photoPosts.length > 0 ? photoPosts : posts;
  const lead = pool.reduce((best, p) => (p.body.length > best.body.length ? p : best), pool[0]);

  const briefs = posts.filter((p) => p !== lead);
  return { lead, briefs, ordered: [lead, ...briefs] };
};

// First name only — warmer and fits a headline better than the full name.
export const firstName = (displayName: string): string => {
  const trimmed = displayName.trim();
  if (!trimmed) return 'a member';
  return trimmed.split(/\s+/)[0];
};

// The headline for a post: its title if the author wrote one, otherwise a warm
// byline-style fallback ("From Ruth").
export const headlineFor = (post: LeadPostLike): string => {
  const title = post.title?.trim();
  if (title) return title;
  return `From ${firstName(post.author.display_name)}`;
};

// A short deck/excerpt for the cover. Collapses whitespace, then trims to a
// word boundary near `maxChars` and adds an ellipsis when it had to cut.
export const deckFor = (post: LeadPostLike, maxChars = 140): string => {
  const text = post.body.replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > maxChars * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
};
