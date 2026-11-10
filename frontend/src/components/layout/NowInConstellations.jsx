import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function NowInConstellations() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/constellations/', { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                const ranked = [...list]
                    .sort((a, b) => {
                        const score = (x) => (x.posts_count || 0) * 3 + (x.members_count || 0);
                        return score(b) - score(a);
                    })
                    .slice(0, 4)
                    .map((item, i) => ({
                        ...item,
                        tag: i === 0 ? 'В тренде' : item.joined ? 'Ты внутри' : 'Открыто',
                    }));
                setItems(ranked);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => { cancelled = true; };
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="right-widget now-in-constellations">
            <h3 className="right-widget__title">Актуальное</h3>
            <div className="now-in-constellations__list">
                {items.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className="now-trend"
                        onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                    >
                        <span className="now-trend__tag">{item.tag} · Созвездие</span>
                        <span className="now-trend__name">{item.label}</span>
                        <span className="now-trend__meta">
                            {item.posts_count || 0} постов · {item.members_count || 0} участников
                        </span>
                    </button>
                ))}
            </div>
            <button
                type="button"
                className="right-widget__more"
                onClick={() => navigate('/constellations')}
            >
                Показать ещё
            </button>
        </div>
    );
}
