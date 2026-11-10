import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { talkBrand } from '../../../theme/talkTheme';
import { conversationRowStyle, messengerLayout } from '../../../theme/messengerTheme';
import { formatChatRowTime } from '../domain/format';
import type { Conversation } from '../types';
import { mediaUrl } from '../../../config/api';

type Props = {
  item: Conversation;
  isDark: boolean;
  textColor: string;
  mutedColor: string;
  secondaryColor: string;
  onPress: () => void;
};

export default function ConversationListItem({
  item,
  isDark,
  textColor,
  mutedColor,
  secondaryColor,
  onPress,
}: Props) {
  const [pressed, setPressed] = useState(false);
  const title =
    item.display_name || item.user?.full_name || item.user?.username || 'Чат';
  const avatarPath = item.display_avatar || item.user?.avatar;
  const initial = title[0]?.toUpperCase() || '?';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={conversationRowStyle(isDark, pressed)}
    >
      <View style={styles.inner}>
        <View style={[styles.avatar, { backgroundColor: talkBrand.accentSoft }]}>
          {avatarPath ? (
            <Image source={{ uri: mediaUrl(avatarPath) }} style={styles.avatarImg} />
          ) : (
            <Text style={[styles.avatarLetter, { color: talkBrand.accent }]}>{initial}</Text>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.top}>
            <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
            {item.last_message_at ? (
              <Text style={[styles.time, { color: mutedColor }]}>
                {formatChatRowTime(item.last_message_at)}
              </Text>
            ) : null}
          </View>
          <View style={styles.bottom}>
            <Text style={[styles.preview, { color: secondaryColor }]} numberOfLines={2}>
              {item.last_message || 'Начните диалог — ваш приватный штаб'}
            </Text>
            {item.has_unread ? (
              <View style={styles.unread}>
                <View style={styles.unreadDot} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: messengerLayout.avatarSize,
    height: messengerLayout.avatarSize,
    borderRadius: messengerLayout.avatarSize / 2,
    marginRight: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { fontSize: 21, fontWeight: '700' },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { flex: 1, fontSize: 17, fontWeight: '700', marginRight: 8, letterSpacing: -0.2 },
  time: { fontSize: 12, fontWeight: '500' },
  bottom: { flexDirection: 'row', alignItems: 'flex-start' },
  preview: { flex: 1, fontSize: 14, lineHeight: 19, marginRight: 8 },
  unread: { paddingTop: 4 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: talkBrand.accent,
  },
});
