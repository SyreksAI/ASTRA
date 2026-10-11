// src/components/pages/MobileFeedPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ============================================================
// ===== ИКОНКИ (замените на свои SVG/PNG) =====
// ============================================================
const IconHome = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V10.5Z" />
    </svg>
);

const IconSearch = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
    </svg>
);

const IconGrok = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 22 12 12 22 2 12 12 2Z" />
    </svg>
);

const IconBell = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 16H6l1.5-2.5V10a4.5 4.5 0 1 1 9 0v3.5L18 16Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
);

const IconChat = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 5h16v11H8l-4 3V5Z" />
    </svg>
);

const IconComment = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5A8 8 0 1 1 21 12Z" />
    </svg>
);

const IconRepost = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 3l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 21l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
);

const IconLike = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9Z" />
    </svg>
);

const IconViews = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </svg>
);

const IconMenuDots = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
    </svg>
);

const IconAddUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="10" cy="8" r="4" />
        <path d="M2 21a8 8 0 0 1 14-5" />
        <path d="M19 14v6M16 17h6" />
    </svg>
);

const IconChevron = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const IconPlus = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 5v14M5 12h14" />
    </svg>
);

// ============================================================
// ===== ВЕРХНЯЯ ШАПКА =====
// ============================================================
const MobileTopBar = () => (
    <header className="mobile-topbar">
        <button className="mobile-topbar-logo" aria-label="Профиль">
            {/* ВАШ ЛОГОТИП — кружок с буквой S */}
            <span className="mobile-topbar-logo-mark">S</span>
        </button>

        <div className="mobile-topbar-center">
            {/* ВАШ ЦЕНТРАЛЬНЫЙ ЛОГОТИП — X */}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-label="Логотип">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
            </svg>
        </div>

        <button className="mobile-topbar-action" aria-label="Добавить пользователя">
            <IconAddUser />
        </button>
    </header>
);

// ============================================================
// ===== ТАБЫ ПОД ШАПКОЙ =====
// ============================================================
const MobileTabs = ({ active, onChange }) => {
    const tabs = [
        { id: 'foryou',    label: 'Для вас',     chevron: true },
        { id: 'reading',   label: 'Вы читаете' },
        { id: 'mlb',       label: 'MLB',         icon: true },
        { id: 'add',       label: '',            add: true },
    ];

    return (
        <nav className="mobile-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={
                        'mobile-tab' +
                        (active === tab.id ? ' mobile-tab-active' : '') +
                        (tab.add ? ' mobile-tab-add' : '')
                    }
                    onClick={() => !tab.add && onChange(tab.id)}
                >
                    {tab.icon && <span className="mobile-tab-icon">⚾</span>}
                    {tab.label && <span>{tab.label}</span>}
                    {tab.chevron && <span className="mobile-tab-chevron"><IconChevron /></span>}
                    {tab.add && <IconPlus />}
                </button>
            ))}
        </nav>
    );
};

// ============================================================
// ===== ОДИН ПОСТ =====
// ============================================================
const Post = ({
    name = "Hatim's Shorts",
    verified = true,
    handle = "@Hatim",
    time = "3 ч",
    text,
    hashtags = [],
    image,
    comments = 227,
    reposts = 2000,
    likes = 9000,
    views = 409000,
}) => (
    <article className="mobile-post">
        <div className="mobile-post-avatar">
            <img src="/menu/profile.png" alt={name} />
        </div>

        <div className="mobile-post-body">
            <div className="mobile-post-head">
                <div className="mobile-post-user">
                    <span className="mobile-post-name">{name}</span>
                    {verified && <span className="mobile-post-verified">✓</span>}
                    <span className="mobile-post-handle">{handle}</span>
                    <span className="mobile-post-time">· {time}</span>
                </div>
                <button className="mobile-post-more" aria-label="Ещё">
                    <IconMenuDots />
                </button>
            </div>

            <p className="mobile-post-text">{text}</p>

            {hashtags.length > 0 && (
                <p className="mobile-post-hashtags">
                    {hashtags.map((tag, i) => (
                        <span key={i} className="mobile-post-hashtag">{tag} </span>
                    ))}
                </p>
            )}

            {image && (
                <div className="mobile-post-media">
                    <img src={image} alt="" />
                </div>
            )}

            <div className="mobile-post-actions">
                <button className="mobile-post-action" aria-label="Комментировать">
                    <IconComment />
                    <span>{formatCount(comments)}</span>
                </button>
                <button className="mobile-post-action" aria-label="Репост">
                    <IconRepost />
                    <span>{formatCount(reposts)}</span>
                </button>
                <button className="mobile-post-action mobile-post-action-like" aria-label="Лайк">
                    <IconLike />
                    <span>{formatCount(likes)}</span>
                </button>
                <button className="mobile-post-action" aria-label="Просмотры">
                    <IconViews />
                    <span>{formatCount(views)}</span>
                </button>
            </div>
        </div>
    </article>
);

