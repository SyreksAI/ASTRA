import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../i18n/useI18n';
import type { TranslationKey } from '../../i18n/translations';
import { useSettings } from '../../context/SettingsContext';
import type { ChatFontScale, ChatWallpaperId } from '../../settings/appSettings';
import { talkBrand } from '../../theme/talkTheme';
import {
  SettingsPage,
  SettingsSectionTitle,
  SettingsCard,
  SettingsSwitchRow,
  SettingsHint,
  useSettingsChrome,
} from './settingsLayout';

const WALLPAPERS: { id: ChatWallpaperId; labelKey: TranslationKey }[] = [
  { id: 'solid', labelKey: 'settingsChats.wpSolid' },
  { id: 'outline', labelKey: 'settingsChats.wpOutline' },
  { id: 'dots', labelKey: 'settingsChats.wpDots' },
];

const FONT_SCALES: { id: ChatFontScale; labelKey: TranslationKey }[] = [
  { id: 'small', labelKey: 'settingsChats.fontSmall' },
  { id: 'medium', labelKey: 'settingsChats.fontMedium' },
  { id: 'large', labelKey: 'settingsChats.fontLarge' },
];

export default function SettingsChatsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useI18n();
  const { settings, patchSettings } = useSettings();
  const { sectionAccent, c, isDark } = useSettingsChrome();
  const chats = settings.chats;

  const setChats = (patch: Partial<typeof chats>) =>
    patchSettings({ chats: { ...chats, ...patch } });

  return (
    <SettingsPage title={t('settingsChats.title')} onBack={() => navigation.goBack()}>
      <SettingsSectionTitle color={sectionAccent}>{t('settingsChats.sectionWallpaper')}</SettingsSectionTitle>
      <SettingsHint color={c.textSecondary}>{t('settingsChats.wallpaperHint')}</SettingsHint>
      <SettingsCard style={styles.wpCard}>
        <View style={styles.wpRow}>
          {WALLPAPERS.map((wp) => {
            const selected = chats.wallpaper === wp.id;
            return (
              <TouchableOpacity
                key={wp.id}
                style={styles.wpItem}
                onPress={() => setChats({ wallpaper: wp.id })}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.wpPreview,
                    { borderColor: selected ? talkBrand.accentBright : c.border },
                  ]}
                >
                  {wp.id === 'solid' ? (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]} />
                  ) : wp.id === 'outline' ? (
                    <Image
                      source={
                        isDark
                          ? require('../../../assets/chat-wallpaper-outline-dark.png')
                          : require('../../../assets/chat-wallpaper-outline-light.png')
                      }
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]}>
                      <View style={styles.dotsPattern} />
                    </View>
                  )}
                  {selected ? (
                    <View style={styles.wpCheck}>
                      <Ionicons name="checkmark-circle" size={22} color={talkBrand.accentBright} />
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.wpLabel,
                    { color: selected ? talkBrand.accentBright : c.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {t(wp.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SettingsCard>

      <SettingsSectionTitle color={sectionAccent}>{t('settingsChats.sectionText')}</SettingsSectionTitle>
      <SettingsCard>
        <View style={styles.fontRow}>
          {FONT_SCALES.map((fs) => {
            const active = chats.fontScale === fs.id;
            return (
              <TouchableOpacity
                key={fs.id}
                style={[
                  styles.fontChip,
                  {
                    backgroundColor: active ? talkBrand.accentSoft : c.surface2,
                    borderColor: active ? talkBrand.accentBright : c.border,
                  },
                ]}
                onPress={() => setChats({ fontScale: fs.id })}
              >
                <Text
                  style={{
                    color: active ? talkBrand.accentBright : c.text,
                    fontWeight: active ? '700' : '500',
                    fontSize: fs.id === 'small' ? 14 : fs.id === 'large' ? 18 : 16,
                  }}
                >
                  {t(fs.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SettingsCard>

      <SettingsSectionTitle color={sectionAccent}>{t('settingsChats.sectionBehavior')}</SettingsSectionTitle>
      <SettingsCard>
        <SettingsSwitchRow
          label={t('settingsChats.sendOnEnter')}
          hint={t('settingsChats.sendOnEnterHint')}
          value={chats.sendOnEnter}
          onValueChange={(v) => setChats({ sendOnEnter: v })}
        />
        <SettingsSwitchRow
          label={t('settingsChats.swipeToReply')}
          value={chats.swipeToReply}
          onValueChange={(v) => setChats({ swipeToReply: v })}
          isLast
        />
      </SettingsCard>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  wpCard: { paddingVertical: 14, paddingHorizontal: 10 },
  wpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  wpItem: { flex: 1, alignItems: 'center' },
  wpPreview: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
  },
  wpCheck: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 12,
  },
  wpLabel: { marginTop: 8, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  dotsPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#888',
    borderStyle: 'dotted',
  },
  fontRow: { flexDirection: 'row', padding: 12, gap: 8 },
  fontChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
