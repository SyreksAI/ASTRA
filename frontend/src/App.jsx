// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Routes,
    Route,
    useLocation,
    useNavigate,
    Navigate,
} from 'react-router-dom';
import "./static/master.scss";

import { Menu } from './components/layout/Menu';
import { MusicPlayer } from './components/music/MusicPlayer';
import { HomePage } from './components/pages/HomePage';
import { ExplorePage } from './components/pages/ExplorePage';
import { ProfilePage } from './components/pages/ProfilePage';
import { ChatPage } from './components/pages/ChatPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { UnderDevelopmentPage } from './components/pages/UnderDevelopmentPage';
import { ModalPost } from './components/modal/Modal';
import { MusicPage } from './components/pages/MusicPage';
import { ModalMore } from './components/modal/ModalMore';
import { SettingsPage } from './components/pages/SettingsPage';
import { UserProfilePage } from './components/pages/UserProfilePage';

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';

const SidebarDrawer = ({ isOpen, onOpen, onClose, children }) => {
    const startXRef = useRef(null);
    const startYRef = useRef(null);
    const isDraggingRef = useRef(false);
    const [dragX, setDragX] = useState(0);

    // Порог срабатывания свайпа (px)
    const OPEN_THRESHOLD = 40;
    const CLOSE_THRESHOLD = 50;
    // Минимальное смещение, чтобы отличить свайп от тапа
    const MIN_DRAG = 8;
    // «Лёгкий» свайп: если сдвинули вправо и отпустили,
    // даже при меньшем пороге — открываем
    const LIGHT_SWIPE = 20;

    useEffect(() => {
        const handleTouchStart = (e) => {
            const t = e.touches[0];
            startXRef.current = t.clientX;
            startYRef.current = t.clientY;
            isDraggingRef.current = false;
            setDragX(0);
        };

        const handleTouchMove = (e) => {
            if (startXRef.current === null) return;

            const t = e.touches[0];
            const dx = t.clientX - startXRef.current;
            const dy = t.clientY - startYRef.current;

            // Ещё не сдвинулись достаточно — не начинаем
            if (!isDraggingRef.current && Math.abs(dx) < MIN_DRAG) return;

            // Вертикальный скролл — отменяем
            if (Math.abs(dy) > Math.abs(dx) * 1.2) {
                isDraggingRef.current = false;
                setDragX(0);
                return;
            }

            // Начало горизонтального свайпа
            if (!isDraggingRef.current && Math.abs(dx) >= MIN_DRAG) {
                isDraggingRef.current = true;
            }

            if (!isDraggingRef.current) return;

            if (isOpen) {
                // Закрытие — только сдвиг влево
                if (dx < 0) {
                    setDragX(Math.max(-320, dx));
                } else {
                    setDragX(0);
                }
            } else {
                // Открытие — только сдвиг вправо
                if (dx > 0) {
                    setDragX(Math.min(320, dx));
                } else {
                    setDragX(0);
                }
            }
        };

        const handleTouchEnd = () => {
            if (!isDraggingRef.current) {
                startXRef.current = null;
                startYRef.current = null;
                return;
            }

            const moved = dragX;

            if (isOpen) {
                // Закрываем, если сдвинули влево больше порога
                if (moved < -CLOSE_THRESHOLD) {
                    onClose();
                } else {
                    // Иначе — возвращаем меню на место
                    setDragX(0);
                }
            } else {
                // Открываем, если сдвинули вправо больше порога ИЛИ лёгкий свайп
                if (moved > OPEN_THRESHOLD || moved > LIGHT_SWIPE) {
                    onOpen();
                }
                setDragX(0);
            }

            isDraggingRef.current = false;
            startXRef.current = null;
            startYRef.current = null;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isOpen, dragX, onOpen, onClose]);

    return (
        <>
            <div
                className={'sidebar-drawer-overlay' + (isOpen ? ' sidebar-drawer-overlay-open' : '')}
                onClick={onClose}
            />
            <aside
                className={'sidebar-drawer' + (isOpen ? ' sidebar-drawer-open' : '')}
                style={{
                    transform: isOpen
                        ? `translateX(${dragX}px)`
                        : `translateX(calc(-100% + ${dragX}px))`,
                }}
            >
                {children}
            </aside>
        </>
    );
};

const BOTTOM_NAV_ITEMS = [
    { id: 'home',    label: 'Главная', icon: '/menu/home.png',    path: '/' },
    { id: 'explore', label: 'Поиск',   icon: '/menu/search.png',  path: '/explore' },
    { id: 'chat',    label: 'Чаты',    icon: '/menu/chat.png',    path: '/chat' },
    { id: 'music',   label: 'Музыка',  icon: '/menu/music.png',   path: '/music' },
    { id: 'profile', label: 'Профиль', icon: '/menu/profile.png', path: '/profile' },
];

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const activeId =
        BOTTOM_NAV_ITEMS.find((item) =>
            item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
        )?.id || 'home';

    return (
        <nav className="bottom-nav" role="navigation" aria-label="Основная навигация">
            {BOTTOM_NAV_ITEMS.map((item) => {
                const isActive = activeId === item.id;
                return (
                    <button
                        key={item.id}
                        type="button"
                        className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
                        onClick={() => navigate(item.path)}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="bottom-nav-icon">
                            <img src={item.icon} alt="" />
                        </span>
                        <span className="bottom-nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <div className="loading-screen">Загрузка...</div>;
    }
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AuthRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return <div className="loading-screen">Загрузка...</div>;
    }
    if (user) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        window.dispatchEvent(new Event('themeChanged'));
        return <Navigate to="/" replace />;
    }
    return children;
};

const AuthLayout = () => {
    return (
        <div className="auth-layer">
            <Routes>
                <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
                <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
            </Routes>
        </div>
    );
};

const AppContent = () => {
    const { user, updateTheme } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [activeItem, setActiveItem] = useState('Главная');
    const [activeTab, setActiveTab] = useState('Для тебя');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            setIsDarkTheme(true);
        } else {
            document.body.classList.remove('dark-theme');
            setIsDarkTheme(false);
        }
    }, []);

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkTheme(document.body.classList.contains('dark-theme'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const handleThemeChange = () => {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                setIsDarkTheme(true);
            } else {
                document.body.classList.remove('dark-theme');
                setIsDarkTheme(false);
            }
        };
        window.addEventListener('themeChanged', handleThemeChange);
        return () => window.removeEventListener('themeChanged', handleThemeChange);
    }, []);

    useEffect(() => {
        if (user) {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                setIsDarkTheme(true);
            } else {
                document.body.classList.remove('dark-theme');
                setIsDarkTheme(false);
            }
        }
    }, [user]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const toggleTheme = async () => {
        const newTheme = isDarkTheme ? 'light' : 'dark';
        setIsDarkTheme(!isDarkTheme);
        document.body.classList.toggle('dark-theme');
        try {
            await updateTheme(newTheme);
        } catch (error) {
            setIsDarkTheme(isDarkTheme);
            document.body.classList.toggle('dark-theme');
            console.error('Ошибка сохранения темы:', error);
        }
    };

    const menuItems = [
        { id: 'Главная',     icon: '/menu/home.png',          label: 'Главная',     path: '/' },
        { id: 'Исследовать', icon: '/menu/search.png',        label: 'Исследовать', path: '/explore' },
        { id: 'Уведомления', icon: '/menu/notifications.png', label: 'Уведомления', path: '/notifications' },
        { id: 'Чат',         icon: '/menu/chat.png',          label: 'Чат',         path: '/chat' },
        { id: 'Музыка',      icon: '/menu/music.png',         label: 'Музыка',      path: '/music' },
        { id: 'Профиль',     icon: '/menu/profile.png',       label: 'Профиль',     path: '/profile' },
        { id: 'Более',       icon: '/menu/more.png',          label: 'Более',       path: '#' },
    ];

    const suggestedUsers = [
        { id: 1, name: 'Павел Дуров',    role: 'CEO Telegram', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10' },
        { id: 2, name: 'Дмитрий Нагиев', role: 'Актёр',        img: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13' },
        { id: 3, name: 'Егор Крид',      role: 'Певец',        img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSox8V0ukDUsoxpzJtiA_nZj9wTmVal5asFAoN2u8PZTw&s=10' },
        { id: 4, name: 'Сергей Жуков',   role: 'Певец',        img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10' },
    ];

    const tracks = [
        { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiHcy_0l0iJEr9v7kqah11L4Y7aNmaxkLzV9Lxk-i27g&s=10' },
        { id: 2, title: 'Starboy',         artist: 'The Weeknd', album: 'Starboy',     duration: '4:16', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJUkqkUuLBuqBtKfsUwrdPKe3SW-5Worv4h1lF4cUa_g&s=10' },
        { id: 3, title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', duration: '3:35', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPvZDT7T5F71HOZrj5hlJUPJf_Qsg-q4NGN9ioK5vxrg&s=10' },
    ];

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (!user) {
            setPosts([]);
            return undefined;
        }

        const url = activeTab === 'Следующий'
            ? '/api/posts/?feed=following'
            : '/api/posts/';

        let cancelled = false;

        fetch(url, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Не удалось загрузить публикации');
                return response.json();
            })
            .then((data) => {
                if (!cancelled) setPosts(data);
            })
            .catch((error) => {
                console.error('Ошибка загрузки публикаций:', error);
                if (!cancelled) setPosts([]);
            });

        return () => { cancelled = true; };
    }, [user?.id, activeTab]);   // ← добавили activeTab

    const handleAddPost = async (newPostData) => {
        const formData = new FormData();
        formData.append('content', newPostData.text || '');
        if (newPostData.imageFile) formData.append('image', newPostData.imageFile);
        const response = await fetch('/api/posts/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData,
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            const detail = Array.isArray(result?.detail)
                ? result.detail.map((item) => item.msg).join('. ')
                : result?.detail;
            throw new Error(detail || 'Не удалось опубликовать запись');
        }
        setPosts((prevPosts) => [result, ...prevPosts]);
        return result;
    };

    const handleCommentCountChange = (postId) => {
        setPosts((currentPosts) =>
            currentPosts.map((post) =>
                post.id === postId
                    ? { ...post, comments_count: (post.comments_count || 0) + 1 }
                    : post
            )
        );
    };

    const handleMenuItemClick = (item) => {
        setActiveItem(item.id);
        if (item.path && item.path !== '#') {
            navigate(item.path);
        }
        setIsSidebarOpen(false);
    };

    const handlePlayToggle = () => setIsPlaying(!isPlaying);
    const handleNextTrack = () => setCurrentTrack((prev) => (prev + 1) % tracks.length);
    const handlePrevTrack = () => setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);

    const isSettingsPage = location.pathname === '/settings';
    const isChatPage = location.pathname === '/chat' || location.pathname.startsWith('/chat/');
    const isMusicPage = location.pathname === '/music';
    const shouldHideRightSidebar = isSettingsPage || isChatPage || isMusicPage;

    const renderSidebarInner = (opts = {}) => {
        const { collapsed = false, logoOverride = null } = opts;
        return (
            <div className={`app-left-sidebar ${collapsed ? 'app-left-sidebar-collapsed' : ''}`}>
                <div className="app-left-sidebar-block">
                    <div className="app-logo-wrapper">
                        <img
                            src={logoOverride || (isDarkTheme ? '/logoDark.png' : '/logo.jpg')}
                            alt="Логотип"
                            className={`app-logo ${isDarkTheme ? 'app-logo-dark' : ''}`}
                        />
                    </div>
                    <Menu
                        items={menuItems}
                        activeItem={activeItem}
                        onItemClick={handleMenuItemClick}
                        onOpenModal={() => setIsModalOpen(true)}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                    <div className="app-user-profile">
                        <div className="app-user-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.username} />
                            ) : (
                                user?.username?.[0]?.toUpperCase() || 'A'
                            )}
                        </div>
                        <div className="app-user-info">
                            <div className="app-user-name">
                                {user?.full_name || user?.username || 'Алексей'}
                            </div>
                            <div className="app-user-handle">
                                @{user?.username || 'alexey'}
                            </div>
                        </div>
                        <div className="app-user-more">•••</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="app">
            <div className={`app-main-wrapper ${isChatPage ? 'app-main-wrapper-chat' : ''} ${isMusicPage ? 'app-main-wrapper-music' : ''}`}>
                <div className="app-left-sidebar-desktop">
                    {renderSidebarInner({
                        collapsed: isChatPage,
                        logoOverride: isChatPage ? '/menu/chat-logo.png' : null,
                    })}
                </div>

                <div className={`app-center-content ${isChatPage ? 'app-center-content-chat' : ''} ${isMusicPage ? 'app-center-content-music' : ''}`}>
                    <Routes>
                        <Route path="/" element={
                            <ProtectedRoute>
                                <HomePage
                                    posts={posts}
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    onCommentCountChange={handleCommentCountChange}
                                    onOpenSidebar={() => setIsSidebarOpen(true)}
                                    user={user}
                                    isDarkTheme={isDarkTheme}
                                />
                            </ProtectedRoute>
                        } />
                        <Route path="/explore" element={
                            <ProtectedRoute>
                                <ExplorePage suggestedUsers={suggestedUsers} />
                            </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <ProfilePage posts={posts} onCommentCountChange={handleCommentCountChange} />
                            </ProtectedRoute>
                        } />
                        <Route path="/notifications" element={
                            <ProtectedRoute>
                                <NotificationsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/chat/:conversationId" element={<ChatPage />} />
                        <Route path="/music" element={
                            <ProtectedRoute>
                                <MusicPage
                                    tracks={tracks}
                                    currentTrack={currentTrack}
                                    isPlaying={isPlaying}
                                    onPlayToggle={handlePlayToggle}
                                    onNext={handleNextTrack}
                                    onPrev={handlePrevTrack}
                                    onTrackSelect={(index) => {
                                        setCurrentTrack(index);
                                        setIsPlaying(true);
                                    }}
                                />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute>
                                <SettingsPage />
                            </ProtectedRoute>
                        } />
                        <Route path="/user/:username" element={
                            <ProtectedRoute>
                                <UserProfilePage />
                            </ProtectedRoute>
                        } />
                        <Route path="/more" element={<Navigate to="/" replace />} />
                        <Route path="*" element={<UnderDevelopmentPage pageName="Страница не найдена" />} />
                    </Routes>
                </div>

                <div className={`app-right-sidebar ${shouldHideRightSidebar ? 'app-right-sidebar-hidden' : ''}`}>
                    <div className="app-search-wrapper">
                        <input type="search" className="app-search-input" placeholder="Поиск..." />
                    </div>
                    <div className="app-news-container">
                        <div className="app-news-header">
                            <h3 className="app-news-title">Последние новости</h3>
                            <div className="app-news-divider">___________________</div>
                        </div>
                        <div className="app-news-list">
                            {[
                                { title: 'Парень из Москвы собрал $1000000 инвестиций', date: '2 часа назад • IT • 356 постов' },
                                { title: 'Девушка изобрела руку повар и приготовила ужин', date: '5 часов назад • DevOps • 106 постов' },
                                { title: 'Парни из Краснодара разработали машину для сплава железа', date: '8 часов назад • DevOps • 582 постов' },
                            ].map((news, i) => (
                                <div key={i} className="app-news-item">
                                    <h4 className="app-news-item-title">{news.title}</h4>
                                    <div className="app-news-item-meta">
                                        <p className="app-news-item-date">{news.date}</p>
                                    </div>
                                </div>
                            ))}
                            <button className="app-news-more-btn">Ещё новости</button>
                        </div>
                    </div>

                    {!isMusicPage && (
                        <MusicPlayer
                            tracks={tracks}
                            currentTrack={currentTrack}
                            isPlaying={isPlaying}
                            onPlayToggle={handlePlayToggle}
                            onNext={handleNextTrack}
                            onPrev={handlePrevTrack}
                        />
                    )}

                    <div className="app-suggestions-block">
                        <div className="app-suggestions-header">
                            <h3 className="app-suggestions-title">За кем следить</h3>
                            <div className="app-suggestions-divider">___________________</div>
                        </div>
                        <div className="app-suggestions-list">
                            {suggestedUsers.map((person) => (
                                <div key={person.id} className="app-suggestion-item">
                                    <img className="app-suggestion-avatar" src={person.img} alt={person.name} />
                                    <div className="app-suggestion-info">
                                        <h3 className="app-suggestion-name">{person.name}</h3>
                                        <p className="app-suggestion-role">{person.role}</p>
                                    </div>
                                    <div className="app-suggestion-btn-wrapper">
                                        <button className="app-suggestion-follow-btn">Следовать</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="app-suggestions-more-btn">Показать ещё</button>
                    </div>

                    <div className="app-terms-block">
                        <p className="app-terms-text">
                            Условия · Конфиденциальность · Доступность · Информация о рекламе · Более <br />
                            © 2026 Astra · SyreksAI.
                        </p>
                    </div>
                </div>
            </div>

            <SidebarDrawer
                isOpen={isSidebarOpen}
                onOpen={() => setIsSidebarOpen(true)}
                onClose={() => setIsSidebarOpen(false)}
            >
                {renderSidebarInner({ collapsed: false })}
            </SidebarDrawer>

            <BottomNav />

            {isModalOpen && (
                <ModalPost
                    onClose={() => setIsModalOpen(false)}
                    onAddPost={handleAddPost}
                />
            )}

            {isSettingsOpen && (
                <ModalMore
                    onClose={() => setIsSettingsOpen(false)}
                    toggleTheme={toggleTheme}
                    isDarkTheme={isDarkTheme}
                />
            )}
        </div>
    );
};

const AppRouter = () => {
    const location = useLocation();
    const isAuthRoute =
        location.pathname === '/login' || location.pathname === '/register';
    if (isAuthRoute) {
        return <AuthLayout />;
    }
    return <AppContent />;
};

function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

export default App;