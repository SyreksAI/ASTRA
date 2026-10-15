import React, { useEffect, useState } from 'react';
import { timeAgo } from '../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

const getErrorMessage = (body, fallback) => {
    if (Array.isArray(body?.detail)) return body.detail.map((item) => item.msg).join('. ');
    return body?.detail || fallback;
};

export function CommentsThread({ post, onClose, onCommentAdded }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/posts/${post.id}/comments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(async (response) => {
                const body = await response.json().catch(() => null);
                if (!response.ok) throw new Error(getErrorMessage(body, 'Не удалось загрузить комментарии'));
                return body;
            })
            .then((data) => {
                if (!cancelled) {
                    const sorted = [...data].sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    setComments(sorted);
                }
            })
            .catch((loadError) => { if (!cancelled) setError(loadError.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [post.id]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const trimmedContent = content.trim();
        if (!trimmedContent || sending) return;

        setSending(true);
        setError('');
        try {
            const response = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ content: trimmedContent })
            });
            const body = await response.json().catch(() => null);
            if (!response.ok) throw new Error(getErrorMessage(body, 'Не удалось отправить комментарий'));

            setComments((current) => [body, ...current]);
            setContent('');
            onCommentAdded();
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSending(false);
        }
    };

    const meAvatar = user?.avatar || '/default-avatar.png';
    const meName = user?.full_name || user?.username || 'Вы';

    return (
        <section className="comments-thread" aria-label="Обсуждение публикации">
            {/* Список комментариев — рендерим ВСЕГДА.
                Если комментариев нет — показываем заглушку. */}
            <div className="comments-list" aria-live="polite">
                {loading && (
                    <p className="comments-state">Загружаем комментарии…</p>
                )}

                {!loading && !error && comments.length === 0 && (
                    <p className="comments-state">
                        Ещё нет ни одного комментария, будь первым
                    </p>
                )}

                {!loading && comments.map((comment) => (
                    <article className="comment-item" key={comment.id}>
                        <div className="comments-avatar-wrap">
                            {comment.author?.avatar
                                ? <img src={comment.author.avatar} alt="" />
                                : (comment.author?.full_name || comment.author?.username || '?')
                                    .charAt(0).toUpperCase()}
                        </div>
                        <div className="comment-main">
                            <div className="comment-author-line">
                                <strong>{comment.author?.full_name || comment.author?.username || 'Пользователь'}</strong>
                                <span>@{comment.author?.username || 'user'}</span>
                                <span>· {timeAgo(comment.created_at)}</span>
                            </div>
                            <p>{comment.content}</p>
                        </div>
                    </article>
                ))}
            </div>

            <form className="comment-composer" onSubmit={handleSubmit}>
                <div className="comment-composer-avatar">
                    <img src={meAvatar} alt={meName} />
                </div>

                <div className="comment-composer-main">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Напишите ответ"
                        maxLength={2000}
                        rows={1}
                        aria-label="Текст комментария"
                    />

                    <div className="comment-composer-toolbar">
                        <div className="comment-composer-icons">
                            <button type="button" className="comment-composer-icon" aria-label="Медиа">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                            </button>
                            <button type="button" className="comment-composer-icon" aria-label="GIF">
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                                    stroke="currentColor" strokeWidth="1.6"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="6" width="20" height="12" rx="2" />
                                    <text x="5.5" y="15.5" fontSize="6" fontWeight="700"
                                        fill="currentColor" stroke="none">GIF</text>
                                </svg>
                            </button>
                            <button type="button" className="comment-composer-icon" aria-label="Опрос">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="9" y1="6" x2="20" y2="6" />
                                    <line x1="9" y1="12" x2="20" y2="12" />
                                    <line x1="9" y1="18" x2="20" y2="18" />
                                    <circle cx="4.5" cy="6" r="1.2" />
                                    <circle cx="4.5" cy="12" r="1.2" />
                                    <circle cx="4.5" cy="18" r="1.2" />
                                </svg>
                            </button>
                            <button type="button" className="comment-composer-icon" aria-label="Эмодзи">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8" />
                                    <line x1="9" y1="9.5" x2="9.01" y2="9.5" />
                                    <line x1="15" y1="9.5" x2="15.01" y2="9.5" />
                                </svg>
                            </button>
                            <button type="button" className="comment-composer-icon" aria-label="Камера">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </button>
                            <button type="button" className="comment-composer-icon" aria-label="Локация">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </button>
                            <button type="button" className="comment-composer-icon" aria-label="Флаг">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                    stroke="currentColor" strokeWidth="1.8"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 22V4" />
                                    <path d="M4 4h13l-2 4 2 4H4" />
                                </svg>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={sending || !content.trim()}
                            className="comment-composer-send"
                        >
                            {sending ? '…' : 'Ответить'}
                        </button>
                    </div>
                </div>
            </form>

            {error && <p className="comments-error" role="alert">{error}</p>}
        </section>
    );
}