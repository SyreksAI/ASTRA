// src/components/pages/ExplorePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const isDarkTheme = useIsDarkTheme();

    const constellationSlug = searchParams.get('constellation') || '';
    const tabParam = searchParams.get('tab') || '';

    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
    const [activeCategory, setActiveCategory] = useState('Для тебя');
    const [filter, setFilter] = useState('all');

    const [userResults, setUserResults] = useState([]);
    const [postResults, setPostResults] = useState([]);
    const [trackResults, setTrackResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [history, setHistory] = useState(() => getSearchHistory());

    const [constellation, setConstellation] = useState(null);
    const [constellationPosts, setConstellationPosts] = useState([]);
    const [constellationLoading, setConstellationLoading] = useState(false);
    const [joinBusy, setJoinBusy] = useState(false);
    const [allConstellations, setAllConstellations] = useState([]);

    const categories = [
        { id: 'Для тебя', label: 'Для тебя' },
        { id: 'В тренде', label: 'В тренде' },
        { id: 'Новости', label: 'Новости' },
        { id: 'Спорт', label: 'Спорт' },
        { id: 'Видео', label: 'Видео' },
    ];

    useEffect(() => {
        if (tabParam === 'constellations') {
            navigate('/constellations', { replace: true });
        }
    }, [tabParam, navigate]);

    useEffect(() => {
        if (tabParam === 'search' && !searchQuery) {
            // keep empty search focused via header input
        }
    }, [tabParam, searchQuery]);

    useEffect(() => {
        if (!constellationSlug && tabParam !== 'constellations') return undefined;

        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        let cancelled = false;

        if (tabParam === 'constellations' && !constellationSlug) {
            fetch('/api/constellations/', { headers })
                .then((r) => (r.ok ? r.json() : []))
                .then((data) => {
                    if (!cancelled) setAllConstellations(Array.isArray(data) ? data : []);
                })
                .catch(() => {
                    if (!cancelled) setAllConstellations([]);
                });
            return () => { cancelled = true; };
        }

        setConstellationLoading(true);
        Promise.all([
            fetch(`/api/constellations/${encodeURIComponent(constellationSlug)}`, { headers })
                .then((r) => (r.ok ? r.json() : null)),
            fetch(`/api/constellations/${encodeURIComponent(constellationSlug)}/posts`, { headers })
                .then((r) => (r.ok ? r.json() : [])),
        ])
            .then(([meta, posts]) => {
                if (cancelled) return;
                setConstellation(meta);
                setConstellationPosts(Array.isArray(posts) ? posts : []);
            })
            .catch(() => {
                if (cancelled) return;
                setConstellation(null);
                setConstellationPosts([]);
            })
            .finally(() => {
                if (!cancelled) setConstellationLoading(false);
            });

        return () => { cancelled = true; };
    }, [constellationSlug, tabParam]);

    const handleConstellationJoin = async () => {
        if (!constellation || joinBusy) return;
        setJoinBusy(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            const method = constellation.joined ? 'DELETE' : 'POST';
            const res = await fetch(
                `/api/constellations/${encodeURIComponent(constellation.id)}/join`,
                { method, headers }
            );
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error('join failed');
            setConstellation(data);
        } catch (err) {
            console.error(err);
        } finally {
            setJoinBusy(false);
        }
    };

    const clearConstellation = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('constellation');
        next.delete('tab');
        setSearchParams(next);
        setConstellation(null);
        setConstellationPosts([]);
    };

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
    const showConstellation = Boolean(constellationSlug);
    const showConstellationList = tabParam === 'constellations' && !constellationSlug;

    return (
        <div className="explore-page">
            <header className="home-mobile-bar">
                <button
                    type="button"
                    className="home-mobile-bar__avatar"
                    onClick={handleOpenSidebar}
                    aria-label="Открыть меню"
                >
                    {user?.avatar ? (
                        <img src={user.avatar} alt="" />
                    ) : (
                        <span>{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                    )}
                </button>
                <img
                    className="home-mobile-bar__logo"
                    src={isDarkTheme ? '/elara-logo-dark.png' : '/elara-logo.png'}
                    alt="Elara"
                />
                <button
                    type="button"
                    className="home-mobile-bar__notify"
                    onClick={() => navigate('/notifications')}
                    aria-label="Уведомления"
                >
                    <img src="/menu/notifications.png" alt="" />
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

                {!isSearching && !showConstellation && !showConstellationList && (
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

            {!isSearching && !showConstellation && !showConstellationList && history.length > 0 && (
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

            {!isSearching && showConstellation && (
                <div className="explore-constellation">
                    <button
                        type="button"
                        className="explore-constellation__back"
                        onClick={clearConstellation}
                    >
                        ← Назад
                    </button>

                    {constellationLoading && (
                        <div className="explore-page-state">Загрузка созвездия…</div>
                    )}

                    {!constellationLoading && !constellation && (
                        <div className="explore-page-state">Созвездие не найдено</div>
                    )}

                    {!constellationLoading && constellation && (
                        <>
                            <div className="explore-constellation__head">
                                <div className="explore-constellation__copy">
                                    <h2 className="explore-constellation__title">
                                        {constellation.label}
                                    </h2>
                                    {constellation.description && (
                                        <p className="explore-constellation__desc">
                                            {constellation.description}
                                        </p>
                                    )}
                                    <p className="explore-constellation__meta">
                                        {constellation.members_count || 0} участников ·{' '}
                                        {constellation.posts_count || 0} постов
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={`explore-constellation__join${
                                        constellation.joined ? ' is-joined' : ''
                                    }`}
                                    onClick={handleConstellationJoin}
                                    disabled={joinBusy}
                                >
                                    {joinBusy
                                        ? '…'
                                        : constellation.joined
                                          ? 'Выйти'
                                          : 'Войти'}
                                </button>
                            </div>

                            <div className="explore-constellation__feed">
                                {constellationPosts.length === 0 ? (
                                    <div className="explore-page-state">
                                        Пока тихо. Опубликуй первый пост в этом Созвездии.
                                    </div>
                                ) : (
                                    constellationPosts.map((p) => (
                                        <PostCard key={p.id} post={p} />
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {!isSearching && showConstellationList && (
                <div className="explore-constellation-list">
                    <h2 className="explore-constellation-list__title">Все Созвездия</h2>
                    <div className="explore-constellation-list__grid">
                        {allConstellations.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                className="explore-constellation-list__card"
                                onClick={() =>
                                    setSearchParams({ constellation: c.id })
                                }
                            >
                                <span className="explore-constellation-list__mark">
                                    {(c.label || c.id).slice(0, 1)}
                                </span>
                                <span className="explore-constellation-list__name">{c.label}</span>
                                <span className="explore-constellation-list__meta">
                                    {c.members_count || 0} · {c.posts_count || 0} постов
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!isSearching && !showConstellation && !showConstellationList && (
                <div className="explore-page-content">
                    <div className="explore-page-main">
                        {renderContentSearch()}
                    </div>
                </div>
            )}
        </div>
    );
}