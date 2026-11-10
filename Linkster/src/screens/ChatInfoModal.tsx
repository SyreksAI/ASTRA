// src/screens/ChatInfoModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTalkColors, talkBrand } from '../theme/talkTheme';
import { useAuth } from '../context/AuthContext';
import { mediaUrl } from '../config/api';

export default function ChatInfoModal({
  visible,
  onClose,
  chat,
  messages,
  onOpenProfile,
  onDeleteChat,
  onClearHistory,
  onMuteToggle,
}) {
  const [activeTab, setActiveTab] = useState('media');
  const { user, theme } = useAuth();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  if (!chat) return null;

  const isGroup = chat.type === 'group';
  const otherUser = chat.user;
  const headerName = isGroup
    ? chat.title || 'Группа'
    : otherUser?.full_name || otherUser?.username || 'Диалог';

  // Медиа и файлы
  const images = messages.filter((m) => m.type === 'image' && m.file_url);
  const files = messages.filter((m) => m.type === 'file' && m.file_url);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.bottomSheet, isDark && styles.bottomSheetDark, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.dragHandle} />

          {/* Шапка */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.textDark]}>
              {isGroup ? 'О группе' : 'О пользователе'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={isDark ? '#e7e9ea' : '#0f1419'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Профиль */}
            <View style={styles.profileBlock}>
              <View style={styles.avatarWrapper}>
                {otherUser?.avatar ? (
                  <Image source={{ uri: mediaUrl(otherUser.avatar) }} style={styles.avatar} />
                ) : (
                  <Text style={styles.avatarFallback}>
                    {(otherUser?.username || 'U')[0].toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={[styles.profileName, isDark && styles.textDark]}>{headerName}</Text>
              <Text style={styles.profileHandle}>@{otherUser?.username}</Text>
            </View>

            {/* Действия */}
            <View style={styles.actionsBlock}>
              <TouchableOpacity style={styles.actionItem} onPress={onMuteToggle}>
                <Ionicons name="notifications-off-outline" size={24} color={isDark ? '#e7e9ea' : '#0f1419'} />
                <Text style={[styles.actionText, isDark && styles.textDark]}>Отключить уведомления</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert('Поиск', 'В разработке')}>
                <Ionicons name="search-outline" size={24} color={isDark ? '#e7e9ea' : '#0f1419'} />
                <Text style={[styles.actionText, isDark && styles.textDark]}>Поиск в чате</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={onClearHistory}>
                <Ionicons name="refresh-outline" size={24} color={isDark ? '#e7e9ea' : '#0f1419'} />
                <Text style={[styles.actionText, isDark && styles.textDark]}>Очистить историю</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={onDeleteChat}>
                <Ionicons name="trash-outline" size={24} color="#f91880" />
                <Text style={[styles.actionText, { color: '#f91880' }]}>Удалить чат</Text>
              </TouchableOpacity>
            </View>

            {/* Вкладки */}
            <View style={[styles.tabsContainer, isDark && styles.tabsContainerDark]}>
              {isGroup && (
                <TouchableOpacity
                  style={[styles.tabItem, activeTab === 'members' && styles.tabItemActive]}
                  onPress={() => setActiveTab('members')}
                >
                  <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive, isDark && styles.textDark]}>Участники</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'media' && styles.tabItemActive]}
                onPress={() => setActiveTab('media')}
              >
                <Text style={[styles.tabText, activeTab === 'media' && styles.tabTextActive, isDark && styles.textDark]}>Медиа</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabItem, activeTab === 'files' && styles.tabItemActive]}
                onPress={() => setActiveTab('files')}
              >
                <Text style={[styles.tabText, activeTab === 'files' && styles.tabTextActive, isDark && styles.textDark]}>Файлы</Text>
              </TouchableOpacity>
            </View>

            {/* Контент вкладок */}
            <View style={styles.tabContent}>
              {activeTab === 'media' && (
                images.length === 0 ? (
                  <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>Пока нет медиа</Text>
                ) : (
                  <View style={styles.mediaGrid}>
                    {images.map((img) => (
                      <View key={img.id} style={styles.mediaItem}>
                        <Image source={{ uri: mediaUrl(img.file_url) }} style={styles.mediaImage} />
                      </View>
                    ))}
                  </View>
                )
              )}
              {activeTab === 'files' && (
                files.length === 0 ? (
                  <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>Файлов пока нет</Text>
                ) : (
                  files.map((f) => (
                    <View key={f.id} style={styles.fileItem}>
                      <Ionicons name="document-outline" size={20} color={isDark ? '#e7e9ea' : '#0f1419'} />
                      <Text style={[styles.fileName, isDark && styles.textDark]}>{f.file_name}</Text>
                    </View>
                  ))
                )
              )}
              {activeTab === 'members' && isGroup && (
                <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>Список участников</Text>
              )}
            </View>

            {/* Открыть профиль */}
            {!isGroup && otherUser?.username && (
              <TouchableOpacity style={styles.openProfileBtn} onPress={onOpenProfile}>
                <Text style={styles.openProfileText}>Открыть профиль</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    height: '85%',
    borderTopWidth: 2,
    borderColor: 'rgba(0, 168, 150, 0.25)',
  },
  bottomSheetDark: { backgroundColor: getTalkColors(true).inputBg },
  dragHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f1419' },
  closeBtn: { padding: 5 },

  profileBlock: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: talkBrand.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: talkBrand.accentBorder,
  },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  profileName: { fontSize: 22, fontWeight: 'bold', color: '#0f1419' },
  profileHandle: { fontSize: 15, color: '#536471' },

  actionsBlock: { marginBottom: 20 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 15 },
  actionText: { fontSize: 16, color: '#0f1419' },

  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)', marginBottom: 10 },
  tabsContainerDark: { borderBottomColor: '#2f3336' },
  tabItem: { paddingVertical: 12, marginRight: 20 },
  tabItemActive: { borderBottomWidth: 3, borderBottomColor: talkBrand.accent },
  tabText: { fontSize: 15, fontWeight: '600', color: '#536471' },
  tabTextActive: { color: '#0f1419' },

  tabContent: { minHeight: 150 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#536471' },

  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  mediaItem: { width: '32%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#ccc' },
  mediaImage: { width: '100%', height: '100%' },

  fileItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  fileName: { fontSize: 14, color: '#0f1419' },

  openProfileBtn: { marginTop: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center' },
  openProfileText: { fontSize: 16, fontWeight: '600', color: '#0f1419' },

  textDark: { color: '#e7e9ea' },
  textMutedDark: { color: '#71767b' },
});