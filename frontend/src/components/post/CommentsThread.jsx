import React, { useEffect, useState } from 'react';
import { timeAgo } from '../utils/dateUtils';

const getErrorMessage = (body, fallback) => {
    if (Array.isArray(body?.detail)) return body.detail.map((item) => item.msg).join('. ');
    return body?.detail || fallback;
};

export function CommentsThread({ post, onClose, onCommentAdded }) {
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
                if (!cancelled) setComments(data);
            })
            .catch((loadError) => {
                if (!cancelled) setError(loadError.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

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

            setComments((current) => [...current, body]);
            setContent('');
            onCommentAdded();
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="comments-thread" aria-label="Обсуждение публикации">
            <div className="comments-thread-header">
                <strong>{comments.length ? `${comments.length} ответ(а)` : 'Ответы'}</strong>
                <button type="button" onClick={onClose} aria-label="Свернуть комментарии">Свернуть</button>
            </div>

            <div className="comments-list" aria-live="polite">
                {loading && <p className="comments-state">Загружаем комментарии…</p>}
                {!loading && !error && !comments.length && <p className="comments-state">Пока нет ответов. Начните обсуждение.</p>}
                {comments.map((comment) => (
                    <article className="comment-item" key={comment.id}>
                        <div className="comments-avatar-wrap">
                            {comment.author?.avatar
                                ? <img src={comment.author.avatar} alt="" />
                                : (comment.author?.full_name || comment.author?.username || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="comment-main">
                            <div className="comment-author-line">
                                <strong>{comment.author?.full_name || comment.author?.username || 'Пользователь'}</strong>
                                <span>@{comment.author?.username || 'user'} · {timeAgo(comment.created_at)}</span>
                            </div>
                            <p>{comment.content}</p>
                        </div>
                    </article>
                ))}
            </div>

            <form className="comment-composer" onSubmit={handleSubmit}>
                {error && <p className="comments-error" role="alert">{error}</p>}
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Напишите ответ"
                    maxLength={2000}
                    rows={2}
                    aria-label="Текст комментария"
                />
                <div className="comment-composer-footer">
                    <span>{content.length}/2000</span>
                    <button type="submit" disabled={sending || !content.trim()}>
                        {sending ? 'Отправка…' : 'Ответить'}
                    </button>
                </div>
            </form>
        </section>
    );
}
