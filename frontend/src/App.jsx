// src/App.jsx
import React, { useState } from 'react';
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

// 👇 КОМПОНЕНТ ДЛЯ ЗАЩИТЫ МАРШРУТОВ (ВНЕ APP)
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="loading-screen">Загрузка...</div>;
    }
    if (!user) {
        return <Navigate to="/login" />;
    }
    return children;
};

// 👇 КОМПОНЕНТ С ОСНОВНЫМ КОНТЕНТОМ (ИСПОЛЬЗУЕТ useAuth)
const AppContent = () => {
    const { user, updateTheme } = useAuth();
    const location = useLocation();
    
    // Проверяем, страница авторизации или нет
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    
    // Если страница авторизации - показываем только её
    if (isAuthPage) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Routes>
        );
    }

    // 👇 ОСТАЛЬНОЙ КОД (ВАША СОЦИАЛЬНАЯ СЕТЬ)
    const [activeItem, setActiveItem] = useState('Главная');
    const [activeTab, setActiveTab] = useState('Для тебя');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        return document.body.classList.contains('dark-theme');
    });

    const toggleTheme = async () => {
        const newTheme = isDarkTheme ? 'light' : 'dark';
        
        // Оптимистичное обновление UI
        setIsDarkTheme(!isDarkTheme);
        document.body.classList.toggle('dark-theme');
        
        // Сохраняем на бекенде
        try {
            await updateTheme(newTheme);  // 👈 Используем функцию из AuthContext
        } catch (error) {
            // Откат при ошибке
            setIsDarkTheme(isDarkTheme);
            document.body.classList.toggle('dark-theme');
            console.error('Ошибка сохранения темы:', error);
        }
    };


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

    const [posts, setPosts] = useState([
        {
            id: 1,
            name: 'Павел Дуров',
            handle: '@durov',
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBXjt3QBuQnsx3pKEV-UpT8XXychSKg9gij_WRs4OY1A&s=10',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSq8LU4scR56nOOivsXLOFFWlbx7UNEvvB8PF4qJqRVYA&s=10',
            content: 'Telegram достиг 900 миллионов активных пользователей! 🚀',
            likes: 1234,
            comments: 89,
            retweets: 234
        },
        {
            id: 2,
            name: 'Дмитрий Нагиев',
            handle: '@nagiev_official',
            avatar: 'https://avatars.mds.yandex.net/i?id=a0629e3b84c2ddbeeb6ee3a0d606f558563ec106-5171197-images-thumbs&n=13',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            content: 'Любите жизнь и будьте счастливы! 🎭✨',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8RR9PGSamrNwfPqAcEho4_T4K-O8F3h7gJdpRXJNIsQ&s=10',
            likes: 5678,
            comments: 345,
            retweets: 789
        },
        {
            id: 3,
            name: 'Сергей Жуков',
            handle: '@zhukov_official',
            avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRd-8LIrbnf-SCygSHIM6pWBiLbpeQk05V0mDx1GuoMyw&s=10',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            content: 'Новый клип выходит завтра! 🎵❤️',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQl48WhTRo7M2KPyCbWMTh5P-7hPCM0D6m5cR4NjqBG_A&s=10',
            likes: 7890,
            comments: 456,
            retweets: 890
        }
    ]);

    const handleAddPost = (newPostData) => {
        const newPost = {
            id: Date.now(),
            created_at: new Date().toISOString(),
            content: newPostData.text,
            image: newPostData.image,
            likes_count: 0,
            comments_count: 0,
            author: {
                full_name: user?.full_name || 'Алексей',
                username: user?.username || '@alexey',
                avatar: user?.avatar || '/default-avatar.png'
            }
        };
        setPosts((prevPosts) => [newPost, ...prevPosts]);
    };

    const handleMenuItemClick = (item) => {
        setActiveItem(item.id);
    };

    const handlePlayToggle = () => setIsPlaying(!isPlaying);
    const handleNextTrack = () => setCurrentTrack(prev => (prev + 1) % tracks.length);
    const handlePrevTrack = () => setCurrentTrack(prev => (prev - 1 + tracks.length) % tracks.length);

    const isSettingsPage = location.pathname === '/settings';
    const isChatPage = location.pathname === '/chat';
    const isMusicPage = location.pathname === '/music';
    const shouldHideRightSidebar = isSettingsPage || isChatPage;

    return (
        <div className="app">
            <div className={`app-main-wrapper ${isChatPage ? 'app-main-wrapper-chat' : ''}`}>
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

                <div className={`app-center-content ${isChatPage ? 'app-center-content-chat' : ''}`}>
                    <Routes>
                        <Route path="/" element={<HomePage posts={posts} activeTab={activeTab} setActiveTab={setActiveTab} />} />
                        <Route path="/explore" element={<ExplorePage suggestedUsers={suggestedUsers} />} />
                        <Route path="/profile" element={<ProfilePage suggestedUsers={suggestedUsers} />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/music" element={<MusicPage tracks={tracks} />} />
                        <Route path="/settings" element={<SettingsPage />} />
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

// 👇 ГЛАВНЫЙ КОМПОНЕНТ APP (ОБЕРТЫВАЕТ В AuthProvider)
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;