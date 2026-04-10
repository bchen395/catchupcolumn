import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const OnboardingScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Set Up Your Profile</ThemedText>
      <ThemedText variant="body">Tell your family a little about yourself.</ThemedText>
    </ThemedView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
