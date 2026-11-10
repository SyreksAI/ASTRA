import React, { useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { getTalkColors, linksterCanvas, talkBrand } from './src/theme/talkTheme';
import { translate } from './src/i18n/translations';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AstraConnectScreen from './src/screens/AstraConnectScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading, token, theme, language, accentPreset } = useAuth();
  const appearanceKey = `${theme}-${accentPreset}`;
  const isDark = theme === 'dark';
  const rootBg = isDark ? linksterCanvas.dark : linksterCanvas.light;
  const bootColors = getTalkColors(isDark);
  const splashHidden = useRef(false);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Нативная заставка перекрывает React, пока не вызван hideAsync — не ждём сеть
  useEffect(() => {
    hideSplash();
  }, [hideSplash]);

  const sessionPending = !loading && !!token && !user;

  if (loading || sessionPending) {
    return (
      <View style={[styles.center, { backgroundColor: rootBg }]} onLayout={hideSplash}>
        <ActivityIndicator size="large" color={talkBrand.accent} />
        {sessionPending ? (
          <Text style={[styles.bootHint, { color: bootColors.textSecondary }]}>
            {translate('boot.checkingSession', language)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: rootBg }]} onLayout={hideSplash}>
      <NavigationContainer
        key={appearanceKey}
        theme={{
          dark: isDark,
          colors: {
            primary: talkBrand.accent,
            background: rootBg,
            card: rootBg,
            text: bootColors.text,
            border: bootColors.border,
            notification: talkBrand.accent,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '800' },
          },
        }}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen
              name="MainApp"
              getComponent={() => require('./src/navigation/MainAppStack').default}
            />
          ) : (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="AstraConnect" component={AstraConnectScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SettingsProvider>
          <RootNavigator />
        </SettingsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bootHint: { marginTop: 16, fontSize: 15 },
});
