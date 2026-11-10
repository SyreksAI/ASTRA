import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mediaUrl } from '../../../config/api';
import { getTalkColors, talkBrand } from '../../../theme/talkTheme';
import { formatChatRowTime } from '../../chat/domain/format';
import type { Conversation } from '../../chat/types';
import { linksterDarkHub } from '../theme/linksterDarkHub';

type Props = {
  item: Conversation;
  index: number;
  isDark: boolean;
  onPress: () => void;
};

function previewMeta(lastMessage?: string): {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
} {
  const raw = lastMessage?.trim() || 'Напишите первым';
  const low = raw.toLowerCase();
  if (low.includes('голос') || low.includes('voice') || low.includes('🎤')) {
    return { icon: 'mic-outline', text: raw };
  }
  if (low.includes('фото') || low.includes('photo') || low.includes('изображ') || low.includes('📷')) {
    return { icon: 'image-outline', text: raw.includes('Фото') ? 'Фотография' : raw };
  }
  return { text: raw };
}

export default function OrbitConversationTile({ item, index, isDark, onPress }: Props) {
  const c = getTalkColors(isDark);
  const title = item.display_name || item.user?.full_name || item.user?.username || 'Чат';
  const avatarPath = item.display_avatar || item.user?.avatar;
  const avatarUri = avatarPath ? mediaUrl(avatarPath) : null;
  const initial = title[0]?.toUpperCase() || '?';
  const unread =
    item.unread_count && item.unread_count > 0
      ? item.unread_count
      : item.has_unread
        ? 1
        : 0;
  const isGroup = item.type === 'group';

  const preview = previewMeta(item.last_message);

  const nameColor = isDark ? linksterDarkHub.textPrimary : c.text;
  const previewColor = isDark ? linksterDarkHub.textSecondary : c.textSecondary;
  const timeColor = isDark ? linksterDarkHub.textMuted : c.textMuted;

  const showPin = isGroup && index < 2;
  const showMute = isGroup && (title.includes('|') || title.toLowerCase().includes('обсужд'));
  const showVerified = title.toLowerCase().includes('linkster') && title.toLowerCase().includes('update');

  return (
    <TouchableOpacity activeOpacity={0.65} onPress={onPress} style={styles.row}>
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatarFallback,
              { backgroundColor: isDark ? '#1A1A1A' : talkBrand.accentSoft },
            ]}
          >
            <Text style={[styles.avatarLetter, { color: talkBrand.accentBright }]}>
              {initial}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleLine}>
          <Text style={[styles.name, { color: nameColor }]} numberOfLines={1}>
            {title}
          </Text>
          {showPin ? (
            <Ionicons name="pin-outline" size={14} color={isDark ? linksterDarkHub.textMuted : c.textMuted} style={styles.titleIcon} />
          ) : null}
          {showMute ? (
            <Ionicons name="notifications-off-outline" size={14} color={timeColor} style={styles.titleIcon} />
          ) : null}
          {showVerified ? (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={talkBrand.accentBright}
              style={styles.titleIcon}
            />
          ) : null}
        </View>
        <View style={styles.previewLine}>
          {preview.icon ? (
            <Ionicons name={preview.icon} size={14} color={previewColor} style={styles.previewIcon} />
          ) : null}
          <Text style={[styles.preview, { color: previewColor }]} numberOfLines={1}>
            {preview.text}
          </Text>
        </View>
      </View>

      <View style={styles.metaCol}>
        {item.last_message_at ? (
          <Text style={[styles.time, { color: timeColor }]}>{formatChatRowTime(item.last_message_at)}</Text>
        ) : (
          <View style={styles.timePlaceholder} />
        )}
        {unread > 0 ? (
          <View style={[styles.unreadBadge, { backgroundColor: talkBrand.accent }]}>
            <Text style={styles.unreadText}>{unread}</Text>
          </View>
        ) : (
          <View style={styles.badgePlaceholder} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatarWrap: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 20, fontWeight: '700' },
  body: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  name: { flexShrink: 1, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  titleIcon: { marginLeft: 5 },
  previewLine: { flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  previewIcon: { marginRight: 4 },
  preview: { flex: 1, fontSize: 14, lineHeight: 18 },
  metaCol: { alignItems: 'flex-end', minWidth: 44, gap: 6 },
  time: { fontSize: 13, fontWeight: '500' },
  timePlaceholder: { height: 16 },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  badgePlaceholder: { height: 22 },
});
