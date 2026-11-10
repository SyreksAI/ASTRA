const DEFAULT_AVATAR = '/default-avatar.png';

export function chatAuthHeaders(json = false) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

export function formatFileSize(bytes) {
    if (bytes == null || Number.isNaN(Number(bytes))) return '';
    const n = Number(bytes);
    if (n < 1024) return `${n} Б`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
    return `${(n / (1024 * 1024)).toFixed(1)} МБ`;
}

export function formatChatListTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
        d.getDate() === now.getDate()
        && d.getMonth() === now.getMonth()
        && d.getFullYear() === now.getFullYear();
    if (sameDay) {
        return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
        d.getDate() === yesterday.getDate()
        && d.getMonth() === yesterday.getMonth()
        && d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return 'вчера';
    return d.toLocaleDateString('ru-RU', { weekday: 'short' });
}

export function formatMessageTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function formatLastSeen(iso, online) {
    if (online) return 'В сети';
    if (!iso) return 'Не в сети';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    if (diffMs < 60_000) return 'был(а) только что';
    if (diffMs < 3600_000) {
        const m = Math.floor(diffMs / 60_000);
        return `был(а) ${m} мин. назад`;
    }
    const sameDay =
        d.getDate() === now.getDate()
        && d.getMonth() === now.getMonth()
        && d.getFullYear() === now.getFullYear();
    if (sameDay) {
        return `был(а) в ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `был(а) ${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`;
}

const MUTE_STORAGE_KEY = 'elara_chat_muted';

export function getMutedConversationIds() {
    try {
        const raw = localStorage.getItem(MUTE_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr.map(Number) : []);
    } catch {
        return new Set();
    }
}

export function setConversationMuted(conversationId, muted) {
    const id = Number(conversationId);
    const set = getMutedConversationIds();
    if (muted) set.add(id);
    else set.delete(id);
    localStorage.setItem(MUTE_STORAGE_KEY, JSON.stringify([...set]));
}

export function countUnreadConversations(conversations) {
    if (!Array.isArray(conversations)) return 0;
    return conversations.filter((c) => (c.unread_count ?? 0) > 0 || c.has_unread).length;
}

export function messagePreviewFromPayload(msg) {
    if (!msg) return '';
    if (msg.type === 'image') return '📷 Фото';
    if (msg.type === 'file') return `📎 ${msg.file_name || 'Файл'}`;
    return msg.text || '';
}

export function dispatchChatUnread(count) {
    window.dispatchEvent(new CustomEvent('chatUnreadChanged', { detail: { count } }));
}

export function mapApiConversation(c, onlineIds = new Set()) {
    const other = c.user || {};
    const isGroup = c.type === 'group';
    const otherOnline = other.id != null && onlineIds.has(other.id);

    return {
        id: String(c.id),
        apiId: c.id,
        convType: c.type,
        type: isGroup ? 'constellations' : 'people',
        name: c.display_name || c.title || 'Чат',
        handle: other.username ? `@${other.username}` : (isGroup ? 'группа' : ''),
        avatar: c.display_avatar || other.avatar || DEFAULT_AVATAR,
        preview: c.last_message || 'Нет сообщений',
        time: formatChatListTime(c.last_message_at),
        unread: Math.max(0, Number(c.unread_count) || (c.has_unread ? 1 : 0)),
        hasUnread: (c.unread_count ?? 0) > 0 || Boolean(c.has_unread),
        online: otherOnline,
        otherUserId: other.id ?? null,
        verified: false,
        bio: other.bio || '',
        role: isGroup ? 'Группа' : 'Участник',
        location: '',
        isGroup,
        membersCount: c.members_count ?? null,
    };
}

export function mapApiMessage(m, meId) {
    const msgType = m.type === 'image' ? 'image' : m.type === 'file' ? 'file' : 'text';
    return {
        id: m.id,
        mine: m.is_me ?? m.sender_id === meId,
        type: msgType,
        text: m.text || '',
        image: msgType === 'image' ? m.file_url : undefined,
        fileUrl: m.file_url,
        fileName: m.file_name || 'Файл',
        fileSize: formatFileSize(m.file_size),
        time: formatMessageTime(m.created_at),
        read: Boolean(m.read_at),
        createdAt: m.created_at,
        conversationId: m.conversation_id,
        senderName: m.sender_name || '',
        senderId: m.sender_id,
    };
}

export async function fetchConversations() {
    const r = await fetch('/api/chat/conversations', { headers: chatAuthHeaders() });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
}

export async function fetchOnlineUserIds(userIds) {
    const ids = [...new Set(userIds.filter((id) => id != null))];
    if (ids.length === 0) return new Set();
    const r = await fetch(`/api/chat/users/online?ids=${ids.join(',')}`, {
        headers: chatAuthHeaders(),
    });
    if (!r.ok) return new Set();
    const data = await r.json();
    const list = data?.online_ids || [];
    return new Set(list);
}

export async function markConversationRead(conversationId) {
    await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: chatAuthHeaders(),
    });
}

export async function fetchMessages(conversationId, opts = {}) {
    const params = new URLSearchParams();
    if (opts.beforeId != null) params.set('before_id', String(opts.beforeId));
    if (opts.limit != null) params.set('limit', String(opts.limit));
    const qs = params.toString();
    const r = await fetch(
        `/api/chat/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
        { headers: chatAuthHeaders() },
    );
    if (!r.ok) return { messages: [], has_more: false };
    return r.json();
}

export async function fetchConversation(conversationId) {
    const r = await fetch(`/api/chat/conversations/${conversationId}`, {
        headers: chatAuthHeaders(),
    });
    if (!r.ok) throw new Error('Не удалось загрузить чат');
    return r.json();
}

export async function fetchUserChatStatus(userId) {
    const r = await fetch(`/api/chat/users/${userId}/status`, {
        headers: chatAuthHeaders(),
    });
    if (!r.ok) return { online: false, last_seen_at: null };
    return r.json();
}

export async function updateGroupConversation(conversationId, payload) {
    const r = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: chatAuthHeaders(true),
        body: JSON.stringify(payload),
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Не удалось обновить группу');
    }
    return r.json();
}

