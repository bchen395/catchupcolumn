import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const LoginScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Welcome Back</ThemedText>
      <ThemedText variant="body">Sign in to your account.</ThemedText>
    </ThemedView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
