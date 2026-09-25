// Prepares a post photo the way the app's composer does before upload
// (uploadPostImage + resizeImageForUpload in lib/posts.ts / lib/image.ts):
//
//   * longest edge clamped to 2600px (print size — never upscaled),
//   * one JPEG encode at quality 0.9, always JPEG, always `image.jpg`,
//   * metadata dropped by the re-encode — including GPS, which matters: these
//     files are emailed and printed.
//
// Two things the phone gets for free are done by hand here:
//
//   * EXIF orientation. jimp applies it on read, so a portrait phone photo
//     stays portrait even though the tag that said so is stripped.
//   * The colour profile. iPhone photos are Display P3; dropping the ICC
//     profile would make them render as sRGB, visibly muted. The decoded
//     pixels are still in the source's space, so the source's ICC_PROFILE
//     segments are copied onto the output unchanged.
//
// Not mirrored: the picker's crop step (allowsEditing), and HEIC input, which
// jimp can't decode — the operator converts first (the error says how).

// @ts-types="./jimp.d.ts"
import { Jimp } from 'https://esm.sh/jimp@1.6.1';

import { Refusal } from './args.ts';

// Mirrors POST_IMAGE_MAX_EDGE / POST_IMAGE_QUALITY in lib/posts.ts.
export const POST_IMAGE_MAX_EDGE = 2600;
const POST_IMAGE_QUALITY = 90;
const MAX_INPUT_BYTES = 60 * 1024 * 1024;

export type PreparedPhoto = {
  bytes: Uint8Array;
  width: number;
  height: number;
  source: { format: 'jpeg' | 'png'; width: number; height: number; bytes: number };
  iccProfileCopied: boolean;
};

type Format = 'jpeg' | 'png' | 'heif' | 'unknown';

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const sniff = (b: Uint8Array): Format => {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b.length > 8 && ascii(b, 1, 4) === 'PNG') return 'png';
  if (b.length > 12 && ascii(b, 4, 8) === 'ftyp') return 'heif'; // HEIC, HEIF, AVIF
  return 'unknown';
};

type Segment = { marker: number; start: number; end: number };

/** Marker segments between SOI and the start of scan (the part metadata lives in). */
const headerSegments = (b: Uint8Array): Segment[] => {
  const segments: Segment[] = [];
  let off = 2;
  while (off + 4 <= b.length) {
    if (b[off] !== 0xff) throw new Error('malformed JPEG (expected a marker)');
    let marker = b[off + 1];
    while (marker === 0xff && off + 2 < b.length) {
      off++; // fill byte
      marker = b[off + 1];
    }
    if (marker === 0xda || marker === 0xd9) break; // SOS / EOI
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      off += 2; // standalone markers carry no length
      continue;
    }
    const length = (b[off + 2] << 8) | b[off + 3];
    if (length < 2 || off + 2 + length > b.length) throw new Error('malformed JPEG segment');
    segments.push({ marker, start: off, end: off + 2 + length });
    off += 2 + length;
  }
  return segments;
};

const isIccSegment = (b: Uint8Array, s: Segment) =>
  s.marker === 0xe2 && s.end - s.start > 16 && ascii(b, s.start + 4, s.start + 16) === 'ICC_PROFILE\0';

/** Splice the source's ICC_PROFILE segments in right after SOI (and APP0, if present). */
const withIccProfile = (out: Uint8Array, src: Uint8Array): { bytes: Uint8Array; copied: boolean } => {
  const icc = headerSegments(src).filter((s) => isIccSegment(src, s));
  if (icc.length === 0) return { bytes: out, copied: false };

  const first = headerSegments(out)[0];
  const at = first && first.marker === 0xe0 && first.start === 2 ? first.end : 2;
  const size = icc.reduce((n, s) => n + (s.end - s.start), 0);
  const bytes = new Uint8Array(out.length + size);
  bytes.set(out.subarray(0, at), 0);
  let off = at;
  for (const s of icc) {
    bytes.set(src.subarray(s.start, s.end), off);
    off += s.end - s.start;
  }
  bytes.set(out.subarray(at), off);
  return { bytes, copied: true };
};

/** Fail closed: nothing that can carry EXIF/GPS/XMP/IPTC may reach storage. */
const assertNoMetadata = (b: Uint8Array): void => {
  const leaked = headerSegments(b).filter((s) => s.marker === 0xe1 || s.marker === 0xed);
  if (leaked.length > 0) {
    throw new Error('photo still carries EXIF/XMP/IPTC metadata after re-encoding — refusing to upload');
  }
};

export const preparePostPhoto = async (path: string): Promise<PreparedPhoto> => {
  let src: Uint8Array;
  try {
    src = await Deno.readFile(path);
  } catch (err) {
    throw new Refusal(`can't read --photo ${path}: ${err instanceof Error ? err.message : err}`);
  }
  if (src.length > MAX_INPUT_BYTES) throw new Refusal(`--photo ${path} is over 60 MB`);

  const format = sniff(src);
  if (format === 'heif') {
    throw new Refusal(
      `--photo ${path} is HEIC/HEIF, which this script can't decode. Convert it to JPEG ` +
        `first — on a Mac: sips -s format jpeg -s formatOptions best "${path}" --out photo.jpg ` +
        '(orientation and location tags survive that step; this script applies the first and strips the second)',
    );
  }
  if (format === 'unknown') throw new Refusal(`--photo ${path} is not a JPEG or PNG`);

  const image = await Jimp.read(src.slice().buffer);
  const source = { format, width: image.bitmap.width, height: image.bitmap.height, bytes: src.length };

  const longest = Math.max(source.width, source.height);
  if (longest > POST_IMAGE_MAX_EDGE) {
    const scale = POST_IMAGE_MAX_EDGE / longest;
    // No `mode`: jimp's default resizer area-averages when shrinking, which is
    // what a downscale for print wants (point-sampled modes alias).
    image.resize({
      w: Math.round(source.width * scale),
      h: Math.round(source.height * scale),
    });
  }

  const encoded = new Uint8Array(await image.getBuffer('image/jpeg', { quality: POST_IMAGE_QUALITY }));
  const { bytes, copied } =
    format === 'jpeg' ? withIccProfile(encoded, src) : { bytes: encoded, copied: false };
  assertNoMetadata(bytes);

  return {
    bytes,
    width: image.bitmap.width,
    height: image.bitmap.height,
    source,
    iccProfileCopied: copied,
  };
};

/** "2600×1950 JPEG, 412 KB (from a 4032×3024 JPEG, 3.1 MB; colour profile kept)" */
export const describePhoto = (p: PreparedPhoto): string => {
  const size = (n: number) =>
    n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;
  return (
    `${p.width}×${p.height} JPEG, ${size(p.bytes.length)} ` +
    `(from a ${p.source.width}×${p.source.height} ${p.source.format.toUpperCase()}, ${size(p.source.bytes)}` +
    `${p.iccProfileCopied ? '; colour profile kept' : ''}; metadata stripped)`
  );
};