const formatCount = (n) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'М';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace('.0', '') + 'К';
    return String(n);
};

// ============================================================
// ===== ПЛАВАЮЩАЯ КНОПКА «+» =====
// ============================================================
const FloatingPlusButton = ({ onClick }) => (
    <button className="mobile-fab" onClick={onClick} aria-label="Создать">
        <IconPlus />
    </button>
);

// ============================================================
// ===== НИЖНЕЕ МЕНЮ =====
// ============================================================
const MobileBottomNav = ({ active, onChange, unread = 1 }) => {
    const items = [
        { id: 'home',      icon: <IconHome />,  label: 'Главная' },
        { id: 'search',    icon: <IconSearch />, label: 'Поиск' },
        { id: 'grok',      icon: <IconGrok />,   label: 'Grok' },
        { id: 'notifs',    icon: <IconBell />,   label: 'Уведомления', badge: unread },
        { id: 'chat',      icon: <IconChat />,   label: 'Чат' },
    ];

    return (
        <nav className="mobile-bottom-nav">
            {items.map(item => (
                <button
                    key={item.id}
                    className={
                        'mobile-bottom-nav-item' +
                        (active === item.id ? ' mobile-bottom-nav-item-active' : '')
                    }
                    onClick={() => onChange(item.id)}
                    aria-label={item.label}
                >
                    <span className="mobile-bottom-nav-icon">{item.icon}</span>
                    {item.badge > 0 && (
                        <span className="mobile-bottom-nav-badge">{item.badge}</span>
                    )}
                </button>
            ))}
        </nav>
    );
};

// ============================================================
// ===== СТРАНИЦА =====
// ============================================================
export const MobileFeedPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('foryou');
    const [activeNav, setActiveNav] = useState('home');

    const posts = [
        {
            name: "Hatim's Shorts",
            verified: true,
            handle: '@Hati...',
            time: '3 ч',
            text: 'Donald Trump Just Keeps Trolling Zelensky 😂\n\nMade with AI, just for fun.',
            hashtags: ['#DonaldTrump', '#Zelensky', '#VladimirPutin', '#President', '#Funny'],
            image: '/menu/sample-post.jpg', // ← замените на свою картинку
            comments: 227,
            reposts: 2000,
            likes: 9000,
            views: 409000,
        },
        {
            name: 'Astra News',
            verified: true,
            handle: '@astra',
            time: '5 ч',
            text: 'Новая версия Astra Music уже доступна — заходите послушать!',
            hashtags: ['#Astra', '#Music'],
            comments: 84,
            reposts: 320,
            likes: 2400,
            views: 51000,
        },
    ];

    return (
        <div className="mobile-feed-page">
            <MobileTopBar />
            <MobileTabs active={activeTab} onChange={setActiveTab} />

            <div className="mobile-feed-list">
                {posts.map((p, i) => (
                    <Post key={i} {...p} />
                ))}
            </div>

            <FloatingPlusButton onClick={() => navigate('/create')} />
            <MobileBottomNav active={activeNav} onChange={setActiveNav} unread={1} />
        </div>
    );
};

export default MobileFeedPage;