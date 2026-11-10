import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import TalkLogo from '../components/TalkLogo';
import { authLogoStyle } from '../theme/authLogoStyle';
import { getTalkColors, linksterCanvas, linksterPrimaryButton, talkBrand } from '../theme/talkTheme';

/**
 * Вход через аккаунт Astra.
 * TODO: OAuth / подтверждение в приложении соцсети Astra.
 */
export default function AstraConnectScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showServer, setShowServer] = useState(false);

  const { login, theme, apiBaseUrl, setApiBaseUrl } = useAuth();
  const isDark = theme === 'dark';

  useEffect(() => {
    setServerUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    setLoading(true);
    try {
      if (serverUrl.trim()) {
        await setApiBaseUrl(serverUrl);
      }
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const onOAuthSoon = () => {
    setError('Подтверждение в приложении Astra появится в следующем обновлении.');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.page, isDark && styles.pageDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Welcome')}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#e7e9ea' : '#0f1419'} />
        </TouchableOpacity>

        <View style={styles.container}>
          <View style={styles.logoWrap}>
            <TalkLogo style={authLogoStyle} />
          </View>

          <View style={styles.astraRow}>
            <Image source={require('../../assets/astra-mark.png')} style={styles.astraMark} />
            <Text style={[styles.title, isDark && styles.textLight]}>Аккаунт Astra</Text>
          </View>

          <Text style={[styles.subtitle, isDark && styles.textMuted]}>
            Скоро здесь будет подтверждение входа в приложении Astra. Пока используйте email и пароль от
            соцсети.
          </Text>

          <TouchableOpacity
            style={[styles.oauthBtn, isDark && styles.oauthBtnDark]}
            onPress={onOAuthSoon}
            activeOpacity={0.85}
          >
            <Image source={require('../../assets/astra-mark.png')} style={styles.oauthMark} />
            <Text style={[styles.oauthBtnText, isDark && styles.textLight]}>
              Подтвердить в Astra (скоро)
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
            <Text style={[styles.dividerText, isDark && styles.textMuted]}>сейчас</Text>
            <View style={[styles.dividerLine, isDark && styles.dividerLineDark]} />
          </View>

          {error ? (
            <View style={[styles.errorBox, isDark && styles.errorBoxDark]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.textLight]}>Email Astra</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, isDark && styles.textLight]}>Пароль</Text>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль"
              placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
              secureTextEntry
            />
          </View>

          <TouchableOpacity onPress={() => setShowServer((v) => !v)}>
            <Text style={styles.serverLink}>
              {showServer ? 'Скрыть адрес сервера' : 'Настроить адрес сервера'}
            </Text>
          </TouchableOpacity>

          {showServer ? (
            <View style={styles.formGroup}>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.104:8000"
                placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#001018" />
            ) : (
              <Text style={styles.buttonText}>Войти</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footer}>
            <Text style={[styles.footerText, isDark && styles.textMuted]}>
              Нет аккаунта? <Text style={styles.footerLink}>Создать Linkster</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: linksterCanvas.light },
  pageDark: { backgroundColor: linksterCanvas.dark },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 48 },
  back: { marginBottom: 8, alignSelf: 'flex-start' },
  container: { maxWidth: 400, width: '100%', alignSelf: 'center', alignItems: 'stretch' },
  logoWrap: { width: '100%', alignItems: 'center', marginBottom: 4 },
  astraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  astraMark: { width: 28, height: 28, borderRadius: 7 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f1419' },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#536471',
    marginBottom: 18,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: talkBrand.accentBorder,
    backgroundColor: talkBrand.accentFill,
    marginBottom: 16,
  },
  oauthBtnDark: { backgroundColor: talkBrand.accentFill },
  oauthMark: { width: 22, height: 22, borderRadius: 5 },
  oauthBtnText: { fontWeight: '700', fontSize: 15, color: '#0f1419' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(15,20,25,0.1)' },
  dividerLineDark: { backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#8b98a5',
    textTransform: 'uppercase',
  },
  errorBox: {
    backgroundColor: 'rgba(249, 24, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(249, 24, 128, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorBoxDark: { backgroundColor: 'rgba(249, 24, 128, 0.12)' },
  errorText: { color: '#f91880', fontSize: 13, textAlign: 'center' },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#0f1419', marginBottom: 6 },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    fontSize: 15,
    backgroundColor: getTalkColors(false).inputBg,
    color: '#0f1419',
  },
  inputDark: {
    backgroundColor: getTalkColors(true).inputBg,
    borderColor: getTalkColors(true).border,
    color: getTalkColors(true).text,
  },
  serverLink: { color: talkBrand.accentPressed, fontWeight: '600', marginBottom: 12, fontSize: 13 },
  button: {
    paddingVertical: 15,
    backgroundColor: linksterPrimaryButton.backgroundColor,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: linksterPrimaryButton.textColor, fontSize: 16, fontWeight: '800' },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#536471' },
  footerLink: { color: talkBrand.accentPressed, fontWeight: '700' },
  textMuted: { color: '#71767b' },
  textLight: { color: '#e7e9ea' },
});
