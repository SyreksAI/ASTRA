import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostCard } from "../post/PostCard";
import PostComposer from '../post/PostComposer';

export function HomePage({
    posts,
    activeTab,
    setActiveTab,
    onCommentCountChange,
    onOpenSidebar,
    user,
    isDarkTheme,
    onPostCreated,
}) {
    const navigate = useNavigate();
    const headerRef = useRef(null);
    const tickingRef = useRef(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
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

        const update = () => {
            tickingRef.current = false;
            const y = getY();
            setScrolled(y > 0);
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

        // на случай, если страница уже была прокручена при монтировании
        update();

        return () => {
            for (const el of candidates) {
                el.removeEventListener('scroll', onScroll);
            }
        };
    }, []);

    const handlePostCreated = (newPost) => {
        if (onPostCreated) {
            onPostCreated(newPost);
        } else {
            window.location.reload();
        }
    };

    const headerClassName = [
        'home-page-header',
        scrolled ? 'home-page-header-scrolled' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className="home-page">
            <div ref={headerRef} className={headerClassName}>
                {/* ВЕРХНИЙ РЯД — аватар / логотип / уведомления */}
                <div className="home-page-header-topbar">
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

                    <div className="home-page-header-logo">
                        <img
                            src={isDarkTheme ? '/logoDark(1).png' : '/logo(1).jpg'}
                            alt="Логотип"
                        />
                    </div>

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
                <PostComposer
                    user={user}
                    onPostCreated={handlePostCreated}
                />

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