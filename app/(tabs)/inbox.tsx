import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const InboxScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Your Inbox</ThemedText>
      <ThemedText variant="body">Your latest editions will appear here.</ThemedText>
    </ThemedView>
  );
};

export default InboxScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
