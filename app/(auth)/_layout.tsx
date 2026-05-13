import { Stack } from 'expo-router';

import { Colors } from '@/constants/colors';

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.paperWarm },
      }}
    />
  );
};

export default AuthLayout;
