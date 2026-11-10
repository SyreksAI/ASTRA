import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTalkColors, talkAccentAlpha, talkBrand } from '../theme/talkTheme';
import { mediaUrl } from '../config/api';
import { Image } from 'react-native';

type ConvRow = {
  id: number | string;
  user?: { username?: string; full_name?: string; avatar?: string };
  title?: string;
  type?: string;
};

type Props = {
  visible: boolean;
  conversations: ConvRow[];
  currentChatId?: number | string | null;
  loading?: boolean;
  onClose: () => void;
  onPick: (conversation: ConvRow) => void;
};

export default function ForwardChatModal({
  visible,
  conversations,
  currentChatId,
  loading,
  onClose,
  onPick,
}: Props) {
  const insets = useSafeAreaInsets();
  const rows = conversations.filter((c) => String(c.id) !== String(currentChatId));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Переслать</Text>
          {loading ? (
            <ActivityIndicator color={talkBrand.accent} style={{ marginVertical: 24 }} />
          ) : (
            <FlatList
              data={rows}
              keyExtractor={(item) => String(item.id)}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={
                <Text style={styles.empty}>Нет других чатов</Text>
              }
              renderItem={({ item }) => {
                const name =
                  item.user?.full_name ||
                  item.user?.username ||
                  item.title ||
                  'Чат';
                const avatar = item.user?.avatar ? mediaUrl(item.user.avatar) : null;
                return (
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => onPick(item)}
                    activeOpacity={0.75}
                  >
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarFallback}>
                        <Text style={styles.avatarLetter}>{name[0]?.toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={styles.rowName} numberOfLines={1}>
                      {name}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#536471" />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: getTalkColors(true).surface2,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: talkAccentAlpha(0.2),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  title: {
    color: '#e8eef2',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  empty: { color: '#8b98a5', textAlign: 'center', padding: 24, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: talkBrand.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: talkBrand.accent, fontWeight: '700', fontSize: 18 },
  rowName: { flex: 1, color: '#e8eef2', fontSize: 16, fontWeight: '600' },
});
