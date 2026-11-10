import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useAuth } from './AuthContext';
import { useChatWebSocket } from '../hooks/useChatWebSocket';
import {
    countUnreadConversations,
    dispatchChatUnread,
    fetchConversations,
    markConversationRead,
    messagePreviewFromPayload,
} from '../utils/chatApi';

const ChatContext = createContext(null);

function sortConversations(list) {
    return [...list].sort(
        (a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0),
    );
}

export function ChatProvider({ children }) {
    const { user } = useAuth();
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    const [conversations, setConversations] = useState([]);
    const [wsConnected, setWsConnected] = useState(false);
    const activeConversationIdRef = useRef(null);
    const reloadLockRef = useRef(false);

    const publishUnread = useCallback((list) => {
        dispatchChatUnread(countUnreadConversations(list));
    }, []);

    const reloadConversations = useCallback(async () => {
        if (!user?.id) {
            setConversations([]);
            publishUnread([]);
            return [];
        }
        const list = await fetchConversations();
        const sorted = sortConversations(list);
        setConversations(sorted);
        publishUnread(sorted);
        return sorted;
    }, [user?.id, publishUnread]);

    useEffect(() => {
        reloadConversations();
    }, [reloadConversations]);

    const setActiveConversation = useCallback((conversationId) => {
        activeConversationIdRef.current =
            conversationId != null && conversationId !== ''
                ? Number(conversationId)
                : null;
    }, []);

    const clearUnread = useCallback(
        (conversationId) => {
            const id = Number(conversationId);
            markConversationRead(id).catch(() => {});
            setConversations((prev) => {
                const next = prev.map((c) =>
                    c.id === id ? { ...c, unread_count: 0, has_unread: false } : c,
                );
                publishUnread(next);
                return next;
            });
        },
        [publishUnread],
    );

    const applyIncomingMessage = useCallback(
        (msg) => {
            if (!msg?.conversation_id || !user?.id) return;

            const convId = msg.conversation_id;
            const isMine = msg.sender_id === user.id;
            const isActive = activeConversationIdRef.current === convId;
            const preview = messagePreviewFromPayload(msg);

            if (isActive && !isMine) {
                markConversationRead(convId).catch(() => {});
            }

            setConversations((prev) => {
                const idx = prev.findIndex((c) => c.id === convId);
                if (idx === -1) {
                    if (!reloadLockRef.current) {
                        reloadLockRef.current = true;
                        reloadConversations().finally(() => {
                            reloadLockRef.current = false;
                        });
                    }
                    return prev;
                }

                const current = prev[idx];
                let unreadCount = current.unread_count ?? (current.has_unread ? 1 : 0);
                if (isMine || isActive) {
                    unreadCount = 0;
                } else {
                    unreadCount += 1;
                }

                const updated = {
                    ...current,
                    last_message: preview,
                    last_message_at: msg.created_at || current.last_message_at,
                    unread_count: unreadCount,
                    has_unread: unreadCount > 0,
                };

                const next = [...prev];
                next[idx] = updated;
                const sorted = sortConversations(next);
                publishUnread(sorted);
                return sorted;
            });

            window.dispatchEvent(
                new CustomEvent('chatMessageNew', { detail: { message: msg } }),
            );
        },
        [user?.id, reloadConversations, publishUnread],
    );

    const applyMessagesRead = useCallback((payload) => {
        if (!payload?.conversation_id) return;
        window.dispatchEvent(
            new CustomEvent('chatMessagesRead', { detail: payload }),
        );
    }, []);

    useChatWebSocket({
        userId: user?.id,
        token,
        onMessageNew: (data) => {
            if (data?.message) applyIncomingMessage(data.message);
        },
        onMessagesRead: applyMessagesRead,
        onConnectionChange: setWsConnected,
    });

    const value = useMemo(
        () => ({
            conversations,
            reloadConversations,
            setActiveConversation,
            clearUnread,
            wsConnected,
        }),
        [conversations, reloadConversations, setActiveConversation, clearUnread, wsConnected],
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const ctx = useContext(ChatContext);
    if (!ctx) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return ctx;
}
