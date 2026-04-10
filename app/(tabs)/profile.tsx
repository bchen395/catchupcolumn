import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const ProfileScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Your Profile</ThemedText>
      <ThemedText variant="body">Manage your account settings.</ThemedText>
    </ThemedView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
