import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TalkWordmark from '../../../components/TalkWordmark';
import { getTalkHeaderColors } from '../../../theme/talkTheme';
import { hubAccentBar } from '../../../theme/messengerTheme';

type Props = {
  isDark: boolean;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onMenuPress: () => void;
  onProfilePress: () => void;
  profileAvatar?: React.ReactNode;
};

export default function ChatHubHeader({
  isDark,
  searchQuery,
  onSearchChange,
  onMenuPress,
  onProfilePress,
  profileAvatar,
}: Props) {
  const insets = useSafeAreaInsets();
  const hdr = getTalkHeaderColors(isDark);

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: insets.top, backgroundColor: hdr.background, borderBottomColor: hdr.border },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} hitSlop={8}>
          <Ionicons name="menu-outline" size={24} color={hdr.foreground} />
        </TouchableOpacity>
        <View style={styles.logoWrap}>
          <TalkWordmark onLightBackground={!isDark} size="header" />
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={onProfilePress} hitSlop={8}>
          {profileAvatar}
        </TouchableOpacity>
      </View>
      <View style={hubAccentBar()} />
      <View style={[styles.search, { backgroundColor: hdr.searchBg }]}>
        <Ionicons name="search" size={18} color={hdr.muted} />
        <TextInput
          style={[styles.searchInput, { color: hdr.foreground }]}
          placeholder="Поиск людей и чатов"
          placeholderTextColor={hdr.muted}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={hdr.muted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 48,
  },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
