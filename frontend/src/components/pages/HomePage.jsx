import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostCard } from '../post/PostCard';
import PostComposer from '../post/PostComposer';
import { OrbitHero } from '../home/OrbitHero';
import { enrichPostsWithConstellations } from '../../utils/constellations';

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

    const enrichedPosts = useMemo(
        () => enrichPostsWithConstellations(posts || []),
        [posts],
    );

    const handlePostCreated = (newPost) => {
        if (onPostCreated) onPostCreated(newPost);
        else window.location.reload();
    };

    return (
        <div className="home-page home-page--orbit">
            <header className="home-mobile-bar">
                <button
                    type="button"
                    className="home-mobile-bar__avatar"
                    onClick={onOpenSidebar}
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

            <div className="home-center home-center--orbit home-center--rexon">
                <OrbitHero activeTab={activeTab} setActiveTab={setActiveTab} />
                <PostComposer user={user} onPostCreated={handlePostCreated} variant="orbit" />

                <div className="home-center__feed">
                    {enrichedPosts.length === 0 ? (
                        <div className="home-empty home-empty--orbit">
                            <p className="home-empty__eyebrow">Elara · Созвездия</p>
                            <h2 className="home-empty__title">Лента ждёт твой первый сигнал</h2>
                            <p className="home-empty__text">
                                Напиши пост, отметь Созвездие — и орбита наполнится людьми.
                            </p>
                            <div className="home-empty__actions">
                                <button
                                    type="button"
                                    className="home-empty__btn home-empty__btn--primary"
                                    onClick={() => document.querySelector('.post-composer-input')?.focus()}
                                >
                                    Написать пост
                                </button>
                                <button
                                    type="button"
                                    className="home-empty__btn"
                                    onClick={() => navigate('/constellations')}
                                >
                                    Найти созвездия
                                </button>
                            </div>
                        </div>
                    ) : (
                        enrichedPosts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                variant="orbit"
                                onCommentCountChange={onCommentCountChange}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomePage;
