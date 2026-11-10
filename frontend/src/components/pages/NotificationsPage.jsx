import React, { useMemo, useState } from 'react';

const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'mentions', label: 'Упоминания' },
    { id: 'reactions', label: 'Реакции' },
    { id: 'follows', label: 'Подписки' },
    { id: 'constellations', label: 'Созвездия' },
];

const INITIAL = [
    {
        id: 1,
        type: 'comment',
        filter: 'mentions',
        name: 'Павел Дуров',
        action: 'ответил на ваш комментарий',
        preview: '«Согласен, орбита стала заметно живее…»',
        time: '5 минут назад',
        read: false,
        group: 'today',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=176&h=176&fit=crop&q=90',
    },
    {
        id: 2,
        type: 'like',
        filter: 'reactions',
        name: 'Дмитрий Нагиев',
        action: 'лайкнул ваш пост',
        preview: '«Немного интерфейсов из нового проекта ✨»',
        time: '15 минут назад',
        read: false,
        group: 'today',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=176&h=176&fit=crop&q=90',
    },
    {
        id: 3,
        type: 'follow',
        filter: 'follows',
        name: 'Егор Крид',
        action: 'подписался на вас',
        preview: 'Теперь в вашей орбите',
        time: '42 минуты назад',
        read: false,
        group: 'today',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=176&h=176&fit=crop&q=90',
    },
    {
        id: 4,
        type: 'constellation',
        filter: 'constellations',
        name: 'Созвездие Дизайн',
        action: 'опубликовало новый пост',
        preview: '«Собрали референсы для светлой орбиты»',
        time: '1 час назад',
        read: false,
        group: 'today',
        avatar: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=176&h=176&fit=crop&q=90',
    },
    {
        id: 5,
        type: 'mention',
        filter: 'mentions',
        name: 'Lina.dev',
        action: 'упомянула вас',
        preview: '«@you посмотри этот экран — очень в тему»',
        time: 'Вчера',
        read: true,
        group: 'earlier',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=176&h=176&fit=crop&q=90',
    },
    {
        id: 6,
        type: 'like',
        filter: 'reactions',
        name: 'SyreksAI',
        action: 'и ещё 11 человек лайкнули ваш пост',
        preview: '«hi»',
        time: '2 дня назад',
        read: true,
        group: 'earlier',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=176&h=176&fit=crop&q=90',
    },
    {
        id: 7,
        type: 'follow',
        filter: 'follows',
        name: 'Сергей Жуков',
        action: 'подписался на вас',
        preview: 'Музыка · 2.1k подписчиков',
        time: '3 дня назад',
        read: true,
        group: 'earlier',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=176&h=176&fit=crop&q=90',
    },
];

function TypeIcon({ type }) {
    if (type === 'like') {
        return (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.1a3.8 3.8 0 0 1 7 2.7C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
            </svg>
        );
    }
    if (type === 'follow') {
        return (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="10" cy="8" r="3.2" />
                <path d="M4.5 19c1.2-2.4 3.2-3.6 5.5-3.6" strokeLinecap="round" />
                <path d="M17 11v6M14 14h6" strokeLinecap="round" />
            </svg>
        );
    }
    if (type === 'constellation') {
        return (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="12" cy="12" r="3.2" />
                <ellipse cx="12" cy="12" rx="8" ry="3.2" transform="rotate(-22 12 12)" />
            </svg>
        );
    }
    if (type === 'mention') {
        return (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                <circle cx="12" cy="12" r="7.2" />
                <path d="M16.2 12v1.2a2.2 2.2 0 0 0 4.1-1.1A8.3 8.3 0 1 0 12 20.3" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2.6" />
            </svg>
        );
    }
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
            <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 16h-4.2L8.5 19.2V16H7A2.5 2.5 0 0 1 4.5 13.5v-6Z" />
        </svg>
    );
}

export function NotificationsPage() {
    const [items, setItems] = useState(INITIAL);
    const [filter, setFilter] = useState('all');

    const unreadCount = items.filter((n) => !n.read).length;

    const visible = useMemo(
        () => (filter === 'all' ? items : items.filter((n) => n.filter === filter)),
        [items, filter],
    );

    const today = visible.filter((n) => n.group === 'today');
    const earlier = visible.filter((n) => n.group === 'earlier');

    const markAllRead = () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const markRead = (id) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    };

    const renderGroup = (title, list) => {
        if (!list.length) return null;
        return (
            <section className="notif-orbit__group" aria-label={title}>
                <h2 className="notif-orbit__group-title">{title}</h2>
                <ul className="notif-orbit__list">
                    {list.map((n) => (
                        <li key={n.id}>
                            <button
                                type="button"
                                className={`notif-orbit__item${!n.read ? ' is-unread' : ''}`}
                                onClick={() => markRead(n.id)}
                            >
                                {!n.read ? (
                                    <span className="notif-orbit__dot" aria-hidden />
                                ) : (
                                    <span className="notif-orbit__dot-spacer" aria-hidden />
                                )}
                                <span className="notif-orbit__media">
                                    <img
                                        src={n.avatar}
                                        alt=""
                                        className="notif-orbit__avatar"
                                        width={44}
                                        height={44}
                                        decoding="async"
                                    />
                                    <span className={`notif-orbit__type notif-orbit__type--${n.type}`} aria-hidden>
                                        <TypeIcon type={n.type} />
                                    </span>
                                </span>
                                <span className="notif-orbit__body">
                                    <span className="notif-orbit__line">
                                        <strong>{n.name}</strong> {n.action}
                                    </span>
                                    {n.preview ? <span className="notif-orbit__preview">{n.preview}</span> : null}
                                </span>
                                <span className="notif-orbit__meta">
                                    <span className="notif-orbit__time">{n.time}</span>
                                    <span
                                        className="notif-orbit__more"
                                        role="presentation"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-hidden
                                    >
                                        ···
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>
        );
    };

    return (
        <div className="notif-orbit">
            <header className="notif-orbit__head">
                <h1 className="notif-orbit__title">Уведомления</h1>
                <p className="notif-orbit__subtitle">Всё важное из твоей вселенной</p>
            </header>

            <div className="notif-orbit__toolbar">
                <div className="notif-orbit__filters" role="tablist" aria-label="Фильтры уведомлений">
                    {FILTERS.map((f) => {
                        const active = filter === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                className={`notif-orbit__chip${active ? ' is-active' : ''}`}
                                onClick={() => setFilter(f.id)}
                            >
                                <span>{f.label}</span>
                                {f.id === 'all' && unreadCount > 0 ? (
                                    <span className="notif-orbit__chip-badge">{unreadCount}</span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    className="notif-orbit__mark-all"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M4.5 12.5 9.2 17l10.3-11" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Отметить всё прочитанным
                </button>
            </div>

            {renderGroup('Сегодня', today)}
            {renderGroup('Ранее', earlier)}

            {!visible.length ? (
                <p className="notif-orbit__empty">Пока тихо в этой орбите</p>
            ) : null}
        </div>
    );
}
