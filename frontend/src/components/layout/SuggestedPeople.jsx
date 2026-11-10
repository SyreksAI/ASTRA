import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SuggestedPeople({ users = [] }) {
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(() => new Set());
    const [following, setFollowing] = useState(() => new Set());

    const user = users.find((u) => !dismissed.has(u.id));
    if (!user) return null;

    const isFollowing = following.has(user.id);
    const bio = user.bio || '«Создаю понятные и красивые интерфейсы. Люблю минимализм и космос.»';
    const constellation = user.constellation || 'В Созвездии дизайна';

    return (
        <section className="orbit-panel suggested-meet">
            <div className="orbit-panel__head">
                <h3 className="orbit-panel__title">Возможная встреча</h3>
                <button
                    type="button"
                    className="orbit-panel__link"
                    onClick={() => navigate('/explore')}
                >
                    Все →
                </button>
            </div>

            <div className="suggested-meet__card">
                <button
                    type="button"
                    className="suggested-meet__main"
                    onClick={() => navigate('/explore')}
                >
                    <img className="suggested-meet__avatar" src={user.img} alt="" />
                    <span className="suggested-meet__text">
                        <span className="suggested-meet__name">{user.name}</span>
                        <span className="suggested-meet__role">{user.role}</span>
                        <span className="suggested-meet__constellation">{constellation}</span>
                    </span>
                </button>

                <p className="suggested-meet__bio">{bio}</p>

                <div className="suggested-meet__actions">
                    <button
                        type="button"
                        className={`suggested-meet__follow${isFollowing ? ' is-following' : ''}`}
                        onClick={() => {
                            setFollowing((prev) => {
                                const next = new Set(prev);
                                if (next.has(user.id)) next.delete(user.id);
                                else next.add(user.id);
                                return next;
                            });
                        }}
                    >
                        {isFollowing ? 'Читаю' : 'Подписаться'}
                    </button>
                    <button
                        type="button"
                        className="suggested-meet__dismiss"
                        aria-label="Скрыть"
                        onClick={() => {
                            setDismissed((prev) => {
                                const next = new Set(prev);
                                next.add(user.id);
                                return next;
                            });
                        }}
                    >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}
