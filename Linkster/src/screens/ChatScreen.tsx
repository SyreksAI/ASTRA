// src/screens/ChatScreen.tsx
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { chatFontScaleMultiplier } from '../settings/appSettings';
import ChatInfoModal from './ChatInfoModal';
import {
  apiPath,
  chatMessageImageUri,
  chatWebSocketUrl,
  fetchWithTimeout,
  mediaUrl,
} from '../config/api';
import {
  appendWsMessage,
  formatLastSeen,
  formatMessageTime,
  isChatAudioMessage,
  isChatImageMessage,
  isChatVideoNoteMessage,
  mergeChatMessage,
  normalizeChatMessage,
} from '../features/chat';
import type { Conversation } from '../features/chat/types';
import { isDemoConversation, mergeHubConversations } from '../features/messenger/demo/linksterDemoHub';
import {
  getDemoThreadMessages,
  isDemoChatOpen,
} from '../features/messenger/demo/linksterDemoThread';
import { ConversationAuraHeader, MessengerOrbitHub } from '../features/messenger';
import ChatWallpaper from '../components/ChatWallpaper';
import OrbitComposerDock from '../features/messenger/ui/OrbitComposerDock';
import { getMessengerSurfaces, messageBubbleStyle } from '../theme/messengerTheme';
import ChatMessagePhoto from '../components/ChatMessagePhoto';
import ChatImageViewer, { type ChatViewerImage } from '../components/ChatImageViewer';
import ForwardChatModal from '../components/ForwardChatModal';
import ChatComposer from '../components/ChatComposer';
import ChatVoiceMessage from '../components/ChatVoiceMessage';
import ChatVideoNoteMessage from '../components/ChatVideoNoteMessage';
import { useVoicePlayback } from '../context/VoicePlaybackContext';
import ChatVoiceMiniPlayer from '../components/ChatVoiceMiniPlayer';
import ChatVideoNoteMiniPlayer from '../components/ChatVideoNoteMiniPlayer';
import { useVideoNotePlayback } from '../context/VideoNotePlaybackContext';
import VoiceMessageHighlight from '../components/VoiceMessageHighlight';
import { buildVoiceTrackFromMessage, isPlayableVoiceMessage } from '../utils/voiceTracks';
import type { VoiceTrack } from '../context/VoicePlaybackContext';
import { useChatTabBar } from '../context/ChatTabBarContext';
import { navigateRoot } from '../navigation/rootNavigation';
import { useTalkTheme } from '../hooks/useTalkTheme';
import { talkBrand, getTalkHeaderColors, getTalkColors } from '../theme/talkTheme';
import {
  downloadChatImageToCache,
  normalizeLocalUploadUri,
  prepareChatImageForUpload,
  prepareChatVoiceForUpload,
  prepareChatVideoNoteForUpload,
  resolveUploadMimeType,
  uploadChatAttachment,
  isUploadTransportError,
} from '../utils/chatMedia';
import { isNativeCallsSupported } from '../native/callsSupported';

