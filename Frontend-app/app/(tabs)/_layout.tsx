import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { colors, feed } from '@/src/theme/tokens';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: feed.bg }}>
        <ActivityIndicator color={colors.teal} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Главная' }} />
      <Tabs.Screen name="constellations" options={{ title: 'Созвездия' }} />
      <Tabs.Screen name="create" options={{ title: 'Создать' }} />
      <Tabs.Screen name="music" options={{ title: 'Музыка' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  );
}
