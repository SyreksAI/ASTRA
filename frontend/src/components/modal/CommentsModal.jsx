import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommentsThread } from '../post/CommentsThread';
import { timeAgo } from '../utils/dateUtils';

export function CommentsModal({ post, onClose, onCommentAdded }) {
    const scrollRef = useRef(null);
    const [showToTop, setShowToTop] = useState(false);

    useEffect(() => {
        const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [onClose]);

    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const handleScroll = (e) => {
        setShowToTop(e.currentTarget.scrollTop > 300);
    };

    const scrollToTop = () => {
        const el = scrollRef.current;
        if (!el) return;

        const start = el.scrollTop;
        const duration = 400;
        const startTime = performance.now();

        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            el.scrollTop = start * (1 - easeOutCubic(progress));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    };

    const author = post.author || {};
    const authorName = author.full_name || author.username || 'Пользователь';
    const authorHandle = author.username ? `@${author.username}` : '@user';
    const authorAvatar = author.avatar || '/default-avatar.png';
    const profileLink = author.username ? `/user/${author.username}` : null;
    const postTime = post.created_at ? timeAgo(post.created_at) : '';

    return (
        <div
            className="comments-modal-overlay"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Пост и комментарии"
        >
            <div
                className="comments-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="comments-modal-header">
                    <button
                        type="button"
                        className="comments-modal-header-close"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                            stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    <div className="comments-modal-header-spacer" />
                    <button type="button" className="comments-modal-header-action">
                        Черновики
                    </button>
                </header>

                <div
                    className="comments-modal-scroll"
                    ref={scrollRef}
                    onScroll={handleScroll}
                >
                    <div className="comments-modal-post">
                        <div className="comments-modal-post-row">
                            {profileLink ? (
                                <Link to={profileLink} className="comments-modal-post-avatar" onClick={onClose}>
                                    <img src={authorAvatar} alt={authorName} />
                                </Link>
                            ) : (
                                <div className="comments-modal-post-avatar">
                                    <img src={authorAvatar} alt={authorName} />
                                </div>
                            )}

                            <div className="comments-modal-post-body">
                                <div className="comments-modal-post-meta">
                                    <span className="comments-modal-post-name">{authorName}</span>
                                    <span className="comments-modal-post-handle">{authorHandle}</span>
                                    {postTime && (
                                        <>
                                            <span className="comments-modal-post-dot">·</span>
                                            <span className="comments-modal-post-time">{postTime}</span>
                                        </>
                                    )}
                                </div>

                                {post.content && (
                                    <div className="comments-modal-post-content">
                                        {post.content}
                                    </div>
                                )}

                                {post.image && (
                                    <img
                                        src={post.image}
                                        alt=""
                                        className="comments-modal-post-image"
                                    />
                                )}

                                {author.username && (
                                    <div className="comments-modal-replying-to">
                                        Ответ пользователю{' '}
                                        <Link
                                            to={profileLink}
                                            className="comments-modal-replying-to-user"
                                            onClick={onClose}
                                        >
                                            @{author.username}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="comments-modal-body">
                        <CommentsThread
                            post={post}
                            onClose={onClose}
                            onCommentAdded={onCommentAdded}
                        />
                    </div>

                    <button
                        type="button"
                        className={`comments-modal-scroll-to-top${showToTop ? ' is-visible' : ''}`}
                        onClick={scrollToTop}
                        aria-label="Наверх"
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="19" x2="12" y2="5" />
                            <polyline points="5 12 12 5 19 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}