import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NewChatModal } from '../modal/NewChatModal';
import { CreateGroupModal } from '../modal/CreateGroupModal';

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

export function ChatPage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

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

    const messagesEndRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const fileInputRef = useRef(null);
    const emojiPanelRef = useRef(null);

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

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
                    setMessages(data.messages || []);
                    setActiveUser(data.user || null);
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
                        return prev.map((c) =>
                            c.id === enriched.conversation_id
                                ? {
                                      ...c,
                                      last_message: enriched.text,
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setIsInfoOpen(false);
        setEmojiOpen(false);
        setMenuOpen(false);
        setMenuPage(null);
        setIsGroupSettingsOpen(false);
        setSettingsPage(null);
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
        const text = newMessage.trim();
        setNewMessage('');

        try {
            const response = await fetch(`/api/chat/conversations/${activeId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error('Не удалось отправить');
            const saved = await response.json();

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
                        ? { ...c, last_message: text, last_message_at: saved.created_at }
                        : c
                )
            );
        } catch (err) {
            console.error(err);
            setNewMessage(text);
        }
    };

    const handleFilePick = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        console.log('Выбран файл:', file.name, file.size, file.type);
        e.target.value = '';
    };

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
    const handleSelectMessages = () => { closeMenu(); alert('Выбор сообщений в разработке'); };
    const handleAddToContacts = () => { closeMenu(); alert('Контакты в разработке'); };
    const handleSendGift = () => { closeMenu(); alert('Подарки в разработке'); };

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

    const filteredConversations = conversations.filter((c) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        const name =
            c.display_name?.toLowerCase() ||
            c.user?.full_name?.toLowerCase() ||
            c.user?.username?.toLowerCase() ||
            '';
        return name.includes(q);
    });

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

    return (
        <div className="chat-page">
            <div className={`chat-page-container ${activeConversation ? 'chat-page-container-open' : ''}`}>
                {/* ============ СПИСОК ЧАТОВ ============ */}
                <div className="chat-list">
                    <div className="search_chat">
                        <input
                            type="text"
                            className="Chat-search-input"
                            placeholder="Поиск контактов..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loadingList && <div className="comments-state">Загрузка…</div>}

                    {!loadingList && filteredConversations.length === 0 && (
                        <div className="comments-state">
                            {conversations.length === 0
                                ? 'Пока нет диалогов'
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
                <div className="chat-window">
                    {activeConversation ? (
                        <>
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

                            <div className="chat-messages">
                                {loadingMessages && (
                                    <div className="comments-state">Загрузка…</div>
                                )}

                                {!loadingMessages && messages.length === 0 && (
                                    <div className="comments-state">
                                        Начните диалог первым сообщением
                                    </div>
                                )}

                                {!loadingMessages &&
                                    messages.map((msg) => {
                                        const isMe = msg.sender_id === user?.id;
                                        const showSender = isGroup && !isMe && msg.sender_name;
                                        const senderUsername =
                                            msg.sender_username || msg.username || '';

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`chat-message ${
                                                    isMe ? 'chat-message-me' : 'chat-message-other'
                                                } ${showSender ? 'chat-message-group' : ''}`}
                                            >
                                                {showSender && (
                                                    senderUsername ? (
                                                        <Link
                                                            to={`/user/${senderUsername}`}
                                                            className="chat-message-sender"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {msg.sender_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="chat-message-sender is-static">
                                                            {msg.sender_name}
                                                        </span>
                                                    )
                                                )}
                                                <div className="chat-message-text">{msg.text}</div>
                                                <div className="chat-message-time">
                                                    {formatTime(msg.created_at)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="chat-input-form" onSubmit={handleSendMessage}>
                                <button
                                    type="button"
                                    className="chat-input-icon-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Прикрепить файл"
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
                                    onChange={handleFilePick}
                                />

                                <button
                                    type="button"
                                    className="chat-input-icon-btn"
                                    onClick={() => setEmojiOpen((v) => !v)}
                                    title="Эмодзи"
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
                                    className="chat-input"
                                    placeholder="Введите сообщение..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onFocus={() => setEmojiOpen(false)}
                                />
                                <button
                                    type="submit"
                                    className="chat-send-btn"
                                    disabled={!newMessage.trim()}
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

                            {/* ============ ТЕЛО ПАНЕЛИ ============ */}
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
        </div>
    );
}