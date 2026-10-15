import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NewChatModal } from '../modal/NewChatModal';
import { CreateGroupModal } from '../modal/CreateGroupModal';
import { groupMessages } from '../utils/groupMessages';

function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function formatLastSeen(iso) {
    if (!iso) return 'был(а) давно';
    const d = new Date(iso);
    const diffMin = (Date.now() - d.getTime()) / 60000;
    if (diffMin < 5) return 'был(а) только что';
    if (diffMin < 60) return 'был(а) недавно';
    if (diffMin < 60 * 24) return 'был(а) сегодня';
    if (diffMin < 60 * 24 * 7) return 'был(а) на этой неделе';
    return 'был(а) давно';
}

const EMOJI_LIST = [
    '😀','😁','😂','🤣','😊','😍','😘','😎','🤔','🙃',
    '😴','😢','😭','😡','👍','👎','❤️','🔥','🎉','✨',
    '🙏','💯','😅','🤗','🤩','😇','🥳','🤯','😱','🤝',
    '👀','💪','🌹','🍕','☕','⚡','🌟','🎁','🎵','🚀',
];

const AUTO_DELETE_OPTIONS = [
    { value: 'off', label: 'Выключено' },
    { value: '1d', label: '1 день' },
    { value: '7d', label: '7 дней' },
    { value: '30d', label: '30 дней' },
    { value: '90d', label: '90 дней' },
];

function EmptyState({ icon, title, hint }) {
    return (
        <div className="chat-info-empty-state">
            <div className="chat-info-empty-state-icon">{icon}</div>
            <div className="chat-info-empty-state-title">{title}</div>
            {hint && <div className="chat-info-empty-state-hint">{hint}</div>}
        </div>
    );
}

function BellIcon({ size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
    );
}

function BellOffIcon({ size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
            className="chat-info-menu-bell-off">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            <line x1="3" y1="3" x2="21" y2="21" />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
        </svg>
    );
}

function StarIcon({ filled = false, size = 20 }) {
    if (filled) {
        return (
            <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
                <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.6 6.8L12 17.8 5.8 20.4l1.6-6.8L2.2 9l6.9-.7L12 2z" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.6 6.8L12 17.8 5.8 20.4l1.6-6.8L2.2 9l6.9-.7L12 2z" />
        </svg>
    );
}

// ===== Иконки для контекстного меню сообщения =====
function ReplyIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 17 4 12 9 7" />
            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function PhotoEditIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
            <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
        </svg>
    );
}

function PinIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="17" x2="12" y2="22" />
            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
    );
}

function ForwardIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 17 20 12 15 7" />
            <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
        </svg>
    );
}

function SelectIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="8 12 11 15 16 9" />
        </svg>
    );
}

function DeleteIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

function CopyIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}

function MessageMenuArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
}

function useIsDarkTheme() {
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined'
            ? document.body.classList.contains('dark-theme')
            : false
    );

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains('dark-theme'));
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return isDark;
}

