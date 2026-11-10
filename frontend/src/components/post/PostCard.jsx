import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/dateUtils';
import { CommentsModal } from '../modal/CommentsModal';
import { resolveConstellation } from '../../utils/constellations';
import { PostMedia } from './PostMedia';
import { getPostMedia } from '../../utils/postMedia';

const LONG_TEXT = 220;

const StarIcon = ({ size = 12 }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden>
        <path
            d="M8 1.1 9.15 6.15 14.2 8 9.15 9.85 8 14.9 6.85 9.85 1.8 8l5.05-1.85Z"
            fill="currentColor"
        />
    </svg>
);

function shortTime(date) {
    if (!date) return '';
    const hasTimezone = /Z$|[+-]\d{2}:\d{2}$/.test(date);
    const isoString = hasTimezone ? date : `${date}Z`;
    const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
    if (diff < 60) return 'сейчас';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} д`;
    return timeAgo(date);
}

export function PostCard({
    post,
    onCommentCountChange,
    variant = 'default',
}) {
    const navigate = useNavigate();
    const isOrbit = variant === 'orbit';
    const [liked, setLiked] = useState(post.liked_by_me || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [reposts] = useState(post.reposts_count || 0);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [saved, setSaved] = useState(false);

    const constellation = post.constellation || resolveConstellation(post);
    const content = post.content || '';
    const isLong = content.length > LONG_TEXT;
    const shownText = !isLong || expanded ? content : `${content.slice(0, LONG_TEXT).trim()}…`;

    const handleLike = async (e) => {
        e.stopPropagation();
        const nextLiked = !liked;
        setLiked(nextLiked);
        setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post.id}/like`, {
                method: nextLiked ? 'POST' : 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!response.ok) throw new Error('Ошибка лайка');
            const data = await response.json();
            setLiked(data.liked_by_me);
            setLikesCount(data.likes_count);
        } catch (err) {
            setLiked(!nextLiked);
            setLikesCount((prev) => (nextLiked ? Math.max(0, prev - 1) : prev + 1));
        }
    };

    const author = post.author || {};
    const authorName = author.full_name || 'Пользователь';
    const authorHandle = author.username ? `@${author.username}` : '@user';
    const authorAvatar = author.avatar || '/default-avatar.png';
    const profileLink = author.username ? `/user/${author.username}` : null;
    const postTime = isOrbit
        ? shortTime(post.created_at)
        : (post.created_at ? timeAgo(post.created_at) : '');

    const avatar = (
        <img src={authorAvatar} alt="" className="feed-post__avatar" />
    );

    const moreBtn = (
        <button type="button" className="feed-post__more" aria-label="Ещё" onClick={(e) => e.stopPropagation()}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.55" />
                <circle cx="12" cy="12" r="1.55" />
                <circle cx="19" cy="12" r="1.55" />
            </svg>
        </button>
    );

    if (isOrbit) {
        const hasMedia = getPostMedia(post).length > 0;

        const orbitFooter = (
            <div className="feed-post__footer feed-post__footer--mobile-icons">
                <button
                    type="button"
                    className={`feed-post__icon-btn ${liked ? 'is-liked' : ''}`}
                    aria-label="Лайк"
                    onClick={handleLike}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden>
                        <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.1a3.8 3.8 0 0 1 7 2.7C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
                    </svg>
                    <span>{likesCount || 0}</span>
                </button>
                <button
                    type="button"
                    className="feed-post__icon-btn"
                    aria-label="Комментарии"
                    onClick={() => setCommentsOpen(true)}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                        <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 16h-4.2L8.5 19.2V16H7A2.5 2.5 0 0 1 4.5 13.5v-6Z" />
                    </svg>
                    <span>{commentsCount || 0}</span>
                </button>
                <button
                    type="button"
                    className={`feed-post__icon-btn ${saved ? 'is-saved' : ''}`}
                    aria-label="Сохранить"
                    onClick={() => setSaved((v) => !v)}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" aria-hidden>
                        <path d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14L12 16.2 5.5 20V6A1.5 1.5 0 0 1 7 4.5Z" strokeLinejoin="round" />
                    </svg>
                </button>
                <span className="feed-post__footer-spacer" aria-hidden />
                <button
                    type="button"
                    className="feed-post__icon-btn"
                    aria-label="Переслать"
                    onClick={async (e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/?post=${post.id}`;
                        try {
                            if (navigator.share) {
                                await navigator.share({
                                    title: authorName,
                                    text: content.slice(0, 120),
                                    url,
                                });
                            } else if (navigator.clipboard?.writeText) {
                                await navigator.clipboard.writeText(url);
                            }
                        } catch {
                            /* cancelled */
                        }
                    }}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21.5 3.5 10.4 14.1" />
                        <path d="M21.5 3.5 14.2 21l-3.5-7.3L3.5 10.2 21.5 3.5Z" />
                    </svg>
                </button>
            </div>
        );

        const avatarBlock = (
            <span className="feed-post__avatar-wrap">
                {avatar}
                <span className="feed-post__avatar-badge" aria-hidden>
                    <StarIcon size={9} />
                </span>
            </span>
        );

        return (
            <article className="feed-post feed-post--orbit" id={`post-${post.id}`}>
                <div className="feed-post__orbit-row">
                    <div className="feed-post__aside">
                        {profileLink ? (
                            <Link to={profileLink} className="feed-post__avatar-link" onClick={(e) => e.stopPropagation()}>
                                {avatarBlock}
                            </Link>
                        ) : (
                            avatarBlock
                        )}
                    </div>

                    <div className="feed-post__body">
                    <div className="feed-post__header feed-post__header--orbit">
                        <div className="feed-post__meta-line">
                            {profileLink ? (
                                <Link
                                    to={profileLink}
                                    className="feed-post__name"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {authorName}
                                </Link>
                            ) : (
                                <span className="feed-post__name">{authorName}</span>
                            )}
                            <span className="feed-post__verified" aria-label="Проверено" title="Проверено">
                                <StarIcon size={10} />
                            </span>
                            {(constellation || postTime) && (
                                <span className="feed-post__meta-rest">
                                    {constellation && (
                                        <button
                                            type="button"
                                            className="feed-post__constellation"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/constellation/${encodeURIComponent(constellation.id)}`);
                                            }}
                                        >
                                            в Созвездии {constellation.label}
                                        </button>
                                    )}
                                    {constellation && postTime && <span className="feed-post__dot">·</span>}
                                    {postTime && <span className="feed-post__time">{postTime}</span>}
                                </span>
                            )}
                        </div>
                        {moreBtn}
                    </div>

                    <div className="feed-post__text">
                        {shownText}
                        {isLong && !expanded && (
                            <button
                                type="button"
                                className="feed-post__expand"
                                onClick={() => setExpanded(true)}
                            >
                                ещё
                            </button>
                        )}
                    </div>

                    {!hasMedia && orbitFooter}
                    </div>
                </div>

                {hasMedia && <PostMedia post={post} />}

                {hasMedia && (
                    <div className="feed-post__orbit-row feed-post__orbit-row--actions">
                        <div className="feed-post__aside feed-post__aside--spacer" aria-hidden />
                        <div className="feed-post__body feed-post__body--actions">
                            {orbitFooter}
                        </div>
                    </div>
                )}

                {commentsOpen && (
                    <CommentsModal
                        post={post}
                        onClose={() => setCommentsOpen(false)}
                        onCommentAdded={() => {
                            setCommentsCount((c) => c + 1);
                            if (onCommentCountChange) onCommentCountChange(post.id);
                        }}
                    />
                )}
            </article>
        );
    }

    return (
        <article className="feed-post">
            <div className="feed-post__aside">
                {profileLink ? (
                    <Link to={profileLink} className="feed-post__avatar-link" onClick={(e) => e.stopPropagation()}>
                        {avatar}
                    </Link>
                ) : (
                    avatar
                )}
            </div>

            <div className="feed-post__body">
                <div className="feed-post__header">
                    {profileLink ? (
                        <Link to={profileLink} className="feed-post__author" onClick={(e) => e.stopPropagation()}>
                            <span className="feed-post__name">{authorName}</span>
                            <span className="feed-post__handle">{authorHandle}</span>
                            {postTime && <span className="feed-post__dot">·</span>}
                            {postTime && <span className="feed-post__time">{postTime}</span>}
                        </Link>
                    ) : (
                        <div className="feed-post__author">
                            <span className="feed-post__name">{authorName}</span>
                            <span className="feed-post__handle">{authorHandle}</span>
                            {postTime && <span className="feed-post__dot">·</span>}
                            {postTime && <span className="feed-post__time">{postTime}</span>}
                        </div>
                    )}
                    {constellation && (
                        <button
                            type="button"
                            className="feed-post__constellation"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/constellation/${encodeURIComponent(constellation.id)}`);
                            }}
                        >
                            в «{constellation.label}»
                        </button>
                    )}
                </div>

                <div className="feed-post__text">
                    {shownText}
                    {isLong && !expanded && (
                        <button
                            type="button"
                            className="feed-post__expand"
                            onClick={() => setExpanded(true)}
                        >
                            ещё
                        </button>
                    )}
                </div>

                <PostMedia post={post} />

                <div className="feed-post__actions feed-post__actions--icons">
                    <button
                        type="button"
                        className="feed-post__icon-btn"
                        aria-label="Комментарии"
                        onClick={() => setCommentsOpen(true)}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 17 16h-4.2L8.5 19.2V16H7A2.5 2.5 0 0 1 4.5 13.5v-6Z" />
                        </svg>
                        <span>{commentsCount || ''}</span>
                    </button>
                    <button type="button" className="feed-post__icon-btn" aria-label="Репост">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7">
                            <path d="M17 3.5 20.5 7 17 10.5M6.5 7h14M7 20.5 3.5 17 7 13.5M17.5 17h-14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{reposts || ''}</span>
                    </button>
                    <button
                        type="button"
                        className={`feed-post__icon-btn ${liked ? 'is-liked' : ''}`}
                        aria-label="Лайк"
                        onClick={handleLike}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
                            <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.1a3.8 3.8 0 0 1 7 2.7C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
                        </svg>
                        <span>{likesCount || ''}</span>
                    </button>
                    <button
                        type="button"
                        className={`feed-post__icon-btn ${saved ? 'is-saved' : ''}`}
                        aria-label="Сохранить"
                        onClick={() => setSaved((v) => !v)}
                    >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">
                            <path d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14L12 16.2 5.5 20V6A1.5 1.5 0 0 1 7 4.5Z" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {commentsOpen && (
                <CommentsModal
                    post={post}
                    onClose={() => setCommentsOpen(false)}
                    onCommentAdded={() => {
                        setCommentsCount((c) => c + 1);
                        if (onCommentCountChange) onCommentCountChange(post.id);
                    }}
                />
            )}
        </article>
    );
}
