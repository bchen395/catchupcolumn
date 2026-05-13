import { Stack } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const ColumnLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.paperWarm },
        headerTintColor: Colors.navy,
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

export default ColumnLayout;
