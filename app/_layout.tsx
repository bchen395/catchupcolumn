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
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { needsOnboarding } from '@/lib/auth';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
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

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onOnboardingScreen = inAuthGroup && segments[1] === 'onboarding';
    const requiresOnboarding = needsOnboarding(session?.user);

    if (!session && (!inAuthGroup || onOnboardingScreen)) {
      router.replace('/(auth)/login');
    } else if (session && requiresOnboarding && !onOnboardingScreen) {
      router.replace('/(auth)/onboarding');
    } else if (session && inAuthGroup && (!onOnboardingScreen || !requiresOnboarding)) {
      router.replace('/(tabs)/inbox');
    }
  }, [session, loading, fontsLoaded, segments]);

  if (!fontsLoaded || loading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="group" options={{ headerShown: false }} />
    </Stack>
  );
};

export default RootLayout;
