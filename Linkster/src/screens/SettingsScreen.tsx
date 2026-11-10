import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SettingsRow from '../components/ui/SettingsRow';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand } from '../theme/talkTheme';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../config/api';
import { navigateRoot } from '../navigation/rootNavigation';

function soon() {
  Alert.alert('Linkster', 'Раздел скоро будет доступен.');
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors: c } = useTalkTheme();

  const openStack = (screen: string, params?: object) => {
    navigateRoot(navigation, screen, params);
  };

  const fullName =
    (typeof user?.full_name === 'string' && user.full_name) ||
    (typeof user?.username === 'string' && user.username) ||
    'Профиль';
  const username = typeof user?.username === 'string' ? user.username : '';

  const openProfileSettings = () => {
    openStack('SettingsProfile');
  };
  const email = typeof user?.email === 'string' ? user.email : '';
  const avatarUri = user?.avatar ? mediaUrl(String(user.avatar)) : null;

  const profileSubtitle = [username ? `@${username}` : null, email || null]
    .filter(Boolean)
    .join(' • ');

  const appVersion = require('../../app.json').expo.version as string;
  const footerLine =
    Platform.OS === 'ios'
      ? `Linkster для iOS v${appVersion}`
      : `Linkster для Android v${appVersion}`;

  return (
    <View style={[styles.page, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 4 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarSide} />
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.topIcon} onPress={soon} hitSlop={8}>
              <Ionicons name="search" size={22} color={c.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIcon} onPress={soon} hitSlop={8}>
              <Ionicons name="ellipsis-vertical" size={20} color={c.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBlock}
          activeOpacity={0.75}
          onPress={openProfileSettings}
        >
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: talkBrand.accentSoft }]}>
                <Text style={styles.avatarLetter}>
                  {fullName[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: talkBrand.accent, borderColor: c.bg },
              ]}
            >
              <Ionicons name="camera" size={14} color={talkBrand.onAccent} />
            </View>
          </View>
          <Text style={[styles.profileName, { color: c.text }]}>{fullName}</Text>
          {profileSubtitle ? (
            <Text style={[styles.profileSub, { color: c.textSecondary }]} numberOfLines={2}>
              {profileSubtitle}
            </Text>
          ) : null}
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: c.surface2 }]}>
          <SettingsRow
            icon="person"
            iconBg="#5AC8FA"
            title="Аккаунт"
            subtitle="Номер, имя пользователя, «О себе»"
            onPress={() => openStack('SettingsAccount')}
          />
          <SettingsRow
            icon="chatbubble"
            iconBg="#FFCC00"
            title="Настройки чатов"
            subtitle="Обои, ночной режим, анимации"
            onPress={() => openStack('SettingsChat')}
          />
          <SettingsRow
            icon="key"
            iconBg="#34C759"
            title="Конфиденциальность"
            subtitle="Был(а) в сети, устройства, ключи доступа"
            onPress={soon}
          />
          <SettingsRow
            icon="notifications"
            iconBg="#FF3B30"
            title="Уведомления и звуки"
            subtitle="Звуки, звонки, счётчик сообщений"
            onPress={soon}
          />
          <SettingsRow
            icon="pie-chart"
            iconBg="#5AC8FA"
            title="Данные и память"
            subtitle="Автозагрузка медиа, сервер"
            onPress={() => openStack('SettingsData')}
          />
          <SettingsRow
            icon="folder"
            iconBg="#007AFF"
            title="Папки с чатами"
            subtitle="Сортировка чатов по папкам"
            onPress={soon}
          />
          <SettingsRow
            icon="laptop-outline"
            iconBg="#32ADE6"
            title="Устройства"
            subtitle="Управление активными сессиями"
            onPress={soon}
          />
          <SettingsRow
            icon="battery-half"
            iconBg="#FF9500"
            title="Экономия энергии"
            subtitle="Энергосбережение при низком заряде"
            onPress={soon}
            isLast
          />
        </View>

        <View style={[styles.card, { backgroundColor: c.surface2 }]}>
          <SettingsRow
            icon="globe-outline"
            iconBg="#FF9500"
            title="Язык"
            value="Русский"
            isLast
          />
        </View>

        <View style={[styles.card, { backgroundColor: c.surface2 }]}>
          <SettingsRow
            icon="star"
            iconBg="#AF52DE"
            title="Linkster Premium"
            onPress={soon}
          />
          <SettingsRow
            icon="star-half"
            iconBg="#FF9500"
            title="Звёзды Linkster"
            onPress={soon}
          />
          <SettingsRow
            icon="storefront-outline"
            iconBg="#FF6482"
            title="Linkster для бизнеса"
            onPress={soon}
          />
          <SettingsRow
            icon="gift-outline"
            iconBg="#FF9500"
            title="Отправить подарок"
            onPress={soon}
            isLast
          />
        </View>

        <Text style={[styles.sectionTitle, { color: talkBrand.accent }]}>Помощь</Text>
        <View style={[styles.card, { backgroundColor: c.surface2 }]}>
          <SettingsRow
            icon="chatbubble-ellipses"
            iconBg="#FF9500"
            title="Задать вопрос"
            onPress={soon}
          />
          <SettingsRow
            icon="help-circle"
            iconBg="#007AFF"
            title="Вопросы о Linkster"
            onPress={soon}
          />
          <SettingsRow
            icon="bulb-outline"
            iconBg="#AF52DE"
            title="Возможности Linkster"
            onPress={soon}
          />
          <SettingsRow
            icon="shield-checkmark"
            iconBg="#34C759"
            title="Политика конфиденциальности"
            onPress={soon}
            isLast
          />
        </View>

        <Text style={[styles.footer, { color: c.textMuted }]}>{footerLine}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { paddingBottom: 28 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  topBarSide: { flex: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center' },
  topIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBlock: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: talkBrand.accent },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileName: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  profileSub: { fontSize: 15, textAlign: 'center', lineHeight: 20 },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    marginHorizontal: 24,
    marginTop: 8,
  },
});
