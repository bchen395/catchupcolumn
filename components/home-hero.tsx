import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { displayRatioFor, useImageOrientation } from '@/hooks/use-image-orientation';
import { deckFor, firstName, headlineFor, orderEdition } from '@/lib/edition-layout';
import type { EditionListItem } from '@/lib/editions';

import { AppImage } from './app-image';
import { EditorialPhoto } from './editorial-photo';
import { PaperboyMailboxScene } from './illustrations/paperboy-mailbox-scene';
import { ThemedText } from './themed-text';

const formatWeekOf = (publishedAt: string, timezone?: string | null): string => {
  const tz = timezone || undefined;
  const end = new Date(publishedAt);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const startMonth = start.toLocaleDateString('en-US', { timeZone: tz, month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { timeZone: tz, month: 'long' });
  const startDay = start.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
  const endDay = end.toLocaleDateString('en-US', { timeZone: tz, day: 'numeric' });
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
};

type HomeHeroProps = {
  edition: EditionListItem;
  isNew: boolean;
  onPress: () => void;
};

// Home's hero — the latest edition as a miniature front page (BRAND §8).
// The lead STORY leads: its photo is the hero image (fresh every week, where
// the old group cover went invisible by week three), its headline is the
// headline, and the group name demotes to the folio line. Falls back to the
// group cover, then to a type-only front — the rule/kicker/headline frame
// carries the block even with no photo at all.
export const HomeHero = ({ edition, isNew, onPress }: HomeHeroProps) => {
  const lead = orderEdition(edition.posts ?? []).lead;
  const { orientation, onNaturalSize } = useImageOrientation(lead?.image_url);
  const headline = lead ? headlineFor(lead) : edition.group.name;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open the latest ${edition.group.name} edition. ${headline}.`}
      style={({ pressed }) => [styles.block, pressed && styles.pressed]}
    >
      <View style={styles.rule} />
      <View style={styles.kickerRow}>
        <ThemedText variant="kicker">{Strings.home.kicker}</ThemedText>
        {isNew ? (
          // The NEW pill — a sanctioned vermilion live-moment (BRAND §2),
          // outlined per §9's chip rule, never filled.
          <View style={styles.newFlag}>
            <ThemedText style={styles.newFlagText}>{Strings.thisWeek.newFlag}</ThemedText>
          </View>
        ) : null}
      </View>
      {lead?.image_url ? (
        // Landscape keeps the 4:3 plate; portrait/square crop to 1:1 so the
        // hero stays a front page, not a poster (a full-width 4:5 would push
        // everything else below the fold).
        <EditorialPhoto
          imageUrl={lead.image_url}
          photoAspectRatio={orientation === 'landscape' ? displayRatioFor('landscape') : 1}
          onNaturalSize={onNaturalSize}
          credit={`Photo by ${firstName(lead.author.display_name)}`}
        />
      ) : edition.group.cover_image_url ? (
        <AppImage source={{ uri: edition.group.cover_image_url }} style={styles.coverImage} />
      ) : null}
      <ThemedText variant="title" numberOfLines={2}>
        {headline}
      </ThemedText>
      {lead ? (
        <ThemedText variant="deck" numberOfLines={2} maxFontSizeMultiplier={1.6}>
          {deckFor(lead, 120)}
        </ThemedText>
      ) : null}
      <ThemedText variant="meta" numberOfLines={2}>
        {Strings.home.folio(
          edition.group.name,
          formatWeekOf(edition.published_at, edition.group.timezone),
          (edition.posts ?? []).length,
        )}
      </ThemedText>
    </Pressable>
  );
};

// The hero slot before any edition exists — a coming-soon front page for the
// first week. This is the one sanctioned illustration hero: there are no
// family photos yet, so the slot is still chrome (BRAND §4). Not pressable;
// the write block below is the action.
export const FirstEditionHero = () => (
  <View style={styles.block}>
    <View style={styles.rule} />
    <ThemedText variant="kicker">{Strings.home.firstEdition.kicker}</ThemedText>
    <View style={styles.sceneWrap}>
      <PaperboyMailboxScene width={180} />
    </View>
    <ThemedText variant="title">{Strings.home.firstEdition.headline}</ThemedText>
    <ThemedText variant="deck">{Strings.home.firstEdition.deck}</ThemedText>
  </View>
);

const styles = StyleSheet.create({
  block: {
    gap: Layout.padding.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  // Section-opening rule (BRAND §2) — the hero announces itself the way a
  // section front does.
  rule: {
    height: Layout.rule.heavy,
    backgroundColor: Colors.ink,
    marginBottom: Layout.padding.xs,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.padding.sm,
  },
  newFlag: {
    borderWidth: 1,
    borderColor: Colors.vermilion,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Layout.padding.sm,
    paddingVertical: 2,
  },
  newFlagText: {
    ...Typography.scale.meta,
    color: Colors.vermilion,
  },
  // Group-cover fallback keeps the old flat 16:9 plate.
  coverImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: Layout.rule.hairline,
    borderColor: Colors.hairline,
    marginTop: Layout.padding.xs,
  },
  sceneWrap: {
    alignItems: 'center',
    paddingVertical: Layout.padding.sm,
  },
});
