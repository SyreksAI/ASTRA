// src/components/post/PostComposer.jsx
import React, { useState } from 'react';

export function PostComposer({ user, onPostCreated }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);

    const canSend = text.trim().length > 0 && !sending;

    const handleSubmit = async () => {
        if (!canSend) return;
        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content: text.trim() }),
            });
            if (!res.ok) throw new Error('Ошибка отправки');
            const newPost = await res.json();
            setText('');
            onPostCreated?.(newPost);
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="post-composer">
            <div className="post-composer-avatar">
                {user?.avatar ? (
                    <img src={user.avatar} alt={user.username} />
                ) : (
                    <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>
                )}
            </div>

            <div className="post-composer-main">
                <textarea
                    className="post-composer-input"
                    placeholder="Что происходит?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={1}
                />

                <div className="post-composer-toolbar">
                    <div className="post-composer-icons">
                        {/* Картинка */}
                        <button type="button" className="post-composer-icon" aria-label="Изображение">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="M21 15l-5-5L5 21" />
                            </svg>
                        </button>

                        {/* GIF */}
                        <button type="button" className="post-composer-icon" aria-label="GIF">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
                                stroke="currentColor" strokeWidth="1.6"
                                strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="6" width="20" height="12" rx="2" />
                                <text x="5.5" y="15.5" fontSize="6" fontWeight="700"
                                    fill="currentColor" stroke="none">GIF</text>
                            </svg>
                        </button>

                        {/* Список */}
                        <button type="button" className="post-composer-icon" aria-label="Список">
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

                        {/* Смайл */}
                        <button type="button" className="post-composer-icon" aria-label="Эмодзи">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M8.5 14.5s1.2 1.8 3.5 1.8 3.5-1.8 3.5-1.8" />
                                <line x1="9" y1="9.5" x2="9.01" y2="9.5" />
                                <line x1="15" y1="9.5" x2="15.01" y2="9.5" />
                            </svg>
                        </button>

                        {/* Камера */}
                        <button type="button" className="post-composer-icon" aria-label="Камера">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </button>

                        {/* Геолокация */}
                        <button type="button" className="post-composer-icon" aria-label="Геолокация">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </button>

                        {/* Флаг */}
                        <button type="button" className="post-composer-icon" aria-label="Отметить">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
                                stroke="currentColor" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 22V4" />
                                <path d="M4 4h13l-2 4 2 4H4" />
                            </svg>
                        </button>
                    </div>

                    <button
                        type="button"
                        className="post-composer-submit"
                        onClick={handleSubmit}
                        disabled={!canSend}
                    >
                        Опубликовать пост
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PostComposer;