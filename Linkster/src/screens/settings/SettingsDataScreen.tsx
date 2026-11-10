import React, { useEffect, useState } from 'react';

import {

  View,

  Text,

  StyleSheet,

  ScrollView,

  TextInput,

  TouchableOpacity,

  Alert,

  ActivityIndicator,

} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as FileSystem from 'expo-file-system/legacy';

import ScreenHeader from '../../components/ui/ScreenHeader';

import { useTalkTheme } from '../../hooks/useTalkTheme';

import { talkBrand } from '../../theme/talkTheme';

import { useAuth } from '../../context/AuthContext';

import { useI18n } from '../../i18n/useI18n';

import { useSettings } from '../../context/SettingsContext';

import type { AutoDownloadPolicy } from '../../settings/appSettings';

import {

  SettingsSectionTitle,

  SettingsCard,

  SettingsSegmentRow,

  useSettingsChrome,

} from './settingsLayout';



const DOWNLOAD_OPTS = (t: (k: 'settingsData.dlWifi' | 'settingsData.dlAlways' | 'settingsData.dlNever') => string) =>

  [

    { id: 'wifi' as AutoDownloadPolicy, label: t('settingsData.dlWifi') },

    { id: 'always' as AutoDownloadPolicy, label: t('settingsData.dlAlways') },

    { id: 'never' as AutoDownloadPolicy, label: t('settingsData.dlNever') },

  ];



export default function SettingsDataScreen() {

  const navigation = useNavigation<any>();

  const insets = useSafeAreaInsets();

  const { apiBaseUrl, setApiBaseUrl } = useAuth();

  const { t } = useI18n();

  const { settings, patchSettings, resetSettings } = useSettings();

  const { colors: c, sectionAccent } = useSettingsChrome();

  const [serverUrl, setServerUrl] = useState(apiBaseUrl);

  const [saving, setSaving] = useState(false);

  const [clearing, setClearing] = useState(false);



  useEffect(() => {

    setServerUrl(apiBaseUrl);

  }, [apiBaseUrl]);



  const saveServer = async () => {

    setSaving(true);

    try {

      await setApiBaseUrl(serverUrl);

      Alert.alert(t('common.saved'), t('settingsData.savedMsg'));

    } catch (e) {

      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.errorSave'));

    } finally {

      setSaving(false);

    }

  };



  const clearCache = async () => {

    Alert.alert(t('settingsData.clearCacheTitle'), t('settingsData.clearCacheMsg'), [

      { text: t('common.cancel'), style: 'cancel' },

      {

        text: t('settingsData.clearCacheConfirm'),

        style: 'destructive',

        onPress: async () => {

          setClearing(true);

          try {

            const dir = FileSystem.cacheDirectory;

            if (dir) {

              const entries = await FileSystem.readDirectoryAsync(dir);

              await Promise.all(

                entries.map((name) =>

                  FileSystem.deleteAsync(`${dir}${name}`, { idempotent: true }).catch(() => {})

                )

              );

            }

            Alert.alert(t('common.done'), t('settingsData.clearCacheDone'));

          } catch (e) {

            Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.errorSave'));

          } finally {

            setClearing(false);

          }

        },

      },

    ]);

  };



  const data = settings.data;

  const dlOpts = DOWNLOAD_OPTS(t);



  return (

    <View style={[styles.page, { backgroundColor: c.bg }]}>

      <ScreenHeader title={t('settingsData.title')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>

        <SettingsSectionTitle color={sectionAccent}>{t('settingsData.sectionServer')}</SettingsSectionTitle>

        <Text style={[styles.hint, { color: c.textSecondary }]}>{t('settingsData.hint')}</Text>

        <TextInput

          style={[

            styles.input,

            { backgroundColor: c.surface2, borderColor: c.border, color: c.text },

          ]}

          value={serverUrl}

          onChangeText={setServerUrl}

          autoCapitalize="none"

          placeholder="http://192.168.1.104"

          placeholderTextColor={c.textMuted}

        />

        <TouchableOpacity

          style={[styles.btn, { backgroundColor: talkBrand.accent }, saving && { opacity: 0.6 }]}

          onPress={saveServer}

          disabled={saving}

          activeOpacity={0.88}

        >

          <Text style={[styles.btnText, { color: talkBrand.onAccent }]}>{t('common.save')}</Text>

        </TouchableOpacity>



        <SettingsSectionTitle color={sectionAccent}>{t('settingsData.sectionAuto')}</SettingsSectionTitle>

        <SettingsCard>

          <SettingsSegmentRow

            label={t('settingsData.autoPhotos')}

            value={data.autoDownloadPhotos}

            options={dlOpts}

            onChange={(v) => patchSettings({ data: { ...data, autoDownloadPhotos: v } })}

          />

          <SettingsSegmentRow

            label={t('settingsData.autoVideos')}

            value={data.autoDownloadVideos}

            options={dlOpts}

            onChange={(v) => patchSettings({ data: { ...data, autoDownloadVideos: v } })}

          />

          <SettingsSegmentRow

            label={t('settingsData.autoFiles')}

            value={data.autoDownloadFiles}

            options={dlOpts}

            onChange={(v) => patchSettings({ data: { ...data, autoDownloadFiles: v } })}

          />

        </SettingsCard>



        <SettingsSectionTitle color={sectionAccent}>{t('settingsData.sectionStorage')}</SettingsSectionTitle>

        <SettingsCard>

          <TouchableOpacity

            style={styles.cacheRow}

            onPress={clearCache}

            disabled={clearing}

            activeOpacity={0.72}

          >

            {clearing ? (

              <ActivityIndicator color={talkBrand.accent} />

            ) : (

              <Text style={[styles.cacheLabel, { color: talkBrand.danger }]}>

                {t('settingsData.clearCache')}

              </Text>

            )}

          </TouchableOpacity>

        </SettingsCard>



        <TouchableOpacity style={styles.resetBtn} onPress={() => resetSettings()} activeOpacity={0.8}>

          <Text style={{ color: c.textSecondary, fontSize: 14 }}>{t('settingsData.resetDefaults')}</Text>

        </TouchableOpacity>

      </ScrollView>

    </View>

  );

}



const styles = StyleSheet.create({

  page: { flex: 1 },

  content: { padding: 16, paddingBottom: 40 },

  hint: { fontSize: 14, lineHeight: 20, marginBottom: 12 },

  input: {

    borderWidth: StyleSheet.hairlineWidth,

    borderRadius: 12,

    paddingHorizontal: 14,

    paddingVertical: 12,

    fontSize: 15,

  },

  btn: {

    marginTop: 14,

    paddingVertical: 14,

    borderRadius: 12,

    alignItems: 'center',

  },

  btnText: { fontWeight: '700', fontSize: 16 },

  cacheRow: { padding: 16, alignItems: 'center' },

  cacheLabel: { fontSize: 16, fontWeight: '600' },

  resetBtn: { marginTop: 24, alignItems: 'center', padding: 12 },

});


