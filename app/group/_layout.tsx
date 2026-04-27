import { Stack } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const ColumnLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.accentNavy,
        headerTitleStyle: {
          fontFamily: Typography.families.sansSemiBold,
          color: Colors.text,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
};

export default ColumnLayout;
