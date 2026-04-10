import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const SignupScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Create Account</ThemedText>
      <ThemedText variant="body">Join your family's Column.</ThemedText>
    </ThemedView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
