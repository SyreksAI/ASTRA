import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from '../../../screens/ChatScreen';
import NewChatScreen from '../../../screens/NewChatScreen';

export type ChatsStackParamList = {
  MessengerRoot: { openConversationId?: string | number } | undefined;
  NewLink: undefined;
};

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export default function ChatsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MessengerRoot" component={ChatScreen} />
      <Stack.Screen
        name="NewLink"
        component={NewChatScreen}
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
