import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import TalkLogo from '../components/TalkLogo';
import { authLogoStyle } from '../theme/authLogoStyle';
import { linksterCanvas, talkBrand, linksterPrimaryButton } from '../theme/talkTheme';

const BTN_HEIGHT = 52;

const FOOTER_LINKS = [
  { key: 'terms', label: 'Условия' },
  { key: 'privacy', label: 'Конфиденциальность' },
  { key: 'support', label: 'Поддержка' },
  { key: 'about', label: 'О приложении' },
] as const;

function openFooterLink(key: (typeof FOOTER_LINKS)[number]['key']) {
  const titles: Record<(typeof FOOTER_LINKS)[number]['key'], string> = {
    terms: 'Условия использования',
    privacy: 'Конфиденциальность',
    support: 'Поддержка',
    about: 'О приложении',
  };
  if (key === 'support') {
    Linking.openURL('mailto:support@astra.local').catch(() => {
      Alert.alert(titles[key], 'Напишите в поддержку Linkster.');
    });
    return;
  }
  Alert.alert(titles[key], 'Раздел скоро появится на сайте Linkster.');
}

export default function WelcomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme, updateTheme } = useAuth();
  const isDark = theme === 'dark';

  const toggleTheme = () => {
    updateTheme(isDark ? 'light' : 'dark').catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={[styles.page, isDark && styles.pageDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.inner,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarSide} />
          <TouchableOpacity style={[styles.themeBtn, isDark && styles.themeBtnDark]} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={isDark ? '#e7e9ea' : '#0f1419'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.mainCenter}>
          <View style={styles.logoWrap}>
            <TalkLogo style={authLogoStyle} />
          </View>
          <Text style={[styles.tagline, isDark && styles.textMuted]}>
            Переписка, группы и звонки в одном приложении.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.primaryBtnText}>Создать аккаунт Linkster</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, isDark && styles.secondaryBtnDark]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Login', { from: 'talk' })}
            >
              <Ionicons name="log-in-outline" size={20} color={talkBrand.accent} />
              <Text style={[styles.secondaryBtnText, isDark && styles.textLight]} numberOfLines={1}>
                Войти в аккаунт
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={[styles.orLine, isDark && styles.orLineDark]} />
              <Text style={[styles.orText, isDark && styles.textMuted]}>или</Text>
              <View style={[styles.orLine, isDark && styles.orLineDark]} />
            </View>

            <TouchableOpacity
              style={[styles.secondaryBtn, isDark && styles.secondaryBtnDark]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('AstraConnect')}
            >
              <Image source={require('../../assets/astra-mark.png')} style={styles.astraMark} resizeMode="contain" />
              <Text
                style={[styles.secondaryBtnText, styles.astraBtnText, isDark && styles.textLight]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.92}
              >
                Продолжить с аккаунтом Astra
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.legalFooter}>
          <View style={styles.legalLinksRow}>
            {FOOTER_LINKS.map((item, index) => (
              <View key={item.key} style={styles.legalLinkWrap}>
                {index > 0 ? <Text style={[styles.legalDot, isDark && styles.textMuted]}> · </Text> : null}
                <TouchableOpacity onPress={() => openFooterLink(item.key)} hitSlop={6}>
                  <Text style={[styles.legalLink, isDark && styles.legalLinkDark]}>{item.label}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <Text style={[styles.legalCopy, isDark && styles.textMuted]}>
            © 2026 Linkster · SyreksAI
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: linksterCanvas.light },
  pageDark: { backgroundColor: linksterCanvas.dark },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 44,
    marginBottom: 4,
  },
  topBarSide: { width: 44 },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 20, 25, 0.05)',
  },
  themeBtnDark: { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  mainCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
    paddingBottom: 12,
  },
  legalFooter: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  legalLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  legalLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalDot: {
    fontSize: 12,
    color: '#8b98a5',
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#536471',
  },
  legalLinkDark: {
    color: '#8b98a5',
  },
  legalCopy: {
    fontSize: 11,
    color: '#8b98a5',
    textAlign: 'center',
  },
  logoWrap: { width: '100%', alignItems: 'center', marginBottom: 2 },
  tagline: {
    textAlign: 'center',
    color: '#536471',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 4,
    marginBottom: 26,
    maxWidth: 360,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    width: '100%',
    minHeight: BTN_HEIGHT,
    backgroundColor: linksterPrimaryButton.backgroundColor,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: linksterPrimaryButton.textColor,
    fontWeight: '800',
    fontSize: 16,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(15, 20, 25, 0.1)',
  },
  orLineDark: { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  orText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b98a5',
    marginHorizontal: 14,
  },
  secondaryBtn: {
    width: '100%',
    minHeight: BTN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: talkBrand.accentBorder,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  secondaryBtnDark: {
    borderColor: talkBrand.accentBorder,
    backgroundColor: talkBrand.accentFill,
  },
  secondaryBtnText: {
    flexShrink: 1,
    color: '#0f1419',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  astraBtnText: { flexShrink: 1, maxWidth: '86%' },
  astraMark: {
    width: 23,
    height: 23,
    borderRadius: 6,
  },
  textMuted: { color: '#71767b' },
  textLight: { color: '#e7e9ea' },
});
