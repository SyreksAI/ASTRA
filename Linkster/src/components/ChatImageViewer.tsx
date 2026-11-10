import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { talkBrand } from '../theme/talkTheme';
import { saveChatImageToGallery } from '../utils/chatMedia';
import TalkConfirmModal from './ui/TalkConfirmModal';

export type ChatViewerImage = {
  id: string | number;
  uri: string;
  senderName: string;
  createdAt: string;
  message: Record<string, unknown>;
};

type Props = {
  visible: boolean;
  items: ChatViewerImage[];
  initialIndex: number;
  authToken: string;
  onClose: () => void;
  onReply: (message: Record<string, unknown>) => void;
  onShowInChat: (messageId: string | number) => void;
  onForward: (message: Record<string, unknown>) => void;
  onDelete: (message: Record<string, unknown>) => Promise<void> | void;
};

function formatViewerDateTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatImageViewer({
  visible,
  items,
  initialIndex,
  authToken,
  onClose,
  onReply,
  onShowInChat,
  onForward,
  onDelete,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatViewerImage>>(null);
  const [index, setIndex] = useState(initialIndex);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const current = items[index];

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setChromeVisible(true);
      setMenuOpen(false);
      setDeleteConfirmOpen(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      });
    }
  }, [visible, initialIndex]);

  const toggleChrome = useCallback(() => {
    setMenuOpen(false);
    setChromeVisible((v) => !v);
  }, []);

  const onScrollEnd = useCallback(
    (x: number) => {
      const i = Math.round(x / width);
      if (i >= 0 && i < items.length) setIndex(i);
    },
    [width, items.length]
  );

  const saveToGallery = useCallback(async () => {
    if (!current?.uri) return;
    setMenuOpen(false);
    setSaving(true);
    try {
      await saveChatImageToGallery(current.uri, authToken);
      Alert.alert('Готово', 'Фото сохранено в галерею');
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'permission_denied') {
        Alert.alert('Доступ', 'Разрешите сохранение фото в настройках приложения');
      } else {
        Alert.alert('Ошибка', 'Не удалось сохранить. Проверьте интернет и доступ к галерее.');
      }
    } finally {
      setSaving(false);
    }
  }, [current, authToken]);

  const shareImage = useCallback(async () => {
    if (!current?.uri) return;
    setMenuOpen(false);
    try {
      await Share.share({ message: current.uri, url: current.uri });
    } catch {
      /* cancelled */
    }
  }, [current]);

  const confirmDelete = useCallback(() => {
    if (!current) return;
    setMenuOpen(false);
    setDeleteConfirmOpen(true);
  }, [current]);

  const runDelete = useCallback(() => {
    if (!current) return;
    setDeleteConfirmOpen(false);
    void Promise.resolve(onDelete(current.message)).then(() => onClose());
  }, [current, onClose, onDelete]);

  if (!visible || items.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => onScrollEnd(e.nativeEvent.contentOffset.x)}
          renderItem={({ item }) => (
            <Pressable style={{ width, height }} onPress={toggleChrome}>
              <Image source={{ uri: item.uri }} style={{ width, height }} resizeMode="contain" />
            </Pressable>
          )}
        />

        {saving ? (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color={talkBrand.accent} />
          </View>
        ) : null}

        {chromeVisible ? (
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.topIcon} onPress={onClose} hitSlop={12}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topCenter}>
              <Text style={styles.topName} numberOfLines={1}>
                {current?.senderName || 'Пользователь'}
              </Text>
              <Text style={styles.topTime} numberOfLines={1}>
                {formatViewerDateTime(current?.createdAt || '')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.topIcon}
              onPress={() => current && onForward(current.message)}
              hitSlop={12}
            >
              <Ionicons name="arrow-redo-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIcon} onPress={() => setMenuOpen(true)} hitSlop={12}>
              <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        {items.length > 1 && chromeVisible ? (
          <View style={[styles.counter, { bottom: insets.bottom + 16 }]}>
            <Text style={styles.counterText}>
              {index + 1} / {items.length}
            </Text>
          </View>
        ) : null}

        <Modal visible={menuOpen} transparent animationType="slide" onRequestClose={() => setMenuOpen(false)}>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
            <Pressable style={[styles.menuSheet, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.menuHandle} />
              <MenuRow
                icon="download-outline"
                label="Сохранить в галерею"
                onPress={() => void saveToGallery()}
              />
              <MenuRow
                icon="chatbubble-ellipses-outline"
                label="Показать в чате"
                onPress={() => {
                  setMenuOpen(false);
                  onShowInChat(current.id);
                }}
              />
              <MenuRow
                icon="happy-outline"
                label="Создать стикер"
                onPress={() => {
                  setMenuOpen(false);
                  Alert.alert('Стикеры', 'Скоро');
                }}
              />
              <MenuRow
                icon="arrow-undo-outline"
                label="Ответить"
                onPress={() => {
                  setMenuOpen(false);
                  onReply(current.message);
                  onClose();
                }}
              />
              <MenuRow icon="share-outline" label="Поделиться" onPress={() => void shareImage()} />
              <MenuRow icon="trash-outline" label="Удалить" danger onPress={confirmDelete} />
            </Pressable>
          </Pressable>
        </Modal>

        <TalkConfirmModal
          visible={deleteConfirmOpen}
          title="Вы действительно хотите удалить сообщение?"
          cancelLabel="Отмена"
          confirmLabel="Удалить"
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={runDelete}
        />
      </View>
    </Modal>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={22} color={danger ? talkBrand.danger : '#e7e9ea'} />
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(28, 32, 36, 0.72)',
  },
  topIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: { flex: 1, paddingHorizontal: 4 },
  topName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  topTime: { color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  counterText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  savingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    backgroundColor: '#1c2024',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  menuHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLabel: { color: '#e7e9ea', fontSize: 16, fontWeight: '500' },
  menuLabelDanger: { color: talkBrand.danger },
});
