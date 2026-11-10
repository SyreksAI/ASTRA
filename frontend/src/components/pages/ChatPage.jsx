import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import {
    addGroupMember,
    createDirectConversation,
    createGroupConversation,
    fetchConversation,
    fetchMessages,
    fetchOnlineUserIds,
    fetchUserChatStatus,
    formatLastSeen,
    getMutedConversationIds,
    leaveGroupConversation,
    mapApiConversation,
    mapApiMessage,
    searchUsersForChat,
    sendChatMessage,
    setConversationMuted,
    uploadChatFile,
} from '../../utils/chatApi';

const TABS = [
    { id: 'all', label: 'Все' },
    { id: 'people', label: 'Люди' },
    { id: 'constellations', label: 'Созвездия' },
    { id: 'channels', label: 'Каналы' },
];

function ReadChecks({ read = false }) {
    return (
        <svg
            viewBox="0 0 24 14"
            width="16"
            height="10"
            aria-hidden
            className={`orbit-chat__checks${read ? ' is-read' : ''}`}
        >
            <path d="M1.5 7.5 5 11l7-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 7.5 12 11l7-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ChatPage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        conversations,
        reloadConversations,
        setActiveConversation,
        clearUnread,
        wsConnected,
    } = useChat();

    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [draft, setDraft] = useState('');
    const [chats, setChats] = useState([]);
    const [activeId, setActiveId] = useState(conversationId ? String(conversationId) : null);
    const [messages, setMessages] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [notifyOn, setNotifyOn] = useState(true);
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeMode, setComposeMode] = useState('direct');
    const [composeQuery, setComposeQuery] = useState('');
    const [composeResults, setComposeResults] = useState([]);
    const [composeSearching, setComposeSearching] = useState(false);
    const [groupTitle, setGroupTitle] = useState('');
    const [groupSelected, setGroupSelected] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [peerStatus, setPeerStatus] = useState({ online: false, last_seen_at: null });
    const [groupMembers, setGroupMembers] = useState([]);
    const [infoAddQuery, setInfoAddQuery] = useState('');
    const [infoAddResults, setInfoAddResults] = useState([]);
    const [infoAddBusy, setInfoAddBusy] = useState(false);

    const threadRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeApiIdRef = useRef(null);
    const composeSearchTimer = useRef(null);

    const activeChat = useMemo(
        () => chats.find((c) => c.id === activeId) || null,
        [chats, activeId],
    );

    useEffect(() => {
        activeApiIdRef.current = activeChat?.apiId ?? null;
        setActiveConversation(activeChat?.apiId ?? null);
    }, [activeChat?.apiId, setActiveConversation]);

    useEffect(() => {
        if (!user?.id) {
            setChats([]);
            setMessages([]);
            return;
        }
        let cancelled = false;
        setLoadingList(true);
        const userIds = conversations.map((c) => c.user?.id).filter(Boolean);
        fetchOnlineUserIds(userIds)
            .then((onlineIds) => {
                if (cancelled) return;
                setChats(conversations.map((c) => mapApiConversation(c, onlineIds)));
            })
            .catch(() => {
                if (!cancelled) setChats(conversations.map((c) => mapApiConversation(c, new Set())));
            })
            .finally(() => {
                if (!cancelled) setLoadingList(false);
            });
        return () => {
            cancelled = true;
        };
    }, [user?.id, conversations]);

    useEffect(() => {
        if (!user?.id || chats.length === 0) return undefined;
        const timer = setInterval(() => {
            const userIds = chats.map((c) => c.otherUserId).filter(Boolean);
            if (userIds.length === 0) return;
            fetchOnlineUserIds(userIds).then((onlineIds) => {
                setChats((prev) =>
                    prev.map((c) => ({
                        ...c,
                        online: c.otherUserId != null && onlineIds.has(c.otherUserId),
                    })),
                );
            });
        }, 30_000);
        return () => clearInterval(timer);
    }, [user?.id, chats.length]);

    useEffect(() => {
        if (conversationId) {
            setActiveId(String(conversationId));
        }
    }, [conversationId]);

    useEffect(() => {
        if (!user?.id || !conversationId || chats.length === 0) return;
        const found = chats.find((c) => String(c.apiId) === String(conversationId));
        if (found && found.id !== activeId) {
            setActiveId(found.id);
        }
    }, [chats, conversationId, user?.id, activeId]);

    useEffect(() => {
        if (!user?.id || conversationId || chats.length === 0) return;
        if (window.innerWidth > 900 && !activeId) {
            const first = chats[0];
            setActiveId(first.id);
            navigate(`/chat/${first.apiId}`, { replace: true });
        }
    }, [chats, conversationId, user?.id, activeId, navigate]);

    useEffect(() => {
        if (!user?.id || !activeChat?.apiId) {
            if (!activeChat) setMessages([]);
            return;
        }

        let cancelled = false;
        setLoadingMessages(true);

        fetchMessages(activeChat.apiId)
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data?.messages) ? data.messages : [];
                setMessages(list.map((m) => mapApiMessage(m, user.id)));
                setHasMoreMessages(Boolean(data?.has_more));
                clearUnread(activeChat.apiId);
            })
            .catch(() => {
                if (!cancelled) setMessages([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingMessages(false);
            });

        return () => {
            cancelled = true;
        };
    }, [activeChat?.apiId, user?.id, clearUnread]);

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages, activeId]);

    useEffect(() => {
        const onRealtimeMessage = (event) => {
            const msg = event.detail?.message;
            if (!msg || !user?.id) return;
            if (activeApiIdRef.current !== msg.conversation_id) return;

            const enriched = mapApiMessage(msg, user.id);
            setMessages((prev) => {
                if (prev.some((m) => m.id === enriched.id)) return prev;
                const withoutTemps = enriched.mine
                    ? prev.filter(
                        (m) =>
                            !(
                                String(m.id).startsWith('tmp-')
                                && m.mine
                                && m.type === enriched.type
                                && (m.text || '') === (enriched.text || '')
                            ),
                    )
                    : prev;
                return [...withoutTemps, enriched];
            });
        };

        window.addEventListener('chatMessageNew', onRealtimeMessage);
        return () => window.removeEventListener('chatMessageNew', onRealtimeMessage);
    }, [user?.id]);

    useEffect(() => {
        const onRead = (event) => {
            const { conversation_id, reader_id } = event.detail || {};
            if (!user?.id || reader_id === user.id) return;
            if (activeApiIdRef.current !== conversation_id) return;
            setMessages((prev) =>
                prev.map((m) => (m.mine ? { ...m, read: true } : m)),
            );
        };
        window.addEventListener('chatMessagesRead', onRead);
        return () => window.removeEventListener('chatMessagesRead', onRead);
    }, [user?.id]);

    useEffect(() => {
        if (!activeChat?.otherUserId) {
            setPeerStatus({ online: false, last_seen_at: null });
            return undefined;
        }
        let cancelled = false;
        const load = () => {
            fetchUserChatStatus(activeChat.otherUserId).then((st) => {
                if (!cancelled) {
                    setPeerStatus({
                        online: Boolean(st.online),
                        last_seen_at: st.last_seen_at || null,
                    });
                }
            });
        };
        load();
        const timer = setInterval(load, 20_000);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [activeChat?.otherUserId]);

    useEffect(() => {
        const muted = getMutedConversationIds();
        if (activeChat?.apiId) {
            setNotifyOn(!muted.has(Number(activeChat.apiId)));
        }
    }, [activeChat?.apiId]);

    useEffect(() => {
        if (!infoOpen || !activeChat?.isGroup || !activeChat?.apiId) {
            setGroupMembers([]);
            return;
        }
        let cancelled = false;
        fetchConversation(activeChat.apiId)
            .then((data) => {
                if (!cancelled) setGroupMembers(Array.isArray(data.members) ? data.members : []);
            })
            .catch(() => {
                if (!cancelled) setGroupMembers([]);
            });
        return () => {
            cancelled = true;
        };
    }, [infoOpen, activeChat?.isGroup, activeChat?.apiId]);

    useEffect(() => {
        if (!infoOpen || !activeChat?.isGroup || infoAddQuery.trim().length < 2) {
            setInfoAddResults([]);
            return undefined;
        }
        const t = setTimeout(async () => {
            setInfoAddBusy(true);
            try {
                const results = await searchUsersForChat(infoAddQuery);
                const memberIds = new Set(groupMembers.map((m) => m.id));
                setInfoAddResults(results.filter((u) => !memberIds.has(u.id)));
            } finally {
                setInfoAddBusy(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [infoOpen, activeChat?.isGroup, infoAddQuery, groupMembers]);

    const loadOlderMessages = async () => {
        if (!activeChat?.apiId || !user?.id || loadingMore || !hasMoreMessages) return;
        const oldest = messages[0];
        if (!oldest?.id || String(oldest.id).startsWith('tmp-')) return;
        setLoadingMore(true);
        try {
            const data = await fetchMessages(activeChat.apiId, { beforeId: oldest.id });
            const list = Array.isArray(data?.messages) ? data.messages : [];
            const mapped = list.map((m) => mapApiMessage(m, user.id));
            setMessages((prev) => {
                const ids = new Set(prev.map((m) => m.id));
                const merged = [...mapped.filter((m) => !ids.has(m.id)), ...prev];
                return merged;
            });
            setHasMoreMessages(Boolean(data?.has_more));
        } finally {
            setLoadingMore(false);
        }
    };

    const peerStatusLabel = useMemo(() => {
        if (!activeChat || activeChat.isGroup) return '';
        return formatLastSeen(peerStatus.last_seen_at, peerStatus.online || activeChat.online);
    }, [activeChat, peerStatus]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return chats.filter((c) => {
            if (tab === 'people' && c.convType !== 'direct') return false;
            if ((tab === 'constellations' || tab === 'channels') && c.convType !== 'group') return false;
            if (!q) return true;
            return c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q);
        });
    }, [chats, tab, search]);

    const selectChat = (chat) => {
        setActiveId(chat.id);
        setInfoOpen(false);
        clearUnread(chat.apiId);
        navigate(`/chat/${chat.apiId}`);
    };

    const openProfile = () => {
        if (!activeChat || activeChat.isGroup) return;
        const handle = String(activeChat.handle || '').replace(/^@/, '');
        if (handle) navigate(`/user/${handle}`);
        else navigate('/profile');
    };

    const sendMessage = async () => {
        const text = draft.trim();
        if (!text || !activeChat?.apiId || !user?.id) return;

        const tempId = `tmp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            mine: true,
            type: 'text',
            text,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            read: false,
        };
        setMessages((prev) => [...prev, optimistic]);
        setDraft('');
        setChats((prev) =>
            prev.map((c) =>
                c.id === activeChat.id ? { ...c, preview: `Ты: ${text}`, time: optimistic.time } : c,
            ),
        );

        try {
            const saved = await sendChatMessage(activeChat.apiId, { text });
            setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? mapApiMessage(saved, user.id) : m)),
            );
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
        }
        inputRef.current?.focus();
    };

    const onPickFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file || !activeChat?.apiId || !user?.id) return;

        setUploading(true);
        try {
            const uploaded = await uploadChatFile(activeChat.apiId, file);
            const isImage = (uploaded.mime_type || file.type || '').startsWith('image/');
            const saved = await sendChatMessage(activeChat.apiId, {
                text: '',
                type: isImage ? 'image' : 'file',
                file_url: uploaded.url,
                file_name: uploaded.file_name || file.name,
                file_size: uploaded.file_size,
                mime_type: uploaded.mime_type,
            });
            setMessages((prev) => [...prev, mapApiMessage(saved, user.id)]);
        } catch (err) {
            console.error(err);
            alert(err.message || 'Не удалось отправить файл');
        } finally {
            setUploading(false);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const showIncomingAvatar = (index) => {
        const msg = messages[index];
        if (msg.mine) return false;
        const prev = messages[index - 1];
        if (!prev || prev.mine) return true;
        if (activeChat?.isGroup && prev.senderId !== msg.senderId) return true;
        return false;
    };

    const showSenderName = (index) => {
        if (!activeChat?.isGroup) return false;
        const msg = messages[index];
        if (msg.mine || !msg.senderName) return false;
        return showIncomingAvatar(index);
    };

    const toggleMute = () => {
        if (!activeChat?.apiId) return;
        const next = !notifyOn;
        setNotifyOn(next);
        setConversationMuted(activeChat.apiId, !next);
    };

    const inviteToGroup = async (targetUser) => {
        if (!activeChat?.apiId) return;
        try {
            await addGroupMember(activeChat.apiId, targetUser.id);
            const data = await fetchConversation(activeChat.apiId);
            setGroupMembers(Array.isArray(data.members) ? data.members : []);
            setInfoAddQuery('');
            setInfoAddResults([]);
            await reloadConversations();
        } catch (err) {
            alert(err.message || 'Не удалось добавить');
        }
    };

    useEffect(() => {
        if (!composeOpen) {
            setComposeQuery('');
            setComposeResults([]);
            setGroupTitle('');
            setGroupSelected([]);
            setComposeMode('direct');
            return;
        }
        if (composeSearchTimer.current) clearTimeout(composeSearchTimer.current);
        if (composeQuery.trim().length < 2) {
            setComposeResults([]);
            return;
        }
        composeSearchTimer.current = setTimeout(async () => {
            setComposeSearching(true);
            try {
                const results = await searchUsersForChat(composeQuery);
                setComposeResults(results);
            } finally {
                setComposeSearching(false);
            }
        }, 300);
        return () => {
            if (composeSearchTimer.current) clearTimeout(composeSearchTimer.current);
        };
    }, [composeOpen, composeQuery]);

    const startDirectChat = async (targetUser) => {
        try {
            const conv = await createDirectConversation(targetUser.id);
            await reloadConversations();
            setComposeOpen(false);
            navigate(`/chat/${conv.id}`);
        } catch {
            alert('Не удалось открыть чат');
        }
    };

    const toggleGroupMember = (u) => {
        setGroupSelected((prev) => {
            if (prev.some((x) => x.id === u.id)) {
                return prev.filter((x) => x.id !== u.id);
            }
            if (prev.length >= 20) return prev;
            return [...prev, u];
        });
    };

    const createGroup = async () => {
        const title = groupTitle.trim();
        if (!title || groupSelected.length === 0) {
            alert('Укажите название и выберите участников');
            return;
        }
        try {
            const conv = await createGroupConversation(
                title,
                groupSelected.map((u) => u.id),
            );
            await reloadConversations();
            setComposeOpen(false);
            navigate(`/chat/${conv.id}`);
        } catch (err) {
            alert(err.message || 'Не удалось создать группу');
        }
    };

    const handleLeaveOrDelete = async () => {
        if (!activeChat?.apiId) return;
        if (!activeChat.isGroup) {
            alert('Личный диалог нельзя удалить — можно только скрыть из списка позже.');
            return;
        }
        if (!window.confirm('Выйти из группы?')) return;
        try {
            await leaveGroupConversation(activeChat.apiId);
            setInfoOpen(false);
            navigate('/chat');
            await reloadConversations();
        } catch (err) {
            alert(err.message || 'Не удалось выйти');
        }
    };

    if (!user) {
        return (
            <section className="orbit-chat orbit-chat--guest">
                <div className="orbit-chat__placeholder orbit-chat__guest">
                    <p>Войдите в аккаунт, чтобы пользоваться сообщениями Elara.</p>
                    <Link to="/login" className="orbit-chat__guest-link">
                        Войти
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className={`orbit-chat${infoOpen ? ' orbit-chat--info-open' : ''}`}>
            <aside className="orbit-chat__list">
                <label className="orbit-chat__search">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="m16.2 16.2 3.3 3.3" strokeLinecap="round" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск чата или сообщения..."
                    />
                </label>

                <div className="orbit-chat__list-head">
                    <h1>
                        Сообщения
                        {wsConnected && <span className="orbit-chat__ws-dot" title="Подключено" />}
                    </h1>
                </div>

                <nav className="orbit-chat__tabs" aria-label="Фильтр чатов">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            className={`orbit-chat__tab${tab === t.id ? ' is-active' : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="orbit-chat__rows">
                    {loadingList && chats.length === 0 && (
                        <div className="orbit-chat__empty-list">Загрузка…</div>
                    )}
                    {!loadingList && filtered.map((chat) => (
                        <button
                            key={chat.id}
                            type="button"
                            className={`orbit-chat__row${activeChat?.id === chat.id ? ' is-active' : ''}`}
                            onClick={() => selectChat(chat)}
                        >
                            <span className="orbit-chat__row-avatar">
                                <img src={chat.avatar} alt="" />
                                {chat.online && <i className="orbit-chat__online-dot" />}
                            </span>
                            <span className="orbit-chat__row-body">
                                <span className="orbit-chat__row-top">
                                    <strong>{chat.name}</strong>
                                    <em>{chat.time}</em>
                                </span>
                                <span className="orbit-chat__row-bottom">
                                    <span>{chat.preview}</span>
                                    {chat.unread > 0 && (
                                        <b aria-label={`Непрочитано: ${chat.unread}`}>
                                            {chat.unread > 99 ? '99+' : chat.unread}
                                        </b>
                                    )}
                                </span>
                            </span>
                        </button>
                    ))}
                    {!loadingList && filtered.length === 0 && (
                        <div className="orbit-chat__empty-list">
                            {chats.length === 0 ? (
                                <>
                                    Нет диалогов.{' '}
                                    <button
                                        type="button"
                                        className="orbit-chat__empty-action"
                                        onClick={() => setComposeOpen(true)}
                                    >
                                        Начать чат
                                    </button>
                                </>
                            ) : (
                                'Ничего не найдено'
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    className="orbit-chat__compose orbit-chat__compose--fab"
                    aria-label="Новое сообщение"
                    onClick={() => setComposeOpen(true)}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M12 20h9" strokeLinecap="round" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" strokeLinejoin="round" />
                    </svg>
                </button>
            </aside>

            <div className="orbit-chat__thread">
                {activeChat ? (
                    <>
                        <header
                            className="orbit-chat__thread-head"
                            role="button"
                            tabIndex={0}
                            aria-expanded={infoOpen}
                            aria-controls="orbit-chat-info"
                            onClick={() => setInfoOpen((v) => !v)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setInfoOpen((v) => !v);
                                }
                            }}
                        >
                            <div className="orbit-chat__thread-who">
                                <div>
                                    <div className="orbit-chat__thread-name">
                                        <strong>{activeChat.name}</strong>
                                    </div>
                                    <span className={(peerStatus.online || activeChat.online) ? 'is-online' : ''}>
                                        {activeChat.isGroup
                                            ? `${groupMembers.length || activeChat.membersCount || '—'} участников`
                                            : peerStatusLabel}
                                    </span>
                                </div>
                            </div>
                        </header>

                        <div className="orbit-chat__messages" ref={threadRef}>
                            {loadingMessages && messages.length === 0 && (
                                <div className="orbit-chat__empty-list">Загрузка сообщений…</div>
                            )}
                            {hasMoreMessages && messages.length > 0 && (
                                <button
                                    type="button"
                                    className="orbit-chat__load-more"
                                    disabled={loadingMore}
                                    onClick={loadOlderMessages}
                                >
                                    {loadingMore ? 'Загрузка…' : 'Показать ранние сообщения'}
                                </button>
                            )}
                            {messages.map((msg, index) => {
                                const isImage = msg.type === 'image' && msg.image;
                                const caption = isImage ? msg.text?.trim() : '';
                                const showMetaBelow = !isImage;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`orbit-chat__bubble-row${msg.mine ? ' is-mine' : ''}${showIncomingAvatar(index) ? '' : ' is-continued'}${isImage ? ' is-media-row' : ''}`}
                                    >
                                        {!msg.mine && (
                                            showIncomingAvatar(index)
                                                ? <img className="orbit-chat__bubble-avatar" src={activeChat.avatar} alt="" />
                                                : <span className="orbit-chat__bubble-avatar-spacer" aria-hidden />
                                        )}
                                        <div
                                            className={`orbit-chat__bubble${msg.mine ? ' is-mine' : ''}${isImage ? ' is-media' : ''}${caption ? ' has-caption' : ''}`}
                                        >
                                            {showSenderName(index) && (
                                                <span className="orbit-chat__sender-name">{msg.senderName}</span>
                                            )}
                                            {isImage && (
                                                <div className="orbit-chat__media">
                                                    <a
                                                        className="orbit-chat__media-link"
                                                        href={msg.fileUrl || msg.image}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <img className="orbit-chat__bubble-img" src={msg.image} alt="" />
                                                    </a>
                                                    <div className="orbit-chat__media-meta" aria-hidden={false}>
                                                        <time dateTime={msg.createdAt}>{msg.time}</time>
                                                        {msg.mine && <ReadChecks read={msg.read} />}
                                                    </div>
                                                </div>
                                            )}
                                            {msg.type === 'file' && (
                                                <a className="orbit-chat__file" href={msg.fileUrl || '#'} download={msg.fileName}>
                                                    <span className="orbit-chat__file-icon" aria-hidden>📎</span>
                                                    <span className="orbit-chat__file-meta">
                                                        <strong>{msg.fileName}</strong>
                                                        <em>{msg.fileSize}</em>
                                                    </span>
                                                </a>
                                            )}
                                            {!isImage && msg.text && (
                                                <div className="orbit-chat__bubble-inner">
                                                    <span className="orbit-chat__bubble-text">{msg.text}</span>
                                                    <span className="orbit-chat__bubble-meta orbit-chat__bubble-meta--inline">
                                                        <time dateTime={msg.createdAt}>{msg.time}</time>
                                                        {msg.mine && <ReadChecks read={msg.read} />}
                                                    </span>
                                                </div>
                                            )}
                                            {isImage && caption && (
                                                <div className="orbit-chat__bubble-inner orbit-chat__media-caption">
                                                    <span className="orbit-chat__bubble-text">{caption}</span>
                                                </div>
                                            )}
                                            {showMetaBelow && !msg.text && msg.type === 'file' && (
                                                <div className="orbit-chat__bubble-meta">
                                                    <time dateTime={msg.createdAt}>{msg.time}</time>
                                                    {msg.mine && <ReadChecks read={msg.read} />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <form
                            className="orbit-chat__composer"
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendMessage();
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="orbit-chat__file-input"
                                accept="image/*,.pdf,.doc,.docx,.zip,.txt"
                                onChange={onPickFile}
                            />
                            <div className="orbit-chat__composer-shell">
                                <button
                                    type="button"
                                    className="orbit-chat__composer-icon"
                                    aria-label="Вложение"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                    </svg>
                                </button>
                                <input
                                    ref={inputRef}
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    placeholder={uploading ? 'Загрузка…' : 'Напиши сообщение...'}
                                    disabled={uploading}
                                />
                            </div>
                            <button type="submit" className="orbit-chat__send" aria-label="Отправить" disabled={!draft.trim() || uploading}>
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="orbit-chat__placeholder">Выберите диалог или начните новый чат</div>
                )}
            </div>

            {activeChat && infoOpen && (
                <aside className="orbit-chat__info" id="orbit-chat-info">
                    <div className="orbit-chat__info-top">
                        <button
                            type="button"
                            className="orbit-chat__info-icon-btn"
                            aria-label="Закрыть"
                            onClick={() => setInfoOpen(false)}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <div className="orbit-chat__info-hero">
                        <img src={activeChat.avatar} alt="" />
                        <strong>{activeChat.name}</strong>
                        <span className={`orbit-chat__info-status${activeChat.online ? ' is-online' : ''}`}>
                            <i />
                            {activeChat.isGroup
                                ? 'Групповой чат'
                                : activeChat.online
                                    ? 'В сети'
                                    : 'Не в сети'}
                        </span>
                    </div>

                    {!activeChat.isGroup && (
                        <button type="button" className="orbit-chat__info-profile-btn" onClick={openProfile}>
                            Перейти в профиль
                        </button>
                    )}

                    {activeChat.isGroup && (
                        <div className="orbit-chat__info-members">
                            <h3>Участники ({groupMembers.length || activeChat.membersCount || 0})</h3>
                            <ul>
                                {groupMembers.map((m) => (
                                    <li key={m.id}>
                                        <img src={m.avatar || '/default-avatar.png'} alt="" />
                                        <span>
                                            <strong>{m.full_name || m.username}</strong>
                                            <em>@{m.username}{m.online ? ' · в сети' : ''}</em>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <input
                                className="orbit-chat__compose-search"
                                value={infoAddQuery}
                                onChange={(e) => setInfoAddQuery(e.target.value)}
                                placeholder="Добавить участника…"
                            />
                            {infoAddBusy && <p className="orbit-chat__compose-hint">Поиск…</p>}
                            <ul className="orbit-chat__compose-users">
                                {infoAddResults.map((u) => (
                                    <li key={u.id}>
                                        <button type="button" className="orbit-chat__compose-user" onClick={() => inviteToGroup(u)}>
                                            <img src={u.avatar || '/default-avatar.png'} alt="" />
                                            <span>
                                                <strong>{u.full_name || u.username}</strong>
                                                <em>@{u.username}</em>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="orbit-chat__info-list">
                        <div className="orbit-chat__info-item">
                            <span className="orbit-chat__info-item-label">Уведомления</span>
                            <button
                                type="button"
                                className={`orbit-chat__switch${notifyOn ? ' is-on' : ''}`}
                                aria-pressed={notifyOn}
                                aria-label="Уведомления"
                                onClick={toggleMute}
                            >
                                <i />
                            </button>
                        </div>
                    </div>

                    {activeChat.isGroup && (
                        <div className="orbit-chat__info-danger">
                            <button type="button" className="orbit-chat__info-item is-danger" onClick={handleLeaveOrDelete}>
                                <span className="orbit-chat__info-item-label">Выйти из группы</span>
                            </button>
                        </div>
                    )}
                </aside>
            )}

            {composeOpen && (
                <div className="orbit-chat__overlay" role="presentation" onClick={() => setComposeOpen(false)}>
                    <div
                        className="orbit-chat__compose-panel"
                        role="dialog"
                        aria-labelledby="orbit-chat-compose-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="orbit-chat__compose-head">
                            <h2 id="orbit-chat-compose-title">Новый чат</h2>
                            <button type="button" className="orbit-chat__info-icon-btn" aria-label="Закрыть" onClick={() => setComposeOpen(false)}>
                                ×
                            </button>
                        </div>
                        <div className="orbit-chat__compose-tabs">
                            <button
                                type="button"
                                className={composeMode === 'direct' ? 'is-active' : ''}
                                onClick={() => setComposeMode('direct')}
                            >
                                Личный
                            </button>
                            <button
                                type="button"
                                className={composeMode === 'group' ? 'is-active' : ''}
                                onClick={() => setComposeMode('group')}
                            >
                                Группа
                            </button>
                        </div>
                        {composeMode === 'group' && (
                            <input
                                className="orbit-chat__compose-title"
                                value={groupTitle}
                                onChange={(e) => setGroupTitle(e.target.value)}
                                placeholder="Название группы"
                                maxLength={120}
                            />
                        )}
                        <input
                            className="orbit-chat__compose-search"
                            value={composeQuery}
                            onChange={(e) => setComposeQuery(e.target.value)}
                            placeholder="Поиск по имени или @нику…"
                            autoFocus
                        />
                        {composeMode === 'group' && groupSelected.length > 0 && (
                            <div className="orbit-chat__compose-chips">
                                {groupSelected.map((u) => (
                                    <button key={u.id} type="button" onClick={() => toggleGroupMember(u)}>
                                        @{u.username} ×
                                    </button>
                                ))}
                            </div>
                        )}
                        <ul className="orbit-chat__compose-users">
                            {composeSearching && <li className="orbit-chat__compose-hint">Поиск…</li>}
                            {!composeSearching && composeQuery.trim().length >= 2 && composeResults.length === 0 && (
                                <li className="orbit-chat__compose-hint">Никого не найдено</li>
                            )}
                            {composeResults.map((u) => (
                                <li key={u.id}>
                                    <button
                                        type="button"
                                        className="orbit-chat__compose-user"
                                        onClick={() =>
                                            composeMode === 'direct'
                                                ? startDirectChat(u)
                                                : toggleGroupMember(u)
                                        }
                                    >
                                        <img src={u.avatar || '/default-avatar.png'} alt="" />
                                        <span>
                                            <strong>{u.full_name || u.username}</strong>
                                            <em>@{u.username}</em>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {composeMode === 'group' && (
                            <button
                                type="button"
                                className="orbit-chat__compose-create"
                                disabled={!groupTitle.trim() || groupSelected.length === 0}
                                onClick={createGroup}
                            >
                                Создать группу
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
