import { Stack } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const EditionLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paperWarm },
        headerTintColor: Colors.orange,
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
