import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { apiPath, fetchWithTimeout } from '../config/api';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';
import { navigateMessengerTab, navigateRoot } from '../navigation/rootNavigation';
import UserAvatar from '../components/ui/UserAvatar';
type Profile = {
  id: number;
  username: string;
  full_name?: string;
  bio?: string;
  avatar?: string;
  cover_image?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_me?: boolean;
  created_at?: string;
};

function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return 'был(а) давно';
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diffMin < 5) return 'был(а) только что';
  if (diffMin < 60) return 'был(а) недавно';
  if (diffMin < 60 * 24) return 'был(а) сегодня';
  if (diffMin < 60 * 24 * 7) return 'был(а) на этой неделе';
  return 'был(а) давно';
}

function formatJoined(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function ProfileInfoRow({
  value,
  label,
  textColor,
  labelColor,
}: {
  value: string;
  label: string;
  textColor: string;
  labelColor: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
  surfaceColor,
  textColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  surfaceColor: string;
  textColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionTile, { backgroundColor: surfaceColor }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <Ionicons name={icon} size={22} color={textColor} />
      <Text style={[styles.actionTileLabel, { color: textColor }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function authUserToProfile(me: Record<string, unknown>, isMe = true): Profile {
  const idRaw = me.id;
  const id =
    typeof idRaw === 'number' ? idRaw : typeof idRaw === 'string' ? Number(idRaw) || 0 : 0;
  return {
    id,
    username: String(me.username ?? ''),
    full_name: typeof me.full_name === 'string' ? me.full_name : undefined,
    bio: typeof me.bio === 'string' ? me.bio : undefined,
    avatar: typeof me.avatar === 'string' ? me.avatar : undefined,
    cover_image: typeof me.cover_image === 'string' ? me.cover_image : undefined,
    created_at: typeof me.created_at === 'string' ? me.created_at : undefined,
    is_me: isMe,
    followers_count: 0,
    following_count: 0,
  };
}

export default function UserProfileScreen({ route, navigation }: any) {
  const { username: usernameParam, hideBack } = route.params ?? {};
  const { token, user: me, uploadProfileImage, refreshUser } = useAuth();
  const username =
    usernameParam ||
    (hideBack && typeof me?.username === 'string' ? me.username : undefined);

  const isOwnProfile = useMemo(() => {
    if (hideBack) return true;
    if (!username || !me?.username) return false;
    return String(me.username).toLowerCase() === String(username).toLowerCase();
  }, [hideBack, username, me?.username]);

  const insets = useSafeAreaInsets();
  const { colors: c } = useTalkTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [presence, setPresence] = useState<string>('загрузка…');
  const profileFromMe = useCallback((): Profile | null => {
    if (!me?.username) return null;
    if (hideBack) return authUserToProfile(me as Record<string, unknown>);
    if (!username) return null;
    if (String(me.username).toLowerCase() !== String(username).toLowerCase()) return null;
    return authUserToProfile(me as Record<string, unknown>);
  }, [me, username, hideBack]);

  const load = useCallback(async () => {
    if (!username) {
      const cached = profileFromMe();
      setProfile(cached);
      setLoading(false);
      return;
    }

    const cachedOwn = isOwnProfile ? profileFromMe() : null;
    if (cachedOwn) {
      setProfile((prev) => prev ?? cachedOwn);
    }

    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    try {
      if (isOwnProfile && headers) {
        const meRes = await fetchWithTimeout(
          apiPath('/api/auth/me'),
          { headers },
          10000
        );
        if (meRes.ok) {
          const data = (await meRes.json()) as Record<string, unknown>;
          setProfile(authUserToProfile(data));
          await refreshUser();
          return;
        }
        if (cachedOwn) return;
        throw new Error('Не удалось загрузить профиль');
      }

      if (!headers) throw new Error('Нет авторизации');

      const pRes = await fetchWithTimeout(
        apiPath(`/api/users/${encodeURIComponent(String(username))}`),
        { headers },
        10000
      );
      if (!pRes.ok) throw new Error('Пользователь не найден');
      const data = (await pRes.json()) as Profile;
      setProfile(data);
      if (data.is_me || me?.username === data.username) {
        refreshUser().catch(() => {});
      }
    } catch (e) {
      const fallback = profileFromMe();
      if (fallback) {
        setProfile(fallback);
      } else {
        Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось загрузить профиль');
        if (!hideBack) navigation.goBack();
        else setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, [username, token, navigation, hideBack, isOwnProfile, profileFromMe, refreshUser]);

  useEffect(() => {
    if (hideBack || isOwnProfile) {
      const cached = profileFromMe();
      if (cached) setProfile((prev) => prev ?? cached);
    }
  }, [hideBack, isOwnProfile, profileFromMe]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!profile?.id) return;
    const isMe = profile.is_me || me?.username === profile.username;
    if (isMe) {
      setPresence('в сети');
      return;
    }
    let cancelled = false;
    fetch(apiPath(`/api/chat/users/${profile.id}/status`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPresence(data.online ? 'в сети' : formatLastSeen(data.last_seen_at));
      })
      .catch(() => {
        if (!cancelled) setPresence('не в сети');
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.is_me, profile?.username, me?.username, token]);

  const toggleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    const method = profile.is_following ? 'DELETE' : 'POST';
    try {
      const res = await fetch(apiPath(`/api/users/${profile.username}/follow`), {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error('Ошибка подписки');
      setProfile((p) =>
        p
          ? {
              ...p,
              is_following: !p.is_following,
              followers_count: Math.max(
                0,
                (p.followers_count || 0) + (p.is_following ? -1 : 1)
              ),
            }
          : p
      );
    } catch {
      Alert.alert('Ошибка', 'Не удалось изменить подписку');
    } finally {
      setFollowLoading(false);
    }
  };

  const openChat = async () => {
    if (!profile) return;
    try {
      const res = await fetch(apiPath('/api/chat/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: profile.id }),
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
      if (!hideBack) navigation.goBack();
    } catch {
      Alert.alert('Ошибка', 'Не удалось открыть чат');
    }
  };

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Доступ', 'Разрешите доступ к галерее');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]) return;
    try {
      await uploadProfileImage(
        { uri: picked.assets[0].uri, mimeType: picked.assets[0].mimeType ?? 'image/jpeg' },
        'avatar'
      );
      await load();
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось загрузить фото');
    }
  };

  const openProfileSettings = () => {
    navigateRoot(navigation, 'SettingsProfile');
  };

  const bootProfile =
    profile ??
    (isOwnProfile && me?.username ? authUserToProfile(me as Record<string, unknown>) : null);

  if (loading && !bootProfile) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg, flex: 1 }]}>
        <ActivityIndicator size="large" color={talkBrand.accent} />
      </View>
    );
  }

  const profileView = bootProfile ?? profile;

  if (!profileView) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg, padding: 24 }]}>
        <Text style={[styles.displayName, { color: c.text, fontSize: 17, marginBottom: 12 }]}>
          Не удалось загрузить профиль
        </Text>
        <TouchableOpacity onPress={() => load()} activeOpacity={0.8}>
          <Text style={{ color: talkBrand.accent, fontSize: 16, fontWeight: '600' }}>
            Повторить
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isMe = profileView.is_me || me?.username === profileView.username;
  const displayName = profileView.full_name || profileView.username;
  const avatarPath =
    profileView.avatar ||
    (isMe && typeof me?.avatar === 'string' ? me.avatar : undefined);
  const email = isMe && typeof me?.email === 'string' ? me.email : null;
  const joined = formatJoined(profileView.created_at);
  const statsLine = `${profileView.following_count ?? 0} подписок · ${profileView.followers_count ?? 0} подписчиков`;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          {!hideBack ? (
            <TouchableOpacity style={styles.topIcon} onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="arrow-back" size={24} color={c.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.topIcon} onPress={() => {}} hitSlop={8}>
              <Ionicons name="grid-outline" size={22} color={c.text} />
            </TouchableOpacity>
          )}
          <View style={styles.topSpacer} />
          <TouchableOpacity
            style={styles.topIcon}
            onPress={() => Alert.alert('Linkster', 'Меню профиля скоро будет доступно.')}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <UserAvatar
            avatarPath={avatarPath}
            name={displayName}
            size={120}
            style={styles.avatar}
            ring={{ color: talkBrand.accentBright, width: 2, padding: 3 }}
          />
          <Text style={[styles.displayName, { color: c.text }]}>{displayName}</Text>
          <Text style={[styles.presence, { color: c.textSecondary }]}>{presence}</Text>
        </View>

        <View style={styles.actionsRow}>
          {isMe ? (
            <>
              <ActionTile
                icon="camera-outline"
                label="Выбрать фото"
                onPress={pickAvatar}
                surfaceColor={c.surface2}
                textColor={c.text}
              />
              <ActionTile
                icon="create-outline"
                label="Изменить"
                onPress={openProfileSettings}
                surfaceColor={c.surface2}
                textColor={c.text}
              />
              <ActionTile
                icon="settings-outline"
                label="Настройки"
                onPress={() => navigateMessengerTab(navigation, 'Deck')}
                surfaceColor={c.surface2}
                textColor={c.text}
              />
            </>
          ) : (
            <>
              <ActionTile
                icon="chatbubble-outline"
                label="Написать"
                onPress={openChat}
                surfaceColor={c.surface2}
                textColor={c.text}
              />
              <ActionTile
                icon={profileView.is_following ? 'person-remove-outline' : 'person-add-outline'}
                label={profileView.is_following ? 'Отписаться' : 'Подписаться'}
                onPress={toggleFollow}
                surfaceColor={c.surface2}
                textColor={c.text}
              />
              <ActionTile
                icon="share-outline"
                label="Поделиться"
                onPress={() => Alert.alert('Linkster', `@${profileView.username}`)}
                surfaceColor={c.surface2}
                textColor={c.text}
              />
            </>
          )}
        </View>

        <View style={[styles.statsBar, { backgroundColor: c.surface2 }]}>
          <Ionicons name="people-outline" size={18} color={talkBrand.accent} />
          <Text style={[styles.statsText, { color: c.text }]} numberOfLines={1}>
            {statsLine}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
        </View>

        <View style={[styles.infoCard, { backgroundColor: c.surface2 }]}>
          {email ? <ProfileInfoRow value={email} label="Email" textColor={c.text} labelColor={c.textSecondary} /> : null}
          {profileView.bio ? (
            <ProfileInfoRow value={profileView.bio} label="О себе" textColor={c.text} labelColor={c.textSecondary} />
          ) : isMe ? (
            <ProfileInfoRow
              value="Добавьте описание о себе"
              label="О себе"
              textColor={c.textMuted}
              labelColor={c.textSecondary}
            />
          ) : null}
          <ProfileInfoRow
            value={`@${profileView.username}`}
            label="Имя пользователя"
            textColor={c.text}
            labelColor={c.textSecondary}
          />
          {joined ? (
            <ProfileInfoRow
              value={`${joined}${isMe ? '' : ''}`}
              label="В Linkster с"
              textColor={c.text}
              labelColor={c.textSecondary}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  topIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSpacer: { flex: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 14 },
  avatarFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 44, fontWeight: '800', color: talkBrand.accent },
  displayName: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  presence: { fontSize: 15 },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },
  actionTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
    minHeight: 72,
  },
  actionTileLabel: { fontSize: 12, textAlign: 'center', lineHeight: 15, fontWeight: '500' },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
  },
  statsText: { flex: 1, fontSize: 15 },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  infoRow: { paddingVertical: 12 },
  infoValue: { fontSize: 16, lineHeight: 22 },
  infoLabel: { fontSize: 13, marginTop: 4 },
});