export function ChatPage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDarkThemeLocal = useIsDarkTheme();
    const isDarkTheme = isDarkThemeLocal;

    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(conversationId ? Number(conversationId) : null);
    const [messages, setMessages] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [search, setSearch] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [activeStatus, setActiveStatus] = useState(null);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [emojiOpen, setEmojiOpen] = useState(false);

    const [onlySubscriptions, setOnlySubscriptions] = useState(false);
    const [subscriptionIds, setSubscriptionIds] = useState(new Set());
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

    const [groupMembers, setGroupMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [infoTab, setInfoTab] = useState('media');
    const [commonGroups, setCommonGroups] = useState([]);

    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPage, setMenuPage] = useState(null);
    const [chatSettings, setChatSettings] = useState({
        muted: false,
        autoDelete: 'off',
        blocked: false,
        sharingDisabled: false,
    });
    const menuRef = useRef(null);

    const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
    const [settingsTitle, setSettingsTitle] = useState('');
    const [settingsAvatar, setSettingsAvatar] = useState('');
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsError, setSettingsError] = useState('');

    const [settingsPage, setSettingsPage] = useState(null);

    const [groupType, setGroupType] = useState('private');
    const [reactionsMode, setReactionsMode] = useState('all');
    const [topicsEnabled, setTopicsEnabled] = useState(false);
    const [historyForNew, setHistoryForNew] = useState(true);
    const [permissions, setPermissions] = useState({
        sendMessages: true,
        sendMedia: true,
        sendLinks: true,
        addMembers: true,
        pinMessages: true,
        changeInfo: true,
    });
    const [inviteLinks, setInviteLinks] = useState([
        { id: 1, code: 'astra-demo-1', uses: 0 },
    ]);

    // ===== Загрузка медиа =====
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pendingImages, setPendingImages] = useState([]);
    const [pendingCaption, setPendingCaption] = useState('');
    const [pendingSpoiler, setPendingSpoiler] = useState(false);
    const [sendAsFile, setSendAsFile] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [viewerState, setViewerState] = useState(null);
    const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    // ===== Скролл =====
    const [showScrollDown, setShowScrollDown] = useState(false);

    // ===== Контекстное меню сообщения =====
    const [messageMenu, setMessageMenu] = useState(null);
    const messageMenuRef = useRef(null);

    // ===== Ответ / Редактирование / Закрепление =====
    const [replyTo, setReplyTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [pinnedMessage, setPinnedMessage] = useState(null);

    // ===== Подсветка сообщения (при клике на цитату/закреп) =====
    const [highlightedId, setHighlightedId] = useState(null);
    const highlightTimerRef = useRef(null);

    // ===== Режим выбора =====
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [copyToast, setCopyToast] = useState('');

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const fileInputRef = useRef(null);
    const addMoreInputRef = useRef(null);
    const emojiPanelRef = useRef(null);
    const dragCounterRef = useRef(0);
    const photoMenuRef = useRef(null);
    const inputRef = useRef(null);

    const token = localStorage.getItem('token');
    const authHeaders = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : {}),
        [token]
    );

    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === activeId) || null,
        [conversations, activeId]
    );

    const myRole = useMemo(() => {
        if (activeConversation?.type !== 'group') return null;
        const me = groupMembers.find((m) => m.id === user?.id);
        return me?.role || null;
    }, [activeConversation, groupMembers, user?.id]);

    const canManageGroup = myRole === 'owner' || myRole === 'admin';

    const handleOpenSidebar = () => {
        window.dispatchEvent(new Event('openSidebar'));
    };

    // ================== Загрузка списка чатов ==================
    useEffect(() => {
        setLoadingList(true);
        fetch('/api/chat/conversations', { headers: authHeaders })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                setConversations(data);
                if (!activeId && data.length > 0) {
                    const isDesktop = window.innerWidth > 768;
                    if (isDesktop) {
                        setActiveId(data[0].id);
                    }
                }
            })
            .catch(() => setConversations([]))
            .finally(() => setLoadingList(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;
        setLoadingSubscriptions(true);

        fetch('/api/users/me/following', { headers: authHeaders })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (cancelled) return;
                const ids = Array.isArray(data)
                    ? data.map((u) => u.id ?? u.user_id ?? u.following_id)
                    : Array.isArray(data?.ids)
                        ? data.ids
                        : [];
                setSubscriptionIds(new Set(ids.filter((id) => id != null)));
            })
            .catch(() => {
                if (!cancelled) setSubscriptionIds(new Set());
            })
            .finally(() => {
                if (!cancelled) setLoadingSubscriptions(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (conversationId) setActiveId(Number(conversationId));
        else setActiveId(null);
    }, [conversationId]);

    useEffect(() => {
        if (!activeId) {
            setMessages([]);
            setActiveUser(null);
            return;
        }
        setLoadingMessages(true);
        fetch(`/api/chat/conversations/${activeId}/messages`, { headers: authHeaders })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    const list = Array.isArray(data.messages) ? [...data.messages] : [];
                    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    setMessages(list);
                    setActiveUser(data.user || null);
                    // Находим закреплённое сообщение при загрузке
                    const pinned = list.find((m) => m.pinned);
                    setPinnedMessage(pinned || null);
                } else {
                    setMessages([]);
                    setActiveUser(null);
                }
            })
            .catch(() => {
                setMessages([]);
                setActiveUser(null);
            })
            .finally(() => setLoadingMessages(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    // ================== WebSocket ==================
    useEffect(() => {
        if (!user?.id || !token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/chat/ws?token=${token}`;

        let stopped = false;

        const connect = () => {
            if (stopped) return;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => setIsConnected(true);

            ws.onmessage = (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }

                if (data.type === 'message.new') {
                    const msg = data.message;
                    const sender = data.sender || null;

                    const enriched = {
                        ...msg,
                        sender_name:
                            msg.sender_name || sender?.full_name || sender?.username || '',
                        sender_username:
                            msg.sender_username || sender?.username || '',
                    };

                    setActiveId((curActiveId) => {
                        if (curActiveId === enriched.conversation_id) {
                            setMessages((prev) => {
                                if (prev.some((m) => m.id === enriched.id)) return prev;
                                return [...prev, enriched];
                            });
                        }
                        return curActiveId;
                    });

                    setConversations((prev) => {
                        const exists = prev.some((c) => c.id === enriched.conversation_id);
                        if (!exists) {
                            fetch('/api/chat/conversations', { headers: authHeaders })
                                .then((r) => (r.ok ? r.json() : []))
                                .then((data) => setConversations(data))
                                .catch(() => {});
                            return prev;
                        }
                        const previewText = enriched.text
                            ? enriched.text
                            : enriched.type === 'image'
                                ? '📷 Фото'
                                : '📎 Файл';
                        return prev.map((c) =>
                            c.id === enriched.conversation_id
                                ? {
                                      ...c,
                                      last_message: previewText,
                                      last_message_at: enriched.created_at,
                                      has_unread: activeId !== enriched.conversation_id,
                                  }
                                : c
                        );
                    });
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;
                if (!stopped) {
                    reconnectTimerRef.current = setTimeout(connect, 3000);
                }
            };

            ws.onerror = (e) => console.error('[ws] error', e);
        };

        connect();

        return () => {
            stopped = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // ================== Онлайн-статусы ==================
    useEffect(() => {
        if (conversations.length === 0) return;
        const ids = conversations
            .filter((c) => c.type !== 'group' && c.user?.id)
            .map((c) => c.user.id)
            .join(',');
        if (!ids) return;

        const loadOnline = () => {
            fetch(`/api/chat/users/online?ids=${ids}`, { headers: authHeaders })
                .then((r) => (r.ok ? r.json() : { online_ids: [] }))
                .then((data) => setOnlineUsers(new Set(data.online_ids)))
                .catch(() => {});
        };

        loadOnline();
        const interval = setInterval(loadOnline, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversations.length]);

    useEffect(() => {
        const otherId = activeConversation?.user?.id || activeUser?.id;
        if (activeConversation?.type === 'group' || !otherId) {
            setActiveStatus(null);
            return;
        }

        const loadStatus = () => {
            fetch(`/api/chat/users/${otherId}/status`, { headers: authHeaders })
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
        };

        loadStatus();
        const interval = setInterval(loadStatus, 15000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeConversation?.user?.id, activeUser?.id, activeConversation?.type]);

    // ================== Участники группы ==================
    useEffect(() => {
        if (!activeId) {
            setGroupMembers([]);
            return;
        }
        if (activeConversation?.type !== 'group') {
            setGroupMembers([]);
            return;
        }

        setLoadingMembers(true);
        fetch(`/api/chat/conversations/${activeId}`, { headers: authHeaders })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                setGroupMembers(Array.isArray(data?.members) ? data.members : []);
            })
            .catch(() => setGroupMembers([]))
            .finally(() => setLoadingMembers(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId, activeConversation?.type]);

    // ================== Общие группы ==================
    useEffect(() => {
        if (!isInfoOpen) return;
        if (activeConversation?.type !== 'direct') {
            setCommonGroups([]);
            return;
        }
        const otherId = activeConversation?.user?.id;
        if (!otherId) {
            setCommonGroups([]);
            return;
        }

        const groups = conversations.filter((c) => c.type === 'group');
        if (groups.length === 0) {
            setCommonGroups([]);
            return;
        }

        let cancelled = false;
        Promise.all(
            groups.map((g) =>
                fetch(`/api/chat/conversations/${g.id}`, { headers: authHeaders })
                    .then((r) => (r.ok ? r.json() : null))
                    .then((data) => {
                        const members = Array.isArray(data?.members) ? data.members : [];
                        const has = members.some((m) => m.id === otherId);
                        return has ? g : null;
                    })
                    .catch(() => null)
            )
        ).then((results) => {
            if (cancelled) return;
            setCommonGroups(results.filter(Boolean));
        });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInfoOpen, activeId, activeConversation?.type, activeConversation?.user?.id]);

    // ================== Функции скролла ==================
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: 0, behavior });
    }, []);

    useEffect(() => {
        if (!activeId) return;
        const container = messagesContainerRef.current;
        if (!container) return;
        requestAnimationFrame(() => {
            container.scrollTop = 0;
            setShowScrollDown(false);
        });
    }, [activeId]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const prevLen = prevMessagesLengthRef.current;
        const newLen = messages.length;
        prevMessagesLengthRef.current = newLen;

        if (prevLen === 0 && newLen > 0) {
            container.scrollTop = 0;
            setShowScrollDown(false);
            return;
        }

        if (container.scrollTop < 120) {
            container.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [messages]);

    const handleMessagesScroll = useCallback((e) => {
        const container = e.currentTarget;
        setShowScrollDown(container.scrollTop > 200);
    }, []);

    // ================== Сброс UI при смене чата ==================
    useEffect(() => {
        setIsInfoOpen(false);
        setEmojiOpen(false);
        setMenuOpen(false);
        setMenuPage(null);
        setIsGroupSettingsOpen(false);
        setSettingsPage(null);
        setMessageMenu(null);
        setReplyTo(null);
        setEditingMessage(null);
        setPinnedMessage(null);
        setSelectionMode(false);
        setSelectedIds(new Set());
        clearPendingImage();
        setInfoTab(
            conversations.find((c) => c.id === activeId)?.type === 'group'
                ? 'members'
                : 'media'
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    useEffect(() => {
        if (isInfoOpen && activeConversation?.type !== 'group' && infoTab === 'members') {
            setInfoTab('media');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInfoOpen, activeConversation?.type]);

    // ================== Закрытие emoji panel ==================
    useEffect(() => {
        if (!emojiOpen) return;
        const onDocClick = (e) => {
            if (emojiPanelRef.current && !emojiPanelRef.current.contains(e.target)) {
                if (!e.target.closest('.chat-input-icon-btn')) {
                    setEmojiOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [emojiOpen]);

    // ================== Закрытие меню ==================
    useEffect(() => {
        if (!menuOpen) return;
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
                setMenuPage(null);
            }
        };
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                if (menuPage) setMenuPage(null);
                else setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [menuOpen, menuPage]);

    // ================== Закрытие мини-меню фото ==================
    useEffect(() => {
        if (!photoMenuOpen) return;
        const onDocClick = (e) => {
            if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) {
                setPhotoMenuOpen(false);
            }
        };
        const onEsc = (e) => {
            if (e.key === 'Escape') setPhotoMenuOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, [photoMenuOpen]);

    // ================== Закрытие контекстного меню сообщения ==================
    useEffect(() => {
        if (!messageMenu) return;

        const onDocClick = (e) => {
            if (messageMenuRef.current && !messageMenuRef.current.contains(e.target)) {
                setMessageMenu(null);
            }
        };
        const onEsc = (e) => {
            if (e.key === 'Escape') setMessageMenu(null);
        };
        const onScroll = () => setMessageMenu(null);

        const timer = setTimeout(() => {
            document.addEventListener('mousedown', onDocClick);
        }, 0);

        document.addEventListener('keydown', onEsc);
        window.addEventListener('scroll', onScroll, true);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', onDocClick);
            document.removeEventListener('keydown', onEsc);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [messageMenu]);

    // ================== Escape для режима выбора ==================
    useEffect(() => {
        if (!selectionMode) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setSelectionMode(false);
                setSelectedIds(new Set());
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [selectionMode]);

    // ================== Клавиши для полноэкранного просмотра ==================
    useEffect(() => {
        if (!viewerState) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setViewerState(null);
            else if (e.key === 'ArrowRight') {
                setViewerState((s) =>
                    s ? { ...s, index: (s.index + 1) % s.images.length } : s
                );
            } else if (e.key === 'ArrowLeft') {
                setViewerState((s) =>
                    s ? { ...s, index: (s.index - 1 + s.images.length) % s.images.length } : s
                );
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [viewerState]);

    // ================== Обработчики ==================
    const handleSelectConversation = (id) => {
        setActiveId(id);
        navigate(`/chat/${id}`, { replace: true });
    };

    const handleBackToList = () => {
        setActiveId(null);
        navigate('/chat', { replace: true });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeId) return;

        setEmojiOpen(false);

        if (editingMessage) {
            const text = newMessage.trim();
            try {
                const response = await fetch(
                    `/api/chat/conversations/${activeId}/messages/${editingMessage.id}`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', ...authHeaders },
                        body: JSON.stringify({ text }),
                    }
                );
                if (!response.ok) throw new Error('Не удалось отредактировать');
                const saved = await response.json();
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === editingMessage.id
                            ? { ...m, text, edited: true, updated_at: saved.updated_at || m.updated_at }
                            : m
                    )
                );
                setConversations((prev) =>
                    prev.map((c) =>
                        c.id === activeId
                            ? { ...c, last_message: text, last_message_at: saved.updated_at || c.last_message_at }
                            : c
                    )
                );
            } catch (err) {
                console.error(err);
                alert('Не удалось сохранить изменения');
            } finally {
                setEditingMessage(null);
                setNewMessage('');
            }
            return;
        }

        const text = newMessage.trim();
        setNewMessage('');

        try {
            const payload = { text };
            if (replyTo) payload.reply_to_id = replyTo.id;

            const response = await fetch(`/api/chat/conversations/${activeId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Не удалось отправить');
            const saved = await response.json();

            const enrichedSaved = {
                ...saved,
                sender_name:
                    saved.sender_name || user?.full_name || user?.username || '',
                sender_username:
                    saved.sender_username || user?.username || '',
                reply_to: replyTo
                    ? {
                          id: replyTo.id,
                          text: replyTo.text,
                          sender_name: replyTo.sender_name,
                          type: replyTo.type,
                      }
                    : null,
            };

            setMessages((prev) => {
                if (prev.some((m) => m.id === enrichedSaved.id)) return prev;
                return [...prev, enrichedSaved];
            });

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeId
                        ? { ...c, last_message: text, last_message_at: saved.created_at }
                        : c
                )
            );

            setReplyTo(null);
        } catch (err) {
            console.error(err);
            setNewMessage(text);
        }
    };

    const handleFilePick = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        processSelectedFile(file);
    };

    const processSelectedFile = (file) => {
        if (!file) return;
        const isImage = file.type.startsWith('image/');
        if (isImage) {
            const previewUrl = URL.createObjectURL(file);
            setPendingImages((prev) => {
                const next = [...prev, { file, previewUrl }];
                setActivePhotoIndex(next.length - 1);
                return next;
            });
            setPendingCaption('');
            setPendingSpoiler(false);
            setSendAsFile(false);
            setPhotoMenuOpen(false);
        } else {
            uploadAndSendFile(file, false);
        }
    };

    const handleAddMorePhotos = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (files.length === 0) return;

        const newImages = files
            .filter((f) => f.type.startsWith('image/'))
            .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));

        if (newImages.length === 0) return;

        setPendingImages((prev) => {
            const next = [...prev, ...newImages];
            setActivePhotoIndex(next.length - 1);
            return next;
        });
        setPhotoMenuOpen(false);
    };

    const clearPendingImage = useCallback(() => {
        setPendingImages((prev) => {
            prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
            return [];
        });
        setPendingCaption('');
        setPendingSpoiler(false);
        setSendAsFile(false);
        setPhotoMenuOpen(false);
        setActivePhotoIndex(0);
    }, []);

    const removePhoto = (index) => {
        setPendingImages((prev) => {
            const img = prev[index];
            if (img?.previewUrl) URL.revokeObjectURL(img.previewUrl);
            const next = prev.filter((_, i) => i !== index);
            if (next.length === 0) {
                clearPendingImage();
            } else {
                setActivePhotoIndex((cur) => Math.min(cur, next.length - 1));
            }
            return next;
        });
    };

    const handleSendImage = async () => {
        if (pendingImages.length === 0 || !activeId) return;
        const files = [...pendingImages];
        const caption = pendingCaption.trim();
        const spoiler = pendingSpoiler;
        const asFile = sendAsFile;
        clearPendingImage();

        for (let i = 0; i < files.length; i += 1) {
            const extras = i === 0 ? { caption, spoiler } : {};
            await uploadAndSendFile(files[i].file, !asFile, extras);
        }
    };

    const handleCancelImage = () => {
        clearPendingImage();
    };

    const uploadAndSendFile = async (file, isImage = false, extras = {}) => {
        if (!activeId) return;

        const { caption = '', spoiler = false } = extras;

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `/api/chat/conversations/${activeId}/upload`);
                if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch {
                            reject(new Error('Некорректный ответ сервера'));
                        }
                    } else {
                        reject(new Error(`Ошибка загрузки: ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Сетевая ошибка'));
                xhr.send(formData);
            });

            const fileUrl = uploadRes.url || uploadRes.file_url;

            const messagePayload = isImage
                ? {
                      text: caption,
                      type: 'image',
                      file_url: fileUrl,
                      file_name: file.name,
                      file_size: file.size,
                      mime_type: file.type,
                      spoiler,
                  }
                : {
                      text: caption || file.name,
                      type: 'file',
                      file_url: fileUrl,
                      file_name: file.name,
                      file_size: file.size,
                      mime_type: file.type,
                  };

            const msgRes = await fetch(
                `/api/chat/conversations/${activeId}/messages`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders },
                    body: JSON.stringify(messagePayload),
                }
            );

            if (!msgRes.ok) throw new Error('Не удалось отправить сообщение');
            const saved = await msgRes.json();

            const enrichedSaved = {
                ...saved,
                sender_name:
                    saved.sender_name || user?.full_name || user?.username || '',
                sender_username:
                    saved.sender_username || user?.username || '',
            };

            setMessages((prev) => {
                if (prev.some((m) => m.id === enrichedSaved.id)) return prev;
                return [...prev, enrichedSaved];
            });

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeId
                        ? {
                              ...c,
                              last_message: isImage ? '📷 Фото' : `📎 ${file.name}`,
                              last_message_at: saved.created_at,
                          }
                        : c
                )
            );
        } catch (err) {
            console.error('Ошибка загрузки файла:', err);
            alert(err.message || 'Не удалось загрузить файл');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // ---- Drag & Drop ----
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setDragOver(true);
        }
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current === 0) {
            setDragOver(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        dragCounterRef.current = 0;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processSelectedFile(files[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- Вставка изображения из буфера ----
    useEffect(() => {
        const handlePaste = (e) => {
            if (!activeId) return;
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        e.preventDefault();
                        processSelectedFile(file);
                    }
                    break;
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId]);

    // ================== Новый чат / группа ==================
    const handleStartNewChat = async (otherUser) => {
        try {
            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ user_id: otherUser.id }),
            });
            if (!response.ok) throw new Error('Не удалось открыть чат');
            const conv = await response.json();
            setIsNewChatOpen(false);

            setConversations((prev) => {
                const exists = prev.some((c) => c.id === conv.id);
                if (!exists) return [conv, ...prev];
                return prev;
            });

            setActiveId(conv.id);
            navigate(`/chat/${conv.id}`, { replace: true });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGroup = async ({ title, user_ids }) => {
        try {
            const response = await fetch('/api/chat/conversations/group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ title, user_ids }),
            });
            if (!response.ok) {
                const err = await response.json().catch(() => null);
                throw new Error(err?.detail || 'Не удалось создать группу');
            }
            const conv = await response.json();

            setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
            setIsCreateGroupOpen(false);
            setActiveId(conv.id);
            navigate(`/chat/${conv.id}`, { replace: true });
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    // ================== Меню чата ==================
    const openSubmenu = (page) => setMenuPage(page);
    const closeMenu = () => { setMenuOpen(false); setMenuPage(null); };

    const handleMuteToggle = () =>
        setChatSettings((s) => ({ ...s, muted: !s.muted }));

    const handleAutoDeleteOpen = () => openSubmenu('auto-delete');

    const handleAutoDeleteSelect = (value) => {
        setChatSettings((s) => ({ ...s, autoDelete: value }));
        setMenuPage(null);
    };

    const handleOpenGroupSettings = () => {
        closeMenu();
        setSettingsTitle(activeConversation?.title || '');
        setSettingsAvatar(activeConversation?.avatar_url || '');
        setSettingsError('');
        setSettingsPage(null);
        setIsGroupSettingsOpen(true);
    };

    const handleSaveGroupSettings = async () => {
        if (!activeId) return;
        const title = settingsTitle.trim();
        if (!title) {
            setSettingsError('Введите название группы');
            return;
        }

        setSavingSettings(true);
        setSettingsError('');
        try {
            const r = await fetch(`/api/chat/conversations/${activeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    title,
                    avatar_url: settingsAvatar.trim() || null,
                }),
            });
            if (!r.ok) {
                const err = await r.json().catch(() => null);
                throw new Error(err?.detail || 'Не удалось сохранить');
            }
            const updated = await r.json();

            setConversations((prev) =>
                prev.map((c) =>
                    c.id === activeId
                        ? {
                              ...c,
                              title: updated.title,
                              avatar_url: updated.avatar_url,
                              display_name: updated.display_name,
                              display_avatar: updated.display_avatar,
                          }
                        : c
                )
            );

            setIsGroupSettingsOpen(false);
            setSettingsPage(null);
        } catch (err) {
            console.error(err);
            setSettingsError(err.message || 'Не удалось сохранить');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleLeaveGroup = async () => {
        closeMenu();
        if (!window.confirm('Выйти из группы?')) return;
        try {
            const r = await fetch(
                `/api/chat/conversations/${activeId}/leave`,
                { method: 'POST', headers: authHeaders }
            );
            if (!r.ok) {
                const err = await r.json().catch(() => null);
                alert(err?.detail || 'Не удалось выйти из группы');
                return;
            }
            setConversations((prev) => prev.filter((c) => c.id !== activeId));
            setActiveId(null);
            setIsInfoOpen(false);
            navigate('/chat', { replace: true });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectGroupType = (value) => {
        setGroupType(value);
        setSettingsPage(null);
    };

    const handleSelectReactions = (value) => {
        setReactionsMode(value);
        setSettingsPage(null);
    };

    const togglePermission = (key) =>
        setPermissions((p) => ({ ...p, [key]: !p[key] }));

    const handleCreateInviteLink = () => {
        const code = Math.random().toString(36).slice(2, 10);
        setInviteLinks((prev) => [...prev, { id: Date.now(), code, uses: 0 }]);
    };

    const handleCopyInviteLink = (code) =>
        navigator.clipboard?.writeText(`https://astra.app/join/${code}`);

    const handleRevokeInviteLink = (id) =>
        setInviteLinks((prev) => prev.filter((l) => l.id !== id));

    const handleCallUser = () => { closeMenu(); alert('Звонки в разработке'); };
    const handleAddToContacts = () => { closeMenu(); alert('Контакты в разработке'); };
    const handleSendGift = () => { closeMenu(); alert('Подарки в разработке'); };

    // «Выбрать сообщения» из меню чата — вход в режим выбора
    const handleSelectMessages = () => {
        closeMenu();
        setSelectionMode(true);
        setSelectedIds(new Set());
    };

    const handleBlockUser = () =>
        setChatSettings((s) => ({ ...s, blocked: !s.blocked }));

    const handleDisableSharing = () =>
        setChatSettings((s) => ({ ...s, sharingDisabled: !s.sharingDisabled }));

    const handleClearHistory = async () => {
        closeMenu();
        if (!window.confirm('Очистить историю сообщений?')) return;
        setMessages([]);
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeId ? { ...c, last_message: '', last_message_at: null } : c
            )
        );
    };

    const handleDeleteChat = async () => {
        closeMenu();
        if (!window.confirm('Удалить чат?')) return;
        setConversations((prev) => prev.filter((c) => c.id !== activeId));
        setActiveId(null);
        setIsInfoOpen(false);
        navigate('/chat', { replace: true });
    };

    const handleAudioCall = () => {
        if (!activeConversation || isGroup) return;
        const targetName = otherUser?.full_name || otherUser?.username || 'пользователь';
        alert(`Аудиозвонок: ${targetName} — в разработке`);
    };

    const handleVideoCall = () => {
        if (!activeConversation || isGroup) return;
        const targetName = otherUser?.full_name || otherUser?.username || 'пользователь';
        alert(`Видеозвонок: ${targetName} — в разработке`);
    };

    // ================== Контекстное меню сообщения ==================
    const openMessageMenu = (e, message) => {
        e.preventDefault();
        e.stopPropagation();

        if (messageMenu) {
            setMessageMenu(null);
            return;
        }

        const MENU_WIDTH = 230;
        const MENU_HEIGHT = 340;
        const PADDING = 10;

        let x = e.clientX;
        let y = e.clientY;

        if (x + MENU_WIDTH > window.innerWidth - PADDING) {
            x = window.innerWidth - MENU_WIDTH - PADDING;
        }
        if (y + MENU_HEIGHT > window.innerHeight - PADDING) {
            y = window.innerHeight - MENU_HEIGHT - PADDING;
        }
        if (x < PADDING) x = PADDING;
        if (y < PADDING) y = PADDING;

        setMessageMenu({ x, y, message });
    };

    // ================== Прокрутка к сообщению ==================
    const scrollToMessage = (id) => {
        if (id == null) return;
        const container = messagesContainerRef.current;
        if (!container) return;
        const el = container.querySelector(`[data-message-id="${id}"]`);
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setHighlightedId(id);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
            setHighlightedId(null);
        }, 1600);
    };

    // ---- Ответить ----
    const handleReplyMessage = () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        setReplyTo(msg);
        setEditingMessage(null);
        setMessageMenu(null);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const cancelReply = () => setReplyTo(null);

    // ---- Редактировать ----
    const handleEditMessage = () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        if (msg.sender_id !== user?.id) {
            setMessageMenu(null);
            return;
        }
        if (msg.type === 'image' || msg.type === 'file') {
            setMessageMenu(null);
            return;
        }
        setEditingMessage(msg);
        setNewMessage(msg.text || '');
        setMessageMenu(null);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const cancelEdit = () => {
        setEditingMessage(null);
        setNewMessage('');
    };

    // ---- Редактировать фото ----
    const handleEditMessagePhoto = () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        setMessageMenu(null);
        alert('Редактирование фото — в разработке');
        console.log('Edit photo:', msg);
    };

    // ---- Закрепить ----
    const handlePinMessage = async () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        setMessageMenu(null);

        const willUnpin = !!msg.pinned;

        setMessages((prev) =>
            prev.map((m) =>
                m.id === msg.id
                    ? { ...m, pinned: !willUnpin }
                    : { ...m, pinned: false }
            )
        );

        setPinnedMessage((prev) => (prev?.id === msg.id ? null : { ...msg, pinned: true }));

        if (!activeId) return;
        try {
            await fetch(
                `/api/chat/conversations/${activeId}/messages/${msg.id}/pin`,
                { method: 'POST', headers: authHeaders }
            );
        } catch (err) {
            console.error('Ошибка закрепления:', err);
        }
    };

    // ---- Вперёд ----
    const handleForwardMessage = () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        setMessageMenu(null);
        alert('Пересылка сообщения — в разработке');
        console.log('Forward:', msg);
    };

    // ---- Копировать ----
    const handleCopyMessage = async () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        const text = msg.text || '';
        setMessageMenu(null);
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopyToast('Скопировано');
        setTimeout(() => setCopyToast(''), 1500);
    };

    // ---- Выбирать ----
    const handleSelectMessage = () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        setMessageMenu(null);
        setSelectionMode(true);
        setSelectedIds(new Set(msg?.id != null ? [msg.id] : []));
    };

    // ---- Удалить ----
    const handleDeleteMessage = async () => {
        if (!messageMenu) return;
        const msg = messageMenu.message;
        setMessageMenu(null);

        if (!msg) return;

        setMessages((prev) => prev.filter((m) => m.id !== msg.id));

        setConversations((prev) =>
            prev.map((c) => {
                if (c.id !== activeId) return c;
                const remaining = messages.filter((m) => m.id !== msg.id);
                const last = remaining[remaining.length - 1];
                return {
                    ...c,
                    last_message: last
                        ? (last.text ||
                        (last.type === 'image' ? '📷 Фото' : '📎 Файл'))
                        : '',
                    last_message_at: last?.created_at || null,
                };
            })
        );

        if (!activeId) return;
        try {
            const res = await fetch(
                `/api/chat/conversations/${activeId}/messages/${msg.id}`,
                { method: 'DELETE', headers: authHeaders }
            );
            if (!res.ok) {
                console.warn(
                    '[chat] server delete failed:',
                    res.status,
                    await res.text().catch(() => '')
                );
            }
        } catch (err) {
            console.warn('[chat] delete request error:', err);
        }
    };

    // ================== Режим выбора ==================
    const enterSelectionMode = (firstId) => {
        setSelectionMode(true);
        setSelectedIds(firstId != null ? new Set([firstId]) : new Set());
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const toggleSelectMessage = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const isMessageSelected = (id) => selectedIds.has(id);

    const selectedMessages = useMemo(
        () => messages.filter((m) => selectedIds.has(m.id)),
        [messages, selectedIds]
    );

    const selectAllMessages = () => {
        setSelectedIds(new Set(messages.map((m) => m.id)));
    };

    const handleSelectionReply = () => {
        if (selectedMessages.length !== 1) return;
        setReplyTo(selectedMessages[0]);
        setEditingMessage(null);
        exitSelectionMode();
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelectionCopy = async () => {
        const text = selectedMessages
            .map((m) => m.text || '')
            .filter(Boolean)
            .join('\n');
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopyToast('Скопировано');
        setTimeout(() => setCopyToast(''), 1500);
        exitSelectionMode();
    };

    const handleSelectionForward = () => {
        if (selectedMessages.length === 0) return;
        alert(
            `Пересылка ${selectedMessages.length} сообщ. — в разработке.`
        );
        exitSelectionMode();
    };

    const handleSelectionDelete = async () => {
        if (selectedMessages.length === 0) return;
        const ids = new Set(selectedMessages.map((m) => m.id));
        setMessages((prev) => prev.filter((m) => !ids.has(m.id)));

        setConversations((prev) =>
            prev.map((c) => {
                if (c.id !== activeId) return c;
                const remaining = messages.filter((m) => !ids.has(m.id));
                const last = remaining[remaining.length - 1];
                return {
                    ...c,
                    last_message: last
                        ? (last.text || (last.type === 'image' ? '📷 Фото' : '📎 Файл'))
                        : '',
                    last_message_at: last?.created_at || null,
                };
            })
        );

        exitSelectionMode();

        if (!activeId) return;
        for (const id of ids) {
            try {
                await fetch(
                    `/api/chat/conversations/${activeId}/messages/${id}`,
                    { method: 'DELETE', headers: authHeaders }
                );
            } catch (err) {
                console.warn('[chat] bulk delete error:', err);
            }
        }
    };

    const handleMessageClick = (e, msg) => {
        if (!selectionMode) return;
        e.preventDefault();
        e.stopPropagation();
        toggleSelectMessage(msg.id);
    };

    const handleRowContextMenu = (e, msg) => {
        if (selectionMode) {
            e.preventDefault();
            e.stopPropagation();
            toggleSelectMessage(msg.id);
            return;
        }
        openMessageMenu(e, msg);
    };

    // ================== Производные значения ==================
    const filteredConversations = useMemo(() => {
        return conversations.filter((c) => {
            if (onlySubscriptions) {
                if (c.type === 'group') return false;
                const otherId = c.user?.id;
                if (!otherId || !subscriptionIds.has(otherId)) return false;
            }

            if (search.trim()) {
                const q = search.trim().toLowerCase();
                const name =
                    c.display_name?.toLowerCase() ||
                    c.user?.full_name?.toLowerCase() ||
                    c.user?.username?.toLowerCase() ||
                    '';
                if (!name.includes(q)) return false;
            }

            return true;
        });
    }, [conversations, onlySubscriptions, subscriptionIds, search]);

    const chatImages = useMemo(() => {
        const result = [];
        for (const msg of messages) {
            if (msg.type === 'image' && msg.file_url) {
                result.push({
                    id: msg.id,
                    url: msg.file_url,
                    spoiler: !!msg.spoiler,
                });
            }
        }
        return result;
    }, [messages]);

    const openViewer = (url) => {
        const index = chatImages.findIndex((img) => img.url === url);
        setViewerState({
            images: chatImages,
            index: index >= 0 ? index : 0,
        });
    };

    const nextImage = useCallback(() => {
        setViewerState((s) => {
            if (!s) return s;
            return { ...s, index: (s.index + 1) % s.images.length };
        });
    }, []);

    const prevImage = useCallback(() => {
        setViewerState((s) => {
            if (!s) return s;
            return { ...s, index: (s.index - 1 + s.images.length) % s.images.length };
        });
    }, []);

    const otherUser = activeConversation?.user || activeUser || null;
    const activeUserOnline = otherUser ? onlineUsers.has(otherUser.id) : false;
    const activeUserStatusText = activeUserOnline
        ? 'в сети'
        : formatLastSeen(activeStatus?.last_seen_at || otherUser?.last_seen_at);

    const isGroup = activeConversation?.type === 'group';
    const headerName = isGroup
        ? activeConversation?.title || 'Группа'
        : otherUser?.full_name || otherUser?.username || '';
    const headerStatus = isGroup
        ? `${activeConversation?.members_count || 0} участников`
        : activeUserStatusText;

    const settingsTitleText = settingsPage === 'type' ? 'Тип группы'
        : settingsPage === 'invites' ? 'Ссылки-приглашения'
        : settingsPage === 'reactions' ? 'Реакции'
        : settingsPage === 'permissions' ? 'Разрешения'
        : settingsPage === 'admins' ? 'Администраторы'
        : isGroupSettingsOpen ? 'Настройки группы'
        : isGroup ? 'О группе'
        : 'О пользователе';

    const showBack = isGroupSettingsOpen || !!settingsPage;

    const orderedMessages = useMemo(() => {
        const grouped = groupMessages(messages);
        return [...grouped].reverse();
    }, [messages]);

    return (
        <div className="chat-page">
            <div className={`chat-page-container ${activeConversation ? 'chat-page-container-open' : ''}`}>
                {/* ============ СПИСОК ЧАТОВ ============ */}
                <div className="chat-list">
                    <header className="chat-list-topbar">
                        <button
                            type="button"
                            className="chat-list-topbar-avatar-btn"
                            onClick={handleOpenSidebar}
                            aria-label="Открыть меню"
                        >
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.username || 'Профиль'}
                                    className="chat-list-topbar-avatar"
                                />
                            ) : (
                                <span className="chat-list-topbar-avatar chat-list-topbar-avatar-fallback">
                                    {user?.username?.[0]?.toUpperCase() || 'A'}
                                </span>
                            )}
                        </button>

                        <div className="chat-list-topbar-logo">
                            <img
                                src={isDarkTheme ? '/logoDark(1).png' : '/logo(1).jpg'}
                                alt="Логотип"
                            />
                        </div>

                        <button
                            type="button"
                            className="chat-list-topbar-notifications-btn"
                            onClick={() => navigate('/notifications')}
                            aria-label="Уведомления"
                        >
                            <img
                                src="/menu/notifications.png"
                                alt=""
                                className="chat-list-topbar-notifications-icon"
                            />
                        </button>
                    </header>

                    <div className="search_chat">
                        <input
                            type="text"
                            className="Chat-search-input"
                            placeholder="Поиск контактов..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button
                            type="button"
                            className={`chat-subscriptions-toggle ${onlySubscriptions ? 'is-active' : ''}`}
                            onClick={() => setOnlySubscriptions((v) => !v)}
                            title={
                                onlySubscriptions
                                    ? 'Показать все чаты'
                                    : 'Показать только тех, на кого я подписан'
                            }
                            aria-pressed={onlySubscriptions}
                        >
                            <StarIcon filled={onlySubscriptions} />
                        </button>
                    </div>

                    {loadingList && <div className="comments-state">Загрузка…</div>}

                    {!loadingList && filteredConversations.length === 0 && (
                        <div className="comments-state">
                            {onlySubscriptions && loadingSubscriptions
                                ? 'Загрузка подписок…'
                                : conversations.length === 0
                                    ? 'Пока нет диалогов'
                                    : onlySubscriptions
                                        ? 'Нет диалогов с теми, на кого вы подписаны'
                                        : 'Ничего не найдено'}
                        </div>
                    )}

                    {filteredConversations.map((chat) => {
                        const chatIsGroup = chat.type === 'group';
                        const displayName =
                            chat.display_name ||
                            chat.user?.full_name ||
                            chat.user?.username ||
                            'Диалог';
                        const displayAvatar =
                            chat.display_avatar ||
                            chat.user?.avatar ||
                            '/default-avatar.png';

                        return (
                            <div
                                key={chat.id}
                                className={`chat-list-item ${
                                    activeId === chat.id ? 'chat-list-item-active' : ''
                                }`}
                                onClick={() => handleSelectConversation(chat.id)}
                            >
                                <div className="chat-list-avatar-wrap">
                                    {chatIsGroup ? (
                                        <div className="chat-list-group-avatar">
                                            {chat.avatar_url ? (
                                                <img src={chat.avatar_url} alt={displayName} />
                                            ) : (
                                                <span>
                                                    {(displayName[0] || 'Г').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <img
                                            src={displayAvatar}
                                            alt={displayName}
                                            className="chat-list-avatar"
                                        />
                                    )}
                                    {!chatIsGroup && onlineUsers.has(chat.user?.id) && (
                                        <span className="chat-list-online-dot" />
                                    )}
                                </div>
                                <div className="chat-list-info">
                                    <div className="chat-list-name">
                                        {displayName}
                                        {chatIsGroup && (
                                            <span className="chat-list-members-badge">
                                                {chat.members_count || 0}
                                            </span>
                                        )}
                                        {chatSettings.muted && activeId === chat.id && (
                                            <span className="chat-list-muted-icon" title="Без звука">
                                                <BellOffIcon size={14} />
                                            </span>
                                        )}
                                    </div>
                                    <div className="chat-list-last-message">
                                        {chat.last_message || 'Нет сообщений'}
                                    </div>
                                </div>
                                <div className="chat-list-time">
                                    {formatTime(chat.last_message_at)}
                                </div>
                                {chat.has_unread && (
                                    <span className="chat-list-unread-dot" />
                                )}
                            </div>
                        );
                    })}

                    <button
                        className="chat-new-btn"
                        onClick={() => setIsNewChatOpen(true)}
                        aria-label="Новый диалог"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            width="26"
                            height="26"
                        >
                            <path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.4-.7L4 20l1.2-4.1A8.5 8.5 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8 8.5z" />
                            <line x1="17" y1="17" x2="21" y2="17" />
                            <line x1="19" y1="15" x2="19" y2="19" />
                        </svg>
                    </button>
                </div>

                {/* ============ ОКНО ЧАТА ============ */}
                <div
                    className={`chat-window ${dragOver ? 'chat-window-dragover' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {dragOver && (
                        <div className="chat-drag-overlay">
                            <div className="chat-drag-overlay-inner">
                                <svg viewBox="0 0 24 24" width="48" height="48" fill="none"
                                    stroke="currentColor" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                                <div>Отпустите файл, чтобы отправить</div>
                            </div>
                        </div>
                    )}

                    {activeConversation ? (
                        <>
                            {/* ===== ПАНЕЛЬ ВЫБОРА ===== */}
                            {selectionMode && (
                                <div className="chat-selection-bar">
                                    <button
                                        type="button"
                                        className="chat-selection-bar-close"
                                        onClick={exitSelectionMode}
                                        aria-label="Отменить выбор"
                                    >
                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                            stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>

                                    <div className="chat-selection-bar-count">
                                        {selectedIds.size > 0
                                            ? `Выбрано: ${selectedIds.size}`
                                            : 'Выберите сообщения'}
                                    </div>

                                    <div className="chat-selection-bar-actions">
                                        <button
                                            type="button"
                                            className="chat-selection-bar-btn"
                                            onClick={selectAllMessages}
                                            title="Выбрать все"
                                        >
                                            Все
                                        </button>
                                        <button
                                            type="button"
                                            className="chat-selection-bar-btn"
                                            onClick={handleSelectionReply}
                                            disabled={selectedIds.size !== 1}
                                            title="Ответить"
                                        >
                                            <ReplyIcon />
                                        </button>
                                        <button
                                            type="button"
                                            className="chat-selection-bar-btn"
                                            onClick={handleSelectionCopy}
                                            disabled={selectedIds.size === 0}
                                            title="Копировать"
                                        >
                                            <CopyIcon />
                                        </button>
                                        <button
                                            type="button"
                                            className="chat-selection-bar-btn"
                                            onClick={handleSelectionForward}
                                            disabled={selectedIds.size === 0}
                                            title="Переслать"
                                        >
                                            <ForwardIcon />
                                        </button>
                                        <button
                                            type="button"
                                            className="chat-selection-bar-btn chat-selection-bar-btn-danger"
                                            onClick={handleSelectionDelete}
                                            disabled={selectedIds.size === 0}
                                            title="Удалить"
                                        >
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ===== ПЛАШКА ЗАКРЕПЛЁННОГО СООБЩЕНИЯ ===== */}
                            {pinnedMessage && !selectionMode && (
                                <div
                                    className="chat-pinned-bar"
                                    onClick={() => scrollToMessage(pinnedMessage.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            scrollToMessage(pinnedMessage.id);
                                        }
                                    }}
                                    title="Перейти к закреплённому"
                                >
                                    <span className="chat-pinned-bar-icon">
                                        <PinIcon />
                                    </span>
                                    <div className="chat-pinned-bar-content">
                                        <div className="chat-pinned-bar-label">Закреплённое сообщение</div>
                                        <div className="chat-pinned-bar-text">
                                            {pinnedMessage.text ||
                                                (pinnedMessage.type === 'image'
                                                    ? '📷 Фото'
                                                    : pinnedMessage.type === 'file'
                                                        ? '📎 Файл'
                                                        : 'Сообщение')}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="chat-pinned-bar-unpin"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            (async () => {
                                                const id = pinnedMessage.id;
                                                setMessages((prev) =>
                                                    prev.map((m) =>
                                                        m.id === id ? { ...m, pinned: false } : m
                                                    )
                                                );
                                                setPinnedMessage(null);
                                                if (!activeId) return;
                                                try {
                                                    await fetch(
                                                        `/api/chat/conversations/${activeId}/messages/${id}/pin`,
                                                        { method: 'POST', headers: authHeaders }
                                                    );
                                                } catch (err) {
                                                    console.error('Ошибка открепления:', err);
                                                }
                                            })();
                                        }}
                                        aria-label="Открепить"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <div className="chat-window-header">
                                <button
                                    type="button"
                                    className="chat-window-back-btn"
                                    onClick={handleBackToList}
                                    aria-label="Назад к списку чатов"
                                >
                                    <BackIcon />
                                </button>

                                <div className="chat-list-avatar-wrap">
                                    {isGroup ? (
                                        <div className="chat-list-group-avatar chat-window-avatar">
                                            {activeConversation.avatar_url ? (
                                                <img
                                                    src={activeConversation.avatar_url}
                                                    alt={activeConversation.title}
                                                />
                                            ) : (
                                                <span>
                                                    {(activeConversation.title?.[0] || 'Г').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={
                                                    activeConversation?.user?.avatar ||
                                                    activeUser?.avatar ||
                                                    '/default-avatar.png'
                                                }
                                                alt={activeConversation?.user?.username || activeUser?.username}
                                                className="chat-window-avatar"
                                            />
                                            {activeUserOnline && (
                                                <span className="chat-list-online-dot chat-window-online-dot" />
                                            )}
                                        </>
                                    )}
                                </div>
                                <div
                                    className="chat-window-user-info"
                                    onClick={() => setIsInfoOpen(true)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setIsInfoOpen(true);
                                        }
                                    }}
                                >
                                    <div className="chat-window-user-name">{headerName}</div>
                                    <div className="chat-window-user-status">
                                        {headerStatus}
                                    </div>
                                </div>

                                {!isGroup && (
                                    <div className="chat-window-header-actions">
                                        <button
                                            type="button"
                                            className="chat-window-call-btn"
                                            onClick={handleAudioCall}
                                            title="Аудиозвонок"
                                            aria-label="Аудиозвонок"
                                        >
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                                stroke="currentColor" strokeWidth="1.9"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z" />
                                            </svg>
                                        </button>

                                        <button
                                            type="button"
                                            className="chat-window-call-btn"
                                            onClick={handleVideoCall}
                                            title="Видеозвонок"
                                            aria-label="Видеозвонок"
                                        >
                                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                                stroke="currentColor" strokeWidth="1.9"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M23 7l-7 5 7 5V7z" />
                                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ============ СООБЩЕНИЯ ============ */}
                            <div
                                className="chat-messages chat-messages-reverse"
                                ref={messagesContainerRef}
                                onScroll={handleMessagesScroll}
                            >
                                {loadingMessages && (
                                    <div className="comments-state">Загрузка…</div>
                                )}

                                {!loadingMessages && messages.length === 0 && (
                                    <div className="comments-state">
                                        Начните диалог первым сообщением
                                    </div>
                                )}

                                {!loadingMessages && orderedMessages.map((item) => {
                                    // === АЛЬБОМ ===
                                    if (item.kind === 'album') {
                                        const isMe = item.sender_id === user?.id;
                                        const showSender = isGroup && !isMe && item.sender_name;
                                        const senderUsername = item.sender_username || '';
                                        const count = item.images.length;
                                        const firstImg = item.images[0];
                                        const gridClass =
                                            count === 2 ? 'chat-album-grid chat-album-grid-2'
                                            : count === 3 ? 'chat-album-grid chat-album-grid-3'
                                            : 'chat-album-grid chat-album-grid-many';

                                        const isSelected = isMessageSelected(firstImg?.id);
                                        const isHighlighted = highlightedId === firstImg?.id;

                                        return (
                                            <div
                                                key={item.id}
                                                data-message-id={firstImg?.id}
                                                className={`chat-message-row ${
                                                    isMe ? 'chat-message-row-me' : 'chat-message-row-other'
                                                } ${selectionMode ? 'chat-message-row-selectable' : ''} ${
                                                    isSelected ? 'chat-message-row-selected' : ''
                                                } ${isHighlighted ? 'chat-message-row-highlighted' : ''}`}
                                                onContextMenu={(e) => handleRowContextMenu(e, firstImg)}
                                                onClick={(e) => handleMessageClick(e, firstImg)}
                                            >
                                                {selectionMode && (
                                                    <span className={`chat-message-checkbox ${isSelected ? 'is-checked' : ''}`}>
                                                        {isSelected && '✓'}
                                                    </span>
                                                )}
                                                <div
                                                    className={`chat-message chat-album ${
                                                        isMe ? 'chat-message-me' : 'chat-message-other'
                                                    } ${showSender ? 'chat-message-group' : ''} ${
                                                        firstImg?.pinned ? 'chat-message-pinned' : ''
                                                    }`}
                                                >
                                                    {showSender && (
                                                        senderUsername ? (
                                                            <Link to={`/user/${senderUsername}`} className="chat-message-sender" onClick={(e) => e.stopPropagation()}>
                                                                {item.sender_name}
                                                            </Link>
                                                        ) : (
                                                            <span className="chat-message-sender is-static">{item.sender_name}</span>
                                                        )
                                                    )}

                                                    <div className={gridClass}>
                                                        {item.images.slice(0, 4).map((img, idx) => (
                                                            <div
                                                                key={img.id}
                                                                className={`chat-album-cell ${img.spoiler ? 'is-spoiler' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (selectionMode) {
                                                                        toggleSelectMessage(firstImg?.id);
                                                                        return;
                                                                    }
                                                                    openViewer(img.url);
                                                                }}
                                                            >
                                                                <img src={img.url} alt="" loading="lazy" />
                                                                {idx === 3 && count > 4 && (
                                                                    <span className="chat-album-more">+{count - 4}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {firstImg?.text && (
                                                        <div className="chat-message-text">{firstImg.text}</div>
                                                    )}

                                                    <div className="chat-message-time">
                                                        {firstImg?.pinned && (
                                                            <svg className="chat-message-pin-icon" viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                                                                <path d="M16 3a1 1 0 0 0-1 1v.5l-3.5 3.5H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h.5L12 15v5a1 1 0 0 0 2 0v-5l3.5-3.5H18a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-3.5L11 5V4a1 1 0 0 0-1-1z" />
                                                            </svg>
                                                        )}
                                                        {formatTime(item.created_at)}
                                                    </div>

                                                    {!selectionMode && (
                                                        <button
                                                            type="button"
                                                            className="chat-message-menu-arrow"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openMessageMenu(e, firstImg);
                                                            }}
                                                            aria-label="Действия"
                                                        >
                                                            <MessageMenuArrowIcon />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // === ОДИНОЧНОЕ СООБЩЕНИЕ ===
                                    const msg = item.message;
                                    const isMe = msg.sender_id === user?.id;
                                    const showSender = isGroup && !isMe && msg.sender_name;
                                    const senderUsername = msg.sender_username || msg.username || '';
                                    const isImageMsg = msg.type === 'image' && msg.file_url;
                                    const isFileMsg = msg.type === 'file' && msg.file_url;

                                    const isSelected = isMessageSelected(msg.id);
                                    const isHighlighted = highlightedId === msg.id;

                                    return (
                                        <div
                                            key={msg.id}
                                            data-message-id={msg.id}
                                            className={`chat-message-row ${
                                                isMe ? 'chat-message-row-me' : 'chat-message-row-other'
                                            } ${selectionMode ? 'chat-message-row-selectable' : ''} ${
                                                isSelected ? 'chat-message-row-selected' : ''
                                            } ${isHighlighted ? 'chat-message-row-highlighted' : ''}`}
                                            onContextMenu={(e) => handleRowContextMenu(e, msg)}
                                            onClick={(e) => handleMessageClick(e, msg)}
                                        >
                                            {selectionMode && (
                                                <span className={`chat-message-checkbox ${isSelected ? 'is-checked' : ''}`}>
                                                    {isSelected && '✓'}
                                                </span>
                                            )}
                                            <div
                                                className={`chat-message ${isMe ? 'chat-message-me' : 'chat-message-other'} ${
                                                    showSender ? 'chat-message-group' : ''
                                                } ${isImageMsg ? 'chat-message-image' : ''} ${
                                                    msg.pinned ? 'chat-message-pinned' : ''
                                                }`}
                                            >
                                                {showSender && (
                                                    senderUsername ? (
                                                        <Link to={`/user/${senderUsername}`} className="chat-message-sender" onClick={(e) => e.stopPropagation()}>
                                                            {msg.sender_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="chat-message-sender is-static">{msg.sender_name}</span>
                                                    )
                                                )}

                                                {msg.reply_to && (
                                                    <div
                                                        className="chat-message-reply"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            scrollToMessage(msg.reply_to.id);
                                                        }}
                                                    >
                                                        <div className="chat-message-reply-name">
                                                            {msg.reply_to.sender_name || 'Сообщение'}
                                                        </div>
                                                        <div className="chat-message-reply-text">
                                                            {msg.reply_to.text ||
                                                                (msg.reply_to.type === 'image'
                                                                    ? '📷 Фото'
                                                                    : msg.reply_to.type === 'file'
                                                                        ? '📎 Файл'
                                                                        : 'Сообщение')}
                                                        </div>
                                                    </div>
                                                )}

                                                {isImageMsg && (
                                                    <div className="chat-message-image-wrap">
                                                        <img
                                                            src={msg.file_url}
                                                            alt="Изображение"
                                                            className={`chat-message-image-img ${msg.spoiler ? 'is-spoiler' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (selectionMode) {
                                                                    toggleSelectMessage(msg.id);
                                                                    return;
                                                                }
                                                                openViewer(msg.file_url);
                                                            }}
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}

                                                {isFileMsg && (
                                                    <a
                                                        href={msg.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="chat-message-file"
                                                        download={msg.file_name}
                                                        onClick={(e) => {
                                                            if (selectionMode) {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleSelectMessage(msg.id);
                                                            }
                                                        }}
                                                    >
                                                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                            <polyline points="14 2 14 8 20 8" />
                                                        </svg>
                                                        <span>{msg.file_name || 'Файл'}</span>
                                                    </a>
                                                )}

                                                {msg.text && <div className="chat-message-text">{msg.text}</div>}

                                                <div className="chat-message-time">
                                                    {msg.pinned && (
                                                        <svg className="chat-message-pin-icon" viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
                                                            <path d="M16 3a1 1 0 0 0-1 1v.5l-3.5 3.5H8a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h.5L12 15v5a1 1 0 0 0 2 0v-5l3.5-3.5H18a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1h-3.5L11 5V4a1 1 0 0 0-1-1z" />
                                                        </svg>
                                                    )}
                                                    {msg.edited && <span className="chat-message-edited">изм.</span>}
                                                    {formatTime(msg.created_at)}
                                                </div>

                                                {!selectionMode && (
                                                    <button
                                                        type="button"
                                                        className="chat-message-menu-arrow"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openMessageMenu(e, msg);
                                                        }}
                                                        aria-label="Действия"
                                                    >
                                                        <MessageMenuArrowIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {showScrollDown && (
                                <button
                                    type="button"
                                    className="chat-scroll-down-btn"
                                    onClick={() => scrollToBottom('smooth')}
                                    aria-label="Вниз"
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                                        stroke="currentColor" strokeWidth="2.2"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                            )}

                            {replyTo && (
                                <div className="chat-reply-bar">
                                    <div className="chat-reply-bar-content">
                                        <div className="chat-reply-bar-name">
                                            {replyTo.sender_name || 'Сообщение'}
                                        </div>
                                        <div className="chat-reply-bar-text">
                                            {replyTo.text || (replyTo.type === 'image' ? '📷 Фото' : '📎 Файл')}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="chat-reply-bar-close"
                                        onClick={cancelReply}
                                        aria-label="Отменить ответ"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {editingMessage && (
                                <div className="chat-edit-bar">
                                    <div className="chat-edit-bar-content">
                                        <div className="chat-edit-bar-name">Редактирование</div>
                                        <div className="chat-edit-bar-text">
                                            {editingMessage.text}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="chat-reply-bar-close"
                                        onClick={cancelEdit}
                                        aria-label="Отменить редактирование"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <button
                                    type="button"
                                    className="chat-input-icon-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Прикрепить файл"
                                    disabled={uploading || !!editingMessage}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22"
                                        fill="none" stroke="currentColor" strokeWidth="1.9"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48" />
                                    </svg>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
                                    onChange={handleFilePick}
                                />

                                <button
                                    type="button"
                                    className="chat-input-icon-btn"
                                    onClick={() => setEmojiOpen((v) => !v)}
                                    title="Эмодзи"
                                    disabled={uploading || !!editingMessage}
                                >
                                    <svg viewBox="0 0 24 24" width="22" height="22"
                                        fill="none" stroke="currentColor" strokeWidth="1.9"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8" />
                                        <line x1="9" y1="9.5" x2="9.01" y2="9.5" />
                                        <line x1="15" y1="9.5" x2="15.01" y2="9.5" />
                                    </svg>
                                </button>

                                {emojiOpen && (
                                    <div className="chat-emoji-panel" ref={emojiPanelRef}>
                                        {EMOJI_LIST.map((emo) => (
                                            <button
                                                key={emo}
                                                type="button"
                                                className="chat-emoji-btn"
                                                onClick={() => setNewMessage((p) => p + emo)}
                                            >
                                                {emo}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    ref={inputRef}
                                    className="chat-input"
                                    placeholder={
                                        uploading
                                            ? 'Загрузка…'
                                            : editingMessage
                                                ? 'Редактирование сообщения...'
                                                : 'Введите сообщение...'
                                    }
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onFocus={() => setEmojiOpen(false)}
                                    disabled={uploading}
                                />
                                <button
                                    type="submit"
                                    className="chat-send-btn"
                                    disabled={!newMessage.trim() || uploading}
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="chat-empty">
                            {conversations.length === 0
                                ? 'Выберите, кому написать'
                                : 'Выберите диалог слева'}
                        </div>
                    )}
                </div>

                {/* ============ ПРАВАЯ ПАНЕЛЬ ============ */}
                <div className={`chat-info-panel ${isInfoOpen ? 'chat-info-panel-open' : ''}`}>
                    {activeConversation && (
                        <>
                            <div className="chat-info-topbar">
                                <button
                                    className="chat-info-topbar-btn"
                                    onClick={() => {
                                        if (settingsPage) setSettingsPage(null);
                                        else if (isGroupSettingsOpen) setIsGroupSettingsOpen(false);
                                        else setIsInfoOpen(false);
                                    }}
                                    aria-label={showBack ? 'Назад' : 'Закрыть'}
                                >
                                    {showBack ? (
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                                            stroke="currentColor" strokeWidth="2"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="19" y1="12" x2="5" y2="12" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                                            stroke="currentColor" strokeWidth="2.2"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    )}
                                </button>
                                <h3 className="chat-info-topbar-title">{settingsTitleText}</h3>

                                {!isGroupSettingsOpen && !settingsPage && (
                                    <div className="chat-info-topbar-menu-wrap" ref={menuRef}>
                                        <button
                                            className="chat-info-topbar-btn"
                                            onClick={() => {
                                                setMenuOpen((v) => !v);
                                                setMenuPage(null);
                                            }}
                                            aria-label="Меню"
                                            aria-expanded={menuOpen}
                                        >
                                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                                <circle cx="12" cy="5" r="1.8" />
                                                <circle cx="12" cy="12" r="1.8" />
                                                <circle cx="12" cy="19" r="1.8" />
                                            </svg>
                                        </button>

                                        {menuOpen && (
                                            <div className="chat-info-menu" role="menu">
                                                {menuPage === 'auto-delete' && (
                                                    <>
                                                        <button
                                                            className="chat-info-menu-back"
                                                            onClick={() => setMenuPage(null)}
                                                        >
                                                            <svg viewBox="0 0 24 24" width="18" height="18"
                                                                fill="none" stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="19" y1="12" x2="5" y2="12" />
                                                                <polyline points="12 19 5 12 12 5" />
                                                            </svg>
                                                            <span>Автоудаление</span>
                                                        </button>
                                                        {AUTO_DELETE_OPTIONS.map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                className="chat-info-menu-item"
                                                                onClick={() => handleAutoDeleteSelect(opt.value)}
                                                            >
                                                                <span className="chat-info-menu-label">
                                                                    {opt.label}
                                                                </span>
                                                                {chatSettings.autoDelete === opt.value && (
                                                                    <span className="chat-info-menu-check">✓</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </>
                                                )}

                                                {menuPage === null && (
                                                    <>
                                                        {isGroup && (
                                                            <>
                                                                <button
                                                                    className={`chat-info-menu-item ${chatSettings.muted ? 'is-active' : ''}`}
                                                                    onClick={handleMuteToggle}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        {chatSettings.muted ? <BellOffIcon /> : <BellIcon />}
                                                                    </span>
                                                                    <span className="chat-info-menu-label">
                                                                        {chatSettings.muted ? 'Включить звук' : 'Без звука'}
                                                                    </span>
                                                                </button>

                                                                {canManageGroup && (
                                                                    <button
                                                                        className="chat-info-menu-item"
                                                                        onClick={handleOpenGroupSettings}
                                                                    >
                                                                        <span className="chat-info-menu-icon">
                                                                            <svg viewBox="0 0 24 24" width="18" height="18"
                                                                                fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                                <circle cx="12" cy="12" r="3" />
                                                                                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                                                                            </svg>
                                                                        </span>
                                                                        <span className="chat-info-menu-label">
                                                                            Настройки группы
                                                                        </span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    className="chat-info-menu-item chat-info-menu-item-danger"
                                                                    onClick={handleLeaveGroup}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                                            <polyline points="16 17 21 12 16 7" />
                                                                            <line x1="21" y1="12" x2="9" y2="12" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">
                                                                        Выйти из группы
                                                                    </span>
                                                                </button>
                                                            </>
                                                        )}

                                                        {!isGroup && (
                                                            <>
                                                                <button
                                                                    className="chat-info-menu-item"
                                                                    onClick={handleAutoDeleteOpen}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <circle cx="12" cy="12" r="9" />
                                                                            <polyline points="12 6 12 12 16 14" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Автоудаление</span>
                                                                    <span className="chat-info-menu-value">
                                                                        {AUTO_DELETE_OPTIONS.find(o => o.value === chatSettings.autoDelete)?.label}
                                                                    </span>
                                                                    <span className="chat-info-menu-chevron">›</span>
                                                                </button>

                                                                <button
                                                                    className={`chat-info-menu-item ${chatSettings.muted ? 'is-active' : ''}`}
                                                                    onClick={handleMuteToggle}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        {chatSettings.muted ? <BellOffIcon /> : <BellIcon />}
                                                                    </span>
                                                                    <span className="chat-info-menu-label">
                                                                        {chatSettings.muted ? 'Включить звук' : 'Без звука'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    className="chat-info-menu-item"
                                                                    onClick={handleCallUser}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7 2 2 0 0 1 1.7 2z" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Позвонить</span>
                                                                </button>

                                                                <button
                                                                    className="chat-info-menu-item"
                                                                    onClick={handleSelectMessages}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <polyline points="8 12 11 15 16 9" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Выбрать сообщения</span>
                                                                </button>

                                                                <button
                                                                    className="chat-info-menu-item"
                                                                    onClick={handleAddToContacts}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                                            <circle cx="9" cy="7" r="4" />
                                                                            <line x1="19" y1="8" x2="19" y2="14" />
                                                                            <line x1="22" y1="11" x2="16" y2="11" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Добавить в контакты</span>
                                                                </button>

                                                                <button
                                                                    className="chat-info-menu-item"
                                                                    onClick={handleSendGift}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="20 12 20 22 4 22 4 12" />
                                                                            <rect x="2" y="7" width="20" height="5" />
                                                                            <line x1="12" y1="22" x2="12" y2="7" />
                                                                            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                                                            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Отправить подарок</span>
                                                                </button>

                                                                <button
                                                                    className={`chat-info-menu-item chat-info-menu-item-danger ${chatSettings.blocked ? 'is-active' : ''}`}
                                                                    onClick={handleBlockUser}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">
                                                                        {chatSettings.blocked ? 'Разблокировать' : 'Заблокировать'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    className={`chat-info-menu-item chat-info-menu-item-danger ${chatSettings.sharingDisabled ? 'is-active' : ''}`}
                                                                    onClick={handleDisableSharing}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <line x1="1" y1="1" x2="23" y2="23" />
                                                                            <path d="M3 3l18 18" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">
                                                                        {chatSettings.sharingDisabled ? 'Включить пересылку' : 'Отключить пересылку'}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    className="chat-info-menu-item chat-info-menu-item-danger"
                                                                    onClick={handleClearHistory}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="3 6 5 6 21 6" />
                                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                                            <path d="M10 11v6" />
                                                                            <path d="M14 11v6" />
                                                                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Очистить историю</span>
                                                                </button>

                                                                <button
                                                                    className="chat-info-menu-item chat-info-menu-item-danger"
                                                                    onClick={handleDeleteChat}
                                                                >
                                                                    <span className="chat-info-menu-icon">
                                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                                            fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                            strokeLinecap="round" strokeLinejoin="round">
                                                                            <polyline points="3 6 5 6 21 6" />
                                                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                                            <path d="M10 11v6" />
                                                                            <path d="M14 11v6" />
                                                                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                                                        </svg>
                                                                    </span>
                                                                    <span className="chat-info-menu-label">Удалить чат</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="chat-info-body">
                                {isGroupSettingsOpen ? (
                                    <div className="chat-info-settings">
                                        {settingsError && (
                                            <div className="chat-info-settings-error">{settingsError}</div>
                                        )}

                                        {settingsPage === 'type' && (
                                            <div className="chat-info-settings-section">
                                                <button
                                                    className={`chat-info-settings-row ${groupType === 'private' ? 'is-selected' : ''}`}
                                                    onClick={() => handleSelectGroupType('private')}
                                                >
                                                    <span className="chat-info-settings-row-icon tg-icon-red">
                                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                            stroke="currentColor" strokeWidth="2"
                                                            strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                        </svg>
                                                    </span>
                                                    <span className="chat-info-settings-row-text">
                                                        <span className="chat-info-settings-row-title">Приватная</span>
                                                        <span className="chat-info-settings-row-subtitle">
                                                            Вступить можно только по ссылке
                                                        </span>
                                                    </span>
                                                    {groupType === 'private' && (
                                                        <span className="chat-info-settings-row-check">✓</span>
                                                    )}
                                                </button>
                                                <button
                                                    className={`chat-info-settings-row ${groupType === 'public' ? 'is-selected' : ''}`}
                                                    onClick={() => handleSelectGroupType('public')}
                                                >
                                                    <span className="chat-info-settings-row-icon tg-icon-green">
                                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                            stroke="currentColor" strokeWidth="2"
                                                            strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="2" y1="12" x2="22" y2="12" />
                                                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                                        </svg>
                                                    </span>
                                                    <span className="chat-info-settings-row-text">
                                                        <span className="chat-info-settings-row-title">Публичная</span>
                                                        <span className="chat-info-settings-row-subtitle">
                                                            Группу можно найти в поиске
                                                        </span>
                                                    </span>
                                                    {groupType === 'public' && (
                                                        <span className="chat-info-settings-row-check">✓</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {settingsPage === 'invites' && (
                                            <>
                                                <div className="chat-info-settings-section">
                                                    {inviteLinks.map((link) => (
                                                        <div key={link.id} className="chat-info-settings-row">
                                                            <span className="chat-info-settings-row-icon tg-icon-orange">
                                                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                    stroke="currentColor" strokeWidth="2"
                                                                    strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                                </svg>
                                                            </span>
                                                            <span className="chat-info-settings-row-text">
                                                                <span className="chat-info-settings-row-title">
                                                                    astra.app/join/{link.code}
                                                                </span>
                                                                <span className="chat-info-settings-row-subtitle">
                                                                    Использовано: {link.uses}
                                                                </span>
                                                            </span>
                                                            <button
                                                                className="chat-info-settings-row-action"
                                                                onClick={() => handleCopyInviteLink(link.code)}
                                                                title="Скопировать"
                                                            >
                                                                <svg viewBox="0 0 24 24" width="16" height="16"
                                                                    fill="none" stroke="currentColor" strokeWidth="1.8">
                                                                    <rect x="4" y="4" width="12" height="12" rx="2" />
                                                                    <rect x="8" y="8" width="12" height="12" rx="2" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="chat-info-settings-row-action chat-info-settings-row-action-danger"
                                                                onClick={() => handleRevokeInviteLink(link.id)}
                                                                title="Удалить"
                                                            >
                                                                <svg viewBox="0 0 24 24" width="16" height="16"
                                                                    fill="none" stroke="currentColor" strokeWidth="1.8"
                                                                    strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    className="chat-info-settings-add-btn"
                                                    onClick={handleCreateInviteLink}
                                                >
                                                    + Создать новую ссылку
                                                </button>
                                            </>
                                        )}

                                        {settingsPage === 'reactions' && (
                                            <div className="chat-info-settings-section">
                                                {[
                                                    { value: 'all', label: 'Все', hint: 'Любые эмодзи' },
                                                    { value: 'some', label: 'Некоторые', hint: 'Только выбранные' },
                                                    { value: 'none', label: 'Выключено', hint: 'Реакции недоступны' },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        className={`chat-info-settings-row ${reactionsMode === opt.value ? 'is-selected' : ''}`}
                                                        onClick={() => handleSelectReactions(opt.value)}
                                                    >
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">
                                                                {opt.label}
                                                            </span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {opt.hint}
                                                            </span>
                                                        </span>
                                                        {reactionsMode === opt.value && (
                                                            <span className="chat-info-settings-row-check">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {settingsPage === 'permissions' && (
                                            <div className="chat-info-settings-section">
                                                {[
                                                    { key: 'sendMessages', label: 'Отправка сообщений' },
                                                    { key: 'sendMedia', label: 'Отправка медиа' },
                                                    { key: 'sendLinks', label: 'Отправка ссылок' },
                                                    { key: 'addMembers', label: 'Добавление участников' },
                                                    { key: 'pinMessages', label: 'Закрепление сообщений' },
                                                    { key: 'changeInfo', label: 'Изменение информации' },
                                                ].map((p) => (
                                                    <div key={p.key} className="chat-info-settings-row chat-info-settings-row-toggle">
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">
                                                                {p.label}
                                                            </span>
                                                        </span>
                                                        <label className="chat-info-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={permissions[p.key]}
                                                                onChange={() => togglePermission(p.key)}
                                                            />
                                                            <span className="chat-info-switch-slider" />
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {settingsPage === 'admins' && (
                                            <div className="chat-info-members">
                                                {groupMembers
                                                    .filter(m => m.role === 'owner' || m.role === 'admin')
                                                    .map((m) => {
                                                        const isMe = m.id === user?.id;
                                                        const roleLabel = m.role === 'owner' ? 'Владелец' : 'Админ';
                                                        return (
                                                            <div
                                                                key={m.id}
                                                                className="chat-info-member"
                                                                onClick={() => {
                                                                    if (!isMe && m.username) {
                                                                        setIsInfoOpen(false);
                                                                        navigate(`/user/${m.username}`);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="chat-list-avatar-wrap">
                                                                    <img
                                                                        src={m.avatar || '/default-avatar.png'}
                                                                        alt={m.username}
                                                                        className="chat-info-member-avatar"
                                                                    />
                                                                </div>
                                                                <div className="chat-info-member-text">
                                                                    <div className="chat-info-member-name">
                                                                        {m.full_name || m.username}
                                                                        {isMe && <span className="chat-info-member-you"> · вы</span>}
                                                                    </div>
                                                                    <div className="chat-info-member-status">
                                                                        @{m.username}
                                                                    </div>
                                                                </div>
                                                                <span className="chat-info-member-role">{roleLabel}</span>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}

                                        {!settingsPage && (
                                            <>
                                                <div className="chat-info-settings-section">
                                                    <button
                                                        className="chat-info-settings-row"
                                                        onClick={() => setSettingsPage('type')}
                                                    >
                                                        <span className="chat-info-settings-row-icon tg-icon-red">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="11" width="18" height="11" rx="2" />
                                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Тип группы</span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {groupType === 'private' ? 'Приватная' : 'Публичная'}
                                                            </span>
                                                        </span>
                                                        <span className="chat-info-settings-row-chevron">›</span>
                                                    </button>

                                                    <button
                                                        className="chat-info-settings-row"
                                                        onClick={() => setSettingsPage('invites')}
                                                    >
                                                        <span className="chat-info-settings-row-icon tg-icon-orange">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Ссылки-приглашения</span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {inviteLinks.length}
                                                            </span>
                                                        </span>
                                                        <span className="chat-info-settings-row-chevron">›</span>
                                                    </button>

                                                    <button
                                                        className="chat-info-settings-row"
                                                        onClick={() => setSettingsPage('reactions')}
                                                    >
                                                        <span className="chat-info-settings-row-icon tg-icon-pink">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Реакции</span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {reactionsMode === 'all' ? 'Все' :
                                                                 reactionsMode === 'some' ? 'Некоторые' : 'Выключено'}
                                                            </span>
                                                        </span>
                                                        <span className="chat-info-settings-row-chevron">›</span>
                                                    </button>

                                                    <button
                                                        className="chat-info-settings-row"
                                                        onClick={() => setSettingsPage('permissions')}
                                                    >
                                                        <span className="chat-info-settings-row-icon tg-icon-gray">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Разрешения</span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {Object.values(permissions).filter(Boolean).length}/{Object.keys(permissions).length}
                                                            </span>
                                                        </span>
                                                        <span className="chat-info-settings-row-chevron">›</span>
                                                    </button>

                                                    <div className="chat-info-settings-row chat-info-settings-row-toggle">
                                                        <span className="chat-info-settings-row-icon tg-icon-purple">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Темы</span>
                                                        </span>
                                                        <label className="chat-info-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={topicsEnabled}
                                                                onChange={() => setTopicsEnabled((v) => !v)}
                                                            />
                                                            <span className="chat-info-switch-slider" />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="chat-info-settings-hint">
                                                    Чат будет разделён на темы, создаваемые админами или участниками.
                                                </div>

                                                <div className="chat-info-settings-section">
                                                    <button
                                                        className="chat-info-settings-row"
                                                        onClick={() => setSettingsPage('admins')}
                                                    >
                                                        <span className="chat-info-settings-row-icon tg-icon-green">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                                <polyline points="9 12 11 14 15 10" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Администраторы</span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {groupMembers.filter(m => m.role === 'owner' || m.role === 'admin').length || 1}
                                                            </span>
                                                        </span>
                                                        <span className="chat-info-settings-row-chevron">›</span>
                                                    </button>

                                                    <button
                                                        className="chat-info-settings-row"
                                                        onClick={() => {
                                                            setIsGroupSettingsOpen(false);
                                                            setInfoTab('members');
                                                        }}
                                                    >
                                                        <span className="chat-info-settings-row-icon tg-icon-orange">
                                                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                                                stroke="currentColor" strokeWidth="2"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                        </span>
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">Участники</span>
                                                            <span className="chat-info-settings-row-subtitle">
                                                                {activeConversation.members_count || groupMembers.length || 1}
                                                            </span>
                                                        </span>
                                                        <span className="chat-info-settings-row-chevron">›</span>
                                                    </button>
                                                </div>

                                                <div className="chat-info-settings-section">
                                                    <div className="chat-info-settings-row chat-info-settings-row-toggle">
                                                        <span className="chat-info-settings-row-text">
                                                            <span className="chat-info-settings-row-title">
                                                                История чата для новых участников
                                                            </span>
                                                        </span>
                                                        <label className="chat-info-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={historyForNew}
                                                                onChange={() => setHistoryForNew((v) => !v)}
                                                            />
                                                            <span className="chat-info-switch-slider" />
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="chat-info-settings-section-title">Основное</div>

                                                <div className="chat-info-settings-avatar-row">
                                                    <div className="chat-info-settings-avatar">
                                                        {settingsAvatar ? (
                                                            <img
                                                                src={settingsAvatar}
                                                                alt=""
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>{(settingsTitle[0] || 'Г').toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="chat-info-settings-avatar-info">
                                                        <div className="chat-info-settings-avatar-label">
                                                            Аватар группы
                                                        </div>
                                                        <div className="chat-info-settings-avatar-hint">
                                                            Вставьте ссылку на изображение
                                                        </div>
                                                    </div>
                                                </div>

                                                <label className="chat-info-settings-field">
                                                    <span>Название группы</span>
                                                    <input
                                                        type="text"
                                                        value={settingsTitle}
                                                        onChange={(e) => setSettingsTitle(e.target.value)}
                                                        maxLength={120}
                                                        placeholder="Например, Рабочая команда"
                                                    />
                                                </label>

                                                <label className="chat-info-settings-field">
                                                    <span>Ссылка на аватар</span>
                                                    <input
                                                        type="text"
                                                        value={settingsAvatar}
                                                        onChange={(e) => setSettingsAvatar(e.target.value)}
                                                        maxLength={255}
                                                        placeholder="https://..."
                                                    />
                                                </label>

                                                <div className="chat-info-settings-actions">
                                                    <button
                                                        className="chat-info-settings-save"
                                                        onClick={handleSaveGroupSettings}
                                                        disabled={savingSettings || !settingsTitle.trim()}
                                                    >
                                                        {savingSettings ? 'Сохранение…' : 'Сохранить'}
                                                    </button>
                                                    <button
                                                        className="chat-info-settings-cancel"
                                                        onClick={() => setIsGroupSettingsOpen(false)}
                                                        disabled={savingSettings}
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="chat-info-avatar-wrap">
                                            {isGroup ? (
                                                <div className="chat-list-group-avatar chat-info-avatar">
                                                    {activeConversation.avatar_url ? (
                                                        <img
                                                            src={activeConversation.avatar_url}
                                                            alt={activeConversation.title}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {(activeConversation.title?.[0] || 'Г').toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <img
                                                    src={activeConversation.user?.avatar || '/default-avatar.png'}
                                                    alt={activeConversation.user?.username}
                                                    className="chat-info-avatar"
                                                />
                                            )}
                                        </div>

                                        <div className="chat-info-name">
                                            {isGroup
                                                ? activeConversation.title || 'Группа'
                                                : activeConversation.user?.full_name ||
                                                  activeConversation.user?.username ||
                                                  'Диалог'}
                                        </div>

                                        <div className="chat-info-status">
                                            {isGroup
                                                ? `${activeConversation.members_count || 0} участников`
                                                : activeUserStatusText}
                                        </div>

                                        <div className="chat-info-list">
                                            {!isGroup && activeConversation.user?.username && (
                                                <div className="chat-info-row">
                                                    <div className="chat-info-row-icon chat-info-icon-blue">
                                                        @
                                                    </div>
                                                    <div className="chat-info-row-text">
                                                        <div className="chat-info-row-value">
                                                            {activeConversation.user.username}
                                                        </div>
                                                        <div className="chat-info-row-label">
                                                            Имя пользователя
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="chat-info-row-action"
                                                        onClick={() => {
                                                            navigator.clipboard?.writeText(
                                                                `@${activeConversation.user.username}`
                                                            );
                                                        }}
                                                        aria-label="Скопировать"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="18" height="18"
                                                            fill="none" stroke="currentColor" strokeWidth="1.8">
                                                            <rect x="4" y="4" width="12" height="12" rx="2" />
                                                            <rect x="8" y="8" width="12" height="12" rx="2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            )}

                                            {!isGroup && activeConversation.user?.bio && (
                                                <div className="chat-info-row">
                                                    <div className="chat-info-row-icon chat-info-icon-gray">
                                                        i
                                                    </div>
                                                    <div className="chat-info-row-text">
                                                        <div className="chat-info-row-value">
                                                            {activeConversation.user.bio}
                                                        </div>
                                                        <div className="chat-info-row-label">О себе</div>
                                                    </div>
                                                </div>
                                            )}

                                            {!isGroup && activeConversation.user?.created_at && (
                                                <div className="chat-info-row">
                                                    <div className="chat-info-row-icon chat-info-icon-purple">
                                                        <svg viewBox="0 0 24 24" width="16" height="16"
                                                            fill="currentColor">
                                                            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.5 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8L12 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="chat-info-row-text">
                                                        <div className="chat-info-row-value">
                                                            {new Date(
                                                                activeConversation.user.created_at
                                                            ).toLocaleDateString('ru-RU', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </div>
                                                        <div className="chat-info-row-label">
                                                            Дата регистрации
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="chat-info-row">
                                                <div className="chat-info-row-icon chat-info-icon-red">
                                                    <svg viewBox="0 0 24 24" width="16" height="16"
                                                        fill="currentColor">
                                                        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm8-5v-1l-1.6-1.6V10a6.4 6.4 0 0 0-5-6.23V3a1.4 1.4 0 1 0-2.8 0v.77A6.4 6.4 0 0 0 5.6 10v5.4L4 17v1z" />
                                                    </svg>
                                                </div>
                                                <div className="chat-info-row-text">
                                                    <div className="chat-info-row-value">Уведомления</div>
                                                    <div className="chat-info-row-label">
                                                        {chatSettings.muted ? 'Отключены' : 'Включены'}
                                                    </div>
                                                </div>
                                                <label className="chat-info-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={!chatSettings.muted}
                                                        onChange={handleMuteToggle}
                                                    />
                                                    <span className="chat-info-switch-slider" />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="chat-info-tabs">
                                            {isGroup && (
                                                <button
                                                    className={`chat-info-tab ${infoTab === 'members' ? 'active' : ''}`}
                                                    onClick={() => setInfoTab('members')}
                                                >
                                                    Участники
                                                </button>
                                            )}
                                            <button
                                                className={`chat-info-tab ${infoTab === 'media' ? 'active' : ''}`}
                                                onClick={() => setInfoTab('media')}
                                            >
                                                Медиа
                                            </button>
                                            <button
                                                className={`chat-info-tab ${infoTab === 'files' ? 'active' : ''}`}
                                                onClick={() => setInfoTab('files')}
                                            >
                                                Файлы
                                            </button>
                                            <button
                                                className={`chat-info-tab ${infoTab === 'links' ? 'active' : ''}`}
                                                onClick={() => setInfoTab('links')}
                                            >
                                                Ссылки
                                            </button>
                                            <button
                                                className={`chat-info-tab ${infoTab === 'voice' ? 'active' : ''}`}
                                                onClick={() => setInfoTab('voice')}
                                            >
                                                Голос
                                            </button>
                                            {!isGroup && (
                                                <button
                                                    className={`chat-info-tab ${infoTab === 'groups' ? 'active' : ''}`}
                                                    onClick={() => setInfoTab('groups')}
                                                >
                                                    Группы
                                                </button>
                                            )}
                                        </div>

                                        {isGroup && infoTab === 'members' && (
                                            <div className="chat-info-members">
                                                {loadingMembers && (
                                                    <div className="chat-info-empty">Загрузка…</div>
                                                )}
                                                {!loadingMembers && groupMembers.length === 0 && (
                                                    <div className="chat-info-empty">Нет участников</div>
                                                )}
                                                {!loadingMembers && groupMembers.map((m) => {
                                                    const isMe = m.id === user?.id;
                                                    const roleLabel =
                                                        m.role === 'owner' ? 'Владелец' :
                                                        m.role === 'admin' ? 'Админ' : null;
                                                    const statusText = m.online
                                                        ? 'в сети'
                                                        : formatLastSeen(m.last_seen_at);

                                                    return (
                                                        <div
                                                            key={m.id}
                                                            className="chat-info-member"
                                                            onClick={() => {
                                                                if (!isMe && m.username) {
                                                                    setIsInfoOpen(false);
                                                                    navigate(`/user/${m.username}`);
                                                                }
                                                            }}
                                                        >
                                                            <div className="chat-list-avatar-wrap">
                                                                <img
                                                                    src={m.avatar || '/default-avatar.png'}
                                                                    alt={m.username}
                                                                    className="chat-info-member-avatar"
                                                                />
                                                                {m.online && <span className="chat-list-online-dot" />}
                                                            </div>
                                                            <div className="chat-info-member-text">
                                                                <div className="chat-info-member-name">
                                                                    {m.full_name || m.username}
                                                                    {isMe && (
                                                                        <span className="chat-info-member-you"> · вы</span>
                                                                    )}
                                                                </div>
                                                                <div className={`chat-info-member-status ${m.online ? 'is-online' : ''}`}>
                                                                    {statusText}
                                                                </div>
                                                            </div>
                                                            {roleLabel && (
                                                                <span className="chat-info-member-role">
                                                                    {roleLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {infoTab === 'media' && (
                                            <>
                                                {chatImages.length === 0 ? (
                                                    <EmptyState
                                                        icon={
                                                            <svg viewBox="0 0 24 24" width="44" height="44" fill="none"
                                                                stroke="currentColor" strokeWidth="1.5"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                                <path d="M21 15l-5-5L5 21" />
                                                            </svg>
                                                        }
                                                        title="Пока нет медиа"
                                                        hint="Фото и видео, отправленные в этом чате, появятся здесь"
                                                    />
                                                ) : (
                                                    <div className="chat-info-media-grid">
                                                        {chatImages.map((img) => (
                                                            <button
                                                                key={img.id}
                                                                type="button"
                                                                className={`chat-info-media-cell ${img.spoiler ? 'is-spoiler' : ''}`}
                                                                onClick={() => openViewer(img.url)}
                                                            >
                                                                <img src={img.url} alt="" loading="lazy" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {infoTab === 'files' && (
                                            <EmptyState
                                                icon={
                                                    <svg viewBox="0 0 24 24" width="44" height="44" fill="none"
                                                        stroke="currentColor" strokeWidth="1.5"
                                                        strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                }
                                                title="Файлов пока нет"
                                                hint="Документы и вложения появятся здесь"
                                            />
                                        )}

                                        {infoTab === 'links' && (
                                            <EmptyState
                                                icon={
                                                    <svg viewBox="0 0 24 24" width="44" height="44" fill="none"
                                                        stroke="currentColor" strokeWidth="1.5"
                                                        strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                    </svg>
                                                }
                                                title="Ссылок пока нет"
                                                hint="Отправленные ссылки появятся здесь"
                                            />
                                        )}

                                        {infoTab === 'voice' && (
                                            <EmptyState
                                                icon={
                                                    <svg viewBox="0 0 24 24" width="44" height="44" fill="none"
                                                        stroke="currentColor" strokeWidth="1.5"
                                                        strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                                        <line x1="12" y1="19" x2="12" y2="23" />
                                                        <line x1="8" y1="23" x2="16" y2="23" />
                                                    </svg>
                                                }
                                                title="Голосовых пока нет"
                                                hint="Голосовые сообщения появятся здесь"
                                            />
                                        )}

                                        {!isGroup && infoTab === 'groups' && (
                                            <>
                                                {commonGroups.length === 0 ? (
                                                    <EmptyState
                                                        icon={
                                                            <svg viewBox="0 0 24 24" width="44" height="44" fill="none"
                                                                stroke="currentColor" strokeWidth="1.5"
                                                                strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                        }
                                                        title="Общих групп пока нет"
                                                        hint="Группы, где вы и этот пользователь вместе, появятся здесь"
                                                    />
                                                ) : (
                                                    <div className="chat-info-members">
                                                        {commonGroups.map((g) => {
                                                            const name = g.title || 'Группа';
                                                            return (
                                                                <div
                                                                    key={g.id}
                                                                    className="chat-info-member"
                                                                    onClick={() => {
                                                                        setIsInfoOpen(false);
                                                                        handleSelectConversation(g.id);
                                                                    }}
                                                                >
                                                                    <div className="chat-list-avatar-wrap">
                                                                        <div className="chat-list-group-avatar chat-info-member-avatar">
                                                                            {g.avatar_url ? (
                                                                                <img src={g.avatar_url} alt={name} />
                                                                            ) : (
                                                                                <span>
                                                                                    {(name[0] || 'Г').toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="chat-info-member-text">
                                                                        <div className="chat-info-member-name">
                                                                            {name}
                                                                        </div>
                                                                        <div className="chat-info-member-status">
                                                                            {g.members_count || 0} участников
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!isGroup && activeConversation.user?.username && (
                                            <div className="chat-info-actions">
                                                <button
                                                    className="chat-info-action-btn"
                                                    onClick={() => {
                                                        setIsInfoOpen(false);
                                                        navigate(`/user/${activeConversation.user.username}`);
                                                    }}
                                                >
                                                    Открыть профиль
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {isNewChatOpen && (
                <NewChatModal
                    onClose={() => setIsNewChatOpen(false)}
                    onSelectUser={handleStartNewChat}
                    onCreateGroup={() => setIsCreateGroupOpen(true)}
                />
            )}

            {isCreateGroupOpen && (
                <CreateGroupModal
                    onClose={() => setIsCreateGroupOpen(false)}
                    onCreate={handleCreateGroup}
                />
            )}

            {pendingImages.length > 0 && (
                <div className="tg-photo-overlay">
                    <div className="tg-photo-modal">
                        <div className="tg-photo-topbar">
                            <button
                                type="button"
                                className="tg-photo-close"
                                onClick={handleCancelImage}
                                aria-label="Закрыть"
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            <div className="tg-photo-title">
                                {pendingImages.length > 1
                                    ? `${activePhotoIndex + 1} из ${pendingImages.length}`
                                    : 'Send Photo'}
                            </div>

                            <div className="tg-photo-menu-wrap" ref={photoMenuRef}>
                                <button
                                    type="button"
                                    className="tg-photo-more"
                                    onClick={() => setPhotoMenuOpen((v) => !v)}
                                    aria-label="Ещё"
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <circle cx="12" cy="5" r="1.8" />
                                        <circle cx="12" cy="12" r="1.8" />
                                        <circle cx="12" cy="19" r="1.8" />
                                    </svg>
                                </button>

                                {photoMenuOpen && (
                                    <div className="tg-photo-menu">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPhotoMenuOpen(false);
                                                addMoreInputRef.current?.click();
                                            }}
                                        >
                                            <span className="tg-photo-menu-icon">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                                                    stroke="currentColor" strokeWidth="1.8"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 5v14M5 12h14" />
                                                </svg>
                                            </span>
                                            Добавить
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSendAsFile(true);
                                                setPhotoMenuOpen(false);
                                                setTimeout(() => handleSendImage(), 0);
                                            }}
                                        >
                                            <span className="tg-photo-menu-icon">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                                                    stroke="currentColor" strokeWidth="1.8"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </span>
                                            Отправить как файл
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPendingSpoiler(true);
                                                setPhotoMenuOpen(false);
                                            }}
                                        >
                                            <span className="tg-photo-menu-icon">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
                                                    stroke="currentColor" strokeWidth="1.8"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            </span>
                                            Скрыть со спойлером
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={addMoreInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                multiple
                                onChange={handleAddMorePhotos}
                            />
                        </div>

                        <div className="tg-photo-body">
                            <div className="tg-photo-image-wrap">
                                <img
                                    src={pendingImages[activePhotoIndex]?.previewUrl}
                                    alt="Превью"
                                    className={`tg-photo-image ${pendingSpoiler ? 'is-spoiler' : ''}`}
                                />

                                <div className="tg-photo-image-actions">
                                    <button
                                        type="button"
                                        className="tg-photo-image-btn"
                                        onClick={() => setPendingSpoiler(true)}
                                        title="Скрыть со спойлером"
                                        aria-label="Скрыть со спойлером"
                                    >
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                            stroke="currentColor" strokeWidth="1.8"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    </button>

                                    <button
                                        type="button"
                                        className="tg-photo-image-btn tg-photo-image-btn-danger"
                                        onClick={() => removePhoto(activePhotoIndex)}
                                        title="Удалить"
                                        aria-label="Удалить"
                                    >
                                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                                            stroke="currentColor" strokeWidth="1.8"
                                            strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {pendingImages.length > 1 && (
                            <div className="tg-photo-thumbs">
                                {pendingImages.map((img, idx) => (
                                    <button
                                        key={img.previewUrl}
                                        type="button"
                                        className={`tg-photo-thumb ${idx === activePhotoIndex ? 'is-active' : ''}`}
                                        onClick={() => setActivePhotoIndex(idx)}
                                    >
                                        <img src={img.previewUrl} alt="" />
                                        <span
                                            className="tg-photo-thumb-remove"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removePhoto(idx);
                                            }}
                                        >
                                            ×
                                        </span>
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    className="tg-photo-thumb tg-photo-thumb-add"
                                    onClick={() => addMoreInputRef.current?.click()}
                                    aria-label="Добавить фото"
                                >
                                    +
                                </button>
                            </div>
                        )}

                        <div className="tg-photo-bottom">
                            <input
                                type="text"
                                className="tg-photo-caption"
                                placeholder="Add a caption..."
                                value={pendingCaption}
                                onChange={(e) => setPendingCaption(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSendImage();
                                    }
                                }}
                            />

                            <button
                                type="button"
                                className="tg-photo-send"
                                onClick={handleSendImage}
                                disabled={uploading}
                                aria-label="Отправить"
                            >
                                {uploading ? (
                                    <span className="tg-photo-send-progress">{uploadProgress}%</span>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewerState && viewerState.images.length > 0 && (
                <div
                    className="chat-image-viewer"
                    onClick={() => setViewerState(null)}
                >
                    <button
                        type="button"
                        className="chat-image-viewer-close"
                        onClick={() => setViewerState(null)}
                        aria-label="Закрыть"
                    >
                        ✕
                    </button>

                    {viewerState.images.length > 1 && (
                        <>
                            <button
                                type="button"
                                className="chat-image-viewer-nav chat-image-viewer-nav-prev"
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                aria-label="Предыдущее фото"
                            >
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
                                    stroke="currentColor" strokeWidth="2.2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                className="chat-image-viewer-nav chat-image-viewer-nav-next"
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                aria-label="Следующее фото"
                            >
                                <svg viewBox="0 0 24 24" width="28" height="28" fill="none"
                                    stroke="currentColor" strokeWidth="2.2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>

                            <div className="chat-image-viewer-counter">
                                {viewerState.index + 1} / {viewerState.images.length}
                            </div>
                        </>
                    )}

                    <img
                        src={viewerState.images[viewerState.index]?.url}
                        alt="Просмотр"
                        className={`chat-image-viewer-img ${
                            viewerState.images[viewerState.index]?.spoiler ? 'is-spoiler' : ''
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {messageMenu && (
                <div
                    ref={messageMenuRef}
                    className="message-context-menu"
                    style={{ top: messageMenu.y, left: messageMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button className="message-context-menu-item" onClick={handleReplyMessage}>
                        <span className="message-context-menu-icon"><ReplyIcon /></span>
                        <span className="message-context-menu-label">Ответить</span>
                    </button>
                    {messageMenu.message?.sender_id === user?.id &&
                        messageMenu.message?.type !== 'image' &&
                        messageMenu.message?.type !== 'file' && (
                        <button className="message-context-menu-item" onClick={handleEditMessage}>
                            <span className="message-context-menu-icon"><EditIcon /></span>
                            <span className="message-context-menu-label">Редактировать</span>
                        </button>
                    )}
                    {messageMenu.message?.type === 'image' && (
                        <button className="message-context-menu-item" onClick={handleEditMessagePhoto}>
                            <span className="message-context-menu-icon"><PhotoEditIcon /></span>
                            <span className="message-context-menu-label">Отредактируйте это фото</span>
                        </button>
                    )}
                    <button className="message-context-menu-item" onClick={handlePinMessage}>
                        <span className="message-context-menu-icon"><PinIcon /></span>
                        <span className="message-context-menu-label">
                            {messageMenu.message?.pinned ? 'Открепить' : 'Закрепить'}
                        </span>
                    </button>
                    <button className="message-context-menu-item" onClick={handleCopyMessage}>
                        <span className="message-context-menu-icon"><CopyIcon /></span>
                        <span className="message-context-menu-label">Копировать</span>
                    </button>
                    <button className="message-context-menu-item" onClick={handleForwardMessage}>
                        <span className="message-context-menu-icon"><ForwardIcon /></span>
                        <span className="message-context-menu-label">Вперёд</span>
                    </button>
                    <button className="message-context-menu-item" onClick={handleSelectMessage}>
                        <span className="message-context-menu-icon"><SelectIcon /></span>
                        <span className="message-context-menu-label">Выбрать</span>
                    </button>
                    <button
                        className="message-context-menu-item message-context-menu-item-danger"
                        onClick={handleDeleteMessage}
                    >
                        <span className="message-context-menu-icon"><DeleteIcon /></span>
                        <span className="message-context-menu-label">Удалить</span>
                    </button>
                </div>
            )}

            {copyToast && (
                <div className="chat-copy-toast">{copyToast}</div>
            )}
        </div>
    );
}