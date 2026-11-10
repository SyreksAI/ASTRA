import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinksterHubTopBar from './LinksterHubTopBar';
import { getTalkColors, talkBrand } from '../../../theme/talkTheme';
import { linksterDarkHub } from '../theme/linksterDarkHub';
import type { Conversation } from '../../chat/types';
import MessengerMeshBackground from './MessengerMeshBackground';
import OrbitConversationTile from './OrbitConversationTile';
import LinksterStoriesRow from './LinksterStoriesRow';
import LinksterEmptyState from './LinksterEmptyState';
import { pickStoryConversations } from '../demo/linksterDemoHub';
import {
  buildStoryUsersFromConversations,
  findStoryUserIndex,
} from '../demo/linksterDemoStories';
import LinksterStoryViewer from './LinksterStoryViewer';
import type { StoryOriginRect } from './storyOrigin';
import {
  loadViewedStoryUserIds,
  markStoryUserViewed,
  persistViewedStoryUserIds,
} from '../demo/linksterStoryViewed';

type Props = {
  isDark: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  conversations: Conversation[];
  loading: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onOpenConversation: (item: Conversation) => void;
  onNewChat: () => void;
  listHeader?: React.ReactNode;
};

export default function MessengerOrbitHub({
  isDark,
  searchQuery,
  onSearchChange,
  conversations,
  loading,
  refreshing = false,
  onRefresh,
  onOpenConversation,
  onNewChat,
  listHeader,
}: Props) {
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const [storyDismissOrigin, setStoryDismissOrigin] = useState<StoryOriginRect | null>(null);
  const storyOriginsRef = useRef<Map<string, StoryOriginRect>>(new Map());
  const [viewedStoryUserIds, setViewedStoryUserIds] = useState<Set<string>>(() => new Set());
  const c = getTalkColors(isDark);

  useEffect(() => {
    loadViewedStoryUserIds().then(setViewedStoryUserIds).catch(() => {});
  }, []);

  const handleStoryUserViewed = useCallback((userId: string) => {
    setViewedStoryUserIds((prev) => {
      const next = markStoryUserViewed(prev, userId);
      if (next.size === prev.size) return prev;
      persistViewedStoryUserIds(next).catch(() => {});
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((item) => {
      const name = item.display_name || item.user?.full_name || item.user?.username || '';
      return name.toLowerCase().includes(q) || (item.last_message || '').toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  const storyConversations = useMemo(
    () => pickStoryConversations(conversations),
    [conversations]
  );

  const storyUsers = useMemo(
    () => buildStoryUsersFromConversations(storyConversations),
    [storyConversations]
  );

  const registerStoryOrigin = useCallback((conversationId: string, origin: StoryOriginRect) => {
    storyOriginsRef.current.set(conversationId, origin);
  }, []);

  const openUserStory = useCallback(
    (item: Conversation, _indexInRow: number, origin: StoryOriginRect) => {
      const id = String(item.id);
      storyOriginsRef.current.set(id, origin);
      const idx = findStoryUserIndex(storyUsers, item.id);
      if (idx >= 0) {
        setStoryDismissOrigin(origin);
        setStoryViewerIndex(idx);
      }
    },
    [storyUsers]
  );

  const handleActiveStoryUser = useCallback((userId: string) => {
    const origin = storyOriginsRef.current.get(userId);
    if (origin) setStoryDismissOrigin(origin);
  }, []);

  const closeStoryViewer = useCallback(() => {
    setStoryViewerIndex(null);
    setStoryDismissOrigin(null);
  }, []);

  const searchBg = isDark ? c.inputBg : '#F3F4F6';

  return (
    <View style={styles.root}>
      <MessengerMeshBackground isDark={isDark} variant="hub" />

      <LinksterHubTopBar
        isDark={isDark}
        right={
          <>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearchOpen((v) => !v)}
              style={styles.searchHit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="search-outline"
                size={26}
                color={isDark ? linksterDarkHub.textPrimary : '#111827'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onNewChat}
              style={[styles.addFab, isDark ? styles.addFabDark : styles.addFabLight]}
            >
              <Ionicons
                name="add"
                size={22}
                color={isDark ? linksterDarkHub.buttonIcon : '#3A3A3C'}
              />
            </TouchableOpacity>
          </>
        }
      />

      {searchOpen ? (
        <View style={styles.searchWrap}>
          <View style={[styles.search, { backgroundColor: searchBg }]}>
            <Ionicons name="search" size={18} color={isDark ? '#6B8A94' : '#9CA3AF'} />
            <TextInput
              value={searchQuery}
              onChangeText={onSearchChange}
              placeholder="Поиск"
              placeholderTextColor={isDark ? '#4A6570' : '#9CA3AF'}
              style={[styles.searchInput, { color: c.text }]}
              autoCapitalize="none"
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Ionicons name="close-circle" size={18} color={isDark ? '#6B8A94' : '#9CA3AF'} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={talkBrand.accentBright} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 88,
            paddingTop: 4,
            flexGrow: filtered.length === 0 ? 1 : undefined,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={talkBrand.accentBright}
                colors={[talkBrand.accentBright]}
              />
            ) : undefined
          }
          ListHeaderComponent={
            <>
              {listHeader}
              <LinksterStoriesRow
                isDark={isDark}
                conversations={storyConversations}
                viewedStoryUserIds={viewedStoryUserIds}
                onPressStory={onNewChat}
                onPressContact={onOpenConversation}
                onPressUserStory={openUserStory}
                onRegisterStoryOrigin={registerStoryOrigin}
              />
            </>
          }
          ListEmptyComponent={
            <LinksterEmptyState
              isDark={isDark}
              title="Пока нет диалогов"
              subtitle="Начните переписку — чаты появятся здесь. Свайп вниз обновит список."
              actionLabel="Новый чат"
              onAction={onNewChat}
            />
          }
          ItemSeparatorComponent={() =>
            isDark ? (
              <View style={[styles.separator, { backgroundColor: linksterDarkHub.separator }]} />
            ) : null
          }
          renderItem={({ item, index }) => (
            <OrbitConversationTile
              item={item}
              index={index}
              isDark={isDark}
              onPress={() => onOpenConversation(item)}
            />
          )}
        />
      )}
      <LinksterStoryViewer
        visible={storyViewerIndex != null && storyUsers.length > 0}
        users={storyUsers}
        initialUserIndex={storyViewerIndex ?? 0}
        originRect={storyDismissOrigin}
        onActiveUserChange={handleActiveStoryUser}
        onClose={closeStoryViewer}
        onUserViewed={handleStoryUserViewed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchHit: { padding: 2 },
  addFab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFabLight: {
    backgroundColor: '#ECECF0',
  },
  addFabDark: {
    backgroundColor: linksterDarkHub.buttonBg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 76,
    marginRight: 16,
  },
  searchWrap: { paddingHorizontal: 16, marginBottom: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
