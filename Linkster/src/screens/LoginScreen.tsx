import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import TalkLogo from '../components/TalkLogo';
import { authLogoStyle } from '../theme/authLogoStyle';
import { getTalkColors, linksterCanvas, linksterPrimaryButton, talkBrand } from '../theme/talkTheme';

type LoginFrom = 'talk' | 'astra';

export default function LoginScreen({ navigation }: any) {
  const route = useRoute();
  const from: LoginFrom = (route.params as { from?: LoginFrom } | undefined)?.from ?? 'talk';
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

  const handleSubmit = async () => {
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
          <Text style={[styles.subtitle, isDark && styles.textMuted]}>
            {from === 'astra'
              ? 'Email и пароль от соцсети Astra — чаты и контакты подтянутся автоматически.'
              : 'Введите email и пароль аккаунта Linkster.'}
          </Text>

          {error ? (
            <View style={[styles.errorBox, isDark && styles.errorBoxDark]}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                {from === 'astra' ? 'Email Astra' : 'Email'}
              </Text>
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
              <Text style={[styles.label, isDark && styles.textDark]}>Пароль</Text>
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
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#001018" />
              ) : (
                <Text style={styles.buttonText}>Войти</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>Нет аккаунта? Создать</Text>
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
  subtitle: { fontSize: 14, color: '#536471', lineHeight: 20, marginBottom: 20, textAlign: 'center' },
  errorBox: {
    backgroundColor: 'rgba(249, 24, 128, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(249, 24, 128, 0.15)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBoxDark: { backgroundColor: 'rgba(249, 24, 128, 0.08)' },
  errorText: { color: '#f91880', fontSize: 13, textAlign: 'center' },
  form: { width: '100%' },
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
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: linksterPrimaryButton.textColor, fontSize: 16, fontWeight: '800' },
  footerLink: { marginTop: 24, textAlign: 'center', color: talkBrand.accentPressed, fontWeight: '600' },
  textDark: { color: '#e7e9ea' },
  textMuted: { color: '#71767b' },
});
