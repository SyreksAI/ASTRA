import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTalkColors, talkBrand } from '../../../theme/talkTheme';
import { mediaUrl } from '../../../config/api';
import { linksterTitle, linksterSubtitle } from '../theme/linksterPro';

type Props = {
  isDark: boolean;
  title: string;
  subtitle: string;
  isOnline?: boolean;
  avatarUrl?: string | null;
  avatarInitial?: string;
  isGroup?: boolean;
  onBack: () => void;
  onInfo: () => void;
  onAudioCall?: () => void;
  onVideoCall?: () => void;
};

export default function ConversationAuraHeader({
  isDark,
  title,
  subtitle,
  isOnline,
  avatarUrl,
  avatarInitial = '?',
  isGroup,
  onBack,
  onInfo,
  onAudioCall,
  onVideoCall,
}: Props) {
  const insets = useSafeAreaInsets();
  const c = getTalkColors(isDark);
  const uri = avatarUrl ? mediaUrl(avatarUrl) : null;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 4,
          backgroundColor: c.bg,
          borderBottomColor: c.border,
        },
      ]}
    >
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="chevron-back" size={26} color={c.text} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.center} onPress={onInfo} activeOpacity={0.75}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFb, { backgroundColor: talkBrand.accentSoft }]}>
            <Text style={[styles.avatarLetter, { color: talkBrand.accent }]}>{avatarInitial}</Text>
          </View>
        )}
        <View style={styles.titles}>
          <Text style={[linksterTitle(isDark), styles.titleLine]} numberOfLines={1}>
            {title}
            {isGroup ? '  ' : ''}
          </Text>
          <View style={styles.statusRow}>
            {isOnline ? <View style={styles.onlineDot} /> : null}
            <Text
              style={[
                linksterSubtitle(isDark),
                { color: isOnline ? talkBrand.online : c.textSecondary },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        {!isGroup && onAudioCall ? (
          <TouchableOpacity onPress={onAudioCall} style={styles.actionBtn}>
            <Ionicons name="call-outline" size={22} color={c.text} />
          </TouchableOpacity>
        ) : null}
        {!isGroup && onVideoCall ? (
          <TouchableOpacity onPress={onVideoCall} style={styles.actionBtn}>
            <Ionicons name="videocam-outline" size={24} color={c.text} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, paddingRight: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarFb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: { fontSize: 16, fontWeight: '700' },
  titles: { flex: 1, minWidth: 0 },
  titleLine: { fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: talkBrand.online,
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
