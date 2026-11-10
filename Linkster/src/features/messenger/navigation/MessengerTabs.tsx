import React from 'react';

import { View, StyleSheet } from 'react-native';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { NavigatorScreenParams } from '@react-navigation/native';

import { useChatTabBar } from '../../../context/ChatTabBarContext';

import VoiceMiniPlayerTabHost from '../../../components/VoiceMiniPlayerTabHost';

import VideoNoteMiniPlayerTabHost from '../../../components/VideoNoteMiniPlayerTabHost';

import OrbitTabBar from '../ui/OrbitTabBar';

import ChatsNavigator, { type ChatsStackParamList } from './ChatsNavigator';

import MessengerLinksScreen from '../screens/MessengerLinksScreen';

import MessengerCallsScreen from '../screens/MessengerCallsScreen';

import MessengerDeckScreen from '../screens/MessengerDeckScreen';

import MessengerProfileScreen from '../screens/MessengerProfileScreen';



export type MessengerTabParamList = {

  Orbit: NavigatorScreenParams<ChatsStackParamList> | undefined;

  Links: undefined;

  Calls: undefined;

  Deck: undefined;

  Self: undefined;

};



const Tab = createBottomTabNavigator<MessengerTabParamList>();



export default function MessengerTabs() {

  const { hideTabs } = useChatTabBar();



  return (

    <View style={styles.root}>

      <Tab.Navigator

        tabBar={(props) => (hideTabs ? null : <OrbitTabBar {...props} />)}

        screenOptions={{

          headerShown: false,

          sceneStyle: { backgroundColor: 'transparent' },

        }}

      >

        <Tab.Screen name="Orbit" component={ChatsNavigator} />

        <Tab.Screen

          name="Links"

          component={MessengerLinksScreen}

          options={{ tabBarButton: () => null }}

        />

        <Tab.Screen name="Calls" component={MessengerCallsScreen} />

        <Tab.Screen name="Deck" component={MessengerDeckScreen} />

        <Tab.Screen name="Self" component={MessengerProfileScreen} />

      </Tab.Navigator>

      {!hideTabs ? (

        <>

          <VoiceMiniPlayerTabHost />

          <VideoNoteMiniPlayerTabHost />

        </>

      ) : null}

    </View>

  );

}



const styles = StyleSheet.create({

  root: { flex: 1 },

});

