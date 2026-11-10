import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { feed } from '@/src/theme/tokens';
import { HomeTopBar } from '@/src/components/home/HomeTopBar';
import { OrbitHeroBanner } from '@/src/components/home/OrbitHeroBanner';
import { ComposeBox } from '@/src/components/home/ComposeBox';
import { FeedTabRow, type FeedTabId } from '@/src/components/home/FeedTabRow';
import { OrbitPostCard, type OrbitPost } from '@/src/components/home/OrbitPostCard';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<OrbitPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTabId>('for-you');

  const load = useCallback(async () => {
    try {
      setError(null);
      let path = '/api/posts/';
      if (feedTab === 'following') path = '/api/posts/?feed=following';
      else if (feedTab === 'popular') path = '/api/posts/trending';

      const data = await apiFetch<OrbitPost[]>(path, { token });
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить ленту');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, feedTab]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onCompose = async (content: string) => {
    setPosting(true);
    try {
      const body = new FormData();
      body.append('content', content);
      await apiFetch('/api/posts/', { method: 'POST', token, body });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось опубликовать');
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: OrbitPost) => {
    const liked = !!post.liked_by_me;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              liked_by_me: !liked,
              likes_count: Math.max(0, (p.likes_count ?? 0) + (liked ? -1 : 1)),
            }
          : p,
      ),
    );
    try {
      await apiFetch(`/api/posts/${post.id}/like`, {
        method: liked ? 'DELETE' : 'POST',
        token,
      });
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                liked_by_me: liked,
                likes_count: Math.max(0, (p.likes_count ?? 0) + (liked ? 1 : -1)),
              }
            : p,
        ),
      );
    }
  };

  const header = (
    <View style={{ paddingTop: insets.top + 6 }}>
      <HomeTopBar avatarUrl={user?.avatar} />
      <OrbitHeroBanner />
      <FeedTabRow active={feedTab} onChange={setFeedTab} />
      <ComposeBox busy={posting} avatarUrl={user?.avatar} onSubmit={onCompose} />
      {error && posts.length === 0 ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      {loading && posts.length === 0 ? (
        <View style={styles.center}>
          {header}
          <ActivityIndicator color={feed.teal} style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={feed.teal}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error || 'Пока тихо. Напишите, что у вас нового.'}
            </Text>
          }
          renderItem={({ item }) => (
            <OrbitPostCard post={item} onLike={() => toggleLike(item)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    color: feed.muted,
    marginTop: 24,
    marginHorizontal: 24,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    fontSize: 12,
  },
});
