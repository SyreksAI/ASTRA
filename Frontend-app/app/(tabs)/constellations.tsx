import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { colors, feed, spacing } from '@/src/theme/tokens';

type Constellation = {
  id: string;
  name?: string;
  label?: string;
  description?: string | null;
  members_count?: number;
  joined?: boolean;
};

const FALLBACK: Constellation[] = [
  { id: 'dev', label: 'Разработка', description: 'Код, архитектура, инструменты', members_count: 28100 },
  { id: 'design', label: 'Дизайн', description: 'UI/UX и визуальный язык', members_count: 17300 },
  { id: 'tech', label: 'Технологии', description: 'AI, гаджеты, стартапы', members_count: 31200 },
  { id: 'music', label: 'Музыка', description: 'Треки и плейлисты', members_count: 22000 },
];

export default function ConstellationsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [items, setItems] = useState<Constellation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Constellation[]>('/api/constellations/', { token });
      setItems(Array.isArray(data) && data.length ? data : FALLBACK);
    } catch {
      setItems(FALLBACK);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const formatMembers = (n?: number) => {
    if (!n) return '—';
    if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.0', '')}K`;
    return String(n);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <StatusBar style="dark" />
      <Text style={styles.heading}>Созвездия</Text>
      <Text style={styles.sub}>Исследуй интересы и находи своих</Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={colors.teal}
            />
          }
          renderItem={({ item }) => {
            const title = item.label || item.name || item.id;
            return (
              <Pressable
                style={[styles.card, selectedId === item.id && styles.cardActive]}
                onPress={() => setSelectedId(item.id)}
              >
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{title.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{title}</Text>
                  {item.description ? (
                    <Text style={styles.desc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={styles.members}>{formatMembers(item.members_count)} участников</Text>
                </View>
                {item.joined ? (
                  <Text style={styles.joined}>Вы в нём</Text>
                ) : (
                  <Text style={styles.open}>Открыть</Text>
                )}
              </Pressable>
            );
          }}
        />
      )}
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
  },
  sub: {
    color: feed.muted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: feed.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: feed.border,
    padding: 14,
  },
  cardActive: {
    borderColor: colors.teal,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: feed.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.teal,
    fontWeight: '800',
    fontSize: 18,
  },
  title: {
    color: feed.text,
    fontSize: 16,
    fontWeight: '800',
  },
  desc: {
    color: feed.muted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  members: {
    color: feed.muted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  joined: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
  },
  open: {
    color: feed.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
