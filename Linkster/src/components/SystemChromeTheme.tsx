import { useEffect } from 'react';

import { Platform } from 'react-native';

import { StatusBar } from 'expo-status-bar';

import * as SystemUI from 'expo-system-ui';

import { NavigationBar } from 'expo-navigation-bar';

import { useAuth } from '../context/AuthContext';

import { linksterCanvas } from '../theme/talkTheme';



/** Системная строка состояния и нижняя зона жестов (Android) в цвет темы приложения */

export default function SystemChromeTheme() {

  const { theme } = useAuth();

  const isDark = theme === 'dark';

  const surface = isDark ? linksterCanvas.dark : linksterCanvas.light;



  useEffect(() => {

    SystemUI.setBackgroundColorAsync(surface).catch(() => {});

  }, [surface]);



  return (

    <>

      <StatusBar style={isDark ? 'light' : 'dark'} />

      {Platform.OS === 'android' ? (

        <NavigationBar style={isDark ? 'dark' : 'light'} hidden={false} />

      ) : null}

    </>

  );

}


