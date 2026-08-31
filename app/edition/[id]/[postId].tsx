import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/error-state';
import { StorySkeleton } from '@/components/skeletons/story-skeleton';
import { StoryReader } from '@/components/story-reader';
import { Colors } from '@/constants/colors';
import { Icons } from '@/constants/icons';
import { Strings } from '@/constants/strings';
import { Typography } from '@/constants/typography';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { orderEdition } from '@/lib/edition-layout';
import { fetchEditionWithPosts } from '@/lib/editions';
import type { PostWithAuthor } from '@/types';

// Route shell for the story reader. The front page normally opens stories in
// the animated enlarge overlay; this route remains the deep-link target and
// the Reduce Motion path. It fetches the edition, orders it, and hands the
// posts to the shared StoryReader, providing the native header as chrome.
const StoryReaderScreen = () => {
  const { id, postId } = useLocalSearchParams<{ id: string; postId: string }>();
  const router = useRouter();
  const reduceMotion = useReduceMotion();

  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [start, setStart] = useState(0);
  const [headerIndex, setHeaderIndex] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [screenError, setScreenError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const edition = await fetchEditionWithPosts(id);
      const ordered = orderEdition(edition.posts).ordered;
      setPosts(ordered);
      const found = ordered.findIndex((p) => p.id === postId);
      const initial = found >= 0 ? found : 0;
      setStart(initial);
      setHeaderIndex(initial);
      setScreenError('');
    } catch (_err) {
      setScreenError(Strings.error.editionLoad);
    }
  }, [id, postId]);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    load().finally(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!hydrated) {
    return <StorySkeleton />;
  }

  if (posts.length === 0) {
    return (
      <ErrorState
        icon={Icons.errorGeneric}
        title={Strings.error.generic.title}
        body={screenError || 'Story not found.'}
        onRetry={() => {
          setHydrated(false);
          load().finally(() => setHydrated(true));
        }}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <Stack.Screen
        options={{
          // Uppercased by hand — the native header can't apply the meta
          // variant's textTransform.
          title: `${headerIndex + 1} of ${posts.length}`.toUpperCase(),
          headerStyle: { backgroundColor: Colors.paperWarm },
          headerShadowVisible: false,
          headerTintColor: Colors.ink,
          headerTitleStyle: {
            fontFamily: Typography.families.sansSemiBold,
            color: Colors.inkSoft,
            fontSize: Typography.scale.meta.fontSize,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Back to the front page"
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={22} color={Colors.ink} />
            </Pressable>
          ),
        }}
      />

      <StoryReader
        key={`${start}-${posts.length}`}
        posts={posts}
        initialIndex={start}
        onExit={() => router.back()}
        reduceMotion={reduceMotion}
        onIndexChange={setHeaderIndex}
      />
    </View>
  );
};

export default StoryReaderScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.paperWarm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
