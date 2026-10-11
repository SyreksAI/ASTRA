import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function CreateGroupModal({ onClose, onCreate }) {
    const { user } = useAuth();
    const [tab, setTab] = useState('following');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set()); // Set<user_id>
    const [title, setTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

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

    const filtered = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.trim().toLowerCase();
        return users.filter(
            (u) =>
                (u.full_name || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q)
        );
    }, [users, search]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const canCreate = title.trim().length >= 1 && selected.size >= 1 && !creating;

    const handleCreate = async () => {
        if (!canCreate) return;
        setCreating(true);
        setError('');
        try {
            await onCreate({
                title: title.trim(),
                user_ids: Array.from(selected),
            });
        } catch (err) {
            setError(err.message || 'Не удалось создать группу');
            setCreating(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !creating) onClose();
            }}
        >
            <div className="create-group-dialog">
                {/* Шапка */}
                <div className="create-group-header">
                    <button
                        className="create-group-close"
                        onClick={onClose}
                        aria-label="Закрыть"
                        disabled={creating}
                    >
                        ×
                    </button>
                    <h2>Новая группа</h2>
                    <button
                        className="create-group-submit"
                        onClick={handleCreate}
                        disabled={!canCreate}
                    >
                        {creating ? 'Создание…' : 'Создать'}
                    </button>
                </div>

                {error && <div className="create-group-error">{error}</div>}

                {/* Название */}
                <div className="create-group-field">
                    <label>Название группы</label>
                    <input
                        type="text"
                        placeholder="Например, Рабочая команда"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                        autoFocus
                    />
                </div>

                {/* Поиск */}
                <div className="create-group-field">
                    <label>Поиск участников</label>
                    <input
                        type="text"
                        placeholder="Имя или @username"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Вкладки */}
                <div className="create-group-tabs">
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

                {/* Счётчик */}
                <div className="create-group-counter">
                    Выбрано: <b>{selected.size}</b> (минимум 1)
                </div>

                {/* Список */}
                <div className="create-group-list">
                    {loading && <div className="new-chat-state">Загрузка…</div>}
                    {!loading && filtered.length === 0 && (
                        <div className="new-chat-state">Никого не найдено</div>
                    )}
                    {!loading &&
                        filtered.map((u) => {
                            const checked = selected.has(u.id);
                            return (
                                <label
                                    key={u.id}
                                    className={`create-group-item ${checked ? 'selected' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(u.id)}
                                    />
                                    <img
                                        src={u.avatar || '/default-avatar.png'}
                                        alt={u.username}
                                        className="create-group-avatar"
                                    />
                                    <div className="create-group-info">
                                        <div className="create-group-name">
                                            {u.full_name || u.username}
                                        </div>
                                        <div className="create-group-username">
                                            @{u.username}
                                        </div>
                                    </div>
                                    <span className="create-group-check" aria-hidden="true">
                                        {checked ? '✓' : ''}
                                    </span>
                                </label>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}