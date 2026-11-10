import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useI18n } from '../../i18n/useI18n';
import {
  SettingsPage,
  SettingsSectionTitle,
  SettingsCard,
  SettingsHint,
  useSettingsChrome,
} from './settingsLayout';

function InfoLine({ label, value, labelColor, valueColor }: { label: string; value: string; labelColor: string; valueColor: string }) {
  return (
    <View style={lineStyles.row}>
      <Text style={[lineStyles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[lineStyles.value, { color: valueColor }]} selectable>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsDevicesScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { sectionAccent, c } = useSettingsChrome();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const deviceName =
    Constants.deviceName ??
    (Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : Platform.OS);

  return (
    <SettingsPage title={t('settingsDevices.title')} onBack={() => navigation.goBack()}>
      <SettingsHint color={c.textSecondary}>{t('settingsDevices.intro')}</SettingsHint>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsDevices.sectionThis')}</SettingsSectionTitle>
      <SettingsCard>
        <View style={lineStyles.cardInner}>
          <InfoLine
            label={t('settingsDevices.device')}
            value={deviceName}
            labelColor={c.textSecondary}
            valueColor={c.text}
          />
          <InfoLine
            label={t('settingsDevices.platform')}
            value={`${Platform.OS} ${String(Platform.Version)}`}
            labelColor={c.textSecondary}
            valueColor={c.text}
          />
          <InfoLine
            label={t('settingsDevices.appVersion')}
            value={`Linkster ${appVersion}`}
            labelColor={c.textSecondary}
            valueColor={c.text}
          />
          <InfoLine
            label={t('settingsDevices.session')}
            value={t('settingsDevices.sessionActive')}
            labelColor={c.textSecondary}
            valueColor={c.text}
          />
        </View>
      </SettingsCard>
      <SettingsHint color={c.textSecondary}>{t('settingsDevices.sessionsHint')}</SettingsHint>
    </SettingsPage>
  );
}

const lineStyles = StyleSheet.create({
  cardInner: { padding: 16, gap: 14 },
  row: { gap: 4 },
  label: { fontSize: 13 },
  value: { fontSize: 16, fontWeight: '500' },
});
