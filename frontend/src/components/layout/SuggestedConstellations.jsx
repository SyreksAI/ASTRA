import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function SuggestedConstellations() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/constellations/', { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (cancelled) return;
                const list = Array.isArray(data) ? data : [];
                const suggested = list
                    .filter((c) => !c.joined)
                    .sort((a, b) => (b.members_count || 0) - (a.members_count || 0))
                    .slice(0, 3);
                setItems(suggested.length > 0 ? suggested : list.slice(0, 3));
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => { cancelled = true; };
    }, []);

    const handleJoin = async (e, item) => {
        e.stopPropagation();
        if (busyId) return;
        setBusyId(item.id);
        try {
            const method = item.joined ? 'DELETE' : 'POST';
            const res = await fetch(`/api/constellations/${encodeURIComponent(item.id)}/join`, {
                method,
                headers: authHeaders(),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error('join failed');
            setItems((prev) =>
                prev.map((row) => (row.id === item.id ? { ...row, ...data } : row))
            );
        } catch (err) {
            console.error(err);
        } finally {
            setBusyId(null);
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="right-widget suggested-constellations">
            <h3 className="right-widget__title">Созвездия для тебя</h3>
            <div className="suggested-constellations__list">
                {items.map((item) => (
                    <div key={item.id} className="suggested-constellations__row">
                        <button
                            type="button"
                            className="suggested-constellations__main"
                            onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                        >
                            <span className="suggested-constellations__mark">
                                {(item.label || item.id).slice(0, 1)}
                            </span>
                            <span className="suggested-constellations__text">
                                <span className="suggested-constellations__name">{item.label}</span>
                                <span className="suggested-constellations__hint">
                                    {item.members_count || 0} участников · {item.posts_count || 0} постов
                                </span>
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`suggested-constellations__join${item.joined ? ' is-joined' : ''}`}
                            onClick={(e) => handleJoin(e, item)}
                            disabled={busyId === item.id}
                        >
                            {busyId === item.id ? '…' : item.joined ? 'Выйти' : 'Войти'}
                        </button>
                    </div>
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
