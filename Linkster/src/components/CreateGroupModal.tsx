import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { apiPath, mediaUrl } from '../config/api';
import { getTalkColors } from '../theme/talkTheme';

type UserRow = { id: number; username: string; full_name?: string; avatar?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; user_ids: number[] }) => Promise<void>;
  isDark: boolean;
};

export default function CreateGroupModal({ visible, onClose, onCreate, isDark }: Props) {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'following' | 'followers'>('following');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible || !user?.username) return;
    setLoading(true);
    const path =
      tab === 'following'
        ? `/api/users/${user.username}/following`
        : `/api/users/${user.username}/followers`;
    fetch(apiPath(path), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [visible, tab, user?.username, token]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (u.full_name || '').toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
  }, [users, search]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canCreate = title.trim().length >= 1 && selected.size >= 1 && !creating;

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError('');
    try {
      await onCreate({ title: title.trim(), user_ids: Array.from(selected) });
      setTitle('');
      setSelected(new Set());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать группу');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.wrap, isDark && styles.wrapDark, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Отмена</Text>
          </TouchableOpacity>
          <Text style={[styles.title, isDark && styles.textDark]}>Новая группа</Text>
          <TouchableOpacity onPress={handleCreate} disabled={!canCreate}>
            <Text style={[styles.create, !canCreate && { opacity: 0.4 }]}>Создать</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.titleInput, isDark && styles.inputDark, isDark && styles.textDark]}
          placeholder="Название группы"
          placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
          value={title}
          onChangeText={setTitle}
        />

        <View style={styles.tabs}>
          {(['following', 'followers'] as const).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'following' ? 'Подписки' : 'Подписчики'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.search, isDark && styles.inputDark, isDark && styles.textDark]}
          placeholder="Поиск..."
          placeholderTextColor={isDark ? '#71767b' : '#8b98a5'}
          value={search}
          onChangeText={setSearch}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#1d9bf0" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const on = selected.has(item.id);
              return (
                <TouchableOpacity style={styles.userRow} onPress={() => toggle(item.id)}>
                  {item.avatar ? (
                    <Image source={{ uri: mediaUrl(item.avatar) ?? undefined }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFb}>
                      <Text style={styles.avatarLetter}>{item.username[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, isDark && styles.textDark]}>
                      {item.full_name || item.username}
                    </Text>
                    <Text style={styles.handle}>@{item.username}</Text>
                  </View>
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {creating ? <ActivityIndicator style={{ marginBottom: 12 }} color="#1d9bf0" /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  wrapDark: { backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cancel: { color: '#536471', fontSize: 16 },
  title: { fontWeight: '800', fontSize: 17, color: '#0f1419' },
  create: { color: '#1d9bf0', fontWeight: '700', fontSize: 16 },
  titleInput: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cfd9de',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputDark: {
    borderColor: getTalkColors(true).border,
    backgroundColor: getTalkColors(true).inputBg,
  },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  tabActive: { backgroundColor: 'rgba(29,155,240,0.15)' },
  tabText: { color: '#536471', fontWeight: '600' },
  tabTextActive: { color: '#1d9bf0' },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cfd9de',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7856ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#fff', fontWeight: '700' },
  userName: { fontWeight: '700', color: '#0f1419' },
  handle: { color: '#536471' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cfd9de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#1d9bf0', borderColor: '#1d9bf0' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 12 },
  error: { color: '#f91880', textAlign: 'center', margin: 8 },
  textDark: { color: '#e7e9ea' },
});
