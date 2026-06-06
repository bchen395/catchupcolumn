// Front-page layout for an edition.
//
// An edition has no human editor, so the front page is assembled by rule:
// MOST VISUAL WINS — a post with a photo leads; among several photo posts the
// longest one leads; with no photos at all, the longest post leads. The same
// rule then picks a SECONDARY story from the remainder (photo preferred,
// longest body wins), and everyone else becomes an "in brief" item in the
// order they were written. Pulling the most-visual second story up to
// position 2 means `ordered` can differ from written order — intentional:
// Next/Previous on the story reader follows the same visual priority the
// front page shows, so the two always agree on sequence.

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
  // The second-most-visual story — gets its own prominent slot on the cover.
  secondary: T | null;
  briefs: T[];
  // Lead, then secondary, then briefs — the canonical reading sequence.
  ordered: T[];
};

// Most-visual-wins pick: prefer photo posts, fall back to the whole set when
// none have a photo. Within the pool, the longest body wins — the meatiest
// read. Strict `>` keeps the earlier-written post on ties.
const mostVisual = <T extends LeadPostLike>(posts: T[]): T => {
  const photoPosts = posts.filter((p) => !!p.image_url);
  const pool = photoPosts.length > 0 ? photoPosts : posts;
  return pool.reduce((best, p) => (p.body.length > best.body.length ? p : best), pool[0]);
};

export const orderEdition = <T extends LeadPostLike>(posts: T[]): EditionOrder<T> => {
  if (posts.length === 0) {
    return { lead: null, secondary: null, briefs: [], ordered: [] };
  }

  const lead = mostVisual(posts);
  const rest = posts.filter((p) => p !== lead);
  const secondary = rest.length > 0 ? mostVisual(rest) : null;

  const briefs = rest.filter((p) => p !== secondary);
  const ordered = secondary ? [lead, secondary, ...briefs] : [lead];
  return { lead, secondary, briefs, ordered };
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
