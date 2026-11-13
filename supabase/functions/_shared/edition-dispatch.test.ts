// deno test --allow-env --allow-net=esm.sh supabase/functions/_shared/edition-dispatch.test.ts
//
// safeAvatarUrl: the edition email prints only avatars from this project's
// public `avatars` bucket. SUPABASE_URL is read when the module loads, so it
// is set before the dynamic import.

Deno.env.set('SUPABASE_URL', 'https://abc.supabase.co');
const { safeAvatarUrl } = await import('./edition-dispatch.ts');

const assertEquals = (actual: unknown, expected: unknown) => {
  if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`);
};

const BUCKET = 'https://abc.supabase.co/storage/v1/object/public/avatars/';

Deno.test('keeps an avatar from the project bucket, unchanged', () => {
  const url = `${BUCKET}0b6f2c1e-0000-4000-8000-000000000000/avatar-1730000000000.jpg`;
  assertEquals(safeAvatarUrl(url), url);
});

Deno.test('drops null, empty and unparseable values', () => {
  assertEquals(safeAvatarUrl(null), null);
  assertEquals(safeAvatarUrl(''), null);
  assertEquals(safeAvatarUrl('not a url'), null);
});

Deno.test('drops another host, even one that starts like ours', () => {
  assertEquals(safeAvatarUrl('https://tracker.example/pixel.gif'), null);
  assertEquals(safeAvatarUrl('https://abc.supabase.co.tracker.example/storage/v1/object/public/avatars/x.jpg'), null);
  assertEquals(safeAvatarUrl('https://evil.supabase.co/storage/v1/object/public/avatars/x.jpg'), null);
  assertEquals(safeAvatarUrl('http://abc.supabase.co/storage/v1/object/public/avatars/x.jpg'), null);
  assertEquals(safeAvatarUrl('https://abc.supabase.co@tracker.example/storage/v1/object/public/avatars/x.jpg'), null);
});

Deno.test('drops another bucket or a path that climbs out of avatars', () => {
  assertEquals(safeAvatarUrl('https://abc.supabase.co/storage/v1/object/public/group-covers/x.jpg'), null);
  assertEquals(safeAvatarUrl(`${BUCKET}../post-images/x.jpg`), null);
  assertEquals(safeAvatarUrl(`${BUCKET}%2e%2e/post-images/x.jpg`), null);
});
