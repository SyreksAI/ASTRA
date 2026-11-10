import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';

export default function ContactsCallsScreen() {
  const { colors: c } = useTalkTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.page, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Контакты" />
      <View style={styles.body}>
        <TouchableOpacity
          style={[styles.link, { borderColor: c.border }]}
          onPress={() => navigation.navigate('Chats')}
        >
          <Text style={[styles.linkText, { color: talkBrand.accent }]}>Найти в разделе «Чаты»</Text>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: c.textMuted }]}>
          История звонков появится позже.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  body: { padding: 20 },
  link: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  linkText: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 15 },
});
