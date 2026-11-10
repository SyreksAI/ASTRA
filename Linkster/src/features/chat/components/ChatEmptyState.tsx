import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { talkBrand } from '../../../theme/talkTheme';

type Props = {
  isDark: boolean;
  isSearch: boolean;
  mutedColor: string;
  textColor: string;
};

export default function ChatEmptyState({ isDark, isSearch, mutedColor, textColor }: Props) {
  if (isSearch) {
    return (
      <Text style={[styles.simple, { color: mutedColor }]}>Никого не найдено</Text>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconRing, { backgroundColor: talkBrand.accentSoft }]}>
        <Ionicons name="chatbubbles" size={36} color={talkBrand.accent} />
      </View>
      <Text style={[styles.title, { color: textColor }]}>Ваш приватный штаб</Text>
      <Text style={[styles.sub, { color: mutedColor }]}>
        Здесь живут личные разговоры и общие дела. Нажмите «+», чтобы написать первому
        человеку или создать группу.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 32,
    paddingTop: 48,
    alignItems: 'center',
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  simple: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 15,
    paddingHorizontal: 24,
  },
});
