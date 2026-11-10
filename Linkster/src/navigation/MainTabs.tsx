import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { tabBarColors, tabBarStyle } from '../theme/tabBar';
import { useChatTabBar } from '../context/ChatTabBarContext';
import { ChatsNavigator } from '../features/messenger';
import ContactsCallsScreen from '../screens/ContactsCallsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileTabScreen from '../screens/ProfileTabScreen';
import VoiceMiniPlayerTabHost from '../components/VoiceMiniPlayerTabHost';
import VideoNoteMiniPlayerTabHost from '../components/VideoNoteMiniPlayerTabHost';

export type MainTabParamList = {
  Chats: { openConversationId?: string | number } | undefined;
  Contacts: undefined;
  Settings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Chats: 'Чаты',
  Contacts: 'Контакты',
  Settings: 'Настройки',
  Profile: 'Профиль',
};

export default function MainTabs() {
  const { theme } = useAuth();
  const { hideTabs } = useChatTabBar();
  const isDark = theme === 'dark';
  const colors = tabBarColors(isDark);
  const insets = useSafeAreaInsets();
  const barStyle = {
    ...tabBarStyle(isDark),
    height: 56 + insets.bottom,
    paddingBottom: Math.max(insets.bottom, 8),
  };
  const hiddenBarStyle = {
    display: 'none' as const,
    height: 0,
    paddingBottom: 0,
    borderTopWidth: 0,
  };

  return (
    <View style={styles.tabsRoot}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: route.name === 'Chats' && hideTabs ? hiddenBarStyle : barStyle,
        tabBarLabel: TAB_LABELS[route.name as keyof MainTabParamList],
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Chats: focused ? 'chatbubbles' : 'chatbubbles-outline',
            Contacts: focused ? 'people' : 'people-outline',
            Settings: focused ? 'settings' : 'settings-outline',
            Profile: focused ? 'person-circle' : 'person-circle-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse'} size={23} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Chats" component={ChatsNavigator} />
      <Tab.Screen name="Contacts" component={ContactsCallsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Profile" component={ProfileTabScreen} />
    </Tab.Navigator>
    <VoiceMiniPlayerTabHost />
    <VideoNoteMiniPlayerTabHost />
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: { flex: 1 },
});
