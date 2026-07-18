import { Stack } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const EditionLayout = () => {
  return (
    <Stack
      screenOptions={{
        // Default to an empty title so the loading state never flashes the raw
        // route name (e.g. "[id]/index"). Each screen sets its real title once
        // its data has loaded.
        title: '',
        headerStyle: { backgroundColor: Colors.paperWarm },
        headerTintColor: Colors.ink,
        headerTitleStyle: {
          fontFamily: Typography.families.sansSemiBold,
          color: Colors.ink,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.paperWarm },
      }}
    />
  );
};

export default EditionLayout;
