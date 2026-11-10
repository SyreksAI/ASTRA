import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { feed } from '@/src/theme/tokens';

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publish = async () => {
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('content', content);
      await apiFetch('/api/posts/', { method: 'POST', token, body });
      setText('');
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось опубликовать');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Новая публикация</Text>
      <Text style={styles.sub}>Поделитесь мыслью с вашей орбитой</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Что сейчас занимает твои мысли?"
        placeholderTextColor={feed.muted}
        multiline
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.cta, (!text.trim() || busy) && styles.ctaDisabled]}
        onPress={publish}
        disabled={!text.trim() || busy}
      >
        {busy ? (
          <ActivityIndicator color="#04110f" />
        ) : (
          <Text style={styles.ctaText}>Опубликовать</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: feed.bg,
    paddingHorizontal: 18,
  },
  title: {
    color: feed.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    color: feed.muted,
    fontSize: 14,
    marginBottom: 18,
  },
  input: {
    minHeight: 160,
    backgroundColor: feed.card,
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    color: feed.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: feed.border,
  },
  error: {
    color: '#ef4444',
    marginTop: 10,
    fontSize: 13,
  },
  cta: {
    marginTop: 18,
    backgroundColor: feed.teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#04110f',
    fontWeight: '800',
    fontSize: 15,
  },
});
