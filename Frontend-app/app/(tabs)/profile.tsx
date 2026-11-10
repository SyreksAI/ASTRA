import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveMediaUrl } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { API_BASE_URL } from '@/src/api/config';
import { colors, feed, spacing } from '@/src/theme/tokens';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const avatar = resolveMediaUrl(user?.avatar);
  const initial = (user?.full_name || user?.username || 'A').charAt(0).toUpperCase();

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 }]}>
      <StatusBar style="dark" />
      <Text style={styles.heading}>Профиль</Text>

      <View style={styles.card}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.full_name || user?.username}</Text>
        <Text style={styles.handle}>@{user?.username}</Text>
        {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>API</Text>
        <Text style={styles.metaValue}>{API_BASE_URL}</Text>
      </View>

      <Pressable style={styles.logout} onPress={() => logout()}>
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: feed.bg,
    paddingHorizontal: spacing.md,
  },
  heading: {
    color: feed.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  card: {
    backgroundColor: feed.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: feed.border,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 8,
  },
  avatarFallback: {
    backgroundColor: feed.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.teal,
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    color: feed.text,
    fontSize: 22,
    fontWeight: '800',
  },
  handle: {
    color: feed.muted,
    fontSize: 14,
  },
  bio: {
    color: feed.text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  email: {
    color: feed.muted,
    fontSize: 12,
    marginTop: 4,
  },
  metaCard: {
    marginTop: 14,
    backgroundColor: feed.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: feed.border,
    padding: 14,
  },
  metaLabel: {
    color: feed.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaValue: {
    color: feed.text,
    fontSize: 13,
  },
  logout: {
    marginTop: 'auto',
    height: 52,
    borderRadius: 999,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 15,
  },
});
