import { Strings } from '@/constants/strings';
import type { SaveStatus } from '@/hooks/use-composer-draft';
import { photosIn, textPiecesIn, type ComposerBlock } from '@/lib/composer-blocks';

export type ComposerStatus = { text: string; tone: 'quiet' | 'error'; settle: boolean };

// The action bar's one status line — reassurance, not a quota. The bar is
// pinned in both keyboard states and never scrolls away, so this line is the
// only save status the screen needs. Most important first: a failed save, a
// photo that didn't upload, photos waiting on words, uploads, an autosave in
// flight, the settled "Filed for …" (held until the next edit), then "Saved".
export const composerStatus = ({
  blocks,
  saveStatus,
  filed,
  dayLabel,
}: {
  blocks: ComposerBlock[];
  saveStatus: SaveStatus;
  filed: boolean;
  dayLabel: string | null;
}): ComposerStatus => {
  const quiet = (text: string, settle = false): ComposerStatus => ({ text, tone: 'quiet', settle });
  const photos = photosIn(blocks);
  const uploading = photos.filter((p) => p.upload === 'uploading').length;
  const wordless = textPiecesIn(blocks).every((p) => p.text.trim() === '');

  if (saveStatus === 'error') return { text: Strings.compose.autosaveError, tone: 'error', settle: false };
  if (photos.some((p) => p.upload === 'failed')) {
    return { text: Strings.compose.photoFailedStatus, tone: 'error', settle: false };
  }
  if (wordless && photos.some((p) => p.upload === 'waiting')) return quiet(Strings.compose.photosWaitForWords);
  if (uploading > 0) return quiet(Strings.compose.uploadingPhotos(uploading));
  if (saveStatus === 'saving') return quiet(Strings.compose.saving);
  if (filed && dayLabel) return quiet(Strings.thisWeek.filedStamp(dayLabel), true);
  if (saveStatus === 'saved') return quiet(Strings.compose.saved);
  return quiet('');
};
