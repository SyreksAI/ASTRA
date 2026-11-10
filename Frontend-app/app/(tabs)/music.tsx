import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feed } from '@/src/theme/tokens';

export default function MusicScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <FontAwesome name="music" size={28} color={feed.teal} />
        <Text style={styles.title}>Elara Music</Text>
        <Text style={styles.sub}>Плеер появится в следующей итерации</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: feed.bg,
    paddingHorizontal: 18,
  },
  card: {
    marginTop: 40,
    backgroundColor: feed.card,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: feed.border,
  },
  title: {
    color: feed.text,
    fontSize: 22,
    fontWeight: '800',
  },
  sub: {
    color: feed.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
