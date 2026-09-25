// The slice of jimp's API that photo.ts uses.
//
// jimp's own declarations pull in `@types/node`, which `deno check` can only
// resolve from a node_modules directory — and CI's Deno job (like a fresh
// worktree) has none. Declaring the four members used here keeps the check
// self-contained. If photo.ts starts using more of jimp, add it here.

export interface JimpImage {
  bitmap: { width: number; height: number };
  resize(options: { w: number; h: number }): JimpImage;
  getBuffer(mime: 'image/jpeg', options: { quality: number }): Promise<Uint8Array>;
}

export declare const Jimp: {
  /** Decodes JPEG/PNG and applies EXIF orientation. */
  read(data: ArrayBuffer): Promise<JimpImage>;
};
