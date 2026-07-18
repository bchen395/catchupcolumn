import 'react-native-url-polyfill/auto';

import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
  Jost_700Bold,
} from '@expo-google-fonts/jost';
import {
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
  Lora_700Bold,
} from '@expo-google-fonts/lora';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { PrintingPressLoading } from '@/components/printing-press-loading';
import { useAuth } from '@/hooks/use-auth';
import { useAutoJoinInvite } from '@/hooks/use-auto-join-invite';
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
  // Lora + Jost load on every platform (BRAND §3 — one metric reality; the
  // v1 iOS Superclarendon/Futura split is retired).
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
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

  const ready = fontsLoaded && !loading;
  const requiresOnboarding = needsOnboarding(session?.user);

  // Consumes a pending invite (saved by the join screen before signup) once
  // the user is signed in and onboarded; owns navigation while it runs.
  const { consumingInvite, holdAuthRedirect } = useAutoJoinInvite(
    session,
    requiresOnboarding,
    ready,
  );

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === '(auth)';
    const onOnboardingScreen = inAuthGroup && segments[1] === 'onboarding';
    const onResetPasswordScreen = inAuthGroup && (segments[1] as string) === 'reset-password';
    // The join screen is the invite-link landing page — it must work without
    // a session so a logged-out invitee can see what they were invited to.
    const onJoinScreen = segments[0] === 'group' && (segments[1] as string) === 'join';

    if (onResetPasswordScreen) return;

    if (!session && (!inAuthGroup || onOnboardingScreen) && !onJoinScreen) {
      router.replace('/(auth)/login');
    } else if (session && requiresOnboarding && !onOnboardingScreen) {
      router.replace('/(auth)/onboarding');
    } else if (
      session &&
      inAuthGroup &&
      (!onOnboardingScreen || !requiresOnboarding) &&
      // holdAuthRedirect covers the async gap while the pending-invite check
      // runs — redirecting home here would race the auto-join navigation.
      !holdAuthRedirect
    ) {
      router.replace('/(tabs)/home');
    }
  }, [session, ready, requiresOnboarding, holdAuthRedirect, segments]);

  if (!ready) {
    // Fonts not ready → render nothing to avoid FOUC. Once fonts are loaded
    // but auth is still resolving, show the press animation.
    return fontsLoaded ? <PrintingPressLoading /> : null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="group" options={{ headerShown: false }} />
        <Stack.Screen name="edition" options={{ headerShown: false }} />
      </Stack>
      {consumingInvite ? (
        // Joining the pending invite — hold the press animation over the
        // navigator (never unmount it mid-navigation) so home doesn't flash
        // before the welcome screen takes over.
        <View style={StyleSheet.absoluteFill}>
          <PrintingPressLoading />
        </View>
      ) : null}
    </>
  );
};

export default RootLayout;