export async function addGroupMember(conversationId, userId) {
    const r = await fetch(`/api/chat/conversations/${conversationId}/members`, {
        method: 'POST',
        headers: chatAuthHeaders(true),
        body: JSON.stringify({ user_id: userId }),
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Не удалось добавить участника');
    }
    return r.json();
}

export async function sendChatMessage(conversationId, body) {
    const r = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: chatAuthHeaders(true),
        body: JSON.stringify(body),
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Не удалось отправить сообщение');
    }
    return r.json();
}

export async function uploadChatFile(conversationId, file) {
    const form = new FormData();
    form.append('file', file);
    const r = await fetch(`/api/chat/conversations/${conversationId}/upload`, {
        method: 'POST',
        headers: chatAuthHeaders(),
        body: form,
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Не удалось загрузить файл');
    }
    return r.json();
}

export async function createDirectConversation(userId) {
    const r = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: chatAuthHeaders(true),
        body: JSON.stringify({ user_id: userId }),
    });
    if (!r.ok) throw new Error('Не удалось открыть чат');
    return r.json();
}

export async function createGroupConversation(title, userIds) {
    const r = await fetch('/api/chat/conversations/group', {
        method: 'POST',
        headers: chatAuthHeaders(true),
        body: JSON.stringify({ title, user_ids: userIds }),
    });
    if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || 'Не удалось создать группу');
    }
    return r.json();
}

export async function searchUsersForChat(query) {
    const q = encodeURIComponent(query.trim());
    if (!q) return [];
    const r = await fetch(`/api/users/search?q=${q}`, { headers: chatAuthHeaders() });
    if (!r.ok) return [];
    const data = await r.json();
    return Array.isArray(data) ? data : [];
}

export async function leaveGroupConversation(conversationId) {
    const r = await fetch(`/api/chat/conversations/${conversationId}/leave`, {
        method: 'POST',
        headers: chatAuthHeaders(),
    });
    if (!r.ok) throw new Error('Не удалось выйти из группы');
    return r.json();
}
