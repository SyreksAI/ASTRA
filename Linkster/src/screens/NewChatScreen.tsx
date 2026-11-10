import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreateGroupModal from '../components/CreateGroupModal';
import NewContactSheet from '../components/NewContactSheet';
import { useAuth } from '../context/AuthContext';
import { apiPath, mediaUrl } from '../config/api';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';
import OrbitScreenScaffold from '../features/messenger/ui/OrbitScreenScaffold';
import OrbitPageHeader from '../features/messenger/ui/OrbitPageHeader';
import { glassPanel } from '../features/messenger/theme/orbitTheme';
import {
  loadLocalContacts,
  localContactDisplayName,
  type LocalContact,
} from '../utils/localContacts';

type AstraUser = {
  id: number;
  username: string;
  full_name?: string;
  avatar?: string;
};

type ListRow =
  | { key: string; kind: 'action'; action: 'group' | 'channel' }
  | { key: string; kind: 'section'; title: string }
  | { key: string; kind: 'user'; user: AstraUser }
  | { key: string; kind: 'local'; contact: LocalContact };

export default function NewChatScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { token, user: me } = useAuth();
  const { isDark, colors: c } = useTalkTheme();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [following, setFollowing] = useState<AstraUser[]>([]);
  const [searchUsers, setSearchUsers] = useState<AstraUser[]>([]);
  const [localContacts, setLocalContacts] = useState<LocalContact[]>([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reloadContacts = useCallback(async () => {
    const local = await loadLocalContacts();
    setLocalContacts(local);
  }, []);

  const loadFollowing = useCallback(async () => {
    setLoading(true);
    try {
      const [followRes] = await Promise.all([
        fetch(apiPath('/api/users/me/following'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        reloadContacts(),
      ]);
      if (followRes.ok) {
        const data = await followRes.json();
        setFollowing(Array.isArray(data) ? data : []);
      }
    } catch {
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  }, [token, reloadContacts]);

  useEffect(() => {
    loadFollowing();
  }, [loadFollowing]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchUsers([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetch(apiPath(`/api/users/search?q=${encodeURIComponent(q)}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setSearchUsers(Array.isArray(data) ? data : []))
        .catch(() => setSearchUsers([]))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, token]);

  const openChatWithUser = async (other: AstraUser) => {
    if (other.id === me?.id) {
      Alert.alert('Это вы', 'Нельзя начать чат с самим собой');
      return;
    }
    try {
      const res = await fetch(apiPath('/api/chat/conversations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: other.id }),
      });
      if (!res.ok) throw new Error('chat');
      const conv = await res.json();
      navigation.navigate('MainTabs', {
        screen: 'Orbit',
        params: {
          screen: 'MessengerRoot',
          params: { openConversationId: conv.id },
        },
      });
      navigation.goBack();
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть чат');
    }
  };

  const handleCreateGroup = async (payload: { title: string; user_ids: number[] }) => {
    const res = await fetch(apiPath('/api/chat/conversations/group'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.detail || 'Не удалось создать группу');
    }
    const conv = await res.json();
    navigation.navigate('MainTabs', {
      screen: 'Orbit',
      params: {
        screen: 'MessengerRoot',
        params: { openConversationId: conv.id },
      },
    });
    navigation.goBack();
  };

  const filteredFollowing = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return following;
    return following.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q)
    );
  }, [following, query]);

  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return localContacts;
    return localContacts.filter((contact) => {
      const name = localContactDisplayName(contact).toLowerCase();
      return name.includes(q) || contact.phone.includes(q);
    });
  }, [localContacts, query]);

  const listData = useMemo((): ListRow[] => {
    const rows: ListRow[] = [
      { key: 'action-group', kind: 'action', action: 'group' },
      { key: 'action-channel', kind: 'action', action: 'channel' },
    ];

    const q = query.trim();
    if (q && searchUsers.length) {
      rows.push({ key: 'sec-search', kind: 'section', title: 'Глобальный поиск' });
      searchUsers.forEach((u) => rows.push({ key: `search-${u.id}`, kind: 'user', user: u }));
    }

    if (filteredLocal.length) {
      rows.push({ key: 'sec-local', kind: 'section', title: 'Контакты' });
      filteredLocal.forEach((contact) =>
        rows.push({ key: contact.id, kind: 'local', contact })
      );
    }

    if (filteredFollowing.length) {
      rows.push({ key: 'sec-following', kind: 'section', title: 'Подписки' });
      filteredFollowing.forEach((u) => rows.push({ key: `user-${u.id}`, kind: 'user', user: u }));
    }

    return rows;
  }, [query, searchUsers, filteredLocal, filteredFollowing]);

  const renderRow = ({ item }: { item: ListRow }) => {
    if (item.kind === 'action') {
      const isGroup = item.action === 'group';
      return (
        <TouchableOpacity
          style={[styles.actionRow, glassPanel(isDark), styles.glassRow]}
          activeOpacity={0.7}
          onPress={() =>
            isGroup ? setGroupOpen(true) : Alert.alert('Linkster', 'Каналы скоро будут доступны.')
          }
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: isGroup ? talkBrand.accentSoft : 'rgba(175, 82, 222, 0.2)' },
            ]}
          >
            <Ionicons
              name={isGroup ? 'people' : 'megaphone'}
              size={22}
              color={isGroup ? talkBrand.accent : '#AF52DE'}
            />
          </View>
          <Text style={[styles.actionLabel, { color: c.text }]}>
            {isGroup ? 'Создать группу' : 'Создать канал'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={c.textMuted} />
        </TouchableOpacity>
      );
    }

    if (item.kind === 'section') {
      return (
        <Text style={[styles.section, { color: c.textSecondary }]}>{item.title}</Text>
      );
    }

    if (item.kind === 'local') {
      const title = localContactDisplayName(item.contact);
      return (
        <TouchableOpacity
          style={[styles.personRow, glassPanel(isDark), styles.glassRow]}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              title,
              `${item.contact.phone}\n\nЭто локальный контакт. Чтобы написать в Linkster, найдите пользователя по имени в поиске.`
            )
          }
        >
          <View style={[styles.avatar, { backgroundColor: talkBrand.accentSoft }]}>
            <Text style={[styles.avatarLetter, { color: talkBrand.accent }]}>
              {title[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.personBody}>
            <Text style={[styles.personName, { color: c.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.personSub, { color: c.textSecondary }]} numberOfLines={1}>
              {item.contact.phone}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    const u = item.user;
    const title = u.full_name || u.username;
    return (
      <TouchableOpacity
        style={[styles.personRow, glassPanel(isDark), styles.glassRow]}
        activeOpacity={0.7}
        onPress={() => openChatWithUser(u)}
      >
        <View style={[styles.avatar, { backgroundColor: talkBrand.accentSoft }]}>
          {u.avatar ? (
            <Image source={{ uri: mediaUrl(u.avatar) ?? undefined }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarLetter, { color: talkBrand.accent }]}>
              {title[0]?.toUpperCase() ?? '?'}
            </Text>
          )}
        </View>
        <View style={styles.personBody}>
          <Text style={[styles.personName, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.personSub, { color: c.textSecondary }]} numberOfLines={1}>
            @{u.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <OrbitScreenScaffold isDark={isDark}>
      <OrbitPageHeader
        isDark={isDark}
        kicker="Новый диалог"
        title="Кому написать?"
        subtitle="Поиск по Linkster, ваши контакты или новая группа."
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity style={styles.headerBtn} onPress={() => setContactSheetOpen(true)}>
            <Ionicons name="person-add-outline" size={24} color={isDark ? '#E8F4F2' : '#0A1628'} />
          </TouchableOpacity>
        }
      />

      <View style={[styles.searchWrap, glassPanel(isDark), styles.searchGlass]}>
        <Ionicons name="search" size={18} color={talkBrand.accent} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#E8F4F2' : '#0F172A' }]}
          placeholder="Имя, @username или телефон"
          placeholderTextColor={isDark ? '#4A6570' : '#94A3B8'}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoFocus
        />
        {query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={isDark ? '#6B8A94' : '#94A3B8'} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={talkBrand.accent} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.key}
          renderItem={renderRow}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            searchLoading ? (
              <View style={styles.searchLoader}>
                <ActivityIndicator size="small" color={talkBrand.accent} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={[styles.empty, { color: c.textMuted }]}>
              {query ? 'Никого не найдено' : 'Добавьте контакт или найдите пользователя Linkster'}
            </Text>
          }
        />
      )}

      <CreateGroupModal
        visible={groupOpen}
        onClose={() => setGroupOpen(false)}
        isDark={isDark}
        onCreate={handleCreateGroup}
      />

      <TouchableOpacity
        style={[styles.contactFab, { bottom: insets.bottom + 20 }]}
        activeOpacity={0.9}
        onPress={() => setContactSheetOpen(true)}
        accessibilityLabel="Новый контакт"
      >
        <Ionicons name="person-add" size={26} color={talkBrand.onAccent} />
      </TouchableOpacity>

      <NewContactSheet
        visible={contactSheetOpen}
        onClose={() => setContactSheetOpen(false)}
        onCreated={reloadContacts}
      />
    </OrbitScreenScaffold>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 10,
    paddingHorizontal: 4,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    gap: 8,
  },
  searchGlass: { marginTop: 0 },
  glassRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchLoader: { paddingVertical: 12, alignItems: 'center' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  section: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 20, fontWeight: '700' },
  personBody: { flex: 1, minWidth: 0 },
  personName: { fontSize: 16, fontWeight: '600' },
  personSub: { fontSize: 14, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, paddingHorizontal: 24, fontSize: 15 },
  contactFab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: talkBrand.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
