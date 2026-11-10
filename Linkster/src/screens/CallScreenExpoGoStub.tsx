import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getTalkColors,
  linksterCanvas,
  linksterPrimaryButton,
  talkBrand,
} from '../theme/talkTheme';

type Props = {
  navigation?: { goBack?: () => void };
  route?: { params?: { isIncoming?: boolean } };
};

export default function CallScreenExpoGoStub({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const incoming = route?.params?.isIncoming;

  useEffect(() => {
    return () => {
      (globalThis as { __activeCallId?: string | null }).__activeCallId = null;
    };
  }, []);

  const close = () => {
    (globalThis as { __activeCallId?: string | null }).__activeCallId = null;
    navigation?.goBack?.();
  };

  return (
    <View style={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.card}>
        <Ionicons name="call-outline" size={48} color={talkBrand.accent} />
        <Text style={styles.title}>
          {incoming ? 'Входящий звонок' : 'Звонки'}
        </Text>
        <Text style={styles.body}>
          В Expo Go нет нативного WebRTC. Чаты работают как обычно. Для звонков соберите приложение:
          {'\n\n'}
          npx expo run:android
        </Text>
        <TouchableOpacity style={styles.btn} onPress={close} activeOpacity={0.85}>
          <Text style={styles.btnText}>Понятно</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: linksterCanvas.dark,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    backgroundColor: getTalkColors(true).surface2,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: getTalkColors(true).border,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#e7e9ea',
    textAlign: 'center',
  },
  body: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
    color: '#71767b',
    textAlign: 'center',
  },
  btn: {
    marginTop: 24,
    backgroundColor: linksterPrimaryButton.backgroundColor,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 9999,
  },
  btnText: { color: linksterPrimaryButton.textColor, fontWeight: '800', fontSize: 16 },
});
