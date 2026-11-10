import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { feed } from '@/src/theme/tokens';
import { resolveMediaUrl } from '@/src/api/client';

type Props = {
  busy?: boolean;
  avatarUrl?: string | null;
  onSubmit: (text: string) => Promise<void> | void;
};

export function ComposeBox({ busy, avatarUrl, onSubmit }: Props) {
  const [text, setText] = useState('');
  const uri = resolveMediaUrl(avatarUrl);

  const send = async () => {
    const value = text.trim();
    if (!value || busy) return;
    await onSubmit(value);
    setText('');
  };

  return (
    <View style={styles.card}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <FontAwesome name="user" size={13} color="#fff" />
        </View>
      )}

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Что у тебя нового?"
        placeholderTextColor="#8B95A5"
        style={styles.input}
        onSubmitEditing={send}
        returnKeyType="send"
      />

      <View style={styles.tools}>
        <FontAwesome name="image" size={15} color="#8B95A5" />
        <FontAwesome name="bar-chart" size={15} color="#8B95A5" />
        <FontAwesome name="smile-o" size={15} color="#8B95A5" />
      </View>

      {text.trim() ? (
        <Pressable style={styles.send} onPress={send} disabled={busy}>
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="arrow-up" size={12} color="#fff" />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
    shadowColor: '#0B1220',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: feed.text,
    fontSize: 14,
    padding: 0,
  },
  tools: {
    flexDirection: 'row',
    gap: 12,
  },
  send: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
