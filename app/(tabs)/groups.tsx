import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const GroupsScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Your Columns</ThemedText>
      <ThemedText variant="body">Manage your Columns here.</ThemedText>
    </ThemedView>
  );
};

export default GroupsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
