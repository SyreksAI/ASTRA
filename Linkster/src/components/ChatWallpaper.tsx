import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { getTalkColors } from '../theme/talkTheme';
import { useSettings } from '../context/SettingsContext';

type Props = {
  isDark: boolean;
};

/** Фон области сообщений (из настроек чатов) */
export default function ChatWallpaper({ isDark }: Props) {
  const { settings } = useSettings();
  const { bg } = getTalkColors(isDark);
  const wp = settings.chats.wallpaper;

  if (wp === 'outline') {
    return (
      <Image
        source={
          isDark
            ? require('../../assets/chat-wallpaper-outline-dark.png')
            : require('../../assets/chat-wallpaper-outline-light.png')
        }
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        pointerEvents="none"
      />
    );
  }

  if (wp === 'dots') {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} pointerEvents="none">
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: isDark ? 0.12 : 0.08,
              backgroundColor: isDark ? '#fff' : '#000',
            },
          ]}
        />
      </View>
    );
  }

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} pointerEvents="none" />;
}
