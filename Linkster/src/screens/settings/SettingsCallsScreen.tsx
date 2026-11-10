import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../i18n/useI18n';
import { useSettings } from '../../context/SettingsContext';
import {
  SettingsPage,
  SettingsSectionTitle,
  SettingsCard,
  SettingsSwitchRow,
  useSettingsChrome,
} from './settingsLayout';

export default function SettingsCallsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { settings, patchSettings } = useSettings();
  const { sectionAccent } = useSettingsChrome();
  const calls = settings.calls;

  const set = (key: keyof typeof calls, value: boolean) =>
    patchSettings({ calls: { ...calls, [key]: value } });

  return (
    <SettingsPage title={t('settingsCalls.title')} onBack={() => navigation.goBack()}>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsCalls.sectionQuality')}</SettingsSectionTitle>
      <SettingsCard>
        <SettingsSwitchRow
          label={t('settingsCalls.noiseSuppression')}
          hint={t('settingsCalls.noiseSuppressionHint')}
          value={calls.noiseSuppression}
          onValueChange={(v) => set('noiseSuppression', v)}
        />
        <SettingsSwitchRow
          label={t('settingsCalls.preferVideo')}
          hint={t('settingsCalls.preferVideoHint')}
          value={calls.preferVideo}
          onValueChange={(v) => set('preferVideo', v)}
        />
        <SettingsSwitchRow
          label={t('settingsCalls.autoAnswer')}
          hint={t('settingsCalls.autoAnswerHint')}
          value={calls.autoAnswer}
          onValueChange={(v) => set('autoAnswer', v)}
          isLast
        />
      </SettingsCard>
    </SettingsPage>
  );
}
