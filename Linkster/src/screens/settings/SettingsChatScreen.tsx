import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ui/ScreenHeader';
import { useTalkTheme } from '../../hooks/useTalkTheme';
import { talkBrand } from '../../theme/talkTheme';
import { useAuth } from '../../context/AuthContext';
import { APP_LANGUAGES, type AppLanguage } from '../../i18n/appLanguage';
import { ACCENT_PRESETS, type AccentPresetId } from '../../theme/accentPresets';
import { linksterLayout, linksterMatteCard } from '../../features/messenger/theme/linksterPro';
import { useI18n } from '../../i18n/useI18n';
import { navigateRoot } from '../../navigation/rootNavigation';
import { SettingsCard, SettingsNavRow } from './settingsLayout';

function SectionTitle({ children, color }: { children: string; color: string }) {
  return <Text style={[styles.sectionTitle, { color }]}>{children}</Text>;
}

export default function SettingsChatScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { updateTheme, updateLanguage, updateAccentPreset } = useAuth();
  const { isDark, colors: c, accentPreset } = useTalkTheme();
  const { t, language } = useI18n();

  const cardStyle = useMemo(() => linksterMatteCard(isDark), [isDark]);
  const sectionAccent = talkBrand.accentBright;
  const dividerColor = c.border;

  const onLanguage = (lang: AppLanguage) => {
    if (lang === language) return;
    updateLanguage(lang).catch(() => {
      Alert.alert('Linkster', t('common.errorSave'));
    });
  };

  const onAccent = (id: AccentPresetId) => {
    if (id === accentPreset) return;
    updateAccentPreset(id).catch(() => {
      Alert.alert('Linkster', t('common.errorSave'));
    });
  };

  return (
    <View style={[styles.page, { backgroundColor: c.bg }]}>
      <ScreenHeader title={t('appearance.screenTitle')} onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle color={sectionAccent}>{t('appearance.sectionTheme')}</SectionTitle>
        <View style={[styles.card, cardStyle]}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.label, { color: c.text }]}>{t('appearance.nightMode')}</Text>
              <Text style={[styles.hint, { color: c.textSecondary }]}>
                {t('appearance.nightModeHint')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={(v) => updateTheme(v ? 'dark' : 'light').catch(() => {})}
              trackColor={{ false: c.textMuted, true: talkBrand.accentPressed }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <SectionTitle color={sectionAccent}>{t('appearance.sectionLanguage')}</SectionTitle>
        <Text style={[styles.blockHint, { color: c.textSecondary }]}>{t('appearance.languageHint')}</Text>
        <View style={[styles.card, cardStyle]}>
          {APP_LANGUAGES.map((item, index) => {
            const selected = language === item.id;
            const isLast = index === APP_LANGUAGES.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.langRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor },
                ]}
                onPress={() => onLanguage(item.id)}
                activeOpacity={0.72}
              >
                <Text style={[styles.langLabel, { color: c.text }]}>{item.native}</Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={talkBrand.accentBright} />
                ) : (
                  <View style={styles.langCheckPlaceholder} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionTitle color={sectionAccent}>{t('appearance.sectionAccent')}</SectionTitle>
        <Text style={[styles.blockHint, { color: c.textSecondary }]}>{t('appearance.accentHint')}</Text>
        <View style={[styles.card, cardStyle, styles.accentCard]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accentRow}>
            {ACCENT_PRESETS.map((preset) => {
              const selected = accentPreset === preset.id;
              const label = language === 'ru' ? preset.labelRu : preset.labelEn;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.accentItem}
                  onPress={() => onAccent(preset.id)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: preset.swatch },
                      selected && { borderColor: talkBrand.accentBright, borderWidth: 3 },
                    ]}
                  >
                    {selected ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                  </View>
                  <Text
                    style={[
                      styles.accentLabel,
                      { color: selected ? talkBrand.accentBright : c.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <SectionTitle color={sectionAccent}>{t('settingsChats.title')}</SectionTitle>
        <SettingsCard>
          <SettingsNavRow
            label={t('settingsChats.title')}
            hint={t('settingsChats.wallpaperHint')}
            onPress={() => navigateRoot(navigation, 'SettingsChats')}
            isLast
          />
        </SettingsCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    paddingHorizontal: linksterLayout.screenH,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 12,
  },
  blockHint: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 12,
    lineHeight: 18,
  },
  card: { overflow: 'hidden' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  switchText: { flex: 1 },
  label: { fontSize: 16, fontWeight: '500' },
  hint: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  langLabel: { fontSize: 17, fontWeight: '500' },
  langCheckPlaceholder: { width: 22, height: 22 },
  accentCard: { paddingVertical: 16 },
  accentRow: {
    paddingHorizontal: 12,
    gap: 16,
    flexDirection: 'row',
  },
  accentItem: { alignItems: 'center', width: 72 },
  swatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accentLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
