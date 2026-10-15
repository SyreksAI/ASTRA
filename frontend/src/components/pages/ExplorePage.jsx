// src/components/pages/ExplorePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ForYou } from '../explore/ForYou';
import { Trending } from '../explore/Trending';
import { News } from '../explore/News';
import { Sport } from '../explore/Sport';
import { Video } from '../explore/Video';
import { PostCard } from '../post/PostCard';
import {
    getSearchHistory,
    pushSearchHistory,
    clearSearchHistory,
} from '../utils/searchHistory';

// Хук для тёмной темы
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

export function ExplorePage({ suggestedUsers }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDarkTheme = useIsDarkTheme();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('Для тебя');
    const [filter, setFilter] = useState('all');

    const [userResults, setUserResults] = useState([]);
    const [postResults, setPostResults] = useState([]);
    const [trackResults, setTrackResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [history, setHistory] = useState(() => getSearchHistory());

    const categories = [
        { id: 'Для тебя', label: 'Для тебя' },
        { id: 'В тренде', label: 'В тренде' },
        { id: 'Новости', label: 'Новости' },
        { id: 'Спорт', label: 'Спорт' },
        { id: 'Видео', label: 'Видео' },
    ];

    const filters = [
        { id: 'all', label: 'Всё' },
        { id: 'users', label: 'Люди' },
        { id: 'posts', label: 'Посты' },
        { id: 'tracks', label: 'Музыка' },
    ];

    useEffect(() => {
        const q = searchQuery.trim();
        if (!q) {
            setUserResults([]);
            setPostResults([]);
            setTrackResults([]);
            setSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const tasks = [];

            if (filter === 'all' || filter === 'users') {
                tasks.push(
                    fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { headers })
                        .then((r) => (r.ok ? r.json() : []))
                        .then((d) => setUserResults(Array.isArray(d) ? d : []))
                        .catch(() => setUserResults([]))
                );
            } else {
                setUserResults([]);
            }

            if (filter === 'all' || filter === 'posts') {
                tasks.push(
                    fetch(`/api/posts/search?q=${encodeURIComponent(q)}`, { headers })
                        .then((r) => (r.ok ? r.json() : []))
                        .then((d) => setPostResults(Array.isArray(d) ? d : []))
                        .catch(() => setPostResults([]))
                );
            } else {
                setPostResults([]);
            }

            if (filter === 'all' || filter === 'tracks') {
                tasks.push(
                    fetch(`/api/music/search?q=${encodeURIComponent(q)}`, { headers })
                        .then((r) => (r.ok ? r.json() : []))
                        .then((d) => setTrackResults(Array.isArray(d) ? d : []))
                        .catch(() => setTrackResults([]))
                );
            } else {
                setTrackResults([]);
            }

            await Promise.all(tasks);
            setSearching(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, filter]);

    const handleFollowToggle = async (targetUser) => {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const method = targetUser.is_following ? 'DELETE' : 'POST';

        setUserResults((prev) =>
            prev.map((u) =>
                u.id === targetUser.id ? { ...u, is_following: !u.is_following } : u
            )
        );

        try {
            const res = await fetch(
                `/api/users/${targetUser.username}/follow`,
                { method, headers }
            );
            if (!res.ok && res.status !== 204) throw new Error('Ошибка подписки');
        } catch (err) {
            console.error(err);
            setUserResults((prev) =>
                prev.map((u) =>
                    u.id === targetUser.id
                        ? { ...u, is_following: targetUser.is_following }
                        : u
                )
            );
        }
    };

    const commitSearch = (q) => {
        if (!q.trim()) return;
        pushSearchHistory(q);
        setHistory(getSearchHistory());
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') commitSearch(searchQuery);
    };

    const handleClearHistory = () => {
        clearSearchHistory();
        setHistory([]);
    };

    const handleOpenSidebar = () => {
        window.dispatchEvent(new Event('openSidebar'));
    };

    const renderContentSearch = () => {
        switch (activeCategory) {
            case 'Для тебя': return <ForYou suggestedUsers={suggestedUsers} />;
            case 'В тренде': return <Trending suggestedUsers={suggestedUsers} />;
            case 'Новости': return <News suggestedUsers={suggestedUsers} />;
            case 'Спорт': return <Sport suggestedUsers={suggestedUsers} />;
            case 'Видео': return <Video suggestedUsers={suggestedUsers} />;
            default: return null;
        }
    };

    const isSearching = searchQuery.trim().length > 0;
    const totalResults =
        userResults.length + postResults.length + trackResults.length;

    return (
        <div className="explore-page">
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

            <div className="explore-page-header">
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="explore-page-search-input"
                />

                {isSearching && (
                    <div className="explore-page-filters">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                className={`explore-page-filter ${
                                    filter === f.id ? 'is-active' : ''
                                }`}
                                onClick={() => setFilter(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {!isSearching && (
                    <div className="explore-page-categories">
                        {categories.map((category) => (
                            <p
                                key={category.id}
                                className={`explore-page-category-item ${
                                    activeCategory === category.id
                                        ? 'explore-page-category-active'
                                        : ''
                                }`}
                                onClick={() => setActiveCategory(category.id)}
                            >
                                {category.label}
                            </p>
                        ))}
                    </div>
                )}
            </div>

            {isSearching && (
                <div className="explore-page-results">
                    {searching && (
                        <div className="explore-page-state">Поиск...</div>
                    )}

                    {!searching && totalResults === 0 && (
                        <div className="explore-page-state">Ничего не найдено</div>
                    )}

                    {!searching && userResults.length > 0 && (
                        <div className="explore-page-section">
                            {filter === 'all' && (
                                <div className="explore-page-section-title">Люди</div>
                            )}
                            {userResults.map((u) => (
                                <div key={u.id} className="explore-page-user-item">
                                    <div
                                        className="explore-page-user-avatar-wrap"
                                        onClick={() => {
                                            commitSearch(searchQuery);
                                            navigate(`/user/${u.username}`);
                                        }}
                                    >
                                        {u.avatar ? (
                                            <img
                                                src={u.avatar}
                                                alt={u.username}
                                                className="explore-page-user-avatar"
                                            />
                                        ) : (
                                            <span className="explore-page-user-avatar explore-page-user-avatar-fallback">
                                                {(u.full_name || u.username || '?')[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        className="explore-page-user-info"
                                        onClick={() => {
                                            commitSearch(searchQuery);
                                            navigate(`/user/${u.username}`);
                                        }}
                                    >
                                        <div className="explore-page-user-name">
                                            {u.full_name || u.username}
                                        </div>
                                        <div className="explore-page-user-handle">
                                            @{u.username}
                                        </div>
                                        {u.bio && (
                                            <div className="explore-page-user-bio">{u.bio}</div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className={`explore-page-user-follow ${
                                            u.is_following ? 'is-following' : ''
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFollowToggle(u);
                                        }}
                                    >
                                        {u.is_following ? 'Отписаться' : 'Подписаться'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {!searching && postResults.length > 0 && (
                        <div className="explore-page-section">
                            {filter === 'all' && (
                                <div className="explore-page-section-title">Посты</div>
                            )}
                            {postResults.map((p) => (
                                <PostCard key={p.id} post={p} />
                            ))}
                        </div>
                    )}

                    {!searching && trackResults.length > 0 && (
                        <div className="explore-page-section">
                            {filter === 'all' && (
                                <div className="explore-page-section-title">Музыка</div>
                            )}
                            {trackResults.map((t) => (
                                <div key={t.id} className="explore-page-track">
                                    {t.cover ? (
                                        <img
                                            src={t.cover}
                                            alt={t.title}
                                            className="explore-page-track-cover"
                                        />
                                    ) : (
                                        <span className="explore-page-track-cover explore-page-track-cover-fallback">
                                            ♪
                                        </span>
                                    )}
                                    <div className="explore-page-track-info">
                                        <div className="explore-page-track-title">
                                            {t.title}
                                        </div>
                                        <div className="explore-page-track-artist">
                                            {t.artist}
                                            {t.album ? ` · ${t.album}` : ''}
                                        </div>
                                    </div>
                                    {t.duration && (
                                        <div className="explore-page-track-duration">
                                            {t.duration}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!isSearching && history.length > 0 && (
                <div className="explore-page-history">
                    <div className="explore-page-history-header">
                        <span>Недавние запросы</span>
                        <button
                            type="button"
                            className="explore-page-history-clear"
                            onClick={handleClearHistory}
                        >
                            Очистить
                        </button>
                    </div>
                    {history.map((h) => (
                        <div
                            key={h}
                            className="explore-page-history-item"
                            onClick={() => setSearchQuery(h)}
                        >
                            <span className="explore-page-history-icon">⌕</span>
                            <span className="explore-page-history-text">{h}</span>
                        </div>
                    ))}
                </div>
            )}

            {!isSearching && (
                <div className="explore-page-content">
                    <div className="explore-page-main">
                        {renderContentSearch()}
                    </div>
                </div>
            )}
        </div>
    );
}