export default function ChatScreen() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  const [replyTo, setReplyTo] = useState(null);

  // Модалки
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);

  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchTimeout = useRef(null);

  // Онлайн
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [activeStatus, setActiveStatus] = useState(null);

  // Контекстное меню
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [imageViewerIndex, setImageViewerIndex] = useState<number | null>(null);
  const [forwardPick, setForwardPick] = useState<{ message: Record<string, unknown> } | null>(
    null
  );
  const [forwardLoading, setForwardLoading] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | number | null>(null);
  const { token, user } = useAuth();
  const { settings } = useSettings();
  const messageFontSize = 15 * chatFontScaleMultiplier(settings.chats.fontScale);
  const { isDark, colors: c } = useTalkTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const chatImageSize = Math.min(260, Math.round(windowWidth * 0.68));
  const flatListRef = useRef(null);
  const messagesRef = useRef(messages);
  const messagesHasMoreRef = useRef(messagesHasMore);
  const messagesLoadingRef = useRef(messagesLoading);
  const activeChatRef = useRef(activeChat);
  messagesRef.current = messages;
  messagesHasMoreRef.current = messagesHasMore;
  messagesLoadingRef.current = messagesLoading;
  activeChatRef.current = activeChat;

  const waitForChatMessagesReady = useCallback((conversationId: number) => {
    return new Promise<void>((resolve) => {
      let attempts = 0;
      const tick = () => {
        attempts += 1;
        const ready =
          String(activeChatRef.current?.id) === String(conversationId) &&
          !messagesLoadingRef.current;
        if (ready || attempts > 240) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
  }, []);

  const imageViewerItems: ChatViewerImage[] = useMemo(() => {
    return messages
      .filter((m) => !String(m.id).startsWith('pending-') && isChatImageMessage(m))
      .map((m) => {
        const uri = chatMessageImageUri(m.file_url, m.local_preview_uri);
        const isMe = m.sender_id === user?.id;
        const senderName = isMe
          ? user?.full_name || user?.username || 'Вы'
          : m.sender_name || activeChat?.user?.full_name || activeChat?.user?.username || 'Пользователь';
        return {
          id: m.id,
          uri: uri || '',
          senderName,
          createdAt: m.created_at,
          message: m,
        };
      })
      .filter((row) => Boolean(row.uri));
  }, [messages, user, activeChat]);

  const openImageViewer = useCallback(
    (messageId: string | number) => {
      const idx = imageViewerItems.findIndex((i) => String(i.id) === String(messageId));
      if (idx >= 0) setImageViewerIndex(idx);
    },
    [imageViewerItems]
  );

  const scrollToMessageInChat = useCallback(
    (messageId: string | number, closeViewer = true) => {
      if (closeViewer) setImageViewerIndex(null);
      const idx = messages.findIndex((m) => String(m.id) === String(messageId));
      if (idx < 0) return;
      setTimeout(() => {
        flatListRef.current?.scrollToIndex?.({ index: idx, animated: true, viewPosition: 0.5 });
      }, closeViewer ? 280 : 0);
    },
    [messages]
  );

  const forwardMessageToChat = useCallback(
    async (targetConv: { id: string | number }, msg: Record<string, unknown>) => {
      if (!token) return;
      setForwardLoading(true);
      try {
        const uri = chatMessageImageUri(
          msg.file_url as string,
          msg.local_preview_uri as string | undefined
        );
        if (!uri) throw new Error('no_uri');
        const localUri =
          uri.startsWith('file://') || uri.startsWith('content://')
            ? uri
            : await downloadChatImageToCache(uri, token);
        const uploadRes = await FileSystem.uploadAsync(
          apiPath(`/api/chat/conversations/${targetConv.id}/upload`),
          localUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            headers: { Authorization: `Bearer ${token}` },
            mimeType: 'image/jpeg',
          }
        );
        if (uploadRes.status < 200 || uploadRes.status >= 300) throw new Error('upload');
        const uploaded = JSON.parse(uploadRes.body);
        const caption = String(msg.text || '').trim();
        const msgRes = await fetchWithTimeout(
          apiPath(`/api/chat/conversations/${targetConv.id}/messages`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: 'image',
              file_id: uploaded.file_id,
              text: caption ? `↪ ${caption}` : '',
            }),
          },
          20000
        );
        if (!msgRes.ok) throw new Error('send');
        setForwardPick(null);
        setImageViewerIndex(null);
        Alert.alert('Готово', 'Сообщение переслано');
      } catch {
        Alert.alert('Ошибка', 'Не удалось переслать');
      } finally {
        setForwardLoading(false);
      }
    },
    [token]
  );

  const deleteChatMessage = useCallback(
    async (msg: Record<string, unknown>) => {
      if (!activeChat?.id || !token) return;
      const messageId = msg.id;
      try {
        const res = await fetch(
          apiPath(`/api/chat/conversations/${activeChat.id}/messages/${messageId}`),
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          setMessages((prev) => prev.filter((m) => String(m.id) !== String(messageId)));
          setImageViewerIndex(null);
        } else {
          Alert.alert('Ошибка', 'Не удалось удалить');
        }
      } catch {
        Alert.alert('Ошибка', 'Не удалось удалить');
      }
    },
    [activeChat?.id, token]
  );
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const voicePlayback = useVoicePlayback();
  const videoNotePlayback = useVideoNotePlayback();
  const { setHideTabs } = useChatTabBar();

  const wsRef = useRef<WebSocket | null>(null);

  useLayoutEffect(() => {
    setHideTabs(Boolean(activeChat));
    return () => setHideTabs(false);
  }, [activeChat, setHideTabs]);

  const { setMiniPlayerHost, registerChatBridge, highlightedMessageId, highlightGeneration } =
    voicePlayback;
  const {
    setMiniPlayerHost: setVideoMiniPlayerHost,
    registerChatBridge: registerVideoChatBridge,
  } = videoNotePlayback;

  useEffect(() => {
    if (!isFocused) return;
    const host = activeChat ? 'openChat' : 'chatList';
    setMiniPlayerHost(host);
    setVideoMiniPlayerHost(host);
  }, [isFocused, activeChat, setMiniPlayerHost, setVideoMiniPlayerHost]);

  useEffect(() => {
    if (!forwardPick || !token) return;
    fetchWithTimeout(apiPath('/api/chat/conversations'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(() => {});
  }, [forwardPick, token]);

  useEffect(() => {
    const openId = route.params?.openConversationId;
    if (!openId || !conversations.length) return;
    const found = conversations.find((c) => String(c.id) === String(openId));
    if (found) setActiveChat(found);
  }, [route.params?.openConversationId, conversations]);

  // 1. Загрузка чатов
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchWithTimeout(
      apiPath('/api/chat/conversations'),
      { headers: { Authorization: `Bearer ${token}` } },
      8000
    )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setConversations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refreshConversations = useCallback(async () => {
    if (!token) return;
    setListRefreshing(true);
    try {
      const r = await fetchWithTimeout(
        apiPath('/api/chat/conversations'),
        { headers: { Authorization: `Bearer ${token}` } },
        8000
      );
      const data = r.ok ? await r.json() : [];
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      /* keep current list */
    } finally {
      setListRefreshing(false);
    }
  }, [token]);

  // 2. Глобальный WebSocket — работает всегда, пока открыт ChatScreen
  //    Это точка, где ловим ВХОДЯЩИЕ ЗВОНКИ.
  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(chatWebSocketUrl(token));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🔔 ЗВОНКИ: входящий
        if (data.type === 'call:incoming') {
          if ((globalThis as any).__activeCallId) return;
          (globalThis as any).__activeCallId = data.call_id;
          if (!isNativeCallsSupported()) {
            return;
          }
          navigateRoot(navigation, 'CallScreen', {
            isIncoming: true,
            callId: data.call_id,
            callType: data.call_type || 'audio',
            targetUser: data.caller,
          });
          return;
        }

        // 🔔 ЗВОНКИ: второй участник завершил
        if (data.type === 'call:ended' || data.type === 'call:declined') {
          if ((globalThis as any).__activeCallId === data.call_id) {
            (globalThis as any).__activeCallId = null;
          }
          return;
        }

        // Обычные сообщения
        if (data.type === 'message.new') {
          const msg = data.message;
          // Если открыт этот чат — добавляем в ленту
          setActiveChat((cur) => {
            if (cur && cur.id === msg.conversation_id) {
              setMessages((prev) =>
                appendWsMessage(prev, normalizeChatMessage(msg as Record<string, unknown>), user?.id)
              );
            }
            return cur;
          });
          // Обновляем превью в списке чатов
          setConversations((prev) =>
            prev.map((c) =>
              c.id === msg.conversation_id
                ? {
                    ...c,
                    last_message:
                      msg.text ||
                      (msg.type === 'image'
                        ? '📷 Фото'
                        : msg.type === 'voice'
                          ? '🎤 Голосовое'
                          : msg.type === 'video_note'
                            ? '🎬 Видеосообщение'
                            : msg.type === 'video'
                              ? '🎬 Видео'
                              : '📎 Файл'),
                    last_message_at: msg.created_at,
                  }
                : c
            )
          );
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, navigation, user?.id]);

  // 3. Когда открыт конкретный чат — подгружаем сообщения (по HTTP)
  //    (WebSocket уже открыт глобально выше)
  useEffect(() => {
    const chatId = activeChat?.id;
    if (!chatId) return;

    if (isDemoChatOpen(activeChat)) {
      setMessages(getDemoThreadMessages(activeChat, Number(user?.id) || 1));
      setMessagesHasMore(false);
      setMessagesLoading(false);
      return;
    }

    if (!token) return;
    let cancelled = false;
    setMessages([]);
    setMessagesLoading(true);
    fetchWithTimeout(
      apiPath(`/api/chat/conversations/${chatId}/messages?limit=80`),
      { headers: { Authorization: `Bearer ${token}` } },
      15000
    )
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => {
        if (!cancelled) {
          setMessages(
            dedupeMessagesById((data.messages || []).map((row: Record<string, unknown>) => normalizeChatMessage(row)))
          );
          setMessagesHasMore(Boolean(data.has_more));
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeChat, activeChat?.id, token, user?.id]);

  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    if (isDemoChatOpen(activeChat)) return false;
    const chatId = activeChat?.id;
    if (!chatId || !token || !messagesHasMoreRef.current || loadingOlderMessages) return false;
    const firstReal = messagesRef.current.find((m) => !String(m.id).startsWith('pending-'));
    if (!firstReal?.id) return false;
    setLoadingOlderMessages(true);
    try {
      const res = await fetchWithTimeout(
        apiPath(`/api/chat/conversations/${chatId}/messages?before_id=${firstReal.id}&limit=80`),
        { headers: { Authorization: `Bearer ${token}` } },
        15000
      );
      if (!res.ok) return false;
      const data = await res.json();
      const older = dedupeMessagesById(
        (data.messages || []).map((row: Record<string, unknown>) => normalizeChatMessage(row))
      );
      if (older.length === 0) {
        setMessagesHasMore(false);
        return false;
      }
      setMessages((prev) => dedupeMessagesById([...older, ...prev]));
      setMessagesHasMore(Boolean(data.has_more));
      return true;
    } catch {
      return false;
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [activeChat?.id, token, loadingOlderMessages]);

  const buildFollowingTracks = useCallback(
    (messageId: string | number): VoiceTrack[] => {
      if (!activeChat?.id) return [];
      const idx = messages.findIndex((m) => String(m.id) === String(messageId));
      if (idx < 0) return [];
      const tracks: VoiceTrack[] = [];
      for (let i = idx + 1; i < messages.length; i += 1) {
        const row = messages[i];
        if (!isChatAudioMessage(row) || !isPlayableVoiceMessage(row)) continue;
        const t = buildVoiceTrackFromMessage(row, activeChat.id, token, {
          userId: user?.id,
          userName: user?.username,
        });
        if (t) tracks.push(t);
      }
      return tracks;
    },
    [activeChat?.id, messages, token, user?.id, user?.username]
  );

  useEffect(() => {
    registerChatBridge({
      openConversation: async (conversationId: number) => {
        navigation.getParent()?.navigate('Orbit');
        const found = conversations.find((c) => String(c.id) === String(conversationId));
        if (found) {
          setActiveChat(found);
        } else if (token) {
          const res = await fetchWithTimeout(apiPath('/api/chat/conversations'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) {
              setConversations(list);
              const row = list.find((c: { id: number }) => String(c.id) === String(conversationId));
              if (row) setActiveChat(row);
            }
          }
        }
        await waitForChatMessagesReady(conversationId);
      },
      ensureMessageLoaded: async (messageId: string | number) => {
        if (messagesRef.current.some((m) => String(m.id) === String(messageId))) return true;
        let guard = 0;
        while (messagesHasMoreRef.current && guard < 40) {
          guard += 1;
          const loaded = await loadOlderMessages();
          if (!loaded) break;
          if (messagesRef.current.some((m) => String(m.id) === String(messageId))) return true;
        }
        return messagesRef.current.some((m) => String(m.id) === String(messageId));
      },
      scrollToMessage: async (messageId: string | number) => {
        const idx = messagesRef.current.findIndex((m) => String(m.id) === String(messageId));
        if (idx < 0) return;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToIndex?.({
              index: idx,
              animated: true,
              viewPosition: 0.5,
            });
            resolve();
          });
        });
      },
      buildFollowingTracks: (messageId: string | number) => buildFollowingTracks(messageId),
    });
    return () => registerChatBridge(null);
  }, [
    registerChatBridge,
    navigation,
    conversations,
    token,
    loadOlderMessages,
    buildFollowingTracks,
    waitForChatMessagesReady,
  ]);

  useEffect(() => {
    registerVideoChatBridge({
      openConversation: async (conversationId: number) => {
        navigation.getParent()?.navigate('Orbit');
        const found = conversations.find((c) => String(c.id) === String(conversationId));
        if (found) {
          setActiveChat(found);
        } else if (token) {
          const res = await fetchWithTimeout(apiPath('/api/chat/conversations'), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const list = await res.json();
            if (Array.isArray(list)) {
              setConversations(list);
              const row = list.find((c: { id: number }) => String(c.id) === String(conversationId));
              if (row) setActiveChat(row);
            }
          }
        }
        await waitForChatMessagesReady(conversationId);
      },
      ensureMessageLoaded: async (messageId: string | number) => {
        if (messagesRef.current.some((m) => String(m.id) === String(messageId))) return true;
        let guard = 0;
        while (messagesHasMoreRef.current && guard < 40) {
          guard += 1;
          const loaded = await loadOlderMessages();
          if (!loaded) break;
          if (messagesRef.current.some((m) => String(m.id) === String(messageId))) return true;
        }
        return messagesRef.current.some((m) => String(m.id) === String(messageId));
      },
      scrollToMessage: async (messageId: string | number) => {
        const idx = messagesRef.current.findIndex((m) => String(m.id) === String(messageId));
        if (idx < 0) return;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToIndex?.({
              index: idx,
              animated: true,
              viewPosition: 0.5,
            });
            resolve();
          });
        });
      },
    });
    return () => registerVideoChatBridge(null);
  }, [
    registerVideoChatBridge,
    navigation,
    conversations,
    token,
    loadOlderMessages,
    waitForChatMessagesReady,
  ]);

  // 4. Отправка сообщения
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat || !user?.id) return;

    if (isDemoChatOpen(activeChat)) {
      const text = newMessage.trim();
      const pendingId = `pending-${Date.now()}`;
      const replySnapshot = replyTo;
      setNewMessage('');
      setReplyTo(null);
      setMessages((prev) => [
        ...prev,
        {
          id: pendingId,
          pending: true,
          text,
          sender_id: user.id,
          type: 'text',
          created_at: new Date().toISOString(),
          reply_to: replySnapshot
            ? {
                id: replySnapshot.id,
                text: replySnapshot.text,
                type: replySnapshot.type,
                sender_name: replySnapshot.sender_name,
              }
            : null,
        },
      ]);
      requestAnimationFrame(() => flatListRef.current?.scrollToEnd?.({ animated: true }));
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === pendingId
              ? { ...m, id: `demo-local-${Date.now()}`, pending: false }
              : m
          )
        );
      }, 350);
      return;
    }

    const text = newMessage.trim();
    const pendingId = `pending-${Date.now()}`;
    const replySnapshot = replyTo;
    setNewMessage('');
    setReplyTo(null);
    setMessages((prev) => [
      ...prev,
      {
        id: pendingId,
        pending: true,
        text,
        sender_id: user.id,
        type: null,
        created_at: new Date().toISOString(),
        reply_to: replySnapshot
          ? {
              id: replySnapshot.id,
              text: replySnapshot.text,
              type: replySnapshot.type,
              sender_name: replySnapshot.sender_name,
            }
          : null,
      },
    ]);
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd?.({ animated: true }));

    setSending(true);
    try {
      const payload: { text: string; reply_to_id?: number } = { text };
      if (replySnapshot) payload.reply_to_id = replySnapshot.id;

      const res = await fetchWithTimeout(
        apiPath(`/api/chat/conversations/${activeChat.id}/messages`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        },
        20000
      );
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) =>
          mergeChatMessage(prev, normalizeChatMessage(saved as Record<string, unknown>), pendingId)
        );
      } else {
        setMessages((prev) => prev.filter((m) => String(m.id) !== pendingId));
        setNewMessage(text);
        if (replySnapshot) setReplyTo(replySnapshot);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => String(m.id) !== pendingId));
      setNewMessage(text);
      if (replySnapshot) setReplyTo(replySnapshot);
    } finally {
      setSending(false);
    }
  };

  // 5. Поиск
  const handleSearch = (text) => {
    setSearchQuery(text);
    const q = text.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(() => {
      const local = conversations
        .filter((c) => (c.user?.username || '').toLowerCase().includes(q) || (c.user?.full_name || '').toLowerCase().includes(q))
        .map((c) => ({ ...c.user, existingChat: c }));

      fetch(apiPath(`/api/users/search?q=${encodeURIComponent(text)}`), {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          const server = Array.isArray(data) ? data : [];
          const combined = [...local];
          server.forEach((u) => {
            if (!combined.some((c) => String(c.id) === String(u.id))) combined.push(u);
          });
          setSearchResults(combined);
        })
        .catch(() => setSearchResults(local))
        .finally(() => setLoadingSearch(false));
    }, 400);
  };

  // 6. Создание чата
  const handleStartChat = async (otherUser) => {
    if (otherUser.id === user?.id) {
      Alert.alert('Это ты', 'Нельзя начать чат с самим собой');
      return;
    }
    try {
      const res = await fetch(apiPath('/api/chat/conversations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: otherUser.id }),
      });
      if (res.ok) {
        const conv = await res.json();
        setSearchQuery('');
        setConversations((prev) => {
          if (prev.some((c) => String(c.id) === String(conv.id))) return prev;
          return [conv, ...prev];
        });
        setActiveChat(conv);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 7. Очистка/удаление
  const handleClearHistory = () => {
    Alert.alert('Очистка истории', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: async () => {
        if (!activeChat) return;
        try {
          const res = await fetch(apiPath(`/api/chat/conversations/${activeChat.id}/clear`), {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) setMessages([]);
        } catch {
          Alert.alert('Ошибка', 'Не удалось очистить историю');
        }
      }},
    ]);
  };

  const handleDeleteChat = () => {
    Alert.alert('Удаление чата', 'Вы уверены?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        if (!activeChat) return;
        try {
          const res = await fetch(apiPath(`/api/chat/conversations/${activeChat.id}`), {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            setConversations((prev) => prev.filter((c) => c.id !== activeChat.id));
            setActiveChat(null);
            setIsChatInfoOpen(false);
          }
        } catch {
          Alert.alert('Ошибка', 'Не удалось удалить чат');
        }
      }},
    ]);
  };

  const sendChatFile = useCallback(
    async (
      localUri: string,
      mimeType: string,
      messageType: 'image' | 'file',
      opts?: {
        width?: number;
        height?: number;
        pendingPreview?: string;
        videoNote?: boolean;
        durationSec?: number;
      }
    ) => {
      if (!activeChat || !user?.id) {
        Alert.alert('Ошибка', 'Откройте чат и попробуйте снова');
        throw new Error('send_failed');
      }
      if (isDemoChatOpen(activeChat)) {
        Alert.alert('Демо', 'Отправка файлов доступна в реальном чате.');
        throw new Error('demo_chat');
      }
      if (!token) {
        Alert.alert('Ошибка', 'Откройте чат и попробуйте снова');
        throw new Error('send_failed');
      }
      const pendingId = `pending-${Date.now()}`;
      const isImage = messageType === 'image';
      const isVideoNote = Boolean(opts?.videoNote);
      const uploadMimeGuess = resolveUploadMimeType(
        localUri,
        isVideoNote ? 'video/mp4' : mimeType
      );
      const isVideo = uploadMimeGuess.startsWith('video/') || isVideoNote;
      const isAudio = uploadMimeGuess.startsWith('audio/');
      if (opts?.pendingPreview || isImage || isVideo || isAudio) {
        setMessages((prev) => [
          ...prev,
          {
            id: pendingId,
            pending: true,
            type: isImage ? 'image' : isAudio ? 'voice' : isVideoNote ? 'video_note' : 'file',
            local_preview_uri: isImage
              ? opts?.pendingPreview || localUri
              : isAudio || isVideoNote
                ? localUri
                : undefined,
            text: '',
            media_duration:
              opts?.durationSec != null ? Math.max(1, Math.round(opts.durationSec)) : undefined,
            sender_id: user.id,
            created_at: new Date().toISOString(),
          },
        ]);
        requestAnimationFrame(() => flatListRef.current?.scrollToEnd?.({ animated: true }));
      }
      setSending(true);
      try {
        let uploadUri = normalizeLocalUploadUri(localUri);
        let uploadMime = uploadMimeGuess;
        if (isImage) {
          const prepared = await prepareChatImageForUpload(
            localUri,
            opts?.width,
            opts?.height
          );
          uploadUri = prepared.uri;
          uploadMime = prepared.mimeType;
        } else if (isAudio) {
          const prepared = await prepareChatVoiceForUpload(localUri);
          uploadUri = prepared.uri;
          uploadMime = prepared.mimeType;
        } else if (isVideoNote) {
          const prepared = await prepareChatVideoNoteForUpload(localUri);
          uploadUri = prepared.uri;
          uploadMime = prepared.mimeType;
        }
        const uploadRes = await uploadChatAttachment(
          activeChat.id,
          uploadUri,
          token,
          uploadMime
        );
        let uploaded: { file_id?: number };
        try {
          uploaded = JSON.parse(uploadRes.body);
        } catch {
          throw new Error('upload_bad_json');
        }
        if (!uploaded?.file_id) throw new Error('upload_no_file_id');
        const postType = isImage
          ? 'image'
          : isAudio
            ? 'voice'
            : isVideoNote
              ? 'video_note'
              : isVideo
                ? 'video'
                : messageType;
        const msgRes = await fetchWithTimeout(
          apiPath(`/api/chat/conversations/${activeChat.id}/messages`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: postType,
              file_id: uploaded.file_id,
              text: '',
              media_duration:
                opts?.durationSec != null
                  ? Math.max(1, Math.round(opts.durationSec))
                  : undefined,
              media_width:
                opts?.width != null ? Math.round(Number(opts.width)) : undefined,
              media_height:
                opts?.height != null ? Math.round(Number(opts.height)) : undefined,
            }),
          },
          20000
        );
        if (msgRes.ok) {
          const saved = await msgRes.json();
          setMessages((prev) =>
            mergeChatMessage(prev, normalizeChatMessage(saved as Record<string, unknown>), pendingId)
          );
        } else {
          const errText = await msgRes.text().catch(() => '');
          setMessages((prev) => prev.filter((m) => String(m.id) !== pendingId));
          throw new Error(`message_${msgRes.status}:${errText.slice(0, 200)}`);
        }
      } catch (err) {
        if (isVideoNote) {
          setMessages((prev) =>
            prev.map((m) =>
              String(m.id) === pendingId ? { ...m, pending: true, upload_failed: true } : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => String(m.id) !== pendingId));
        }
        const raw = err instanceof Error ? err.message : '';
        let userMsg = isVideoNote ? 'Не удалось отправить видеокружок' : 'Не удалось отправить файл';
        if (raw === 'video_not_ready' || raw === 'empty_video') {
          userMsg = 'Видео ещё не готово — удерживайте запись чуть дольше и попробуйте снова';
        } else if (raw === 'video_too_large') {
          userMsg = 'Видео слишком большое — запишите короче (до ~30 сек)';
        } else if (raw.startsWith('upload_413')) {
          userMsg =
            'Файл слишком большой для сервера. Запишите короче или перезапустите nginx (лимит 30M).';
        } else if (raw.startsWith('upload_400') || raw.includes('Недопустимый тип')) {
          userMsg = 'Сервер не принял формат видео. Обновите backend или попробуйте ещё раз';
        } else if (isUploadTransportError(raw)) {
          userMsg =
            'Нет связи с сервером загрузки. Уберите EXPO_PUBLIC_UPLOAD_API_URL из .env или укажите тот же адрес, что EXPO_PUBLIC_API_URL.';
        } else if (raw.startsWith('upload_')) {
          userMsg = 'Ошибка загрузки на сервер (проверьте Wi‑Fi и EXPO_PUBLIC_API_URL)';
        } else if (raw.startsWith('message_')) {
          userMsg = 'Файл загружен, но сообщение не создано';
        }
        if (__DEV__ && raw) console.warn('[sendChatFile]', raw);
        Alert.alert('Ошибка', userMsg);
        throw new Error('send_failed');
      } finally {
        setSending(false);
      }
    },
    [activeChat, token, user?.id]
  );

  const handleAttachImage = async () => {
    if (!activeChat) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нужен доступ к галерее');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      exif: false,
    });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    await sendChatFile(asset.uri, asset.mimeType || 'image/jpeg', 'image', {
      width: asset.width,
      height: asset.height,
      pendingPreview: asset.uri,
    });
  };

  // 8. Статус собеседника
  useEffect(() => {
    if (!activeChat?.user?.id) return;
    const otherId = activeChat.user.id;
    fetch(apiPath(`/api/chat/users/${otherId}/status`), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setActiveStatus(data);
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (data.online) next.add(otherId);
            else next.delete(otherId);
            return next;
          });
        }
      })
      .catch(() => {});
  }, [activeChat, token]);

  // ==========================================================
  // 🔔 ЗВОНКИ — обработчики нажатия на иконки
  // ==========================================================
  const startAudioCall = () => {
    if (!activeChat?.user) return;
    (globalThis as any).__activeCallId = `outgoing_${Date.now()}`; // резерв
    navigateRoot(navigation, 'CallScreen', {
      isIncoming: false,
      callType: 'audio',
      targetUser: activeChat.user,
    });
  };

  const startVideoCall = () => {
    if (!activeChat?.user) return;
    (globalThis as any).__activeCallId = `outgoing_${Date.now()}`;
    navigateRoot(navigation, 'CallScreen', {
      isIncoming: false,
      callType: 'video',
      targetUser: activeChat.user,
    });
  };

  // Фильтрация
  const displayedChats = searchQuery
    ? searchResults.map((u) => ({ id: u.existingChat?.id || u.id, user: u, last_message: u.existingChat?.last_message, existingChat: u.existingChat }))
    : conversations;

  type ChatRow = {
    id: number | string;
    type?: string;
    user?: unknown;
    display_name?: string;
    display_avatar?: string;
    last_message?: string;
    last_message_at?: string;
    has_unread?: boolean;
  };
  const listChats = (
    searchQuery
      ? displayedChats
      : mergeHubConversations(displayedChats as Conversation[])
  ) as ChatRow[];
  const hdr = getTalkHeaderColors(isDark);
  const messenger = getMessengerSurfaces(isDark);

  const openConversationFromHub = useCallback(
    (item: Conversation) => {
      if (isDemoConversation(item)) {
        setActiveChat(item);
        return;
      }
      if (item.user) {
        handleStartChat(item.user);
      } else {
        setActiveChat(item);
      }
    },
    [handleStartChat]
  );

  // --- Orbit Hub (главный экран мессенджера) ---
  if (!activeChat) {
    return (
      <MessengerOrbitHub
        isDark={isDark}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        conversations={listChats as Conversation[]}
        loading={listLoading || loadingSearch}
        refreshing={listRefreshing}
        onRefresh={refreshConversations}
        onOpenConversation={openConversationFromHub}
        onNewChat={() => navigation.navigate('NewLink')}
        listHeader={
          <>
            <ChatVoiceMiniPlayer placement="chatList" />
            <ChatVideoNoteMiniPlayer placement="chatList" />
          </>
        }
      />
    );
  }

  // --- Рендер окна чата ---
  const isGroup = activeChat.type === 'group';
  const otherUser = activeChat.user;
  const activeUserOnline = otherUser ? onlineUsers.has(otherUser.id) : false;
  const headerName = isGroup
    ? activeChat.title || activeChat.display_name || 'Группа'
    : otherUser?.full_name || otherUser?.username || activeChat.display_name || 'Чат';
  const headerStatus = isDemoChatOpen(activeChat)
    ? 'демо-переписка'
    : activeUserOnline
      ? 'в сети'
      : formatLastSeen(activeStatus?.last_seen_at || otherUser?.last_seen_at);
  const headerAvatarPath =
    activeChat.display_avatar || (isGroup ? undefined : otherUser?.avatar);
  const headerInitial = (
    activeChat.display_name ||
    otherUser?.username ||
    otherUser?.full_name ||
    'U'
  )[0]?.toUpperCase();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ConversationAuraHeader
        isDark={isDark}
        title={headerName}
        subtitle={headerStatus}
        isOnline={activeUserOnline}
        isGroup={isGroup}
        avatarUrl={headerAvatarPath}
        avatarInitial={headerInitial}
        onBack={() => setActiveChat(null)}
        onInfo={() => setIsChatInfoOpen(true)}
        onAudioCall={!isGroup && otherUser ? startAudioCall : undefined}
        onVideoCall={!isGroup && otherUser ? startVideoCall : undefined}
      />

      <ChatVoiceMiniPlayer placement="openChat" />
      <ChatVideoNoteMiniPlayer placement="openChat" />

      <View style={styles.messagesArea}>
        <ChatWallpaper isDark={isDark} />
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) =>
            String(item.id).startsWith('pending-') ? String(item.id) : `msg-${item.id}`
          }
          style={styles.messagesListTransparent}
          contentContainerStyle={styles.messagesList}
          initialNumToRender={18}
          maxToRenderPerBatch={12}
          windowSize={8}
          removeClippedSubviews={Platform.OS === 'android'}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset?.({
              offset: Math.max(0, info.averageItemLength * info.index),
              animated: true,
            });
          }}
          ListEmptyComponent={
            messagesLoading ? (
              <View style={styles.messagesLoader}>
                <ActivityIndicator size="small" color={talkBrand.accent} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          const localPreview = item.local_preview_uri as string | undefined;
          const isImageMsg = isChatImageMessage(item);
          const caption = (item.text || '').trim();
          const isRead = Boolean(item.read_at);

          const replyBlock = item.reply_to ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => item.reply_to?.id && scrollToMessageInChat(item.reply_to.id, false)}
              style={[
                styles.messageBubble,
                messageBubbleStyle(isDark, isMe),
                styles.replyBubbleAboveMedia,
              ]}
            >
              <View style={styles.replyBlock}>
                <Text style={[styles.replyName, isMe && { color: '#fff' }]}>
                  {item.reply_to.sender_name || 'Пользователь'}
                </Text>
                <Text
                  style={[styles.replyText, isMe && { color: 'rgba(255,255,255,0.7)' }]}
                  numberOfLines={1}
                >
                  {item.reply_to.text ||
                    (item.reply_to.type === 'image' ? '📷 Фото' : 'Сообщение')}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null;

          const imageUri = chatMessageImageUri(item.file_url, localPreview);

          const isVideoNote = isChatVideoNoteMessage(item);
          const isVoiceMsg = isChatAudioMessage(item);

          if (isVideoNote) {
            const videoNoteActive = activeVideoId != null && activeVideoId === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.messageRow,
                  isMe ? styles.messageRowMe : styles.messageRowOther,
                  videoNoteActive && styles.messageRowVideoNoteActive,
                ]}
                onLongPress={() => setSelectedMessage(item)}
                activeOpacity={0.92}
              >
                <View style={styles.videoNoteBubble}>
                  <ChatVideoNoteMessage
                    messageId={item.id}
                    conversationId={activeChat!.id}
                    senderLabel={
                      isMe
                        ? 'Вы'
                        : String(item.sender_name || otherUser?.full_name || otherUser?.username || 'Чат')
                    }
                    fileUrl={(item.file_url as string | undefined) ?? null}
                    localPreviewUri={item.local_preview_uri as string | undefined}
                    token={token}
                    isMe={isMe}
                    timeLabel={formatMessageTime(item.created_at)}
                    isRead={isRead}
                    pending={Boolean(item.pending && !item.file_url)}
                    activeVideoId={activeVideoId}
                    onActivate={setActiveVideoId}
                  />
                </View>
              </TouchableOpacity>
            );
          }

          if (isVoiceMsg) {
            const voiceTrack =
              activeChat?.id && (item.file_url || item.local_preview_uri)
                ? buildVoiceTrackFromMessage(item, activeChat.id, token, {
                    userId: user?.id,
                    userName: user?.username,
                  })
                : null;
            const highlightActive =
              highlightedMessageId != null &&
              String(highlightedMessageId) === String(item.id);
            return (
              <TouchableOpacity
                style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}
                onLongPress={() => setSelectedMessage(item)}
                activeOpacity={0.92}
              >
                <VoiceMessageHighlight
                  active={highlightActive}
                  pulseKey={highlightGeneration}
                  style={[
                    styles.messageBubble,
                    messageBubbleStyle(isDark, isMe),
                    styles.voiceBubble,
                  ]}
                >
                  {item.file_url || item.local_preview_uri ? (
                    <ChatVoiceMessage
                      messageId={item.id}
                      fileUrl={(item.file_url as string | undefined) ?? null}
                      localPreviewUri={
                        item.pending && !item.file_url
                          ? (item.local_preview_uri as string | undefined)
                          : undefined
                      }
                      token={token}
                      isMe={isMe}
                      isDark={isDark}
                      timeLabel={formatMessageTime(item.created_at)}
                      senderName={item.sender_name as string | undefined}
                      isRead={isRead}
                      durationSec={item.media_duration as number | undefined}
                      pending={Boolean(item.pending && !item.file_url)}
                      track={voiceTrack}
                      conversationId={activeChat?.id ?? null}
                      buildFollowingTracks={buildFollowingTracks}
                    />
                  ) : (
                    <Text style={[styles.messageText, { fontSize: messageFontSize }, isMe && styles.messageTextMe]}>Голосовое</Text>
                  )}
                </VoiceMessageHighlight>
              </TouchableOpacity>
            );
          }

          if (isImageMsg && imageUri) {
            return (
              <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                <View style={styles.messageMediaColumn}>
                  {replyBlock}
                  <TouchableOpacity
                    activeOpacity={0.92}
                    onPress={() => openImageViewer(item.id)}
                    onLongPress={() => setSelectedMessage(item)}
                  >
                    <ChatMessagePhoto
                      uri={imageUri}
                      maxWidth={chatImageSize}
                      borderColor={
                        isMe ? talkBrand.accent : isDark ? '#1E2A36' : '#D0DAD4'
                      }
                      isMe={isMe}
                      isRead={isRead}
                      timeLabel={formatMessageTime(item.created_at)}
                    />
                  </TouchableOpacity>
                  {caption ? (
                    <View
                      style={[
                        styles.messageBubble,
                        messageBubbleStyle(isDark, isMe),
                        styles.captionBubble,
                        styles.captionBubbleMinimal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          { fontSize: messageFontSize },
                          isMe && styles.messageTextMe,
                          !isMe && isDark && styles.textDark,
                        ]}
                      >
                        {caption}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }

          return (
            <TouchableOpacity
              style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}
              onLongPress={() => setSelectedMessage(item)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.messageBubble,
                  messageBubbleStyle(isDark, isMe),
                ]}
              >
                {item.reply_to && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      item.reply_to?.id && scrollToMessageInChat(item.reply_to.id, false)
                    }
                  >
                    <View style={styles.replyBlock}>
                      <Text style={[styles.replyName, isMe && { color: '#fff' }]}>
                        {item.reply_to.sender_name || 'Пользователь'}
                      </Text>
                      <Text
                        style={[styles.replyText, isMe && { color: 'rgba(255,255,255,0.7)' }]}
                        numberOfLines={1}
                      >
                        {item.reply_to.text ||
                          (item.reply_to.type === 'image' ? '📷 Фото' : 'Сообщение')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <Text
                  style={[
                    styles.messageText,
                    { fontSize: messageFontSize },
                    isMe && styles.messageTextMe,
                    !isMe && isDark && styles.textDark,
                  ]}
                >
                  {caption ||
                    (item.type === 'image'
                      ? '📷 Фото'
                      : isChatVideoNoteMessage(item)
                        ? '🎥 Видеосообщение'
                        : item.text?.trim() || 'Сообщение')}
                </Text>
                <View style={styles.textMessageMeta}>
                  <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>
                    {formatMessageTime(item.created_at)}
                  </Text>
                  {isMe ? (
                    <Ionicons
                      name={isRead ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={isMe ? 'rgba(255,255,255,0.75)' : '#536471'}
                    />
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        />
      </View>

      {/* ПАНЕЛЬ ОТВЕТА */}
      {replyTo && (
        <View style={[styles.replyBar, isDark && styles.replyBarDark]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.75}
            onPress={() => replyTo?.id && scrollToMessageInChat(replyTo.id, false)}
          >
            <Text style={styles.replyBarName}>Ответ: {replyTo.sender_name || 'Пользователь'}</Text>
            <Text style={styles.replyBarText} numberOfLines={1}>
              {replyTo.text ||
                (replyTo.type === 'image' ? '📷 Фото' : 'Сообщение')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={20} color={isDark ? '#e7e9ea' : '#0f1419'} />
          </TouchableOpacity>
        </View>
      )}

      {activeChat ? (
        <OrbitComposerDock isDark={isDark}>
          <ChatComposer
            value={newMessage}
            onChangeText={setNewMessage}
            onSend={handleSendMessage}
            sending={sending}
            disabled={!activeChat}
            isDark={isDark}
            paddingBottom={Math.max(insets.bottom + 10, 18)}
            onAttachPress={handleAttachImage}
            onSendFile={(uri, mime, type) => sendChatFile(uri, mime, type)}
          />
        </OrbitComposerDock>
      ) : null}

      {/* МОДАЛКА ИНФОРМАЦИИ О ЧАТЕ */}
      <ChatInfoModal
        visible={isChatInfoOpen}
        onClose={() => setIsChatInfoOpen(false)}
        chat={activeChat}
        messages={messages}
        onOpenProfile={() => {
          const uname = activeChat?.user?.username;
          if (uname) navigateRoot(navigation, 'UserProfile', { username: uname });
        }}
        onDeleteChat={handleDeleteChat}
        onClearHistory={handleClearHistory}
        onMuteToggle={() => Alert.alert('Уведомления', 'В разработке')}
      />

      <ChatImageViewer
        visible={imageViewerIndex !== null}
        items={imageViewerItems}
        initialIndex={imageViewerIndex ?? 0}
        authToken={token || ''}
        onClose={() => setImageViewerIndex(null)}
        onReply={(msg) => setReplyTo(msg)}
        onShowInChat={(id) => scrollToMessageInChat(id, true)}
        onForward={(msg) => setForwardPick({ message: msg })}
        onDelete={deleteChatMessage}
      />

      <ForwardChatModal
        visible={Boolean(forwardPick)}
        conversations={conversations}
        currentChatId={activeChat?.id}
        loading={forwardLoading}
        onClose={() => !forwardLoading && setForwardPick(null)}
        onPick={(conv) => {
          if (forwardPick?.message) void forwardMessageToChat(conv, forwardPick.message);
        }}
      />

      {/* КОНТЕКСТНОЕ МЕНЮ СООБЩЕНИЯ */}
      <Modal visible={!!selectedMessage} transparent animationType="fade">
        <TouchableOpacity style={styles.contextOverlay} onPress={() => setSelectedMessage(null)}>
          <View style={[styles.contextMenu, isDark && styles.contextMenuDark]}>
            <TouchableOpacity style={styles.contextItem} onPress={() => {
              setReplyTo(selectedMessage);
              setSelectedMessage(null);
            }}>
              <Ionicons name="arrow-undo-outline" size={20} color={isDark ? '#e7e9ea' : '#0f1419'} />
              <Text style={[styles.contextText, isDark && styles.textDark]}>Ответить</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextItem} onPress={() => {
              setSelectedMessage(null);
              Alert.alert('Скопировано');
            }}>
              <Ionicons name="copy-outline" size={20} color={isDark ? '#e7e9ea' : '#0f1419'} />
              <Text style={[styles.contextText, isDark && styles.textDark]}>Копировать</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contextItem} onPress={() => {
              void deleteChatMessage(selectedMessage);
              setSelectedMessage(null);
            }}>
              <Ionicons name="trash-outline" size={20} color="#f91880" />
              <Text style={[styles.contextText, { color: '#f91880' }]}>Удалить</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatListFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  tgHeader: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    minHeight: 48,
  },
  tgHeaderIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  tgHeaderLogoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tgHeaderAvatar: { width: 32, height: 32, borderRadius: 16 },
  tgHeaderAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  tgSearchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },

  tgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  tgAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgAvatarImg: { width: '100%', height: '100%' },
  tgAvatarLetter: { fontSize: 22, fontWeight: '700' },
  tgRowBody: { flex: 1, minWidth: 0 },
  tgRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  tgName: { flex: 1, fontSize: 16, fontWeight: '600', marginRight: 8 },
  tgTime: { fontSize: 13 },
  tgRowBottom: { flexDirection: 'row', alignItems: 'center' },
  tgPreview: { flex: 1, fontSize: 15, marginRight: 8 },
  rowSep: { height: StyleSheet.hairlineWidth },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: talkBrand.accent,
  },
  tgEmpty: { textAlign: 'center', marginTop: 48, fontSize: 15, paddingHorizontal: 24 },

  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: talkBrand.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, height: '60%' },
  bottomSheetDark: { backgroundColor: getTalkColors(true).inputBg },
  dragHandle: { width: 40, height: 4, backgroundColor: '#ccc', borderRadius: 2, alignSelf: 'center', marginBottom: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f1419' },
  closeBtn: { padding: 5 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  headerDark: { borderBottomColor: '#2f3336' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: talkBrand.accent, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  headerAvatarImg: { width: '100%', height: '100%' },
  headerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f1419' },
  headerSubtitle: { fontSize: 13, color: talkBrand.accent },

  // 🔔 Кнопки звонков в шапке
  callButtons: { flexDirection: 'row', gap: 15 },
  callBtn: { padding: 5 },

  messagesArea: { flex: 1, overflow: 'hidden' },
  messagesAreaTransparent: { backgroundColor: 'transparent' },
  messagesListTransparent: { backgroundColor: 'transparent' },
  messagesList: { padding: 16, flexGrow: 1 },
  messagesLoader: { paddingVertical: 24, alignItems: 'center' },
  messageRow: { flexDirection: 'row', marginBottom: 8 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  voiceBubble: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingBottom: 4,
    maxWidth: '88%',
  },
  videoNoteBubble: {
    backgroundColor: 'transparent',
    padding: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  messageRowVideoNoteActive: {
    marginBottom: 18,
  },
  messageMediaColumn: { maxWidth: '80%', gap: 2 },
  replyBubbleAboveMedia: { marginBottom: 2, alignSelf: 'stretch' },
  captionBubble: { marginTop: 2 },
  captionBubbleMinimal: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12 },
  textMessageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    marginTop: 4,
  },
  messageMe: { backgroundColor: talkBrand.accent, borderBottomRightRadius: 4 },
  messageOther: { backgroundColor: getTalkColors(false).surface2, borderBottomLeftRadius: 4 },
  messageOtherDark: { backgroundColor: getTalkColors(true).surface2, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: '#0f1419' },
  messageTextMe: { color: '#ffffff' },
  messageTime: { fontSize: 10, color: '#536471', alignSelf: 'flex-end', marginTop: 4 },
  messageTimeMe: { color: 'rgba(255,255,255,0.7)' },

  replyBlock: { borderLeftWidth: 3, borderLeftColor: talkBrand.accent, paddingLeft: 8, marginBottom: 6 },
  replyName: { fontSize: 12, fontWeight: '700', color: talkBrand.accent },
  replyText: { fontSize: 12, color: '#536471' },

  replyBar: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f0f0f0', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)' },
  replyBarDark: {
    backgroundColor: getTalkColors(true).inputBg,
    borderTopColor: getTalkColors(true).border,
  },
  replyBarName: { fontSize: 13, fontWeight: '700', color: talkBrand.accent },
  replyBarText: { fontSize: 12, color: '#536471' },

  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', alignItems: 'center', gap: 8 },
  inputContainerDark: { borderTopColor: '#2f3336' },
  attachBtn: { padding: 5 },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  inputDark: { backgroundColor: getTalkColors(true).inputBg, color: getTalkColors(true).text },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: talkBrand.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },

  contextOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  contextMenu: { width: 200, backgroundColor: '#fff', borderRadius: 14, padding: 8, elevation: 10 },
  contextMenuDark: { backgroundColor: getTalkColors(true).inputBg },
  contextItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, gap: 12 },
  contextText: { fontSize: 16, color: '#0f1419' },

  textDark: { color: '#e7e9ea' },
  textMutedDark: { color: '#71767b' },
  groupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  groupLinkText: { color: talkBrand.accent, fontWeight: '700', fontSize: 16 },
});