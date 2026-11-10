import React from 'react';
import { useNavigate } from 'react-router-dom';

export function NowHappening({ items = [] }) {
    const navigate = useNavigate();

    return (
        <div className="now-happening">
            <div className="now-happening__header">
                <h3 className="now-happening__title">Сейчас в Elara</h3>
                <p className="now-happening__sub">Живые обсуждения и активные созвездия</p>
            </div>

            {items.length === 0 ? (
                <p className="now-happening__empty">Пока тихо — напиши первый пост в созвездии</p>
            ) : (
                <ul className="now-happening__list">
                    {items.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                className="now-happening__item"
                                onClick={() => {
                                    const el = document.getElementById(`post-${item.id}`);
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    } else {
                                        navigate('/');
                                    }
                                }}
                            >
                                <span className="now-happening__constellation">{item.constellation}</span>
                                <span className="now-happening__item-title">{item.title}</span>
                                <span className="now-happening__item-meta">
                                    {item.author}
                                    {item.comments > 0 ? ` · ${item.comments} ответов` : ''}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
