import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const ComposeScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText variant="headline">Compose</ThemedText>
      <ThemedText variant="body">Write something for this week.</ThemedText>
    </ThemedView>
  );
};

export default ComposeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
