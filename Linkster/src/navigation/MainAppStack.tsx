import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';

import { MessengerShellProvider } from '../features/messenger/context/MessengerShellContext';

import MessengerTabs from '../features/messenger/navigation/MessengerTabs';

import { ChatTabBarProvider } from '../context/ChatTabBarContext';

import UserProfileScreen from '../screens/UserProfileScreen';

import SettingsChatScreen from '../screens/settings/SettingsChatScreen';

import SettingsAccountScreen from '../screens/settings/SettingsAccountScreen';

import SettingsProfileScreen from '../screens/settings/SettingsProfileScreen';

import SettingsDataScreen from '../screens/settings/SettingsDataScreen';

import SettingsNotificationsScreen from '../screens/settings/SettingsNotificationsScreen';

import SettingsPrivacyScreen from '../screens/settings/SettingsPrivacyScreen';

import SettingsDevicesScreen from '../screens/settings/SettingsDevicesScreen';

import SettingsChatsScreen from '../screens/settings/SettingsChatsScreen';

import SettingsCallsScreen from '../screens/settings/SettingsCallsScreen';

import SettingsAboutScreen from '../screens/settings/SettingsAboutScreen';

import SettingsHelpScreen from '../screens/settings/SettingsHelpScreen';

import SettingsTermsScreen from '../screens/settings/SettingsTermsScreen';

import { VoicePlaybackProvider } from '../context/VoicePlaybackContext';

import { VideoNotePlaybackProvider } from '../context/VideoNotePlaybackContext';



export type MainAppStackParamList = {

  MainTabs: { screen?: keyof import('../features/messenger/navigation/MessengerTabs').MessengerTabParamList } | undefined;

  UserProfile: { username: string; hideBack?: boolean; orbitShell?: boolean };

  CallScreen: {

    isIncoming?: boolean;

    callId?: string;

    callType?: 'audio' | 'video';

    targetUser?: unknown;

  };

  SettingsChat: undefined;

  SettingsAccount: undefined;

  SettingsProfile: undefined;

  SettingsData: undefined;

  SettingsNotifications: undefined;

  SettingsPrivacy: undefined;

  SettingsDevices: undefined;

  SettingsChats: undefined;

  SettingsCalls: undefined;

  SettingsAbout: undefined;

  SettingsHelp: undefined;

  SettingsTerms: undefined;

};



const Stack = createNativeStackNavigator<MainAppStackParamList>();



export default function MainAppStack() {

  const { theme, accentPreset } = useAuth();

  const appearanceKey = `${theme}-${accentPreset}`;



  return (

    <VoicePlaybackProvider>

    <VideoNotePlaybackProvider>

    <Stack.Navigator key={appearanceKey} screenOptions={{ headerShown: false }}>

      <Stack.Screen name="MainTabs">

        {() => (

          <ChatTabBarProvider>

            <MessengerShellProvider>

              <MessengerTabs />

            </MessengerShellProvider>

          </ChatTabBarProvider>

        )}

      </Stack.Screen>

      <Stack.Screen name="UserProfile" component={UserProfileScreen} />

      <Stack.Screen name="SettingsChat" component={SettingsChatScreen} />

      <Stack.Screen name="SettingsAccount" component={SettingsAccountScreen} />

      <Stack.Screen name="SettingsProfile" component={SettingsProfileScreen} />

      <Stack.Screen name="SettingsData" component={SettingsDataScreen} />

      <Stack.Screen name="SettingsNotifications" component={SettingsNotificationsScreen} />

      <Stack.Screen name="SettingsPrivacy" component={SettingsPrivacyScreen} />

      <Stack.Screen name="SettingsDevices" component={SettingsDevicesScreen} />

      <Stack.Screen name="SettingsChats" component={SettingsChatsScreen} />

      <Stack.Screen name="SettingsCalls" component={SettingsCallsScreen} />

      <Stack.Screen name="SettingsAbout" component={SettingsAboutScreen} />

      <Stack.Screen name="SettingsHelp" component={SettingsHelpScreen} />

      <Stack.Screen name="SettingsTerms" component={SettingsTermsScreen} />

      <Stack.Screen

        name="CallScreen"

        getComponent={() =>

          require('../native/getCallScreenComponent').getCallScreenComponent()

        }

        options={{ presentation: 'fullScreenModal', animation: 'fade' }}

      />

    </Stack.Navigator>

    </VideoNotePlaybackProvider>

    </VoicePlaybackProvider>

  );

}

