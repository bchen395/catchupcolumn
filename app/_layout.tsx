import 'react-native-url-polyfill/auto';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { PrintingPressLoading } from '@/components/printing-press-loading';
import { useAuth } from '@/hooks/use-auth';
import { needsOnboarding } from '@/lib/auth';

export { ErrorBoundary } from 'expo-router';

// Start the navigator on the auth stack so the tab tree (and its data
// fetches) doesn't briefly mount against an unauthenticated client during
// cold start. The redirect effect below moves signed-in users to /(tabs).
export const unstable_settings = {
  initialRouteName: '(auth)/login',
};

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  // Deep-link push-notification taps to the edition reading view.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { edition_id?: string }
        | undefined;
      if (data?.edition_id) {
        router.push(`/edition/${data.edition_id}`);
      }
    });
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onOnboardingScreen = inAuthGroup && segments[1] === 'onboarding';
    const onResetPasswordScreen = inAuthGroup && (segments[1] as string) === 'reset-password';
    const requiresOnboarding = needsOnboarding(session?.user);

    if (onResetPasswordScreen) return;

    if (!session && (!inAuthGroup || onOnboardingScreen)) {
      router.replace('/(auth)/login');
    } else if (session && requiresOnboarding && !onOnboardingScreen) {
      router.replace('/(auth)/onboarding');
    } else if (session && inAuthGroup && (!onOnboardingScreen || !requiresOnboarding)) {
      router.replace('/(tabs)/inbox');
    }
  }, [session, loading, fontsLoaded, segments]);

  if (!fontsLoaded || loading) {
    // Fonts not ready → render nothing to avoid FOUC. Once fonts are loaded
    // but auth is still resolving, show the press animation.
    return fontsLoaded ? <PrintingPressLoading /> : null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="group" options={{ headerShown: false }} />
      <Stack.Screen name="edition" options={{ headerShown: false }} />
    </Stack>
  );
};

export default RootLayout;
