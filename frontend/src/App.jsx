// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Routes,
    Route,
    useLocation,
    useNavigate,
    Navigate,
} from 'react-router-dom';
import "./static/master.scss";
import "./static/orbit-chat.scss";
import "./static/mateai.scss";
import "./static/music.scss";
import "./static/constellations.scss";
import "./static/notifications.scss";
import "./static/rexon-home.scss";

import { Menu } from './components/layout/Menu';
import { NearbyConstellations } from './components/layout/NearbyConstellations';
import { SuggestedPeople } from './components/layout/SuggestedPeople';
import { AstraMusicCard } from './components/layout/AstraMusicCard';
import { ProfileSidebar } from './components/layout/ProfileSidebar';
import { ConstellationSidebar } from './components/layout/ConstellationSidebar';
import { OrbitTopBar } from './components/layout/OrbitTopBar';
import { HomePage } from './components/pages/HomePage';
import { ExplorePage } from './components/pages/ExplorePage';
import { ConstellationPage } from './components/pages/ConstellationPage';
import { ConstellationsPage } from './components/pages/ConstellationsPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { CONSTELLATIONS } from './utils/constellations';
import { ChatPage } from './components/pages/ChatPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { UnderDevelopmentPage } from './components/pages/UnderDevelopmentPage';
import { ModalPost } from './components/modal/Modal';
import { MusicPage } from './components/pages/MusicPage';
import { ModalMore } from './components/modal/ModalMore';
import { SettingsPage } from './components/pages/SettingsPage';
import { UserProfilePage } from './components/pages/UserProfilePage';
import { MateAIPage } from './components/pages/MateAIPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider, useChat } from './context/ChatContext';
import { countUnreadConversations } from './utils/chatApi';
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

    const { conversations: chatConversations } = useChat();
    const chatUnreadBadge = useMemo(
        () => countUnreadConversations(chatConversations),
        [chatConversations],
    );

    const menuItems = [
        { id: 'Главная',     iconKey: 'home',          label: 'Главная',     path: '/' },
        { id: 'Созвездия',   iconKey: 'constellation', label: 'Созвездия',   path: '/constellations' },
        {
            id: 'Сообщения',
            iconKey: 'messages',
            label: 'Сообщения',
            path: '/chat',
            ...(chatUnreadBadge > 0 ? { badge: chatUnreadBadge } : {}),
        },
        { id: 'Музыка',      iconKey: 'music',         label: 'Музыка',      path: '/music' },
        { id: 'MateAI',      iconKey: 'mateai',        label: 'MateAI',      path: '/mateai' },
        { id: 'Уведомления', iconKey: 'notifications', label: 'Уведомления', path: '/notifications', badge: 12 },
        { id: 'Профиль',     iconKey: 'profile',       label: 'Профиль',     path: '/profile' },
    ];

    useEffect(() => {
        const path = location.pathname;
        if (path === '/') setActiveItem('Главная');
        else if (
            path.startsWith('/explore')
            || path === '/constellations'
            || path.startsWith('/constellation/')
        ) setActiveItem('Созвездия');
        else if (path.startsWith('/notifications')) setActiveItem('Уведомления');
        else if (path.startsWith('/chat')) setActiveItem('Сообщения');
        else if (path.startsWith('/music')) setActiveItem('Музыка');
        else if (path.startsWith('/mateai')) setActiveItem('MateAI');
        else if (path.startsWith('/profile')) setActiveItem('Профиль');
    }, [location.pathname]);

    const toggleTheme = async () => {
        const newTheme = isDarkTheme ? 'light' : 'dark';
        setIsDarkTheme(newTheme === 'dark');
        try {
            await updateTheme(newTheme);
        } catch (error) {
            console.error('Ошибка сохранения темы:', error);
        }
    };

    const suggestedUsers = [
        {
            id: 1,
            name: 'Егор Ковалёв',
            role: 'UI/UX дизайнер',
            constellation: 'В Созвездии дизайна',
            bio: '«Создаю понятные и красивые интерфейсы. Люблю минимализм и космос.»',
            img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
        },
        {
            id: 2,
            name: 'Алиса Миронова',
            role: 'Продуктовый дизайн',
            constellation: 'В Созвездии дизайна',
            bio: '«Собираю спокойные продукты и люблю чистую типографику.»',
            img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
        },
        {
            id: 3,
            name: 'Марк Волков',
            role: 'Разработчик',
            constellation: 'В Созвездии разработки',
            bio: '«Пишу код и ловлю орбитальные баги по ночам.»',
            img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
        },
    ];

    const tracks = [
        { id: 1, title: 'Космос внутри', artist: 'Три дня дождя', album: 'Orbit', duration: '3:27', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop' },
        { id: 2, title: 'Night Signals', artist: 'Elara Music', album: 'Orbit', duration: '3:48', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop' },
        { id: 3, title: 'Soft Horizon', artist: 'Elara Music', album: 'Orbit', duration: '3:12', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop' },
        { id: 4, title: 'Orbit Glow', artist: 'Elara Music', album: 'Focus', duration: '2:48', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&h=120&fit=crop' },
        { id: 5, title: 'Лунный шёпот', artist: 'Сигнал', album: 'Night', duration: '3:05', cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=120&h=120&fit=crop' },
        { id: 6, title: 'Пульс города', artist: 'Три дня дождя', album: 'Live', duration: '3:41', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop' },
        { id: 7, title: 'Тихий космос', artist: 'Elara AI', album: 'Calm', duration: '4:02', cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&h=120&fit=crop' },
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
        if (newPostData.mediaFiles?.length) {
            newPostData.mediaFiles.forEach((file) => formData.append('media', file));
        } else if (newPostData.imageFile) {
            formData.append('image', newPostData.imageFile);
        }
        if (newPostData.constellationId) {
            formData.append('constellation_id', newPostData.constellationId);
        }
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
    const isProfilePage = location.pathname === '/profile' || location.pathname.startsWith('/user/');
    const isConstellationsMapPage = location.pathname === '/constellations';
    const isConstellationPage = location.pathname.startsWith('/constellation/');
    const constellationId = isConstellationPage
        ? location.pathname.split('/')[2]
        : null;
    const activeConstellation = CONSTELLATIONS.find((c) => c.id === constellationId)
        || (constellationId ? { id: constellationId, label: 'Созвездие' } : null);
    const isMateAIPage = location.pathname.startsWith('/mateai');
    const isHomePage = location.pathname === '/';
    const isIconRail = isChatPage || isMateAIPage;
    const shouldHideRightSidebar = isSettingsPage || isChatPage || isMusicPage || isMateAIPage || isConstellationsMapPage;
    const shouldShowTopBar = !isSettingsPage && !isMusicPage && !isChatPage && !isConstellationsMapPage;

    const renderSidebarInner = (opts = {}) => {
        const { collapsed = false, logoOverride = null } = opts;

        return (
            <div className={`app-left-sidebar${collapsed ? ' app-left-sidebar-collapsed' : ''}`}>
                <div className="app-left-sidebar-block">
                    <div className="app-logo-wrapper">
                        <img
                            src={
                                logoOverride
                                || (isDarkTheme ? '/elara-logo-dark.png' : '/elara-logo.png')
                            }
                            alt="Elara"
                            className="app-logo"
                        />
                    </div>
                    <Menu
                        items={menuItems}
                        activeItem={activeItem}
                        onItemClick={handleMenuItemClick}
                        onOpenModal={() => setIsModalOpen(true)}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        user={user}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="app app--orbit">
            <div className={`app-main-wrapper ${isChatPage ? 'app-main-wrapper-chat' : ''} ${isMusicPage ? 'app-main-wrapper-music' : ''} ${isConstellationsMapPage ? 'app-main-wrapper-constellations' : ''}`}>
                <div
                    className={`app-left-sidebar-desktop${isIconRail ? ' app-left-sidebar-desktop--rail' : ''}${isHomePage ? ' app-left-sidebar-desktop--home' : ''}`}
                >
                    {renderSidebarInner({
                        collapsed: isIconRail,
                        logoOverride: isIconRail
                            ? (isDarkTheme ? '/elara-mark-dark.png' : '/elara-mark.png')
                            : null,
                    })}
                </div>

                <div className={`app-orbit-main${isIconRail ? ' app-orbit-main--rail' : ''}`}>
                    {shouldShowTopBar && (
                        <OrbitTopBar
                            user={user}
                            isDarkTheme={isDarkTheme}
                            onToggleTheme={toggleTheme}
                        />
                    )}

                    <div className={`app-orbit-body${isHomePage ? ' app-orbit-body--home' : ''}`}>
                        <div className={`app-center-content ${isChatPage ? 'app-center-content-chat' : ''} ${isMusicPage ? 'app-center-content-music' : ''} ${isConstellationsMapPage ? 'app-center-content-constellations' : ''}${isHomePage ? ' app-center-content--home' : ''}`}>
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
                                            onPostCreated={(newPost) => {
                                                setPosts((prev) => [newPost, ...prev]);
                                            }}
                                        />
                                    </ProtectedRoute>
                                } />
                                <Route path="/explore" element={
                                    <ProtectedRoute>
                                        <ExplorePage suggestedUsers={suggestedUsers} />
                                    </ProtectedRoute>
                                } />
                                <Route path="/constellations" element={
                                    <ProtectedRoute>
                                        <ConstellationsPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/explore/constellations" element={<Navigate to="/constellations" replace />} />
                                <Route path="/constellation/:id" element={
                                    <ProtectedRoute>
                                        <ConstellationPage
                                            posts={posts}
                                            onCommentCountChange={handleCommentCountChange}
                                            onPostCreated={(newPost) => {
                                                setPosts((prev) => [newPost, ...prev]);
                                            }}
                                        />
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
                                <Route path="/mateai" element={
                                    <ProtectedRoute>
                                        <MateAIPage />
                                    </ProtectedRoute>
                                } />
                                <Route path="/more" element={<Navigate to="/mateai" replace />} />
                                <Route path="*" element={<UnderDevelopmentPage pageName="Страница не найдена" />} />
                            </Routes>
                        </div>

                        {!shouldHideRightSidebar && (
                            <div className={`app-right-sidebar app-right-sidebar--orbit${isHomePage ? ' app-right-sidebar--home' : ''}`}>
                                {isProfilePage ? (
                                    <ProfileSidebar user={user} />
                                ) : isConstellationPage ? (
                                    <ConstellationSidebar constellation={activeConstellation} />
                                ) : (
                                    <>
                                        <NearbyConstellations />
                                        <AstraMusicCard
                                            tracks={tracks}
                                            currentTrack={currentTrack}
                                            isPlaying={isPlaying}
                                            onPlayToggle={handlePlayToggle}
                                            onNext={handleNextTrack}
                                            onPrev={handlePrevTrack}
                                        />
                                        <SuggestedPeople users={suggestedUsers} />
                                    </>
                                )}
                            </div>
                        )}
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
            <ChatProvider>
                <AppRouter />
            </ChatProvider>
        </AuthProvider>
    );
}

export default App;