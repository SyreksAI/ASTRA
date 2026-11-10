import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../i18n/useI18n';
import {
  SettingsPage,
  SettingsSectionTitle,
  SettingsCard,
  useSettingsChrome,
} from './settingsLayout';

const FAQ_KEYS = [
  ['settingsHelp.q1', 'settingsHelp.a1'],
  ['settingsHelp.q2', 'settingsHelp.a2'],
  ['settingsHelp.q3', 'settingsHelp.a3'],
  ['settingsHelp.q4', 'settingsHelp.a4'],
] as const;

export default function SettingsHelpScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { sectionAccent, c } = useSettingsChrome();

  return (
    <SettingsPage title={t('settingsHelp.title')} onBack={() => navigation.goBack()}>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsHelp.sectionFaq')}</SettingsSectionTitle>
      {FAQ_KEYS.map(([q, a]) => (
        <SettingsCard key={q} style={styles.block}>
          <Text style={[styles.q, { color: c.text }]}>{t(q)}</Text>
          <Text style={[styles.a, { color: c.textSecondary }]}>{t(a)}</Text>
        </SettingsCard>
      ))}
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  block: { padding: 16, marginBottom: 8 },
  q: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  a: { fontSize: 15, lineHeight: 22 },
});
