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
import { useAuth } from '../context/AuthContext';
import TalkLogo from '../components/TalkLogo';
import { authLogoStyle } from '../theme/authLogoStyle';
import { getTalkColors, linksterCanvas, linksterPrimaryButton, talkBrand } from '../theme/talkTheme';

export default function RegisterScreen({ navigation }: { navigation: any }) {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [showServer, setShowServer] = useState(false);

  const { register, theme, apiBaseUrl, setApiBaseUrl } = useAuth();
  const isDark = theme === 'dark';

  useEffect(() => {
    setServerUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const handleChange = (name: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const emailLooksValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    setError('');
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Заполните имя пользователя, email и пароль');
      return;
    }
    if (!emailLooksValid(formData.email.trim())) {
      setError('Некорректный email. Пример: name@gmail.com');
      return;
    }
    if (formData.password.length < 6) {
      setError('Пароль не короче 6 символов');
      return;
    }
    setLoading(true);
    try {
      const urlToUse = (serverUrl.trim() || apiBaseUrl).trim();
      if (urlToUse) {
        await setApiBaseUrl(urlToUse);
      }
      await register({
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim() || undefined,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.page, isDark && styles.pageDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.navigate('Welcome')}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#e7e9ea' : '#0f1419'} />
        </TouchableOpacity>

        <View style={styles.container}>
          <View style={styles.headerBlock}>
            <View style={styles.logoWrap}>
              <TalkLogo style={authLogoStyle} />
            </View>
            <Text style={[styles.subtitle, isDark && styles.textMutedDark]}>
              Новый аккаунт Linkster на том же сервере — один логин для чатов и ленты.
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, isDark && styles.errorBoxDark]}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Имя пользователя</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={formData.username}
                onChangeText={(text) => handleChange('username', text)}
                placeholder="Выберите никнейм"
                placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Полное имя (опционально)</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={formData.full_name}
                onChangeText={(text) => handleChange('full_name', text)}
                placeholder="Ваше полное имя"
                placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Email</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                placeholder="name@gmail.com"
                placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>Пароль</Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={formData.password}
                onChangeText={(text) => handleChange('password', text)}
                placeholder="Минимум 6 символов"
                placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
                secureTextEntry
              />
            </View>

            <Text style={[styles.serverHint, isDark && styles.textMutedDark]}>
              Сервер: {apiBaseUrl}
            </Text>
            <TouchableOpacity onPress={() => setShowServer((v) => !v)}>
              <Text style={styles.serverLink}>
                {showServer ? 'Скрыть адрес сервера' : 'Изменить адрес сервера'}
              </Text>
            </TouchableOpacity>

            {showServer ? (
              <View style={styles.formGroup}>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  placeholder="http://192.168.1.104"
                  placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
                  autoCapitalize="none"
                />
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.buttonRow, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#001018" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Создаём аккаунт…</Text>
                </>
              ) : (
                <Text style={styles.buttonText}>Создать аккаунт Linkster</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, isDark && styles.textMutedDark]}>Уже есть аккаунт? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login', { from: 'talk' })}>
              <Text style={styles.linkText}>Войти</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: linksterCanvas.light },
  pageDark: { backgroundColor: linksterCanvas.dark },
  back: { marginBottom: 8, alignSelf: 'flex-start' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  container: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  headerBlock: { alignItems: 'center', marginBottom: 24, width: '100%' },
  logoWrap: { width: '100%', alignItems: 'center', marginBottom: 4 },
  subtitle: {
    fontSize: 14,
    color: '#536471',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(249, 24, 128, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(249, 24, 128, 0.15)',
    padding: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorBoxDark: {
    backgroundColor: 'rgba(249, 24, 128, 0.08)',
    borderColor: 'rgba(249, 24, 128, 0.2)',
  },
  errorText: { color: '#f91880', fontSize: 13, textAlign: 'center' },
  form: { width: '100%' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#0f1419', marginBottom: 6 },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
  button: {
    paddingVertical: 15,
    backgroundColor: linksterPrimaryButton.backgroundColor,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonRow: { flexDirection: 'row' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: linksterPrimaryButton.textColor, fontSize: 16, fontWeight: '800' },
  serverHint: { fontSize: 12, color: '#536471', marginBottom: 6 },
  serverLink: { color: talkBrand.accentPressed, fontWeight: '600', marginBottom: 12, fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14, color: '#536471' },
  linkText: { fontSize: 14, color: talkBrand.accentPressed, fontWeight: '600' },
  textDark: { color: '#e7e9ea' },
  textMutedDark: { color: '#71767b' },
});
