import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTalkTheme } from '../hooks/useTalkTheme';

export default function StatusScreen() {
  const { colors: c } = useTalkTheme();

  return (
    <View style={[styles.page, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Статус" />
      <View style={styles.body}>
        <Text style={[styles.hint, { color: c.textSecondary }]}>
          Истории и обновления скоро появятся здесь.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  hint: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
