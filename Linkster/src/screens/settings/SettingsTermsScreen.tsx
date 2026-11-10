import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../i18n/useI18n';
import { SettingsPage, useSettingsChrome } from './settingsLayout';

export default function SettingsTermsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { c } = useSettingsChrome();

  return (
    <SettingsPage title={t('settingsTerms.title')} onBack={() => navigation.goBack()}>
      <Text style={[styles.body, { color: c.textSecondary }]}>{t('settingsTerms.body')}</Text>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 24, paddingHorizontal: 4, paddingTop: 8 },
});
