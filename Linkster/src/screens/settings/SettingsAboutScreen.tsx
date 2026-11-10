import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useI18n } from '../../i18n/useI18n';
import { talkBrand } from '../../theme/talkTheme';
import { navigateRoot } from '../../navigation/rootNavigation';
import {
  SettingsPage,
  SettingsSectionTitle,
  SettingsCard,
  SettingsNavRow,
  useSettingsChrome,
} from './settingsLayout';

export default function SettingsAboutScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { sectionAccent, c } = useSettingsChrome();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SettingsPage title={t('settingsAbout.title')} onBack={() => navigation.goBack()}>
      <View style={styles.hero}>
        <Text style={[styles.appName, { color: c.text }]}>Linkster</Text>
        <Text style={[styles.version, { color: c.textSecondary }]}>
          {t('settingsAbout.version', { version })}
        </Text>
      </View>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsAbout.sectionLinks')}</SettingsSectionTitle>
      <SettingsCard>
        <SettingsNavRow
          label={t('settingsAbout.help')}
          onPress={() => navigateRoot(navigation, 'SettingsHelp')}
        />
        <SettingsNavRow
          label={t('settingsAbout.terms')}
          onPress={() => navigateRoot(navigation, 'SettingsTerms')}
          isLast
        />
      </SettingsCard>
      <Text style={[styles.copy, { color: c.textMuted }]}>{t('settingsAbout.copyright')}</Text>
      <TouchableOpacity
        style={[styles.resetLink, { borderColor: c.border }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={{ color: talkBrand.accentBright, fontWeight: '600' }}>{t('common.done')}</Text>
      </TouchableOpacity>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 28 },
  appName: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  version: { marginTop: 6, fontSize: 15 },
  copy: { textAlign: 'center', marginTop: 24, fontSize: 13, lineHeight: 18, paddingHorizontal: 24 },
  resetLink: {
    marginTop: 20,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
