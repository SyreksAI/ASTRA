import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function NewChatModal({ onClose, onSelectUser, onCreateGroup }) {
    const { user } = useAuth();
    const [tab, setTab] = useState('following');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    useEffect(() => {
        if (!user?.username) return;
        setLoading(true);
        const url =
            tab === 'following'
                ? `/api/users/${user.username}/following`
                : `/api/users/${user.username}/followers`;

        fetch(url, { headers: authHeaders })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setUsers(data))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, user?.username]);

    const filtered = users.filter((u) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
            (u.full_name || '').toLowerCase().includes(q) ||
            (u.username || '').toLowerCase().includes(q)
        );
    });

    return (
        <div
            className="modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="new-chat-dialog">
                {/* Шапка */}
                <div className="new-chat-header">
                    <h2>Новое сообщение</h2>
                    <button
                        className="new-chat-close"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                    </button>
                </div>

                {/* Поиск */}
                <div className="new-chat-search">
                    <svg
                        className="new-chat-search-icon"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        width="18"
                        height="18"
                    >
                        <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Поиск по имени или @username"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Создать группу */}
                <button
                    className="new-chat-create-group"
                    onClick={() => {
                        onClose();
                        onCreateGroup?.();
                    }}
                >
                    <span className="new-chat-create-group-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            <path d="M18 11h-2v3h-3v2h3v3h2v-3h3v-2h-3z" />
                        </svg>
                    </span>
                    <span className="new-chat-create-group-label">Создать группу</span>
                </button>

                {/* Вкладки */}
                <div className="new-chat-tabs">
                    <button
                        className={tab === 'following' ? 'active' : ''}
                        onClick={() => setTab('following')}
                    >
                        Подписки
                    </button>
                    <button
                        className={tab === 'followers' ? 'active' : ''}
                        onClick={() => setTab('followers')}
                    >
                        Подписчики
                    </button>
                </div>

                {/* Список юзеров */}
                <div className="new-chat-list">
                    {loading && <div className="new-chat-state">Загрузка…</div>}
                    {!loading && filtered.length === 0 && (
                        <div className="new-chat-state">Никого не найдено</div>
                    )}
                    {!loading &&
                        filtered.map((u) => (
                            <button
                                key={u.id}
                                className="new-chat-item"
                                onClick={() => onSelectUser(u)}
                            >
                                <img
                                    src={u.avatar || '/default-avatar.png'}
                                    alt={u.username}
                                    className="new-chat-avatar"
                                />
                                <div className="new-chat-info">
                                    <div className="new-chat-name">
                                        {u.full_name || u.username}
                                    </div>
                                    <div className="new-chat-username">
                                        @{u.username}
                                    </div>
                                </div>
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
}