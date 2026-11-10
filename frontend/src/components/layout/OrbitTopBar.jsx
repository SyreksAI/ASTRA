import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = [
    { label: 'Люди', path: '/explore?tab=search' },
    { label: 'Идеи', path: '/explore' },
    { label: 'Созвездия', path: '/constellations' },
    { label: 'Ты', path: '/profile' },
];

/** variant: full — search + links; context — только навигация (колонка справа на главной) */
export function OrbitTopBar({ user, isDarkTheme, onToggleTheme, variant = 'full' }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [query, setQuery] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const contextOnly = variant === 'context';
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return undefined;

        const onPointerDown = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [menuOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/explore?tab=search&q=${encodeURIComponent(q)}` : '/explore?tab=search');
    };

    const go = (path) => {
        setMenuOpen(false);
        navigate(path);
    };

    const handleLogout = () => {
        if (!window.confirm('Выйти из аккаунта?')) return;
        setMenuOpen(false);
        logout();
        navigate('/login');
    };

    const displayName = user?.full_name || user?.username || 'Профиль';
    const handle = user?.username ? `@${user.username}` : '';

    return (
        <header className={`orbit-topbar${contextOnly ? ' orbit-topbar--context' : ''}`}>
            {!contextOnly && (
                <form className="orbit-topbar__search" onSubmit={handleSubmit} role="search">
                    <svg className="orbit-topbar__search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M16.2 16.2 20.5 20.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Поиск людей, созвездий, идей…"
                        aria-label="Поиск"
                    />
                </form>
            )}

            <div className={`orbit-topbar__right${contextOnly ? ' orbit-topbar__right--solo' : ''}`}>
                <nav className="orbit-topbar__links" aria-label="Быстрые разделы">
                    {LINKS.map((link, i) => (
                        <React.Fragment key={link.label}>
                            {i > 0 && <span className="orbit-topbar__dot" aria-hidden>·</span>}
                            <button type="button" onClick={() => navigate(link.path)}>
                                {link.label}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>

                <span className="orbit-topbar__sep" aria-hidden />

                <div className="orbit-topbar__actions">
                    <button
                        type="button"
                        className="orbit-topbar__icon"
                        aria-label={isDarkTheme ? 'Светлая тема' : 'Тёмная тема'}
                        onClick={onToggleTheme}
                    >
                        {isDarkTheme ? (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2.8v2.2M12 19v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.8 12h2.2M19 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                                <path
                                    d="M19.5 13.2A7.5 7.5 0 0 1 10.8 4.5 7.6 7.6 0 1 0 19.5 13.2Z"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </button>

                    <button
                        type="button"
                        className="orbit-topbar__icon orbit-topbar__notify"
                        aria-label="Уведомления"
                        onClick={() => navigate('/notifications')}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                            <path
                                d="M12 4.5a5 5 0 0 1 5 5v2.2c0 .8.3 1.6.8 2.2l.9 1.1H5.3l.9-1.1c.5-.6.8-1.4.8-2.2V9.5a5 5 0 0 1 5-5Z"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinejoin="round"
                            />
                            <path d="M10 18.8a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        </svg>
                        <span className="orbit-topbar__badge" aria-hidden />
                    </button>

                    <div className="orbit-topbar__profile-wrap" ref={menuRef}>
                        <button
                            type="button"
                            className={`orbit-topbar__profile${menuOpen ? ' is-open' : ''}`}
                            aria-label="Меню профиля"
                            aria-haspopup="menu"
                            aria-expanded={menuOpen}
                            onClick={() => setMenuOpen((v) => !v)}
                        >
                            <span className="orbit-topbar__avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" />
                                ) : (
                                    <span>{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                                )}
                            </span>
                            <svg className="orbit-topbar__caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                                <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="orbit-topbar__menu" role="menu">
                                <div className="orbit-topbar__menu-user">
                                    <span className="orbit-topbar__menu-name">{displayName}</span>
                                    {handle && <span className="orbit-topbar__menu-handle">{handle}</span>}
                                </div>

                                <button
                                    type="button"
                                    className="orbit-topbar__menu-item"
                                    role="menuitem"
                                    onClick={() => go('/profile')}
                                >
                                    Профиль
                                </button>
                                <button
                                    type="button"
                                    className="orbit-topbar__menu-item"
                                    role="menuitem"
                                    onClick={() => go('/settings')}
                                >
                                    Настройки
                                </button>
                                <button
                                    type="button"
                                    className="orbit-topbar__menu-item"
                                    role="menuitem"
                                    onClick={() => {
                                        onToggleTheme?.();
                                        setMenuOpen(false);
                                    }}
                                >
                                    {isDarkTheme ? 'Светлая тема' : 'Тёмная тема'}
                                </button>
                                <button
                                    type="button"
                                    className="orbit-topbar__menu-item"
                                    role="menuitem"
                                    onClick={() => go('/notifications')}
                                >
                                    Уведомления
                                </button>

                                <div className="orbit-topbar__menu-sep" />

                                <button
                                    type="button"
                                    className="orbit-topbar__menu-item orbit-topbar__menu-item--danger"
                                    role="menuitem"
                                    onClick={handleLogout}
                                >
                                    Выйти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
