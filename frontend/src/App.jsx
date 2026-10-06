// src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
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

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';

// ===== КОМПОНЕНТ ДЛЯ ЗАЩИТЫ МАРШРУТОВ =====
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

// ===== КОМПОНЕНТ ДЛЯ СТРАНИЦ АВТОРИЗАЦИИ =====
const AuthRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="loading-screen">Загрузка...</div>;
    }
    
    if (user) {
        // 👇 ВОССТАНАВЛИВАЕМ ТЕМУ ИЗ localStorage
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // ОБНОВЛЯЕМ СОСТОЯНИЕ В AppContent
        window.dispatchEvent(new Event('themeChanged'));
        
        return <Navigate to="/" replace />;
    }
    return children;
};


// ===== ОСНОВНОЙ КОМПОНЕНТ =====
const AppContent = () => {
    const { user, updateTheme } = useAuth();
    const location = useLocation();
    
    // ===== СОСТОЯНИЯ =====
    const [activeItem, setActiveItem] = useState('Главная');
    const [activeTab, setActiveTab] = useState('Для тебя');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    // ===== ТЕМА =====
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme === 'dark';
    });

    

    // ===== ЭФФЕКТ 1: Загрузка темы при старте =====
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

    // ===== ЭФФЕКТ 2: Отслеживание изменения класса на body =====
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const isDark = document.body.classList.contains('dark-theme');
            setIsDarkTheme(isDark);
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // ===== ЭФФЕКТ 3: Обработчик события восстановления темы =====
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

    // ===== ЭФФЕКТ 4: Синхронизация темы при изменении user =====
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
            console.log('🔄 Тема синхронизирована с user:', savedTheme);
        }
    }, [user]);

    // ===== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ =====
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

    // ===== ДАННЫЕ =====
    const menuItems = [
        { id: 'Главная', icon: '/menu/home.png', label: 'Главная', path: '/' },
        { id: 'Исследовать', icon: '/menu/search.png', label: 'Исследовать', path: '/explore' },
        { id: 'Уведомления', icon: '/menu/notifications.png', label: 'Уведомления', path: '/notifications' },
        { id: 'Чат', icon: '/menu/chat.png', label: 'Чат', path: '/chat' },
        { id: 'Музыка', icon: '/menu/music.png', label: 'Музыка', path: '/music' },
        { id: 'Профиль', icon: '/menu/profile.png', label: 'Профиль', path: '/profile' },
        { id: 'Более', icon: '/menu/more.png', label: 'Более', path: '#' },
    ];

    const suggestedUsers = [
        { id: 1, name: 'Павел Дуров', role: 'CEO Telegram', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10' },
        { id: 2, name: 'Дмитрий Нагиев', role: 'Актёр', img: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13' },
        { id: 3, name: 'Егор Крид', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSox8V0ukDUsoxpzJtiA_nZj9wTmVal5asFAoN2u8PZTw&s=10' },
        { id: 4, name: 'Сергей Жуков', role: 'Певец', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10' }
    ];

    const tracks = [
        { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiHcy_0l0iJEr9v7kqah11L4Y7aNmaxkLzV9Lxk-i27g&s=10' },
        { id: 2, title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', duration: '4:16', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJUkqkUuLBuqBtKfsUwrdPKe3SW-5Worv4h1lF4cUa_g&s=10' },
        { id: 3, title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', duration: '3:35', cover: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPvZDT7T5F71HOZrj5hlJUPJf_Qsg-q4NGN9ioK5vxrg&s=10' }
    ];

    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (!user) {
            setPosts([]);
            return undefined;
        }

        let cancelled = false;
        fetch('/api/posts/', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(async (response) => {
                if (!response.ok) throw new Error('Не удалось загрузить публикации');
                return response.json();
            })
            .then((data) => {
                if (!cancelled) setPosts(data);
            })
            .catch((error) => console.error('Ошибка загрузки публикаций:', error));

        return () => { cancelled = true; };
    }, [user?.id]);

    // ===== ОБРАБОТЧИКИ =====
    const handleAddPost = async (newPostData) => {
        const formData = new FormData();
        formData.append('content', newPostData.text || '');
        if (newPostData.imageFile) formData.append('image', newPostData.imageFile);
        const response = await fetch('/api/posts/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: formData
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) {
            const detail = Array.isArray(result?.detail)
                ? result.detail.map((item) => item.msg).join('. ')
                : result?.detail;
            throw new Error(detail || 'Не удалось опубликовать запись');
        }
        const newPost = result;
        setPosts((prevPosts) => [newPost, ...prevPosts]);
        return newPost;
    };

    const handleCommentCountChange = (postId) => {
        setPosts((currentPosts) => currentPosts.map((post) => (
            post.id === postId
                ? { ...post, comments_count: (post.comments_count || 0) + 1 }
                : post
        )));
    };

    const handleMenuItemClick = (item) => setActiveItem(item.id);
    const handlePlayToggle = () => setIsPlaying(!isPlaying);
    const handleNextTrack = () => setCurrentTrack(prev => (prev + 1) % tracks.length);
    const handlePrevTrack = () => setCurrentTrack(prev => (prev - 1 + tracks.length) % tracks.length);

    const isSettingsPage = location.pathname === '/settings';
    const isChatPage = location.pathname === '/chat';
    const isMusicPage = location.pathname === '/music';
    const shouldHideRightSidebar = isSettingsPage || isChatPage || isMusicPage;

    // ===== RENDER =====
    return (
        <div className="app">
            <div className={`app-main-wrapper ${isChatPage ? 'app-main-wrapper-chat' : ''} ${isMusicPage ? 'app-main-wrapper-music' : ''}`}>
                {/* Левая панель */}
                <div className="app-left-sidebar">
                    <div className="app-left-sidebar-block">
                        <div className="app-logo-wrapper">
                            <img 
                                src={isDarkTheme ? '/logoDark.png' : '/logo.jpg'} 
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
                                <div className="app-user-name">{user?.full_name || user?.username || 'Алексей'}</div>
                                <div className="app-user-handle">@{user?.username || 'alexey'}</div>
                            </div>
                            <div className="app-user-more">•••</div>
                        </div>
                    </div>
                </div>

                {/* Центральный контент */}
                <div className={`app-center-content ${isChatPage ? 'app-center-content-chat' : ''} ${isMusicPage ? 'app-center-content-music' : ''}`}>
                    <Routes>
                        {/* Защищённые маршруты */}
                        <Route path="/" element={
                            <ProtectedRoute>
                                <HomePage posts={posts} activeTab={activeTab} setActiveTab={setActiveTab} onCommentCountChange={handleCommentCountChange} />
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
                        <Route path="/chat" element={
                            <ProtectedRoute>
                                <ChatPage />
                            </ProtectedRoute>
                        } />
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
                        <Route path="/more" element={<Navigate to="/" replace />} />
                        
                        {/* Маршруты авторизации (только для неавторизованных) */}
                        <Route path="/login" element={
                            <AuthRoute>
                                <LoginPage />
                            </AuthRoute>
                        } />
                        <Route path="/register" element={
                            <AuthRoute>
                                <RegisterPage />
                            </AuthRoute>
                        } />
                        
                        <Route path="*" element={<UnderDevelopmentPage pageName="Страница не найдена" />} />
                    </Routes>
                </div>

                {/* Правая панель */}
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
                                { title: 'Парни из Краснодара разработали машину для сплава железа', date: '8 часов назад • DevOps • 582 постов' }
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
                        <p className="app-terms-text">Условия · Конфиденциальность · Доступность · Информация о рекламе · Более <br/>© 2026 Astra · SyreksAI.</p>
                    </div>
                </div>
            </div>

            {/* Модальные окна */}
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

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
