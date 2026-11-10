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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { AuthHeader } from '@/src/components/AuthHeader';
import { CosmosBackground } from '@/src/components/CosmosBackground';
import { GlassField } from '@/src/components/GlassField';
import { useAuth } from '@/src/context/AuthContext';
import { colors, spacing } from '@/src/theme/tokens';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось войти');
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
            <Text style={styles.title}>Твоя вселенная{'\n'}начинается здесь</Text>
            <Text style={styles.subtitle}>Войдите, чтобы продолжить своё путешествие</Text>
          </View>

          <View style={styles.form}>
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
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              rightIcon={showPassword ? 'eye-slash' : 'eye'}
              onRightPress={() => setShowPassword((v) => !v)}
            />

            <Pressable style={styles.forgot}>
              <Text style={styles.forgotText}>Забыли пароль?</Text>
            </Pressable>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.cta, busy && styles.ctaDisabled]}
              onPress={onSubmit}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#04110f" />
              ) : (
                <Text style={styles.ctaText}>Войти →</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>или войдите через</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              {(['google', 'apple', 'vk'] as const).map((name) => (
                <Pressable key={name} style={styles.socialBtn}>
                  <FontAwesome
                    name={name === 'google' ? 'google' : name === 'apple' ? 'apple' : 'vk'}
                    size={18}
                    color={colors.text}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.footer}>
              Нет аккаунта?{' '}
              <Link href="/(auth)/register" style={styles.footerLink}>
                Зарегистрироваться
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
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: 48,
    marginBottom: 28,
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
  forgot: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  forgotText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  footerLink: {
    color: colors.teal,
    fontWeight: '700',
  },
});
