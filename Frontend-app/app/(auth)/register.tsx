import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthHeader } from '@/src/components/AuthHeader';
import { CosmosBackground } from '@/src/components/CosmosBackground';
import { GlassField } from '@/src/components/GlassField';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/theme/tokens';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!username.trim() || !email.trim() || password.length < 6) {
      setError('Заполните поля. Пароль — минимум 6 символов');
      return;
    }
    setBusy(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        full_name: fullName.trim() || username.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось зарегистрироваться');
    } finally {
      setBusy(false);
    }
  };

  return (
    <CosmosBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader />

          <View style={styles.hero}>
            <Text style={styles.title}>Создай свой{'\n'}орбит</Text>
            <Text style={styles.subtitle}>Регистрация займёт меньше минуты</Text>
          </View>

          <View style={styles.form}>
            <GlassField
              icon="user"
              placeholder="Имя пользователя"
              autoComplete="username"
              value={username}
              onChangeText={setUsername}
            />
            <GlassField
              icon="smile-o"
              placeholder="Имя (необязательно)"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <GlassField
              icon="envelope"
              placeholder="Email"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <GlassField
              icon="lock"
              placeholder="Пароль"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              rightIcon={showPassword ? 'eye-slash' : 'eye'}
              onRightPress={() => setShowPassword((v) => !v)}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.cta, busy && styles.ctaDisabled]}
              onPress={onSubmit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#04110f" />
              ) : (
                <Text style={styles.ctaText}>Создать аккаунт →</Text>
              )}
            </Pressable>

            <Text style={styles.footer}>
              Уже есть аккаунт?{' '}
              <Link href="/(auth)/login" style={styles.footerLink}>
                Войти
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </CosmosBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 12,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  cta: {
    height: 54,
    borderRadius: 999,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: '#04110f',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginTop: 10,
  },
  footerLink: {
    color: colors.teal,
    fontWeight: '700',
  },
});
