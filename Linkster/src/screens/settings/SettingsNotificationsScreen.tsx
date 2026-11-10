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

export default function SettingsNotificationsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { settings, patchSettings } = useSettings();
  const { sectionAccent } = useSettingsChrome();
  const n = settings.notifications;

  const set = (key: keyof typeof n, value: boolean) =>
    patchSettings({ notifications: { ...n, [key]: value } });

  return (
    <SettingsPage title={t('settingsNotifications.title')} onBack={() => navigation.goBack()}>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsNotifications.sectionPush')}</SettingsSectionTitle>
      <SettingsCard>
        <SettingsSwitchRow
          label={t('settingsNotifications.messages')}
          hint={t('settingsNotifications.messagesHint')}
          value={n.messages}
          onValueChange={(v) => set('messages', v)}
        />
        <SettingsSwitchRow
          label={t('settingsNotifications.calls')}
          hint={t('settingsNotifications.callsHint')}
          value={n.calls}
          onValueChange={(v) => set('calls', v)}
        />
        <SettingsSwitchRow
          label={t('settingsNotifications.reactions')}
          value={n.reactions}
          onValueChange={(v) => set('reactions', v)}
        />
        <SettingsSwitchRow
          label={t('settingsNotifications.preview')}
          hint={t('settingsNotifications.previewHint')}
          value={n.preview}
          onValueChange={(v) => set('preview', v)}
        />
        <SettingsSwitchRow
          label={t('settingsNotifications.sound')}
          value={n.sound}
          onValueChange={(v) => set('sound', v)}
          isLast
        />
      </SettingsCard>
    </SettingsPage>
  );
}
