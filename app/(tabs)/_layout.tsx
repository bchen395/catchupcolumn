import { Tabs } from 'expo-router';

import { ComposeSheetProvider } from '@/components/compose-sheet-provider';
import { CustomTabBar } from '@/components/custom-tab-bar';
import { Colors } from '@/constants/colors';
import { Typography } from '@/constants/typography';

const TabLayout = () => {
  return (
    <ComposeSheetProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: Colors.paperWarm },
          headerTintColor: Colors.ink,
          headerTitleStyle: {
            fontFamily: Typography.families.serifBold,
            color: Colors.ink,
          },
        }}
      >
        <Tabs.Screen name="home" options={{ title: 'Home', headerShown: false }} />
        <Tabs.Screen name="inbox" options={{ title: 'Editions' }} />
        <Tabs.Screen name="post" options={{ title: 'Compose' }} />
        <Tabs.Screen name="groups" options={{ title: 'My Groups' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </ComposeSheetProvider>
  );
};

export default TabLayout;
