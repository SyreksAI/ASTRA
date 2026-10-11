import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostCard } from "../post/PostCard";
// import { ModalPost } from './components/modal/Modal';

export function HomePage({
    posts,
    activeTab,
    setActiveTab,
    onCommentCountChange,
    onOpenSidebar,
    user,
    isDarkTheme,
}) {
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const lastYRef = useRef(0);
    const tickingRef = useRef(false);
    const [headerHidden, setHeaderHidden] = useState(false);

    useEffect(() => {
        // Все возможные скролл-контейнеры: и окно, и внутренние обёртки.
        // Какой бы ни скроллился — мы это поймаем.
        const candidates = [
            document.querySelector('.app-center-content'),
            document.querySelector('.app-shell-content'),
            document.querySelector('.home-page'),
            window,
        ].filter(Boolean);

        const getY = () => {
            let max = 0;
            for (const el of candidates) {
                const y = el === window
                    ? window.scrollY || window.pageYOffset || 0
                    : el.scrollTop || 0;
                if (y > max) max = y;
            }
            return max;
        };

        lastYRef.current = getY();

        const update = () => {
            tickingRef.current = false;

            const y = getY();
            const delta = y - lastYRef.current;

            // Порог, чтобы микро-дрожание пальца не переключало шапку
            if (Math.abs(delta) < 6) return;

            if (y < 40) {
                // Близко к верху — всегда показываем
                setHeaderHidden(false);
            } else if (delta > 0) {
                // Скролл вниз — прячем
                setHeaderHidden(true);
            } else {
                // Скролл вверх — показываем
                setHeaderHidden(false);
            }

            lastYRef.current = y;
        };

        const onScroll = () => {
            if (!tickingRef.current) {
                tickingRef.current = true;
                requestAnimationFrame(update);
            }
        };

        for (const el of candidates) {
            el.addEventListener('scroll', onScroll, { passive: true });
        }

        return () => {
            for (const el of candidates) {
                el.removeEventListener('scroll', onScroll);
            }
        };
    }, []);

    return (
        <div className="home-page">
            <div
                ref={headerRef}
                className={`home-page-header ${headerHidden ? 'home-page-header-hidden' : ''}`}
            >
                {/* ВЕРХНИЙ РЯД — аватар / логотип / уведомления */}
                <div className="home-page-header-topbar">
                    {/* Слева — аватар, тап открывает боковое меню */}
                    <button
                        type="button"
                        className="home-page-header-avatar-btn"
                        onClick={onOpenSidebar}
                        aria-label="Открыть меню"
                    >
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.username}
                                className="home-page-header-avatar"
                            />
                        ) : (
                            <span className="home-page-header-avatar home-page-header-avatar-fallback">
                                {user?.username?.[0]?.toUpperCase() || 'A'}
                            </span>
                        )}
                    </button>

                    {/* По центру — логотип */}
                    <div className="home-page-header-logo">
                        <img
                            src={isDarkTheme ? '/logoDark(1).png' : '/logo(1).jpg'}
                            alt="Логотип"
                        />
                    </div>

                    {/* Справа — иконка уведомлений */}
                    <button
                        type="button"
                        className="home-page-header-notifications-btn"
                        onClick={() => navigate('/notifications')}
                        aria-label="Уведомления"
                    >
                        <img
                            src="/menu/notifications.png"
                            alt=""
                            className="home-page-header-notifications-icon"
                        />
                    </button>
                </div>

                {/* НИЖНИЙ РЯД — табы */}
                <div className="home-page-header-tabs">
                    {['Для тебя', 'Следующий'].map(tab => (
                        <p
                            key={tab}
                            className={`home-page-header-link ${activeTab === tab ? 'home-page-header-link-active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </p>
                    ))}
                </div>
            </div>

            <div className="home-page-feed">
                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onCommentCountChange={onCommentCountChange}
                    />
                ))}
            </div>
        </div>
    );
}

export default HomePage;