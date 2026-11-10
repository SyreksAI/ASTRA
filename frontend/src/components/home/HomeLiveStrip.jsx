import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function HomeLiveStrip({ onComposeHint }) {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/constellations/', { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                setItems(
                    [...list]
                        .sort((a, b) => {
                            const score = (x) => (x.members_count || 0) * 2 + (x.posts_count || 0);
                            return score(b) - score(a);
                        })
                        .slice(0, 6)
                );
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => { cancelled = true; };
    }, []);

    if (items.length === 0) return null;

    return (
        <section className="home-live" aria-label="Живые созвездия">
            <div className="home-live__head">
                <h2 className="home-live__title">Сейчас живые</h2>
                <button
                    type="button"
                    className="home-live__all"
                    onClick={() => navigate('/constellations')}
                >
                    Все
                </button>
            </div>
            <div className="home-live__track">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`home-live__chip${item.joined ? ' is-joined' : ''}`}
                        onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                    >
                        <span className="home-live__dot" aria-hidden />
                        <span className="home-live__label">{item.label}</span>
                        <span className="home-live__meta">
                            {item.posts_count || 0}·{item.members_count || 0}
                        </span>
                    </button>
                ))}
            </div>
            {onComposeHint && (
                <p className="home-live__hint">
                    Выбери созвездие в композере — и лента перестанет быть пустой.
                </p>
            )}
        </section>
    );
}
