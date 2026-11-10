import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useI18n } from '../../i18n/useI18n';
import { useSettings } from '../../context/SettingsContext';
import {
  SettingsPage,
  SettingsSectionTitle,
  SettingsCard,
  SettingsSwitchRow,
  SettingsHint,
  useSettingsChrome,
} from './settingsLayout';

export default function SettingsPrivacyScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { settings, patchSettings } = useSettings();
  const { sectionAccent, c } = useSettingsChrome();
  const p = settings.privacy;

  const set = (key: keyof typeof p, value: boolean) =>
    patchSettings({ privacy: { ...p, [key]: value } });

  return (
    <SettingsPage title={t('settingsPrivacy.title')} onBack={() => navigation.goBack()}>
      <SettingsHint color={c.textSecondary}>{t('settingsPrivacy.intro')}</SettingsHint>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsPrivacy.sectionStatus')}</SettingsSectionTitle>
      <SettingsCard>
        <SettingsSwitchRow
          label={t('settingsPrivacy.showOnline')}
          value={p.showOnline}
          onValueChange={(v) => set('showOnline', v)}
        />
        <SettingsSwitchRow
          label={t('settingsPrivacy.showLastSeen')}
          value={p.showLastSeen}
          onValueChange={(v) => set('showLastSeen', v)}
        />
        <SettingsSwitchRow
          label={t('settingsPrivacy.showReadReceipts')}
          hint={t('settingsPrivacy.showReadReceiptsHint')}
          value={p.showReadReceipts}
          onValueChange={(v) => set('showReadReceipts', v)}
        />
        <SettingsSwitchRow
          label={t('settingsPrivacy.allowFindByUsername')}
          hint={t('settingsPrivacy.allowFindByUsernameHint')}
          value={p.allowFindByUsername}
          onValueChange={(v) => set('allowFindByUsername', v)}
          isLast
        />
      </SettingsCard>
    </SettingsPage>
  );
}
