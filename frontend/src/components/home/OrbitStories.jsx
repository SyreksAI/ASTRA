import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const THUMBS = {
    tech: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=160&h=160&fit=crop',
    design: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=160&h=160&fit=crop',
    games: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&h=160&fit=crop',
    music: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=160&h=160&fit=crop',
    art: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=160&h=160&fit=crop',
    science: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=160&h=160&fit=crop',
    sport: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=160&h=160&fit=crop',
    dev: 'https://images.unsplash.com/photo-1515879214611-6a9bd4f6e5b5?w=160&h=160&fit=crop',
};

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function OrbitStories() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/constellations/', { headers: authHeaders() })
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => {
                if (!cancelled) setItems(Array.isArray(data) ? data.slice(0, 7) : []);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            });
        return () => { cancelled = true; };
    }, []);

    return (
        <section className="orbit-stories" aria-label="Созвездия">
            <div className="orbit-stories__track">
                <button
                    type="button"
                    className="orbit-stories__item orbit-stories__item--me"
                    onClick={() => navigate('/constellations')}
                >
                    <span className="orbit-stories__ring">
                        <span className="orbit-stories__plus">+</span>
                    </span>
                    <span className="orbit-stories__label">Моё</span>
                </button>
                {items.map((item, i) => (
                    <button
                        key={item.id}
                        type="button"
                        className={`orbit-stories__item${item.joined ? ' is-on' : ''}`}
                        onClick={() => navigate(`/constellation/${encodeURIComponent(item.id)}`)}
                    >
                        <span className="orbit-stories__ring">
                            <img src={THUMBS[item.id] || THUMBS.tech} alt="" />
                            {i < 2 && <span className="orbit-stories__badge">new</span>}
                        </span>
                        <span className="orbit-stories__label">{item.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
